import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UserSearchQueryDto {
  @ApiProperty({
    example: 'john',
    description:
      'Numeric string looks up by user id; otherwise partial match on username, first name, or surname (min 2 characters)',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value ?? '').trim(),
  )
  @IsString()
  @MinLength(1, { message: 'Search query cannot be empty' })
  @MaxLength(100)
  q: string;

  @ApiPropertyOptional({ default: 10, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 10;
}
