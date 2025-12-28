import { CreateUserDto } from '../../common';
import { Controller, Body, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ApiGatewayService } from './api-gateway.service';

@Controller('api')
export class ApiGatewayController {
  constructor(
    private readonly authService: AuthService,
    private readonly apiGatewayService: ApiGatewayService,
  ) {}

  @Post()
  async login() {}

  @Post('/register')
  async register(@Body() dto: CreateUserDto) {
    return await this.authService.register(dto);
  }

  @Post()
  async refresh() {}

  @Post()
  async logout() {}
}
