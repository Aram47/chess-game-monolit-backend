import { SortDir } from '../../enums';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    required: false,
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    required: false,
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiProperty({
    required: false,
    description: 'Number of items to skip',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  skip: number;

  @ApiProperty({
    required: false,
    description: 'Field to sort by',
    example: 'id',
    default: 'id',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'id';

  @ApiProperty({
    required: false,
    description: 'Sort direction',
    example: SortDir.DESC,
    enum: SortDir,
    default: SortDir.DESC,
  })
  @IsOptional()
  @IsEnum(SortDir)
  sortDir: SortDir = SortDir.DESC;
}
