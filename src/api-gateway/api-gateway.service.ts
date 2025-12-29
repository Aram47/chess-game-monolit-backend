import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto, PaginationDto, UpdateUserDto } from '../../common';
import { LoginDto } from '../../common/dtos/user/user.login.dto';

@Injectable()
export class ApiGatewayService {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
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
}
