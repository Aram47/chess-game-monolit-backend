export interface ProblemSession {
  userId: number;
  problemId: number;
  fen: string;
  solutionMoves: string[];
  userMoves: string[];
  startedAt: number;
}
