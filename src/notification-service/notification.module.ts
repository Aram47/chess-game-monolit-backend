import { InboxNotification, RedisModule } from '../../common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notification.service';
import { NotificationsController } from './notification.controller';
import { NotificationsRedisSubscriber } from './notification-redis.service';
import { NotificationsPublisherService } from './notification-publisher.service';
import { NotificationFeedService } from './notification-feed.service';

@Module({
  imports: [RedisModule, TypeOrmModule.forFeature([InboxNotification])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRedisSubscriber,
    NotificationFeedService,
    NotificationsPublisherService,
  ],
  exports: [NotificationsService, NotificationsPublisherService, NotificationFeedService],
})
export class NotificationsModule {}
