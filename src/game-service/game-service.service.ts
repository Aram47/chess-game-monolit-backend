import Redis from 'ioredis';
import { v4 as uuid } from 'uuid';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Theme,
  MoveType,
  IPvEGameRoom,
  REDIS_CLIENT,
  MergePayload,
  ChessProblem,
  ProblemTheme,
  PaginationDto,
  ProblemSession,
  ProblemMoveDto,
  ProblemCategory,
  CreateProblemDto,
  UserDecoratorDto,
  ProblemSnapshotDto,
  GetProblemsQueryDto,
  CreateProblemCategoryDto,
} from '../../common';
import { Chess } from 'chess.js';
import { GameEngineService } from '../game-engine/game-engine.service';
import { SnapshotServiceService } from '../snapshot-service/snapshot-service.service';
@Injectable()
export class GameServiceService {
  constructor(
    private readonly snapshotService: SnapshotServiceService,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    @InjectRepository(Theme)
    private readonly themeRepository: Repository<Theme>,
    @InjectRepository(ChessProblem)
    private readonly chessProblemRepository: Repository<ChessProblem>,
    @InjectRepository(ProblemTheme)
    private readonly problemThemeRepository: Repository<ProblemTheme>,
    @InjectRepository(ProblemCategory)
    private readonly problemCategoryRepository: Repository<ProblemCategory>,
    private readonly datasSource: DataSource,
    private readonly gameEngineService: GameEngineService,
  ) {}

  async getProblems(
    payload: MergePayload<[PaginationDto, GetProblemsQueryDto]>,
  ) {
    const qb = this.chessProblemRepository.createQueryBuilder('problem');

    qb.where('problem.isActive = true');
    qb.innerJoin('problem.category', 'category');

    if (payload.categoryId) {
      qb.andWhere('category.id = :categoryId', {
        categoryId: payload.categoryId,
      });
    }

    if (payload.difficultyLevel) {
      qb.andWhere('problem.difficultyLevel = :level', {
        level: payload.difficultyLevel,
      });
    }

    if (payload.isPayable) {
      qb.andWhere('problem.isPayable = :isPayable', {
        isPayable: payload.isPayable,
      });
    }

    if (payload.themeId) {
      qb.innerJoin(
        'problem_themes',
        'pt',
        'pt.problemId = problem.id AND pt.themeId = :themeId',
        { themeId: payload.themeId },
      );
    }

    qb.skip(payload.skip).take(payload.limit);
    return await qb.getManyAndCount();
  }

  async startProblem(problemId: number, userMetaData: UserDecoratorDto) {
    const problem = await this.chessProblemRepository.findOne({
      where: { id: problemId, isActive: true },
    });

    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    const session: ProblemSession = {
      userId: userMetaData.sub,
      problemId,
      fen: problem.fen,
      solutionMoves: problem.solutionMoves,
      userMoves: [],
      startedAt: Date.now(),
    };

    await this.redisClient.set(
      this.getSessionKey(userMetaData.sub, problemId),
      JSON.stringify(session),
      'EX',
      1800,
    );

    return { status: 'started' };
  }

  async finishProblem(problemId: number, userId: number) {
    // Implementation of finishing the problem
    const key = this.getSessionKey(userId, problemId);
    const sessionRaw = await this.redisClient.get(key);

    if (!sessionRaw) {
      throw new NotFoundException('Problem session not found');
    }

    await this.redisClient.del(key);
    return { status: 'finished' };
  }

  async makeMove(problemId: number, userId: number, dto: ProblemMoveDto) {
    // Implementation of making a move in the problem session
    const key = this.getSessionKey(userId, problemId);
    const sessionRaw = await this.redisClient.get(key);
    if (!sessionRaw) {
      throw new NotFoundException('Problem session not found');
    }

    const session: ProblemSession = JSON.parse(sessionRaw);
    const chess = new Chess(session.fen);

    for (const move of session.userMoves) {
      chess.move(move);
    }

    const move = chess.move(dto.move);
    if (!move) {
      throw new BadRequestException('Invalid move');
    }

    const expectedMove = session.solutionMoves[session.userMoves.length];
    if (move.from !== expectedMove.from || move.to !== expectedMove.to) {
      throw new BadRequestException('Wrong move');
    }

    session.userMoves.push({ from: move.from, to: move.to });

    const isSloved = session.userMoves.length === session.solutionMoves.length;

    if (isSloved) {
      const snapshotDto: ProblemSnapshotDto = {
        userId: String(session.userId),
        problemId: String(session.problemId),
        finalFen: chess.fen(),
        solevedAt: new Date(),
        durationMs: Date.now() - session.startedAt,
        moves: session.userMoves,
        theme: '', // to be fetched
        level: '', // to be fetched
      };

      await this.finishProblemInternal(snapshotDto); // will be implemented later
      await this.redisClient.del(key);

      return { status: 'solved' };
    }

    await this.redisClient.set(key, JSON.stringify(session), 'EX', 1800);

    return { status: 'move accepted' };
  }

