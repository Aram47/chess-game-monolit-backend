import { Module } from '@nestjs/common';
import {
  Theme,
  RedisModule,
  ChessProblem,
  ProblemTheme,
  ProblemCategory,
} from '../../common';
import { Stockfish } from './stockfish';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameServiceService } from './game-service.service';
import { GameServiceController } from './game-service.controller';
import { SnapshotServiceModule } from '../snapshot-service/snapshot-service.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Theme,
      ChessProblem,
      ProblemTheme,
      ProblemCategory,
    ]),
    RedisModule,
    SnapshotServiceModule,
  ],
  controllers: [GameServiceController],
  providers: [GameServiceService, Stockfish],
  exports: [GameServiceService],
})
export class GameServiceModule {}
