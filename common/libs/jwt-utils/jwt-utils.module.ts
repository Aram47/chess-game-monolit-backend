// jwt.module.ts
import { Module } from '@nestjs/common';
import { JwtUtils } from './jwt.utils';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ENV_VARIABLES } from '../../';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>(ENV_VARIABLES.JWT_SECRET),
        signOptions: {
          expiresIn: config.get<string | number>(
            ENV_VARIABLES.JWT_EXPIRES_IN,
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  providers: [JwtUtils],
  exports: [JwtUtils, JwtModule],
})
export class JwtUtilsModule {}
