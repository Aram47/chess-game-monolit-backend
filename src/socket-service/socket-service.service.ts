import Redis from 'ioredis';
import { Chess } from 'chess.js';
import { v4 as uuid } from 'uuid';
import { Server, Socket } from 'socket.io';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  IPvPGameRoom,
  REDIS_CLIENT,
  GameMakeMoveDto,
  MakeMoveLuaScript,
  MakeMoveLuaResult,
  SOCKET_EMIT_MESSAGE,
  MatchMakeAtomicLuaScript,
  FindGameRoomAtomicLuaScript,
  CreateGameRoomAtomicLuaScript,
  UpdateGameRoomAtomicLuaScript,
  RemoveGameRoomAtomicLuaScript,
  FindWaitingRoomAtomicLuaScript,
  CreateWaitingRoomAtomicLuaScript,
  RemoveWaitingRoomAtomicLuaScript,
} from '../../common';
import { SnapshotServiceService } from '../snapshot-service/snapshot-service.service';

@Injectable()
export class SocketServiceService implements OnModuleInit {
  private readonly DISCONNECT_GRACE_MS: number = 30_000;

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    private readonly snapshotService: SnapshotServiceService,
  ) {}

  async onModuleInit() {
    this.redisClient.defineCommand('makeMoveAtomic', {
      numberOfKeys: 1,
      lua: MakeMoveLuaScript,
    });

    this.redisClient.defineCommand('findWaitingRoomAtomic', {
      numberOfKeys: 1,
      lua: FindWaitingRoomAtomicLuaScript,
    });

    this.redisClient.defineCommand('createWaitingRoomAtomic', {
      numberOfKeys: 1,
      lua: CreateWaitingRoomAtomicLuaScript,
    });

    this.redisClient.defineCommand('removeWaitingRoomAtomic', {
      numberOfKeys: 1,
      lua: RemoveWaitingRoomAtomicLuaScript,
    });

    this.redisClient.defineCommand('findGameRoom', {
      numberOfKeys: 1,
      lua: FindGameRoomAtomicLuaScript,
    });

    this.redisClient.defineCommand('createGameRoom', {
      numberOfKeys: 1,
      lua: CreateGameRoomAtomicLuaScript,
    });

    this.redisClient.defineCommand('updateGameRoom', {
      numberOfKeys: 1,
      lua: UpdateGameRoomAtomicLuaScript,
    });

    this.redisClient.defineCommand('removeGameRoom', {
      numberOfKeys: 1,
      lua: RemoveGameRoomAtomicLuaScript,
    });

    this.redisClient.defineCommand('matchMake', {
      numberOfKeys: 1,
      lua: MatchMakeAtomicLuaScript,
    });
  }

  async handleDisconnect(server: Server, client: Socket) {
    const userId: string = client.data?.user?.sub;
    if (!userId) {
      // user not found
      return;
    }

    const roomId = await this.redisClient.get(`chess:user:${userId}:room`);
    if (!roomId) {
      // roomId not found
      return;
    }

    const roomKey = `chess:room:${roomId}`;
    const roomRaw = await this.redisClient.findGameRoom(roomKey);

    if (!roomRaw) {
      // room not found
      return;
    }

    const room: IPvPGameRoom = JSON.parse(roomRaw);

    if (room.isGameOver) {
      // Game finished
      return;
    }

    room.disconnected = {
      userId,
      at: Date.now(),
    };

    await this.redisClient.updateGameRoom(
      roomKey,
      JSON.stringify(room),
      'EX',
      30,
    );

    // await this.scheduleDisconnectTimeout(server, room);
    // notify to user about second user disconnecting
  }

  async handleReconnect(server: Server, client: Socket) {
    const userId = client.data?.user?.sub;
    if (!userId) {
      // userId not found
      return;
    }

    const roomId = await this.redisClient.get(`chess:user:${userId}:room`);
    if (!roomId) {
      // roomId not found
      return;
    }
    const roomKey = `chess:room:${roomId}`;
    const roomRaw = await this.redisClient.findGameRoom(roomKey);
    if (!roomRaw) {
      // room not found
      return;
    }

    const room: IPvPGameRoom = JSON.parse(roomRaw);

    const timeoutTriggered = await this.checkDisconnectTimeout(server, room);
    if (timeoutTriggered) {
      // game already finished
      return;
    }

    if (room.white.userId !== userId && room.black.userId !== userId) {
      // who is this user?
      return;
    }

    if (room.disconnected?.userId === userId) {
      delete room.disconnected;
      if (room.white.userId === userId) {
        room.white.socketId = client.id;
      } else {
        room.black.socketId = client.id;
      }

      await this.redisClient.updateGameRoom(
        roomKey,
        JSON.stringify(room),
        'EX',
        3600,
      );
    }

    client.join(roomId);

    client.emit(SOCKET_EMIT_MESSAGE.GAME_RESUMED, {
      fen: room.fen,
      turn: room.turn,
      allMoves: room.allMoves,
    });
  }

  async findGame(server: Server, client: Socket, userId: string) {
    const { status, room } = await this.matchOrCreateRoom(userId, client.id);

    switch (status) {
      case 'Waiting': {
        client.emit(SOCKET_EMIT_MESSAGE.WAITING_FOR_OPONENT);
        return;
      }
      case 'Match': {
        client.join(room.roomId);
        const opponentSocketId =
          room.white.userId === userId
            ? room.black.socketId
            : room.white.socketId;

        const opponentSocket = server.sockets.sockets.get(opponentSocketId);
        opponentSocket?.join(room.roomId);

        server.to(room.roomId).emit(SOCKET_EMIT_MESSAGE.GAME_STARTED, {
          fen: room.fen,
          turn: room.turn,
          roomId: room.roomId,
          white: room.white.userId,
          black: room.black.userId,
        });

        return;
      }
      default: {
        client.emit(SOCKET_EMIT_MESSAGE.CREATING_ISSUE);
        return;
      }
    }
  }

  async makeMove(server: Server, client: Socket, payload: GameMakeMoveDto) {
    const roomKey = `chess:room:${payload.roomId}`;

    const roomRaw: string = await this.redisClient.findGameRoom(roomKey);

    if (!roomRaw) {
      // room not found
      return;
    }

    const room: IPvPGameRoom = JSON.parse(roomRaw);

    const timeoutTriggered = await this.checkDisconnectTimeout(server, room);
    if (timeoutTriggered) {
      return;
    }

    if (room.disconnected) {
      // we have a disconnected user
      return;
    }

    const userId =
      client.id === room.white.socketId
        ? room.white.userId
        : client.id === room.black.socketId
          ? room.black.userId
          : '';

    if (!userId) {
      // Not player
      return;
    }

    const userColor = this.getColor(userId, room);

    if (!userColor) {
      // what the fuck who is this man?
      return;
    }

    if (room.turn !== userColor) {
      // this is not your turn beach
      return;
    }

    const chess: Chess = new Chess(room.fen);

    const moveResult = chess.move({
      from: payload.move.from,
      to: payload.move.to,
    });

    if (!moveResult) {
      // do you know rules of chess?
      return;
    }

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
          ? room.white.userId
          : room.winner === 'black'
            ? room.black.userId
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
        // move already processed
      }
      throw e;
    }

    const [status, newVersion, isGameOver] = result;

    if (status !== 'OK') {
      // 'Atomic move failed'
      return;
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

  private async matchOrCreateRoom(
    userId: string,
    socketId: string,
  ): Promise<{
    status: 'Waiting' | 'Match' | 'UNKNOWN_MATCHMAKE_STATUS';
    room?: IPvPGameRoom;
  }> {
    const roomId: string = `game:${uuid()}`;
    const result = await this.redisClient.matchMake(
      'chess:waiting_queue',
      userId,
      socketId,
      roomId,
      30, // seconds waiting TTL
    );

    const status = result[0];

    if (status === 'WAIT') {
      return { status: 'Waiting' };
    }

    if (status === 'MATCH') {
      return { status: 'Match', room: JSON.parse(result[1]) };
    }

    if (status === 'ALREADY_IN_ROOM') {
      const existingRoomId = result[1];
      const roomKey = `chess:room:${existingRoomId}`;

      const roomRaw = await this.redisClient.findGameRoom(roomKey);

      if (!roomRaw) {
        return { status: 'Waiting' };
      }

      return {
        status: 'Match',
        room: JSON.parse(roomRaw),
      };
    }

    return { status: 'UNKNOWN_MATCHMAKE_STATUS' };
  }

  private async checkDisconnectTimeout(
    server: Server,
    room: IPvPGameRoom,
  ): Promise<boolean> {
    if (!room.disconnected || room.isGameOver) {
      return false;
    }

    const now = Date.now();
    const elapsed = now - room.disconnected.at;

    if (elapsed < this.DISCONNECT_GRACE_MS) {
      return false;
    }

    const loserId = room.disconnected.userId;
    const winnerColor = loserId === room.white.userId ? 'black' : 'white';

    room.isGameOver = true;
    room.winner = winnerColor;
    room.winnerId =
      winnerColor === 'white' ? room.white.userId : room.black.userId;
    room.finishedAt = now;
    room.isCheckmate = false;
    room.isDraw = false;

    await this.redisClient.updateGameRoom(
      `chess:room:${room.roomId}`,
      JSON.stringify(room),
      'EX',
      60,
    );

    await this.finishGameInternal(server, room);
    return true;
  }

  private async finishGameInternal(server: Server, room: IPvPGameRoom) {
    const { roomId, winner, winnerId } = room;
    await this.snapshotService.storeGameResultSnapshot(room);
    server.to(roomId).emit(SOCKET_EMIT_MESSAGE.GAME_FINISHED, {
      winner,
      winnerId,
      reason: room.isCheckmate ? 'checkmate' : room.isDraw ? 'draw' : 'leav',
    });
    await this.cleanupRoom(room);
  }

  private async cleanupRoom(room: IPvPGameRoom) {
    await this.redisClient.removeGameRoom(`chess:room:${room.roomId}`);
    await this.redisClient.del(`chess:user:${room.white.userId}:room`);
    await this.redisClient.del(`chess:user:${room.black.userId}:room`);
  }

  private getColor(userId: string, room: IPvPGameRoom) {
    return room.white.userId === userId
      ? 'white'
      : room.black.userId === userId
        ? 'black'
        : '';
  }
}
