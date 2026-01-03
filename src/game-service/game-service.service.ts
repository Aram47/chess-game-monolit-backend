import Redis from 'ioredis';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
  CreateProblemDto,
  UserDecoratorDto,
  ProblemSnapshotDto,
  GetProblemsQueryDto,
} from '../../common';
import { Chess } from 'chess.js';
import { SnapshotServiceService } from '../snapshot-service/snapshot-service.service';

@Injectable()
export class GameServiceService {
  constructor(
    private readonly snapshotService: SnapshotServiceService,
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
    qb.innerJoin('problem.category', 'category');

    if (payload.categoryId) {
      qb.andWhere('category.id = :categoryId', {
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
    if (move.from !== expectedMove.from || move.to !== expectedMove.to) {
      throw new BadRequestException('Wrong move');
    }

    session.userMoves.push({ from: move.from, to: move.to });

    const isSloved = session.userMoves.length === session.solutionMoves.length;

    if (isSloved) {
      const snapshotDto: ProblemSnapshotDto = {
        userId: String(session.userId),
        problemId: String(session.problemId),
        finalFen: chess.fen(),
        solevedAt: new Date(),
        durationMs: Date.now() - session.startedAt,
        moves: session.userMoves,
        theme: '', // to be fetched
        level: '', // to be fetched
      };

      await this.finishProblemInternal(snapshotDto); // will be implemented later
      await this.redisClient.del(key);

      return { status: 'solved' };
    }

    await this.redisClient.set(key, JSON.stringify(session), 'EX', 1800);

    return { status: 'move accepted' };
  }

  async finishProblemInternal(snapshotDto: ProblemSnapshotDto) {
    await this.snapshotService.storeProblemSnapshot(snapshotDto);
  }

  private getSessionKey(userId: number, problemId: number): string {
    return `problem_session:user:${userId}:problem:${problemId}`;
  }

  async createProblem(dto: CreateProblemDto) {
    // Implementation of creating a new problem

    const category = await this.problemCategoryRepository.findOne({
      where: {
        name: dto.category,
      },
    });

    if (!category) {
      throw new NotFoundException('Problem category not found');
    }

    const problem = this.chessProblemRepository.create({
      fen: dto.fen,
      solutionMoves: dto.solutionMoves,
      description: dto.description,
      difficultyLevel: dto.difficultyLevel,
      isPayable: dto.isPayable,
      category,
      isActive: dto.isActive,
    });

    return await this.chessProblemRepository.save(problem);
  }

  async createProblemCategory() {}
}
