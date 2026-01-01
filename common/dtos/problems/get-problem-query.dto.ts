import { Type } from 'class-transformer';
import { ProblemDifficultyLevel } from '../../enums';
import { IsEnum, IsOptional, IsNumber } from 'class-validator';

export class GetProblemsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  themeId?: number;

  @IsOptional()
  @IsEnum(ProblemDifficultyLevel)
  difficultyLevel?: ProblemDifficultyLevel;

  @IsOptional()
  @Type(() => Boolean)
  isPayable?: boolean;
}
