import { ApiProperty } from '@nestjs/swagger';
import { AuthProviderEnum } from '../../enums';

export class UserProfileStatsDto {
  @ApiProperty()
  solvedProblemsCount: number;

  @ApiProperty()
  playedGames: number;

  @ApiProperty()
  wins: number;

  @ApiProperty()
  losses: number;

  @ApiProperty()
  draws: number;
}

export class PublicUserSnippetDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  surname: string;

  @ApiProperty()
  elo: number;
}

export class UserPublicProfileResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  surname: string;

  @ApiProperty()
  elo: number;

  @ApiProperty({ type: UserProfileStatsDto })
  stats: UserProfileStatsDto;

  @ApiProperty({ type: [Object], description: 'Recent game snapshots (Mongo lean docs)' })
  recentGames: Record<string, unknown>[];

  @ApiProperty()
  createdAt: Date;
}

export class UserMeProfileResponseDto extends UserPublicProfileResponseDto {
  @ApiProperty()
  email: string;

  @ApiProperty({ enum: AuthProviderEnum })
  authProvider: AuthProviderEnum;

  @ApiProperty({
    description:
      'True when the user has a local password (hide change-password UI when false)',
  })
  canChangePassword: boolean;
}
