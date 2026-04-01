import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class AnalyzePositionDto {
  @ApiProperty({
    description: 'FEN of the position to analyze (side to move is in the FEN).',
    example: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  })
  @IsString()
  @IsNotEmpty()
  fen: string;

  @ApiPropertyOptional({
    description:
      'How many top engine lines (MultiPV) to return. Omitted = server default (3).',
    default: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  recommendedMovesCount?: number;

  @ApiPropertyOptional({
    description:
      'Search depth for Stockfish `go depth`. Omitted = server default (12).',
    default: 12,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  depth?: number;
}
