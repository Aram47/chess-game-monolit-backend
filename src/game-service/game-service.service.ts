import Redis from 'ioredis';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  Theme,
  REDIS_CLIENT,
  MergePayload,
  ChessProblem,
  ProblemTheme,
  PaginationDto,
  ProblemSession,
  ProblemCategory,
  UserDecoratorDto,
  GetProblemsQueryDto,
} from '../../common';

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

  private getSessionKey(userId: number, problemId: number): string {
    return `problem_session:user:${userId}:problem:${problemId}`;
  }
}
