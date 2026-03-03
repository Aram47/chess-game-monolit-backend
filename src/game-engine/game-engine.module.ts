import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GameEngineService } from './game-engine.service';
import { GameEngineController } from './game-engine.controller';

@Module({
  imports: [ConfigModule],
  controllers: [GameEngineController],
  providers: [GameEngineService],
  exports: [GameEngineService],
})
export class GameEngineModule {}
