import { MoveType } from '../types';

export interface ProblemSession {
  userId: number;
  problemId: number;
  fen: string;
  solutionMoves: MoveType[];
  userMoves: MoveType[];
  startedAt: number;
}
