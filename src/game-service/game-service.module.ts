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
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>(ENV_VARIABLES.POSTGRES_HOST),
        port: configService.get<number>(ENV_VARIABLES.POSTGRES_PORT),
        username: configService.get<string>(ENV_VARIABLES.POSTGRES_USER),
        password: configService.get<string>(ENV_VARIABLES.POSTGRES_PASSWORD),
        database: configService.get<string>(ENV_VARIABLES.POSTGRES_DB),
        entities: [Theme, ChessProblem, ProblemTheme, ProblemCategory],
        synchronize: true, // for development
      }),
    }),
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
