import { Module } from '@nestjs/common';
import { NotificationsService } from './notification.service';
import { NotificationsController } from './notification.controller';
import { NotificationsRedisSubscriber } from './notification-redis.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRedisSubscriber],
  exports: [NotificationsService],
})
export class NotificationsModule {}
