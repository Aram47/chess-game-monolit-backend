import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MoveType, ProblemDifficultyLevel } from '../../';

export class CreateProblemDto {
  @ApiProperty({
    example: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    description: 'FEN string representing the chess position',
  })
  @IsString()
  fen: string;

  @ApiProperty({
    example: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
    description: 'Array of solution moves in standard algebraic notation',
  })
  @IsString({ each: true })
  solutionMoves: MoveType[];

  @ApiProperty({
    example: 'Easy',
    description: 'Difficulty level of the problem',
  })
  @IsString()
  difficultyLevel: ProblemDifficultyLevel;

  @ApiProperty({
    example: true,
    description: 'Indicates if the problem is active',
  })
  @IsString()
  isActive: boolean;

  @ApiProperty({
    example: false,
    description: 'Indicates if the problem is payable',
  })
  @IsString()
  isPayable: boolean;

  @ApiProperty({
    example: 'Basic Mate in 2',
    description: 'Category of the problem',
  })
  @IsString()
  category: string;

  @ApiProperty({
    example: 'A simple checkmate in two moves',
    description: 'Description of the problem',
  })
  @IsString()
  description: string;
}
