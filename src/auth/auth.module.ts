import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { OauthModule } from './oauth/oauth.module';

@Module({
  imports: [UserModule, OauthModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
