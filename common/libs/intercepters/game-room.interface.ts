import { MoveType } from '../types';

export interface IGameRoom {
  fen: string;
  turn: string;
  white: {
    userId: string;
    socketId: string;
  };
  black: {
    userId: string;
    socketId: string;
  };
  roomId: string;
  version: number;
  createdAt: number;
  winnerId?: string;
  finishedAt?: number;
  allMoves: MoveType[];
  isGameOver?: boolean;
  isCheckmate?: boolean;
  isDraw?: boolean;
  winner?: 'white' | 'black' | 'draw';
  disconnected?: {
    userId: string;
    at: number;
  };
}
