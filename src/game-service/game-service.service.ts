import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Theme,
  MergePayload,
  ChessProblem,
  ProblemTheme,
  PaginationDto,
  ProblemCategory,
  GetProblemsQueryDto,
} from '../../common';

@Injectable()
export class GameServiceService {
  constructor(
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

    return qb.getManyAndCount();
  }
}
