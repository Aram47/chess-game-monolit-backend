import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserRelatedData, ENV_VARIABLES } from '../../common';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>(ENV_VARIABLES.POSTGRES_HOST),
        port: configService.get<number>(ENV_VARIABLES.POSTGRES_PORT),
        username: configService.get<string>(ENV_VARIABLES.POSTGRES_USERNAME),
        password: configService.get<string>(ENV_VARIABLES.POSTGRES_PASSWORD),
        database: configService.get<string>(
          ENV_VARIABLES.POSTGRES_USER_DB_NAME,
        ),
        entities: [User, UserRelatedData],
        synchronize: true, // for development
      }),
    }),
    TypeOrmModule.forFeature([User, UserRelatedData]),
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
