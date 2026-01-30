import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserRelatedData } from '../../common';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRelatedData])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
