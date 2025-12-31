import {
  mergeDtos,
  AuthGuard,
  Pagination,
  MergePayload,
  CreateUserDto,
  PaginationDto,
  UpdateUserDto,
  GetProblemsQueryDto,
} from '../../common';
import {
  Get,
  Body,
  Post,
  Query,
  Patch,
  Param,
  Delete,
  UseGuards,
  Controller,
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

  @UseGuards(AuthGuard)
  @Get('/problems')
  async getProblems(
    @Pagination() dto: PaginationDto,
    @Query() filters: GetProblemsQueryDto,
  ) {
    const mergedPayload: MergePayload<[PaginationDto, GetProblemsQueryDto]> =
      mergeDtos<[PaginationDto, GetProblemsQueryDto]>(dto, filters);
    return await this.apiGatewayService.getProblems(mergedPayload);
  }

  @UseGuards(AuthGuard)
  @Post('/problems/:id/start')
  async startProblem(@Param(':id') id: number) {}

  // May be we will havn't need for this api
  @UseGuards(AuthGuard)
  @Post('/problems/:id/finsh')
  async finishProblem(@Param(':id') id: number) {}

  @UseGuards(AuthGuard)
  @Post('/problems/:id/move')
  async move(@Param(':id') id: number /*@Body() dto: ProblemDtoViaMove */) {}
}
