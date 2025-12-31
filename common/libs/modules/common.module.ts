import { Module } from '@nestjs/common';
import { ENV_VARIABLES } from '../../';
import { JwtUtils, AuthGuard } from '../';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Common Module
 *
 * Common module that exports frequently used services and guards.
 * Import this module in other modules for access to:
 * - JwtUtils
 * - AuthGuard
 */
@Module({
  imports: [
    ConfigModule,
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
  providers: [JwtUtils, AuthGuard],
  exports: [JwtUtils, AuthGuard],
})
export class CommonModule {}
