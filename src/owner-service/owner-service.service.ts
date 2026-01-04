import { Injectable } from '@nestjs/common';
import { CreateProblemDto, CreateProblemCategoryDto } from '../../common';
import { GameServiceService } from '../game-service/game-service.service';

@Injectable()
export class OwnerServiceService {
  constructor(private readonly gameService: GameServiceService) {}

  async createChessProblem(dto: CreateProblemDto) {
    return this.gameService.createProblem(dto);
  }

  async createProblemCategory(dto: CreateProblemCategoryDto) {
    return await this.gameService.createProblemCategory(dto);
  }

  async deleteChessProblemById(id: number) {
    return await this.gameService.deleteChessProblemById(id);
  }

  async deleteProblemCategoryById(id: number) {
    return await this.gameService.deleteProblemCategoryById(id);
  }
}
