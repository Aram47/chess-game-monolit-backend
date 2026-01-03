import Redis from 'ioredis';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  Theme,
  REDIS_CLIENT,
  MergePayload,
  ChessProblem,
  ProblemTheme,
  PaginationDto,
  ProblemSession,
  ProblemMoveDto,
  ProblemCategory,
  UserDecoratorDto,
  GetProblemsQueryDto,
} from '../../common';
import { Chess } from 'chess.js';

@Injectable()
export class GameServiceService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    @InjectRepository(Theme)
    private readonly themeRepository: Repository<Theme>,
    @InjectRepository(ChessProblem)
    private readonly chessProblemRepository: Repository<ChessProblem>,
    @InjectRepository(ProblemTheme)
    private readonly problemThemeRepository: Repository<ProblemTheme>,
    @InjectRepository(ProblemCategory)
    private readonly problemCategoryRepository: Repository<ProblemCategory>,
    private readonly datasSource: DataSource,
  ) {}

  async getProblems(
    payload: MergePayload<[PaginationDto, GetProblemsQueryDto]>,
  ) {
    const qb = this.chessProblemRepository.createQueryBuilder('problem');

    qb.where('problem.isActive = true');

    if (payload.categoryId) {
      qb.andWhere('problem.categoryId = :categoryId', {
        categoryId: payload.categoryId,
      });
    }

    if (payload.difficultyLevel) {
      qb.andWhere('problem.difficultyLevel = :level', {
        level: payload.difficultyLevel,
      });
    }

    if (payload.isPayable) {
      qb.andWhere('problem.isPayable = :isPayable', {
        isPayable: payload.isPayable,
      });
    }

    if (payload.themeId) {
      qb.innerJoin(
        'problem_themes',
        'pt',
        'pt.problemId = problem.id AND pt.themeId = :themeId',
        { themeId: payload.themeId },
      );
    }

    qb.skip(payload.skip).take(payload.limit);

    return await qb.getManyAndCount();
  }

  async startProblem(problemId: number, userMetaData: UserDecoratorDto) {
    const problem = await this.chessProblemRepository.findOne({
      where: { id: problemId, isActive: true },
    });

    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    const session: ProblemSession = {
      userId: userMetaData.sub,
      problemId,
      fen: problem.fen,
      solutionMoves: problem.solutionMoves,
      userMoves: [],
      startedAt: Date.now(),
    };

    await this.redisClient.set(
      this.getSessionKey(userMetaData.sub, problemId),
      JSON.stringify(session),
      'EX',
      1800,
    );

    return { status: 'started' };
  }

  async finishProblem(problemId: number, userId: number) {
    // Implementation of finishing the problem
    const key = this.getSessionKey(userId, problemId);
    const sessionRaw = await this.redisClient.get(key);

    if (!sessionRaw) {
      throw new NotFoundException('Problem session not found');
    }

    await this.redisClient.del(key);
    return { status: 'finished' };
  }

  async makeMove(problemId: number, userId: number, dto: ProblemMoveDto) {
    // Implementation of making a move in the problem session
    const key = this.getSessionKey(userId, problemId);
    const sessionRaw = await this.redisClient.get(key);
    if (!sessionRaw) {
      throw new NotFoundException('Problem session not found');
    }

    const session: ProblemSession = JSON.parse(sessionRaw);
    const chess = new Chess(session.fen);

    for (const move of session.userMoves) {
      chess.move(move);
    }

    const move = chess.move(dto.move);
    if (!move) {
      throw new BadRequestException('Invalid move');
    }

    const expectedMove = session.solutionMoves[session.userMoves.length];
    if (move.san !== expectedMove) {
      throw new BadRequestException('Wrong move');
    }

    session.userMoves.push(move.san);

    const isSloved = session.userMoves.length === session.solutionMoves.length;

    if (isSloved) {
      await this.finishProblemInternal(session, chess); // will be implemented later
      await this.redisClient.del(key);
      return { status: 'solved' };
    }

    await this.redisClient.set(key, JSON.stringify(session), 'EX', 1800);

    return { status: 'move accepted' };
  }

  async finishProblemInternal(session: ProblemSession, chess: Chess) {
    // there are we will make snapshot in mongodb
  }

  private getSessionKey(userId: number, problemId: number): string {
    return `problem_session:user:${userId}:problem:${problemId}`;
  }
}
