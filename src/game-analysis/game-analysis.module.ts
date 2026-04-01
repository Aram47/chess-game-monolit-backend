import { Module } from '@nestjs/common';
import { GameAnalysisController } from './game-analysis.controller';
import { GameAnalysisService } from './game-analysis.service';
import { GameEngineModule } from '../game-engine/game-engine.module';

@Module({
  imports: [GameEngineModule],
  controllers: [GameAnalysisController],
  providers: [GameAnalysisService],
})
export class GameAnalysisModule {}
