import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserProfileService } from './user-profile.service';
import { UserFriendService } from './user-friend.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserRelatedData, UserFriend } from '../../common';
import { SnapshotServiceModule } from '../snapshot-service/snapshot-service.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRelatedData, UserFriend]),
    SnapshotServiceModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserProfileService, UserFriendService],
  exports: [UserService],
})
export class UserModule {}
