import { MoveType } from '../types';

interface IGameRoom {
  fen: string;
  turn: string;
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

export interface IPvEGameRoom extends IGameRoom {
  white: { userId: string };
  black: 'bot';
}

export interface IPvPGameRoom extends IGameRoom {
  white: {
    userId: string;
    socketId: string;
  };
  black: {
    userId: string;
    socketId: string;
  };
}

export const isBotRoom = (room: IPvEGameRoom | IPvPGameRoom): boolean => {
  return typeof room.black === 'string' ? true : false;
};
