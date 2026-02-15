import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import {
  PaginationDto,
  UpdateUserDto,
  CreateUserDto,
  CreateProblemDto,
  CreateDWMProblemDto,
  UpdateDWMProblemDto,
  CreateProblemCategoryDto,
} from '../../common';
import { GameServiceService } from '../game-service/game-service.service';

@Injectable()
export class OwnerServiceService {
  constructor(
    private readonly userService: UserService,
    private readonly gameService: GameServiceService,
  ) {}

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

  async createEventBasedProblem(dto: CreateDWMProblemDto) {
    return await this.gameService.createEventBasedProblem(dto);
  }

  async updateEventBasedProblem(dto: UpdateDWMProblemDto) {
    return await this.gameService.updateEventBasedProblem(dto);
  }

  async getEventBasedProblemById(id: number) {
    return await this.gameService.getEventBasedProblemById(id);
  }

  async getEventBasedProblems() {
    return await this.gameService.getEventBasedProblems();
  }

  async deleteEventBasedProblem(id: number) {
    return await this.gameService.deleteEventBasedProblem(id);
  }

  async createUser(dto: CreateUserDto) {
    return await this.userService.createUser(dto);
  }

  async deleteUserById(id: number) {
    return await this.userService.deleteUserById(id);
  }

  async updateUserById(id: number, dto: UpdateUserDto) {
    return await this.userService.updateUserById(id, dto);
  }

  async getUserById(id: number) {
    return await this.userService.getUserById(id);
  }

  async getUsers(dto: PaginationDto) {
    return await this.userService.getUsers(dto);
  }
}
