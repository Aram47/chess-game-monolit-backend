import Redis from 'ioredis';
import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REDIS_CLIENT, ENV_VARIABLES } from '../../../constants';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const redisHost: string = configService.get<string>(
      ENV_VARIABLES.REDIS_HOST,
    );
    const redisPort: number = configService.get<number>(
      ENV_VARIABLES.REDIS_PORT,
    );

    const redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: configService.get<string>(ENV_VARIABLES.REDIS_PASSWORD),
      maxLoadingRetryTime: 5000,
      enableReadyCheck: true,
      // will make correct and add log when redis is not connected or will reconnect
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });

    const logger = new Logger('RedisProvider');

    redis.on('connect', () => {
      logger.log(`Redis connected to ${redisHost}:${redisPort}`);
    });

    redis.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    redis.on('error', (err) => {
      logger.error(`Redis error: ${err}`);
    });

    return redis;
  },
};
