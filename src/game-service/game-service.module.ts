import { Module } from '@nestjs/common';
import {
  Theme,
  RedisModule,
  ChessProblem,
  ProblemTheme,
  ENV_VARIABLES,
  ProblemCategory,
} from '../../common';
import { ConfigService } from '@nestjs/config';
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
  providers: [GameServiceService],
  exports: [GameServiceService],
})
export class GameServiceModule {}
