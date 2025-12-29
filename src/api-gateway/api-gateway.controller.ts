import {
  CreateUserDto,
  Pagination,
  PaginationDto,
  UpdateUserDto,
} from '../../common';
import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { LoginDto } from '../../common/dtos/user/user.login.dto';

@Controller('api')
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Post('/login')
  async login(@Body() dto: LoginDto) {
    return await this.apiGatewayService.login(dto);
  }

  @Post('/register')
  async register(@Body() dto: CreateUserDto) {
    return await this.apiGatewayService.register(dto);
  }

  @Get(':id')
  async getUserById(@Param('id') id: number) {
    return await this.apiGatewayService.getUserById(id);
  }

  @Get('')
  async getUsers(@Pagination() dto: PaginationDto) {
    return await this.apiGatewayService.getUsers(dto);
  }

  @Patch(':id')
  async updateUserById(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    return await this.apiGatewayService.updateUserById(id, dto);
  }

  @Delete(':id')
  async deleteUserById(@Param('id') id: number) {
    return await this.apiGatewayService.deleteUserById(id);
  }

  @Post()
  async refresh() {}

  @Post()
  async logout() {}
}
