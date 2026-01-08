import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class GameMoveDto {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  to: string;
}

export class GameMakeMoveDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ValidateNested()
  @Type(() => GameMoveDto)
  move: GameMoveDto;
}
