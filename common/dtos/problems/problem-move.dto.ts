import { IsString } from 'class-validator';

export class ProblemMoveDto {
  @IsString()
  move: string; // SAN or UCI
}
