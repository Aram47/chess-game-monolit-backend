import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/** Send exactly one of `friendId` or `username` (exact match, case-sensitive). */
export class SendFriendRequestDto {
  @ApiPropertyOptional({
    example: 2,
    description: 'Target user id (use this or username, not both)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  friendId?: number;

  @ApiPropertyOptional({
    example: 'john_doe',
    description: 'Exact username, 3–20 characters (use this or friendId, not both)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    let s = value.trim();
    if (s.startsWith('@')) s = s.slice(1).trim();
    return s;
  })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username?: string;
}
