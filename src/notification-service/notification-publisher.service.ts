import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { NOTIFICATIONS_USER_CHANNEL } from './notification.constants';
import { NotificationFeedService } from './notification-feed.service';

export type UserNotificationPayload = {
  userId: number;
  event: string;
  data: unknown;
  id?: string;
  retry?: number;
};

@Injectable()
export class NotificationsPublisherService {
  private readonly logger = new Logger(NotificationsPublisherService.name);

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    private readonly notificationFeedService: NotificationFeedService,
  ) {}

  /**
   * Publishes to `NOTIFICATIONS_USER_CHANNEL`; local `NotificationsRedisSubscriber`
   * forwards to `NotificationsService.pushToUser` for SSE clients.
   */
  async publishToUser(
    userId: number,
    event: string,
    data: unknown,
    options?: Pick<UserNotificationPayload, 'id' | 'retry'>,
  ): Promise<void> {
    const payload: UserNotificationPayload = {
      userId,
      event,
      data,
      ...options,
    };

    await this.notificationFeedService.persist(userId, event, data);

    try {
      await this.redisClient.publish(
        NOTIFICATIONS_USER_CHANNEL,
        JSON.stringify(payload),
      );
    } catch (err) {
      this.logger.warn(
        `Failed to publish notification event="${event}" userId=${userId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
