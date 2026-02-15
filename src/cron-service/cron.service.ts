import Redis from 'ioredis';
import { REDIS_SUBSCRIBER, REDIS_PUBLISHER } from '../../common';
import { Logger, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { GameServiceService } from '../game-service/game-service.service';

@Injectable()
export class CronService implements OnModuleInit {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER)
    private readonly subscriber: Redis,
    @Inject(REDIS_PUBLISHER)
    private readonly publisher: Redis,
    private readonly gameService: GameServiceService,
  ) {}
  
  async onModuleInit() {
    await this.subscriber.subscribe('__keyevent@0__:expired');

    this.subscriber.on('message', async (_, key) => {
      await this.handleExpiredKey(key);
    });
  }

  private async handleExpiredKey(key: string) {}
}
