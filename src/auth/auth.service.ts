import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../common';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async login() {}

  async register(dto: CreateUserDto) {
    await this.userService.createUser(dto);
  }

  async refresh() {}

  async logout() {}
}
