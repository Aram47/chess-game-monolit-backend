import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  IGameRoom,
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
      solevedAt: snapshot.solevedAt,
      durationMs: snapshot.durationMs,
    });

    await createdProblemSnapshot.save();

    return createdProblemSnapshot;
  }

  async storeGameResultSnapshot(room: IGameRoom) {
    const createGameSnapshot = await this.gameSnapshotRepository.create({
      fen: room.fen,
      white: room.white,
      black: room.black,
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
}
