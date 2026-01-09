import 'ioredis';
import { MakeMoveLuaResult } from './';

declare module 'ioredis' {
  interface Redis {
    makeMoveAtomic(
      roomKey: string,
      version: number,
      room: string,
      ttl: number,
    ): MakeMoveLuaResult;
  }
}
