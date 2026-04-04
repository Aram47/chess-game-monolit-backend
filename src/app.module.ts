import { Module } from '@nestjs/common';
import {
  User,
  Theme,
  CommonModule,
  ProblemTheme,
  ChessProblem,
  ENV_VARIABLES,
  ProblemCategory,
  UserRelatedData,
  UserFriend,
  InboxNotification,
} from '../common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GameEngineModule } from './game-engine/game-engine.module';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';
import { GameServiceModule } from './game-service/game-service.module';
import { SocketServiceModule } from './socket-service/socket-service.module';
import { NotificationsModule } from './notification-service/notification.module';
import { GameAnalysisModule } from './game-analysis/game-analysis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>(ENV_VARIABLES.POSTGRES_HOST),
        port: configService.get<number>(ENV_VARIABLES.POSTGRES_PORT),
        username: configService.get<string>(ENV_VARIABLES.POSTGRES_USER),
        password: configService.get<string>(ENV_VARIABLES.POSTGRES_PASSWORD) || '',
        database: configService.get<string>(ENV_VARIABLES.POSTGRES_DB),
        entities: [
          User,
          Theme,
          ChessProblem,
          ProblemTheme,
          ProblemCategory,
          UserRelatedData,
          UserFriend,
          InboxNotification,
        ],
        synchronize: true, // for development
      }),
    }),
    UserModule,
    CommonModule,
    ApiGatewayModule,
    GameEngineModule,
    GameServiceModule,
    NotificationsModule,
    SocketServiceModule,
    GameAnalysisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
