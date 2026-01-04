/**
 * Mock API services
 * Used when backend endpoints are not available
 * All data structures match real API contracts
 */

import type { GetProblemsResponse, ChessProblem, ProblemDifficultyLevel } from './puzzles';
import type { User, UserRelatedData } from './user';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export interface UserProgress {
  solvedCount: number;
  streak: number;
  accuracy: number;
  lastPuzzle?: ChessProblem;
}

/**
 * Mock user progress data
 */
export function getMockUserProgress(): UserProgress {
  return {
    solvedCount: 42,
    streak: 7,
    accuracy: 78,
    lastPuzzle: {
      id: 1,
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      solutionMoves: ['e4', 'e5', 'Nf3', 'Nc6'],
      description: 'Mate in two moves',
      difficultyLevel: ProblemDifficultyLevel.L2,
      isPayable: false,
      isActive: true,
    },
  };
}

/**
 * Mock problems data
 */
export function getMockProblems(): GetProblemsResponse {
  return {
    data: [
      {
        id: 1,
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
        solutionMoves: ['e4', 'e5', 'Nf3', 'Nc6'],
        description: 'Mate in two moves',
        difficultyLevel: ProblemDifficultyLevel.L1,
        isPayable: false,
        isActive: true,
      },
      {
        id: 2,
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        solutionMoves: ['Bc4', 'Nf6', 'd4', 'exd4'],
        description: 'Tactical combination',
        difficultyLevel: ProblemDifficultyLevel.L2,
        isPayable: false,
        isActive: true,
      },
      {
        id: 3,
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        solutionMoves: ['Nxe5', 'Nxe5', 'd4', 'Nc6'],
        description: 'Advanced tactics',
        difficultyLevel: ProblemDifficultyLevel.L3,
        isPayable: true,
        isActive: true,
      },
    ],
    total: 3,
    page: 1,
    limit: 10,
  };
}

export { USE_MOCK_DATA };

