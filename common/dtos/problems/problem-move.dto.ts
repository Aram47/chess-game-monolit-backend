import { Type } from 'class-transformer';
import { MoveType } from '../../libs/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

class MovePayloadDto implements MoveType {
  @ApiProperty({ example: 'e2' })
  @IsString()
  from: string;

  @ApiProperty({ example: 'e4' })
  @IsString()
  to: string;

  @ApiProperty({ example: 'q', required: false })
  @IsOptional()
  @IsString()
  promotion?: string;
}

export class ProblemMoveDto {
  @ApiProperty({ type: MovePayloadDto })
  @ValidateNested()
  @Type(() => MovePayloadDto)
  move: MovePayloadDto;
}
