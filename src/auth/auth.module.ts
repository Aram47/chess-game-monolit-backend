import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtUtils } from '../../common';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [UserModule, JwtModule],
  providers: [AuthService, JwtUtils],
  exports: [AuthService],
})
export class AuthModule {}
