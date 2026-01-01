import Redis from 'ioredis';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REDIS_CLIENT, ENV_VARIABLES } from '../../../constants';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return new Redis({
      host: configService.get<string>(ENV_VARIABLES.REDIS_HOST),
      port: configService.get<number>(ENV_VARIABLES.REDIS_PORT),
      // password: configService.get<string>(ENV_VARIABLES.REDIS_PASSWORD),
      maxLoadingRetryTime: null,
      enableReadyCheck: true,
    });
  },
};
