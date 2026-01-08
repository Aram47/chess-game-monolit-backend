import { MoveType } from '../types';

export interface IGameRoom {
  fen: string;
  turn: string;
  white: string;
  black: string;
  roomId: string;
  version: number;
  isDraw: boolean;
  createdAt: number;
  winnerId?: string;
  finishedAt?: number;
  allMoves: MoveType[];
  isGameOver: boolean;
  isCheckmate: boolean;
  sockets: Record<string, string>;
  winner?: 'white' | 'black' | 'draw';
}
