import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoveTypeDto } from '../move-type.dto';

export class AnalysisEvaluationResponseDto {
  @ApiProperty({
    enum: ['cp', 'mate'],
    description:
      'cp = centipawns from the side to move perspective; mate = mate in N (positive = side to move mates, negative = mated).',
  })
  kind: 'cp' | 'mate';

  @ApiProperty({
    description: 'Centipawn score or mate distance, per Stockfish.',
    example: 24,
  })
  value: number;
}

export class AnalysisLineResponseDto {
  @ApiProperty({ description: '1 = best line, 2 = second best, …' })
  rank: number;

  @ApiProperty({ type: MoveTypeDto })
  move: MoveTypeDto;

  @ApiProperty({ type: AnalysisEvaluationResponseDto })
  evaluation: AnalysisEvaluationResponseDto;

  @ApiProperty({
    description: 'Principal variation as UCI tokens from this position.',
    type: [String],
    example: ['e2e4', 'e7e5', 'g1f3'],
  })
  pvUci: string[];
}

export class AnalyzePositionResponseDto {
  @ApiProperty({ description: 'Validated FEN that was analyzed.' })
  fen: string;

  @ApiProperty({
    description: 'Depth requested for the search (Stockfish `go depth`).',
  })
  depth: number;

  @ApiProperty({
    description: 'Maximum reported search depth from engine info lines.',
  })
  depthReached: number;

  @ApiPropertyOptional({
    type: MoveTypeDto,
    description:
      'First recommended move (same as `lines[0].move` when lines exist). Mirrors bot `bestMove` shape.',
    nullable: true,
  })
  bestMove: MoveTypeDto | null;

  @ApiProperty({ type: [AnalysisLineResponseDto] })
  lines: AnalysisLineResponseDto[];
}
