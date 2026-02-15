import Redis from 'ioredis';
import { Provider } from '@nestjs/common';
import { REDIS_CLIENT, REDIS_SUBSCRIBER } from '../../../constants';

export const RedisSubscriberProvider: Provider = {
  provide: REDIS_SUBSCRIBER,
  inject: [REDIS_CLIENT],
  useFactory: (redis: Redis) => {
    return redis.duplicate();
  },
};
