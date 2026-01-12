import 'ioredis';
import { MakeMoveLuaResult } from './';

declare module 'ioredis' {
  interface Redis {
    makeMoveAtomic(
      roomKey: string,
      version: number,
      room: string,
      ttl: number,
    ): Promise<MakeMoveLuaResult>;

    findWaitingRoomAtomic(queue: string): Promise<any>;

    createWaitingRoomAtomic(queue: string, roomOptions: string): Promise<any>;

    removeWaitingRoomAtomic(): Promise<any>;

    findGameRoom(key: string): Promise<any>;

    createGameRoom(
      key: string,
      room: string,
      secondsToken: string,
      ttl: number,
    ): Promise<any>;

    updateGameRoom(
      key: string,
      roomUpdatingOptions: string,
      secondsToken: string,
      ttl: number,
    ): Promise<any>;

    removeGameRoom(key: string): Promise<any>;

    matchMake(
      key: string,
      userId: string,
      socketId: string,
      roomId: string,
      ttl: number,
    ): Promise<any>;
  }
}
