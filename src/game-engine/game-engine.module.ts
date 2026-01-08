import { Module } from '@nestjs/common';
import { GameEngineService } from './game-engine.service';
import { GameEngineController } from './game-engine.controller';

@Module({
  controllers: [GameEngineController],
  providers: [GameEngineService],
})
export class GameEngineModule {}
