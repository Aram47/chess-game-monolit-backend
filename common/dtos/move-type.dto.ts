import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { MoveType } from '../libs/types';

/**
 * Swagger + validation shape for {@link MoveType} (shared across game and analysis APIs).
 */
export class MoveTypeDto implements MoveType {
  @ApiProperty({ example: 'e2' })
  @IsString()
  from: string;

  @ApiProperty({ example: 'e4' })
  @IsString()
  to: string;

  @ApiPropertyOptional({
    description: 'Promotion piece (lowercase), when applicable.',
    example: 'q',
  })
  @IsOptional()
  @IsString()
  promotion?: string;
}
