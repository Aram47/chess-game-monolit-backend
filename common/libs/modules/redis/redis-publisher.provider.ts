import Redis from 'ioredis';
import { Provider } from '@nestjs/common';
import { REDIS_CLIENT, REDIS_PUBLISHER } from '../../../constants';

export const RedisPublisherProvider: Provider = {
  provide: REDIS_PUBLISHER,
  inject: [REDIS_CLIENT],
  useFactory: (redis: Redis) => redis.duplicate(),
};
