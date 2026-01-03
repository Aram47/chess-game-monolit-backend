import { IsString } from 'class-validator';
import { MoveType, ProblemDifficultyLevel } from '../../';

export class CreateProblemDto {
  @IsString()
  fen: string;

  @IsString({ each: true })
  solutionMoves: MoveType[];

  difficultyLevel: ProblemDifficultyLevel;

  isActive: boolean;

  isPayable: boolean;

  category: string;

  description: string;
}
