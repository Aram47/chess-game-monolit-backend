import { MoveType } from '../../';
import { IsString } from 'class-validator';

export class ProblemSnapshotDto {
  @IsString()
  userId: string;

  @IsString()
  problemId: string;

  moves: MoveType[];

  @IsString()
  finalFen: string;

  @IsString()
  theme: string;

  @IsString()
  level: string;

  solevedAt: Date;

  durationMs: number;
}
