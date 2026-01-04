import { Module } from '@nestjs/common';
import { CommonModule, ENV_VARIABLES, ProblemTheme, ProblemCategory, ChessProblem, Theme, User, UserRelatedData } from '../common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { GameServiceModule } from './game-service/game-service.module';

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
        password: configService.get<string>(ENV_VARIABLES.POSTGRES_PASSWORD),
        database: configService.get<string>(ENV_VARIABLES.POSTGRES_DB),
        entities: [Theme, ChessProblem, ProblemTheme, ProblemCategory, User, UserRelatedData],
        synchronize: true, // for development
      }),
    }),
    CommonModule,
    ApiGatewayModule,
    UserModule,
    GameServiceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
