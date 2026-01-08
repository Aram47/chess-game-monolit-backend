import { Controller } from '@nestjs/common';
import { GameEngineService } from './game-engine.service';

@Controller('game-engine')
export class GameEngineController {
  constructor(private readonly gameEngineService: GameEngineService) {}
}
