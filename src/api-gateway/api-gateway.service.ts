import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { LoginDto, CreateUserDto } from '../../common';

@Injectable()
export class ApiGatewayService {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  async register(dto: CreateUserDto) {
    return await this.userService.createUser(dto);
  }

  async login(dto: LoginDto) {
    return await this.authService.login(dto);
  }

  async refresh(refreshToken: string) {
    return await this.authService.refresh(refreshToken);
  }

  async logout(accessToken: string) {
    return await this.authService.logout(accessToken);
  }
}
