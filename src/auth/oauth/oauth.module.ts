import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../../user/user.module';
import { User } from '../../../common';
import { OauthService } from './oauth.service';
import { OauthController } from './oauth.controller';
import { GoogleStrategy } from '../../../common';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    TypeOrmModule.forFeature([User]),
    UserModule,
  ],
  controllers: [OauthController],
  providers: [OauthService, GoogleStrategy],
  exports: [OauthService],
})
export class OauthModule {}
