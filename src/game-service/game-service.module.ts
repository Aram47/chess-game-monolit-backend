import { Module } from '@nestjs/common';
import { GameServiceService } from './game-service.service';

@Module({
  controllers: [],
  providers: [GameServiceService],
  exports: [GameServiceService],
})
export class GameServiceModule {}
