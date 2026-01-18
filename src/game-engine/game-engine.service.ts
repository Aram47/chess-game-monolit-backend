import { Injectable, OnModuleInit } from '@nestjs/common';
import { StockfishCommands, StockfishResponse } from '../../common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

@Injectable()
export class GameEngineService implements OnModuleInit {
  currentEngineIndex: number = 4;
  commands: Record<string, string>;
  responses: Record<string, string>;
  ENGINES_POOL_DEFAULT_SIZE: number = 4;
  stokfishEngines: Array<ChildProcessWithoutNullStreams | null> = [];

  onModuleInit() {
    this.stokfishEngines = new Array(this.ENGINES_POOL_DEFAULT_SIZE)
      .fill(null)
      .map(() => {
        const engine = spawn('stockfish');
        console.log(`Stockfish pid: ${engine.pid}`);
        engine.stdout.on('data', (data) =>
          console.log('Stockfish says:', data.toString()),
        );
        engine.stderr.on('data', (data) =>
          console.error('Stockfish stderr:', data.toString()),
        );
        engine.on('error', (err) => console.error('Stockfish failed:', err));
        return engine;
      });

    this.commands = {
      [StockfishCommands.GO]: StockfishCommands.GO, // go
      [StockfishCommands.UCI]: StockfishCommands.UCI, // uci
      [StockfishCommands.STOP]: StockfishCommands.STOP, // stop
      [StockfishCommands.QUIT]: StockfishCommands.QUIT, // quit
      [StockfishCommands.DEBUG]: StockfishCommands.DEBUG, // debug
      [StockfishCommands.ISREADY]: StockfishCommands.ISREADY, // isready
      [StockfishCommands.REGISTER]: StockfishCommands.REGISTER, // register
      [StockfishCommands.POSITION]: StockfishCommands.POSITION, // position
      [StockfishCommands.SETOPTION]: StockfishCommands.SETOPTION, // setoption
      [StockfishCommands.PONDERHIT]: StockfishCommands.PONDERHIT, // ponderhit
      [StockfishCommands.UCINEWGAME]: StockfishCommands.UCINEWGAME, // ucinewgame
    };

    this.responses = {
      [StockfishResponse.ID]: StockfishResponse.ID, // id
      [StockfishResponse.UCIOK]: StockfishResponse.UCIOK, // uciok
      [StockfishResponse.READYOK]: StockfishResponse.READYOK, // readyok
      [StockfishResponse.BESTMOVE]: StockfishResponse.BESTMOVE, // bestmove
    };

    const cleanUp = () => {
      console.log('Node.js exiting, killing all Stockfish engines...');
      this.stokfishEngines.forEach((engine) => {
        if (!engine.killed) engine.kill();
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

  private async handleCommand(command: string) {
    return new Promise((resolve) => {
      const engine = this.stokfishEngines[this.currentEngineIndex];

      this.currentEngineIndex =
        (this.currentEngineIndex + 1) % this.stokfishEngines.length;

      const onData = (data) => {
        resolve(data.toString());
        engine.stdout.off('data', onData);
      };

      engine.stdout.on('data', onData);
      engine.stdin.write(command + '\n');
    });
  }
}
