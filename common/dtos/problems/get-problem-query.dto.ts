import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProblemDifficultyLevel } from '../../enums';
import { IsEnum, IsOptional, IsNumber } from 'class-validator';

export class GetProblemsQueryDto {
  @ApiProperty({
    example: 1,
    description: 'Category ID to filter problems',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiProperty({
    example: 2,
    description: 'Theme ID to filter problems',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  themeId?: number;

  @ApiProperty({
    example: 'Easy',
    description: 'Difficulty level to filter problems',
    required: false,
  })
  @IsOptional()
  @IsEnum(ProblemDifficultyLevel)
  difficultyLevel?: ProblemDifficultyLevel;

  @ApiProperty({
    example: false,
    description: 'Filter payable problems',
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  isPayable?: boolean;
}
