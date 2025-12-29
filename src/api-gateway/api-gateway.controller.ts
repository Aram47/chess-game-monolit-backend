import { CreateUserDto, Pagination, PaginationDto } from '../../common';
import { Controller, Body, Post, Get, Param } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';

@Controller('api')
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Post()
  async login() {}

  @Post('/register')
  async register(@Body() dto: CreateUserDto) {
    return await this.apiGatewayService.register(dto);
  }

  @Get(':id')
  async getUserById(@Param('id') id: number) {
    return this.apiGatewayService.getUserById(id);
  }

  @Get('')
  async getUsers(@Pagination() dto: PaginationDto) {
    this.apiGatewayService.getUsers(dto);
  }

  @Post()
  async refresh() {}

  @Post()
  async logout() {}
}
