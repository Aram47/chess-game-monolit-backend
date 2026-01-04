import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserRelatedData, ENV_VARIABLES } from '../../common';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRelatedData]),
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
