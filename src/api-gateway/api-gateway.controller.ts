import {
  Pagination,
  CreateUserDto,
  PaginationDto,
  UpdateUserDto,
} from '../../common';
import {
  Get,
  Body,
  Post,
  Patch,
  Param,
  Delete,
  Controller,
} from '@nestjs/common';
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

  @Get('/problems')
  async getProblems(@Pagination() dto: PaginationDto) {}

  @Post('/problems/:id')
  async startProblem(@Param(':id') id: number) {}

  // May be we will havn't need for this api
  @Post('/problems/finsh/:id')
  async finishProblem(@Param(':id') id: number) {}

  @Post('/problems/move/:id')
  async move(@Param(':id') id: number /*@Body() dto: ProblemDtoViaMove */) {}
}
