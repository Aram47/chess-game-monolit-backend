import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { GameServiceService } from '../game-service/game-service.service';
import {
  LoginDto,
  MergePayload,
  CreateUserDto,
  PaginationDto,
  UpdateUserDto,
  GetProblemsQueryDto,
} from '../../common';

@Injectable()
export class ApiGatewayService {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly gameService: GameServiceService,
  ) {}

  async register(dto: CreateUserDto) {
    return await this.userService.createUser(dto);
  }

  async getUserById(id: number) {
    return await this.userService.getUserById(id);
  }

  async getUsers(dto: PaginationDto) {
    return await this.userService.getUsers(dto);
  }

  async updateUserById(id: number, dto: UpdateUserDto) {
    return await this.userService.updateUserById(id, dto);
  }

  async deleteUserById(id: number) {
    return await this.userService.deleteUserById(id);
  }

  async login(dto: LoginDto) {
    return await this.authService.login(dto);
  }

  async getProblems(
    payload: MergePayload<[PaginationDto, GetProblemsQueryDto]>,
  ) {
    return await this.gameService.getProblems(payload);
  }
}
