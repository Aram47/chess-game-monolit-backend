import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ProblemSnapshot,
  ProblemSnapshotDto,
  ProblemSnapshotDocument,
} from '../../common';

@Injectable()
export class SnapshotServiceService {
  constructor(
    @InjectModel(ProblemSnapshot.name)
    private readonly problemSnapshotRepository: Model<ProblemSnapshotDocument>,
  ) {}

  async storeProblemSnapshot(snapshot: ProblemSnapshotDto) {
    const createdProblemSnapshot = await this.problemSnapshotRepository.create({
      userId: snapshot.userId,
      problemId: snapshot.problemId,
      moves: snapshot.moves,
      finalFen: snapshot.finalFen,
      theme: snapshot.theme,
      level: snapshot.level,
      solevedAt: snapshot.solevedAt,
      durationMs: snapshot.durationMs,
    });

    await createdProblemSnapshot.save();

    return createdProblemSnapshot;
  }
}
