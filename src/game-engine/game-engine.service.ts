import { spawn } from 'child_process';
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chess } from 'chess.js';
import {
  MoveType,
  StockfishEngineWrapper,
  ENV_VARIABLES,
  StockfishDefaults,
  StockfishResponse,
  DifficultyMovetimeMs,
} from '../../common';

type DifficultyLevel = 'easy' | 'medium' | 'hard';

@Injectable()
export class GameEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GameEngineService.name);
  private currentEngineIndex = 0;
  private stockfishEngines: StockfishEngineWrapper[] = [];

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const poolSize =
      this.configService.get<number>(
        ENV_VARIABLES.STOCKFISH_ENGINES_POOL_SIZE,
      ) ?? StockfishDefaults.ENGINES_POOL_SIZE;

    this.stockfishEngines = await Promise.all(
      Array.from({ length: poolSize }, () => this.createEngine()),
    );
  }

  async onModuleDestroy() {
    this.cleanUp();
  }

  private cleanUp() {
    for (const engine of this.stockfishEngines) {
      try {
        if (!engine.process.killed) {
          engine.process.kill();
        }
      } catch (e) {
        this.logger.error('Error killing Stockfish engine', e);
      }
    }
    this.stockfishEngines = [];
  }

  async getBestMove(fen: string, level: DifficultyLevel): Promise<MoveType> {
    this.validateFen(fen);

    const engine = await this.getEngine();
    const timeoutMs =
      this.configService.get<number>(ENV_VARIABLES.STOCKFISH_MOVE_TIMEOUT_MS) ??
      StockfishDefaults.MOVE_TIMEOUT_MS;

    return new Promise<MoveType>((resolve, reject) => {
      let done = false;

      const timeoutId = setTimeout(() => {
        if (done) return;
        done = true;

        engine.process.stdout.off('data', onData);
        engine.busy = false;

        const index = this.stockfishEngines.indexOf(engine);
        if (index !== -1) {
          this.restartEngine(index).catch((err) =>
            this.logger.error('Failed to restart Stockfish engine', err),
          );
        }

        reject(new ServiceUnavailableException('Stockfish timeout'));
      }, timeoutMs);

      let buffer = '';

      const onData = (data: Buffer) => {
        if (done) return;

        const chunk = data.toString();
        if (
          buffer.length + chunk.length >
          StockfishDefaults.MAX_OUTPUT_BUFFER_BYTES
        ) {
          done = true;
          clearTimeout(timeoutId);
          engine.process.stdout.off('data', onData);
          engine.busy = false;
          reject(new ServiceUnavailableException('Stockfish output buffer overflow'));
          return;
        }

        buffer += chunk;

        if (!buffer.includes(StockfishResponse.BESTMOVE)) return;

        done = true;
        clearTimeout(timeoutId);

        const match = buffer.match(/bestmove\s(\S+)/);
        buffer = '';

        engine.process.stdout.off('data', onData);
        engine.busy = false;

        if (!match) {
          reject(new ServiceUnavailableException('Failed to parse Stockfish output'));
          return;
        }

        const move = match[1];

        if (move === '(none)') {
          reject(new BadRequestException('No legal moves'));
          return;
        }

        resolve({
          from: move.slice(0, 2),
          to: move.slice(2, 4),
          promotion: move[4],
        });
      };

      engine.process.stdout.on('data', onData);

      try {
        if (engine.process.killed) {
          engine.busy = false;
          reject(new ServiceUnavailableException('Stockfish process is not running'));
          return;
        }

        engine.process.stdin.write('ucinewgame\n');
        engine.process.stdin.write(`position fen ${fen}\n`);
        this.sendGoCommand(engine, level);
      } catch (err) {
        clearTimeout(timeoutId);
        engine.process.stdout.off('data', onData);
        engine.busy = false;
        reject(err);
      }
    });
  }

  private validateFen(fen: string): void {
    try {
      new Chess(fen);
    } catch {
      throw new BadRequestException('Invalid FEN position');
    }
  }

  private sendGoCommand(
    engine: StockfishEngineWrapper,
    level: DifficultyLevel,
  ): void {
    const movetimeMs = this.getMovetimeMs(level);
    engine.process.stdin.write(`go movetime ${movetimeMs}\n`);
  }

  private getMovetimeMs(level: DifficultyLevel): number {
    const map: Record<DifficultyLevel, number> = {
      easy:
        Math.random() < 0.3
          ? DifficultyMovetimeMs.easy[0]
          : DifficultyMovetimeMs.easy[1],
      medium: DifficultyMovetimeMs.medium,
      hard: DifficultyMovetimeMs.hard,
    };
    return map[level] ?? DifficultyMovetimeMs.medium;
  }

  private createEngine(): Promise<StockfishEngineWrapper> {
    return new Promise((resolve, reject) => {
      const path = this.configService.get<string>(ENV_VARIABLES.STOCKFISH_PATH);
      const binaryPath =
        path?.trim() || StockfishDefaults.BINARY_PATH;
      const engine = spawn(binaryPath);
      const initTimeoutMs = StockfishDefaults.INIT_TIMEOUT_MS;

      const timeoutId = setTimeout(() => {
        engine.stdout.off('data', onReady);
        if (!engine.killed) {
          engine.kill();
        }
        reject(new ServiceUnavailableException('Stockfish init timeout: no readyok response'));
      }, initTimeoutMs);

      engine.on('error', (err) => {
        clearTimeout(timeoutId);
        this.logger.error('Stockfish spawn failed', err);
        reject(new ServiceUnavailableException('Stockfish spawn failed', { cause: err }));
      });

      engine.stderr.on('data', (data) =>
        this.logger.debug(`Stockfish stderr: ${data.toString()}`),
      );
      engine.on('exit', (code) => {
        this.logger.warn(`Stockfish exited with code ${code}`);
      });
      engine.on('close', () => {
        this.logger.warn('Stockfish closed');
      });

      let buffer = '';
      const onReady = (data: Buffer) => {
        buffer += data.toString();
        if (buffer.includes(StockfishResponse.READYOK)) {
          clearTimeout(timeoutId);
          engine.stdout.off('data', onReady);
          resolve({
            process: engine,
            busy: false,
          });
        }
      };

      engine.stdout.on('data', onReady);
      engine.stdin.write('uci\n');
      engine.stdin.write('isready\n');
    });
  }

  private async restartEngine(index: number): Promise<StockfishEngineWrapper> {
    const oldEngine = this.stockfishEngines[index];

    try {
      if (!oldEngine?.process.killed) {
        oldEngine?.process.kill();
      }
    } catch (e) {
      this.logger.error('Error killing Stockfish', e);
    }

    const newEngine = await this.createEngine();
    this.stockfishEngines[index] = newEngine;
    return newEngine;
  }

  private async getEngine(): Promise<StockfishEngineWrapper> {
    const enginesCount = this.stockfishEngines.length;

    if (enginesCount === 0) {
      throw new ServiceUnavailableException(
        'Stockfish engine pool is empty (service may be shutting down)',
      );
    }

    for (let i = 0; i < enginesCount; i++) {
      const index = this.currentEngineIndex;
      this.currentEngineIndex = (this.currentEngineIndex + 1) % enginesCount;

      const engine = this.stockfishEngines[index];

      if (engine.process.killed) {
        const newEngine = await this.restartEngine(index);
        newEngine.busy = true;
        return newEngine;
      }

      if (!engine.busy) {
        engine.busy = true;
        return engine;
      }
    }

    throw new ServiceUnavailableException('All Stockfish engines are busy');
  }
}
