import { Module } from '@nestjs/common';
import {
  Theme,
  ChessProblem,
  ProblemTheme,
  ProblemCategory,
  ENV_VARIABLES,
} from '../../common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameServiceService } from './game-service.service';

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
  ],
  providers: [GameServiceService],
  exports: [GameServiceService],
})
export class GameServiceModule {}