  async finishProblemInternal(snapshotDto: ProblemSnapshotDto) {
    await this.snapshotService.storeProblemSnapshot(snapshotDto);
  }

  private getSessionKey(userId: number, problemId: number): string {
    return `problem_session:user:${userId}:problem:${problemId}`;
  }

  async createProblem(dto: CreateProblemDto) {
    const category = await this.problemCategoryRepository.findOne({
      where: {
        name: dto.category,
      },
    });

    if (!category) {
      throw new NotFoundException('Problem category not found');
    }

    const problem = this.chessProblemRepository.create({
      fen: dto.fen,
      solutionMoves: dto.solutionMoves,
      description: dto.description,
      difficultyLevel: dto.difficultyLevel,
      isPayable: dto.isPayable,
      category,
      isActive: dto.isActive,
    });

    return await this.chessProblemRepository.save(problem);
  }

  async createProblemCategory(dto: CreateProblemCategoryDto) {
    const category = this.problemCategoryRepository.create({
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
      order: 0, // Default order, can be modified later
    });
    return await this.problemCategoryRepository.save(category);
  }

  async deleteChessProblemById(id: number) {
    const problem = await this.chessProblemRepository.findOne({
      where: { id },
    });

    if (!problem) {
      throw new NotFoundException('Chess problem not found');
    }

    await this.chessProblemRepository.remove(problem);

    return problem;
  }

  async deleteProblemCategoryById(id: number) {
    const category = await this.problemCategoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Problem category not found');
    }

    await this.problemCategoryRepository.remove(category);

    return category;
  }

  async startGameWithBot(user: UserDecoratorDto) {
    /**
     * @Important
     * I think we can have issue if user will send many requests to this api
     * I think we can solve this issue via redis atomic operations
     * like we can create room instance inside of redis and do that operations
     * inside of redis via atomic operations
     *
     * @Important2
     * we will check if user has already created room we will not move forvard
     * room creating operation
     */
    const roomId = uuid();

    const chess = new Chess();

    const room: IPvEGameRoom = {
      roomId,
      fen: chess.fen(),
      turn: 'w',
      white: { userId: String(user.sub) },
      black: 'bot',
      level: 'medium',
      allMoves: [],
      createdAt: Date.now(),
      version: 1,
    };

    await this.redisClient.set(
      `pve:room:${roomId}`,
      JSON.stringify(room),
      'EX',
      60 * 60,
    );

    return {
      roomId,
      fen: room.fen,
      color: 'white',
    };
  }

  async makeMoveInTheGameWithBot(
    roomId: string,
    move: MoveType,
    user: UserDecoratorDto,
  ) {
    const raw = await this.redisClient.get(`pve:room:${roomId}`);
    if (!raw) throw new NotFoundException('Room not found');
    const room: IPvEGameRoom = JSON.parse(raw);

    if (room.white.userId !== String(user.sub)) {
      throw new BadRequestException('Not your game');
    }

    if (room.isGameOver) {
      throw new BadRequestException('Game already finished');
    }

    const chess = new Chess(room.fen);

    // User move
    const userMove = chess.move(move);
    if (!userMove) {
      throw new BadRequestException('Invalid move');
    }

    room.allMoves.push(move);

    // Checking is finished or not
    if (chess.isGameOver()) {
      return await this.finishPvEGame(room, chess);
    }

    // Stockfish engine move
    const bestMove = await this.gameEngineService.getBestMove(
      chess.fen(),
      room.level,
    );

    chess.move(bestMove);
    room.allMoves.push(bestMove);

    // Checking is finished or not after stockfish move
    if (chess.isGameOver()) {
      return await this.finishPvEGame(room, chess);
    }

    room.fen = chess.fen();
    room.turn = chess.turn();
    room.version++;

    await this.redisClient.set(
      `pve:room:${roomId}`,
      JSON.stringify(room),
      'EX',
      60 * 60,
    );

    return {
      fen: room.fen,
      userMove,
      botMove: bestMove,
    };
  }

  private async finishPvEGame(room: IPvEGameRoom, chess: Chess) {
    room.isGameOver = true;
    room.finishedAt = Date.now();
    room.fen = chess.fen();

    if (chess.isCheckmate()) {
      room.isCheckmate = true;
      room.winner = chess.turn() === 'w' ? 'black' : 'white';
      room.winnerId = room.winner === 'white' ? room.white.userId : 'bot';
    } else {
      room.isDraw = true;
      room.winner = 'draw';
    }

    await this.snapshotService.storeGameResultSnapshot(room);
    await this.redisClient.del(`pve:room:${room.roomId}`);

    return room;
  }
}
