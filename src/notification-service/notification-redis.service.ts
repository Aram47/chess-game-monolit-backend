import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from './notification.service';

@Injectable()
export class NotificationsRedisSubscriber implements OnModuleInit {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    /**
     * @Each client can send event just with publishing event to redis
     *
     * @Example
     *
     * await redis.publish(
     * 	'notifications:user',
     * 	JSON.stringify({
     * 		userId,
     * 		event: 'order.created',
     * 		data: { orderId: 42 },
     * 	}),
     * );
     */
    const subscriber = this.redisClient.duplicate();
    await subscriber.subscribe('notifications:user');

    subscriber.on('message', (_, message) => {
      try {
        const payload = JSON.parse(message);
        if (!payload.userId) {
          return;
        }

        this.notificationsService.pushToUser(payload.userId, {
          data: payload.data,
          event: payload.event,
          id: payload.id,
          retry: payload.retry,
        });
      } catch (e) {
        // log error via our custom logger
        console.log(e);
      }
    });
  }
}
