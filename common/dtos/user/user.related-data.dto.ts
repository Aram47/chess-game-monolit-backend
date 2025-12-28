import { Role, Plan } from '../../';
import { Type } from 'class-transformer';
import { IsEnum, Min, Max, IsInt } from 'class-validator';

export class UserRelatedDataDto {
  @IsInt()
  @Type(() => Number)
  @Min(0)
  userId: number;

  @IsEnum(Role)
  role: Role;

  @IsEnum(Plan)
  plan: Plan;

  @Min(0)
  xp: number;

  @Min(0)
  @Max(100)
  level: number;

  @IsInt()
  @Min(0)
  solvedProblems: number;

  @IsInt()
  @Min(0)
  winGames: number;

  @IsInt()
  @Min(0)
  loseGames: number;
}
