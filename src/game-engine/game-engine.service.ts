import { spawn } from 'child_process';
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  MoveType,
  StockfishEngineWrapper,
  MultiPvAnalysisEngineResult,
  AnalysisEngineLine,
} from '../../common';
import {
  parseStockfishInfoLine,
  parsedLineToEngineFields,
} from './stockfish-multipv.parser';

@Injectable()
export class GameEngineService implements OnModuleInit {
  currentEngineIndex: number = 0;
  ENGINES_POOL_DEFAULT_SIZE: number = 4;
  stokfishEngines: StockfishEngineWrapper[];

  onModuleInit() {
    this.stokfishEngines = new Array(this.ENGINES_POOL_DEFAULT_SIZE)
      .fill(null)
      .map(() => this.createEngine());

    const cleanUp = () => {
      console.log('Node.js exiting, killing all Stockfish engines...');
      this.stokfishEngines.forEach((engine) => {
        if (!engine.process.killed) engine.process.kill();
      });
    };

    process.on('exit', () => cleanUp()); // exit

    process.on('SIGINT', () => {
      // Ctrl+C
      cleanUp();
      process.exit();
    });

    process.on('SIGTERM', () => {
      // docker stop / systemd
      cleanUp();
      process.exit();
    });

    process.on('uncaughtException', (err) => {
      // error
      console.error('Uncaught exception:', err);
      cleanUp();
      process.exit(1);
    });
  }

  async getBestMove(
    fen: string,
    level: 'easy' | 'medium' | 'hard',
  ): Promise<MoveType> {
    const engine = this.getEngine();

    return new Promise<MoveType>((resolve, reject) => {
      const timeoutMs = 2000;
      let done = false;

      const timeoutId = setTimeout(() => {
        if (done) return;
        done = true;

        engine.process.stdout.off('data', onData);
        engine.busy = false;

        const index = this.stokfishEngines.indexOf(engine);
        if (index !== -1) {
          this.restartEngine(index);
        }

        reject(new Error('Stockfish timeout'));
      }, timeoutMs);

      let buffer = '';

      const onData = (data: Buffer) => {
        if (done) return;

        buffer += data.toString();

        if (!buffer.includes('bestmove')) return;

        done = true;
        clearTimeout(timeoutId);

        const match = buffer.match(/bestmove\s(\S+)/);
        buffer = '';
        if (!match) return;

        engine.process.stdout.off('data', onData);
        engine.busy = false;

        const move = match[1];

        if (move === '(none)') {
          return reject(new Error('No legal moves'));
        }

        resolve({
          from: move.slice(0, 2),
          to: move.slice(2, 4),
          promotion: move[4],
        });
      };

      engine.process.stdout.on('data', onData);

      try {
        engine.process.stdin.write('ucinewgame\n');
        engine.process.stdin.write(`position fen ${fen}\n`);

        // hier we choose one variant
        this.sendGoCommand(engine, level);
      } catch (err) {
        clearTimeout(timeoutId);
        engine.process.stdout.off('data', onData);
        engine.busy = false;
        reject(err);
      }
    });
  }

