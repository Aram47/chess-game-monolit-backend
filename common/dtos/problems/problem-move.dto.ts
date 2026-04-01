import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { MoveTypeDto } from '../move-type.dto';

export class ProblemMoveDto {
  @ApiProperty({ type: MoveTypeDto })
  @ValidateNested()
  @Type(() => MoveTypeDto)
  move: MoveTypeDto;
}
