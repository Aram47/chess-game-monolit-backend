import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  isBotRoom,
  IPvPGameRoom,
  IPvEGameRoom,
  GameSnapshot,
  ProblemSnapshot,
  ProblemSnapshotDto,
  GameSnapshotDocument,
  ProblemSnapshotDocument,
} from '../../common';

@Injectable()
export class SnapshotServiceService {
  constructor(
    @InjectModel(ProblemSnapshot.name)
    private readonly problemSnapshotRepository: Model<ProblemSnapshotDocument>,
    @InjectModel(GameSnapshot.name)
    private readonly gameSnapshotRepository: Model<GameSnapshotDocument>,
  ) {}

  async storeProblemSnapshot(snapshot: ProblemSnapshotDto) {
    const createdProblemSnapshot = await this.problemSnapshotRepository.create({
      theme: snapshot.theme,
      level: snapshot.level,
      moves: snapshot.moves,
      userId: snapshot.userId,
      finalFen: snapshot.finalFen,
      problemId: snapshot.problemId,
      solvedAt: snapshot.solvedAt,
      durationMs: snapshot.durationMs,
    });

    await createdProblemSnapshot.save();

    return createdProblemSnapshot;
  }

  async storeGameResultSnapshot(room: IPvPGameRoom | IPvEGameRoom) {
    return isBotRoom(room)
      ? await this.storePvEGameResult(room as IPvEGameRoom)
      : await this.storePvPGameResult(room as IPvPGameRoom);
  }

  async getUserGameHistory(userId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const filter = {
      $or: [{ white: userId }, { black: userId }],
    };

    const [games, total] = await Promise.all([
      this.gameSnapshotRepository
        .find(filter)
        .sort({ finishedAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean()
        .exec(),
      this.gameSnapshotRepository.countDocuments(filter).exec(),
    ]);

    return {
      data: games,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getUserGameById(userId: string, gameId: string) {
    return this.gameSnapshotRepository
      .findOne({
        _id: gameId,
        $or: [{ white: userId }, { black: userId }],
      })
      .lean()
      .exec();
  }

  async countSolvedProblems(userId: string): Promise<number> {
    return this.problemSnapshotRepository
      .countDocuments({ userId })
      .exec();
  }

  async getUserGameStats(userId: string): Promise<{
    played: number;
    wins: number;
    losses: number;
    draws: number;
  }> {
    const participant = {
      $or: [{ white: userId }, { black: userId }],
    };

    const [agg] = await this.gameSnapshotRepository
      .aggregate<{
        played: number;
        wins: number;
        losses: number;
        draws: number;
      }>([
        { $match: participant },
        {
          $group: {
            _id: null,
            played: { $sum: 1 },
            draws: {
              $sum: { $cond: [{ $eq: ['$isDraw', true] }, 1, 0] },
            },
            wins: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$isDraw', false] },
                      { $eq: ['$winnerId', userId] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            losses: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$isDraw', false] },
                      { $ne: ['$winnerId', null] },
                      { $ne: ['$winnerId', userId] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
      .exec();

    return {
      played: agg?.played ?? 0,
      wins: agg?.wins ?? 0,
      losses: agg?.losses ?? 0,
      draws: agg?.draws ?? 0,
    };
  }

  async getRecentGames(userId: string, limit = 10) {
    const safeLimit = Math.min(50, Math.max(1, limit));
    const filter = {
      $or: [{ white: userId }, { black: userId }],
    };

    return this.gameSnapshotRepository
      .find(filter)
      .sort({ finishedAt: -1 })
      .limit(safeLimit)
      .lean()
      .exec();
  }

  private async storePvPGameResult(room: IPvPGameRoom) {
    const createGameSnapshot = await this.gameSnapshotRepository.create({
      fen: room.fen,
      white: room.white.userId,
      black: room.black.userId,
      isBot: false,
      isDraw: room.isDraw,
      winnerId: room.winnerId,
      allMoves: room.allMoves,
      winnerColor: room.winner,
      finishedAt: room.finishedAt,
      gameCreatedAt: room.createdAt,
      isCheckmate: room.isCheckmate,
    });

    await createGameSnapshot.save();

    return createGameSnapshot;
  }

  private async storePvEGameResult(room: IPvEGameRoom) {
    const whiteValue =
      typeof room.white === 'string' ? room.white : room.white.userId;
    const blackValue =
      typeof room.black === 'string' ? room.black : room.black.userId;

    const createdGameSnapshot = await this.gameSnapshotRepository.create({
      fen: room.fen,
      white: whiteValue,
      black: blackValue,
      isBot: true,
      isDraw: room.isDraw ?? false,
      winnerId: room.winnerId,
      allMoves: room.allMoves,
      winnerColor: room.winner,
      finishedAt: room.finishedAt,
      gameCreatedAt: room.createdAt,
      isCheckmate: room.isCheckmate ?? false,
    });

    await createdGameSnapshot.save();

    return createdGameSnapshot;
  }
}