  /**
   * MultiPV analysis at fixed depth. Resets MultiPV to 1 before releasing the engine.
   */
  async analyzeMultiPv(params: {
    fen: string;
    multiPv: number;
    depth: number;
  }): Promise<MultiPvAnalysisEngineResult> {
    const { fen, multiPv, depth } = params;
    const engine = this.getEngine();
    const timeoutMs = 15_000;

    return new Promise<MultiPvAnalysisEngineResult>((resolve, reject) => {
      let done = false;
      let buffer = '';
      type Phase = 'await_first_ready' | 'searching' | 'await_reset_ready';
      let phase: Phase = 'await_first_ready';
      const byMultiPv = new Map<number, AnalysisEngineLine>();
      let depthReached = 0;

      const finishError = (err: Error) => {
        if (done) return;
        done = true;
        clearTimeout(timeoutId);
        engine.process.stdout.off('data', onData);
        engine.busy = false;
        reject(err);
      };

      const finishSuccess = (result: MultiPvAnalysisEngineResult) => {
        if (done) return;
        done = true;
        clearTimeout(timeoutId);
        engine.process.stdout.off('data', onData);
        engine.busy = false;
        resolve(result);
      };

      const timeoutId = setTimeout(() => {
        if (done) return;
        done = true;
        engine.process.stdout.off('data', onData);
        engine.busy = false;
        const index = this.stokfishEngines.indexOf(engine);
        if (index !== -1) this.restartEngine(index);
        reject(new Error('Stockfish analysis timeout'));
      }, timeoutMs);

      const flushLines = () => {
        const parts = buffer.split('\n');
        buffer = parts.pop() ?? '';
        return parts;
      };

      const onData = (data: Buffer) => {
        if (done) return;
        buffer += data.toString();

        const lines = flushLines();

        for (const raw of lines) {
          const line = raw.trim();
          if (!line) continue;

          if (phase === 'await_first_ready') {
            if (line === 'readyok') {
              phase = 'searching';
              try {
                engine.process.stdin.write(`position fen ${fen}\n`);
                engine.process.stdin.write(`go depth ${depth}\n`);
              } catch (e) {
                finishError(
                  e instanceof Error ? e : new Error(String(e)),
                );
              }
            }
            continue;
          }

          if (phase === 'searching') {
            if (line.startsWith('info ')) {
              const parsed = parseStockfishInfoLine(line);
              if (parsed) {
                const fields = parsedLineToEngineFields(parsed);
                if (fields) {
                  byMultiPv.set(fields.multipv, {
                    multipv: fields.multipv,
                    depth: fields.depth,
                    evaluation: fields.evaluation,
                    move: fields.move,
                    pvUci: fields.pvUci,
                  });
                  depthReached = Math.max(depthReached, fields.depth);
                }
              }
            } else if (line.startsWith('bestmove ')) {
              phase = 'await_reset_ready';
              buffer = '';
              try {
                engine.process.stdin.write(
                  'setoption name MultiPV value 1\n',
                );
                engine.process.stdin.write('isready\n');
              } catch (e) {
                finishError(
                  e instanceof Error ? e : new Error(String(e)),
                );
              }
            }
            continue;
          }

          if (phase === 'await_reset_ready' && line === 'readyok') {
            const ordered: AnalysisEngineLine[] = [];
            for (let m = 1; m <= multiPv; m++) {
              const row = byMultiPv.get(m);
              if (row) ordered.push(row);
            }
            finishSuccess({
              depthRequested: depth,
              depthReached,
              lines: ordered,
            });
          }
        }
      };

      engine.process.stdout.on('data', onData);

      try {
        engine.process.stdin.write('ucinewgame\n');
        engine.process.stdin.write(
          `setoption name MultiPV value ${multiPv}\n`,
        );
        engine.process.stdin.write('isready\n');
      } catch (err) {
        clearTimeout(timeoutId);
        engine.process.stdout.off('data', onData);
        engine.busy = false;
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  private sendGoCommand(
    engine: StockfishEngineWrapper,
    level: 'easy' | 'medium' | 'hard',
  ) {
    const map = {
      easy: Math.random() < 0.3 ? 50 : 150,
      medium: 300,
      hard: 600,
    };

    engine.process.stdin.write(`go movetime ${map[level]}\n`);
  }

  private createEngine(): StockfishEngineWrapper {
    const engine = spawn('stockfish');

    engine.stdin.write('uci\n');
    engine.stdin.write('isready\n');

    engine.stderr.on('data', (data) =>
      console.error('Stockfish stderr:', data.toString()),
    );
    engine.on('exit', (code) => {
      console.error('Stockfish exited with code', code);
    });

    engine.on('close', () => {
      console.error('Stockfish closed');
    });
    engine.on('error', (err) => console.error('Stockfish failed:', err));

    return {
      process: engine,
      busy: false,
    };
  }

  private restartEngine(index: number) {
    const oldEngine = this.stokfishEngines[index];

    try {
      if (!oldEngine.process.killed) {
        oldEngine.process.kill();
      }
    } catch (e) {
      console.error('Error killing Stockfish:', e);
    }

    console.log(`Restarting Stockfish engine at index ${index}`);

    this.stokfishEngines[index] = this.createEngine();
  }

  private getEngine(): StockfishEngineWrapper {
    const enginesCount = this.stokfishEngines.length;

    for (let i = 0; i < enginesCount; i++) {
      const index = this.currentEngineIndex;
      this.currentEngineIndex = (this.currentEngineIndex + 1) % enginesCount;

      const engine = this.stokfishEngines[index];

      // if process killed we restart it
      if (engine.process.killed) {
        this.restartEngine(index);
        this.stokfishEngines[index].busy = true;
        return this.stokfishEngines[index];
      }

      if (!engine.busy) {
        engine.busy = true;
        return engine;
      }
    }

    throw new Error('All Stockfish engines are busy');
  }
}
