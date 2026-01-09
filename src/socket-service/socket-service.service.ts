import Redis from 'ioredis';
import { Chess } from 'chess.js';
import { v4 as uuid } from 'uuid';
import { Server, Socket } from 'socket.io';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  IGameRoom,
  REDIS_CLIENT,
  GameMakeMoveDto,
  MakeMoveLuaScript,
  MakeMoveLuaResult,
  SOCKET_EMIT_MESSAGE,
} from '../../common';
import { SnapshotServiceService } from '../snapshot-service/snapshot-service.service';

@Injectable()
export class SocketServiceService implements OnModuleInit {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    private readonly snapshotService: SnapshotServiceService,
  ) {}

  onModuleInit() {
    this.redisClient.defineCommand('makeMoveAtomic', {
      numberOfKeys: 1,
      lua: MakeMoveLuaScript,
    });
  }

  async findGame(server: Server, client: Socket, userId: string) {
    const result = await this.matchOrCreateRoom(userId, client.id);

    if (result.status === 'waiting') {
      client.emit(SOCKET_EMIT_MESSAGE.WAITING_FOR_OPONENT);
      return;
    }

    client.join(result.roomId);

    const opponentSocket = server.sockets.sockets.get(result.waitingSocketId);

    opponentSocket?.join(result.roomId);

    server.to(result.roomId).emit(SOCKET_EMIT_MESSAGE.GAME_STARTED, {
      roomId: result.roomId,
    });
  }

  async makeMove(server: Server, client: Socket, payload: GameMakeMoveDto) {
    const roomKey = `room:${payload.roomId}`;

    const roomRaw = await this.redisClient.get(roomKey);
    if (!roomRaw) throw new Error('Room not found');

    const room: IGameRoom = JSON.parse(roomRaw);

    const userId = Object.keys(room.sockets).find(
      (id) => room.sockets[id] === client.id,
    );
    if (!userId) throw new Error('Not a player');

    const userColor = this.getColor(userId, room);

    if (room.turn !== userColor) {
      throw new Error('Not your turn');
    }

    const chess = new Chess(room.fen);

    const moveResult = chess.move({
      from: payload.move.from,
      to: payload.move.to,
    });

    if (!moveResult) throw new Error('Invalid move');

    room.fen = chess.fen();
    room.turn = chess.turn() === 'w' ? 'white' : 'black';
    room.isGameOver = chess.isGameOver();
    room.isCheckmate = chess.isCheckmate();
    room.isDraw = chess.isDraw();
    room.allMoves.push(payload.move);

    if (room.isGameOver) {
      room.winner = room.isCheckmate ? userColor : room.isDraw ? 'draw' : null;

      room.finishedAt = Date.now();
      room.winnerId =
        room.winner === 'white'
          ? room.white
          : room.winner === 'black'
            ? room.black
            : undefined;
    }

    let result: MakeMoveLuaResult;

    try {
      result = await this.redisClient.makeMoveAtomic(
        roomKey,
        room.version,
        JSON.stringify(room),
        3600,
      );
    } catch (e: any) {
      if (e.message?.includes('VERSION_CONFLICT')) {
        throw new Error('Move already processed');
      }
      throw e;
    }

    const [status, newVersion, isGameOver] = result;

    if (status !== 'OK') {
      throw new Error('Atomic move failed');
    }

    room.version = newVersion;

    if (isGameOver === 1) {
      await this.finishGameInternal(server, room);
    } else {
      server.to(payload.roomId).emit(SOCKET_EMIT_MESSAGE.MOVE_MADE, {
        move: payload.move,
      });
    }
  }

  async matchOrCreateRoom(userId: string, socketId: string) {
    const waitingRaw = await this.redisClient.lpop('chess:waiting_queue');

    if (!waitingRaw) {
      await this.redisClient.rpush(
        'chess:waiting_queue',
        JSON.stringify({ userId, socketId }),
      );

      return { status: 'waiting' };
    }

    const waitingUser = JSON.parse(waitingRaw);
    const roomId = `game:${uuid()}`;

    const roomData: IGameRoom = {
      version: 0,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // starting position
      turn: 'white',
      white: waitingUser.userId,
      black: userId,
      roomId,
      isDraw: false,
      createdAt: Date.now(),
      allMoves: [],
      isGameOver: false,
      isCheckmate: false,
      sockets: {
        [waitingUser.userId]: waitingUser.socketId,
        [userId]: socketId,
      },
    };

    await this.redisClient.set(
      `room:${roomId}`,
      JSON.stringify(roomData),
      'EX',
      3600,
    );

    await this.redisClient.set(`user:${waitingUser.userId}:room`, roomId);
    await this.redisClient.set(`user:${userId}:room`, roomId);

    return {
      status: 'matched',
      roomId,
      waitingSocketId: waitingUser.socketId,
    };
  }

  private async finishGameInternal(server: Server, room: IGameRoom) {
    const { roomId, winner } = room;

    await this.snapshotService.storeGameResultSnapshot(room);

    server.to(roomId).emit(SOCKET_EMIT_MESSAGE.GAME_FINISHED, {
      winner,
      reason: room.isDraw ? 'draw' : 'checkmate',
    });

    await this.cleanupRoom(room);

    // Optional close socket connection
  }

  private async cleanupRoom(room: IGameRoom) {
    await this.redisClient.del(`room:${room.roomId}`);
    await this.redisClient.del(`user:${room.white}:room`);
    await this.redisClient.del(`user:${room.black}:room`);
  }

  private getColor(userId: string, room: IGameRoom): 'white' | 'black' {
    if (room.white === userId) return 'white';
    if (room.black === userId) return 'black';
    throw new Error('User is not part of this room');
  }
}
