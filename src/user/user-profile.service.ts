import { Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import { SnapshotServiceService } from '../snapshot-service/snapshot-service.service';
import { ChangePasswordDto, UpdateProfileDto } from '../../common';

@Injectable()
export class UserProfileService {
  constructor(
    private readonly userService: UserService,
    private readonly snapshotService: SnapshotServiceService,
  ) {}

  async getProfileById(targetUserId: number, includeEmail: boolean) {
    const user = await this.userService.getUserById(targetUserId);
    const uid = String(targetUserId);

    const [solvedProblemsCount, stats, recentGames] = await Promise.all([
      this.snapshotService.countSolvedProblems(uid),
      this.snapshotService.getUserGameStats(uid),
      this.snapshotService.getRecentGames(uid, 10),
    ]);

    const elo = user.userRelatedData?.elo ?? 800;

    const base = {
      id: user.id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      ...(includeEmail ? { email: user.email } : {}),
      elo,
      stats: {
        solvedProblemsCount,
        playedGames: stats.played,
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
      },
      recentGames,
      createdAt: user.createdAt,
    };

    if (includeEmail) {
      const flags = await this.userService.getProfileAuthFlags(targetUserId);
      return { ...base, ...flags };
    }

    return base;
  }

  async changeMyPassword(userId: number, dto: ChangePasswordDto) {
    await this.userService.changePasswordForUser(userId, dto);
    return this.getProfileById(userId, true);
  }

  async updateMyProfile(userId: number, dto: UpdateProfileDto) {
    await this.userService.updateUserProfile(userId, dto);
    return this.getProfileById(userId, true);
  }
}
