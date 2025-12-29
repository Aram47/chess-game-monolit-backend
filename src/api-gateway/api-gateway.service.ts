import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto, PaginationDto } from '../../common';

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
}
