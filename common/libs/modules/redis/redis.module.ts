import { ConfigModule } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { RedisProvider } from './redis.provider';
import {
  REDIS_CLIENT,
  REDIS_PUBLISHER,
  REDIS_SUBSCRIBER,
} from '../../../constants';
import { RedisPublisherProvider } from './redis-publisher.provider';
import { RedisSubscriberProvider } from './redis-subscriber.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisProvider, RedisPublisherProvider, RedisSubscriberProvider],
  exports: [REDIS_CLIENT, REDIS_PUBLISHER, REDIS_SUBSCRIBER],
})
export class RedisModule {}
