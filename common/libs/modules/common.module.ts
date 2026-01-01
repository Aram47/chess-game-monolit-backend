import { AuthGuard } from '../';
import { ConfigModule } from '@nestjs/config';
import { JwtUtilsModule } from '../jwt-utils';
import { Global, Module } from '@nestjs/common';

/**
 * Common Module
 *
 * Common module that exports frequently used services and guards.
 * Import this module in other modules for access to:
 * - JwtUtils
 * - AuthGuard
 */
@Global()
@Module({
  imports: [ConfigModule, JwtUtilsModule],
  providers: [AuthGuard],
  exports: [JwtUtilsModule, AuthGuard],
})
export class CommonModule {}
