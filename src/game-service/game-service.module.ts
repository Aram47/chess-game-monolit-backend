import { Module } from '@nestjs/common';
import {
  Theme,
  RedisModule,
  ChessProblem,
  ProblemTheme,
  ProblemCategory,
} from '../../common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameServiceService } from './game-service.service';
import { GameServiceController } from './game-service.controller';
import { GameEngineModule } from '../game-engine/game-engine.module';
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
    GameEngineModule,
    SnapshotServiceModule,
  ],
  controllers: [GameServiceController],
  providers: [GameServiceService],
  exports: [GameServiceService],
})
export class GameServiceModule {}
