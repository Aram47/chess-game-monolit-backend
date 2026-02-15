import { OwnerServiceService } from './owner-service.service';
import {
  Role,
  User,
  Roles,
  AuthGuard,
  Pagination,
  RolesGuard,
  ChessProblem,
  PaginationDto,
  CreateUserDto,
  UpdateUserDto,
  ProblemCategory,
  CreateProblemDto,
  CreateDWMProblemDto,
  UpdateDWMProblemDto,
  CreateProblemCategoryDto,
} from '../../common';
import {
  ApiTags,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  Get,
  Put,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';

@ApiTags('Owner Service')
@UseGuards(AuthGuard, RolesGuard)
@Controller('owner-service')
export class OwnerServiceController {
  constructor(private readonly ownerServiceService: OwnerServiceService) {}

  /**
   * @Chess Problem Management APIs
   *
   * apis for chess problem creation, deletion, updation and fetching
   */

  @ApiOperation({ summary: 'Create a new chess problem' })
  @ApiResponse({
    status: 201,
    description: 'Chess problem created successfully',
    type: ChessProblem,
  })
  @ApiBody({ type: CreateProblemDto })
  @Roles(Role.ADMIN)
  @Post('/game/create-chess-problem')
  async createChessProblem(@Body() dto: CreateProblemDto) {
    return await this.ownerServiceService.createChessProblem(dto);
  }

  @ApiOperation({ summary: 'Create a new problem category' })
  @ApiResponse({
    status: 201,
    description: 'Problem category created successfully',
    type: ProblemCategory,
  })
  @ApiBody({ type: CreateProblemCategoryDto })
  @Roles(Role.ADMIN)
  @Post('/game/create-problem-category')
  async createProblemCategory(@Body() dto: CreateProblemCategoryDto) {
    return await this.ownerServiceService.createProblemCategory(dto);
  }

  @ApiOperation({ summary: 'Delete a chess problem by ID' })
  @ApiResponse({
    status: 200,
    description: 'Chess problem deleted successfully',
    type: ChessProblem,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the chess problem',
  })
  @Roles(Role.ADMIN)
  @Delete('/game/:id/delete-chess-problem')
  async deleteChessProblemById(@Param('id') id: number) {
    return await this.ownerServiceService.deleteChessProblemById(id);
  }

  @ApiOperation({ summary: 'Delete a problem category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Problem category deleted successfully',
    type: ProblemCategory,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the problem category',
  })
  @Roles(Role.ADMIN)
  @Delete('/game/:id/delete-problem-category')
  async deleteProblemCategoryById(@Param('id') id: number) {
    return await this.ownerServiceService.deleteProblemCategoryById(id);
  }

  /**
   * @EventBasedProblems is a
   *
   * Daily Weekly or Monthly problems which will
   * our application send to users
   *
   * @Important apis not completed yet
   * 1. Will add Dto's
   * 2. Will add decorators for swagger
   */

  @Roles(Role.SUPER_ADMIN)
  @Post('/game/event-based-problem')
  async createEventBasedProblem(@Body() dto: CreateDWMProblemDto) {
    return await this.ownerServiceService.createEventBasedProblem(dto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Put('/game/event-based-problem')
  async updateEventBasedProblem(@Body() dto: UpdateDWMProblemDto) {
    return await this.ownerServiceService.updateEventBasedProblem(dto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Get('/game/:id/event-based-problem')
  async getEventBasedProblemById(@Param('id') id: number) {
    return await this.ownerServiceService.getEventBasedProblemById(id);
  }

  @Roles(Role.SUPER_ADMIN)
  @Get('/game/event-based-problem')
  async getEventBasedProblems() {
    return await this.ownerServiceService.getEventBasedProblems();
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete('/game/:id/event-based-problem')
  async deleteEventBasedProblem(@Param('id') id: number) {
    return await this.ownerServiceService.deleteEventBasedProblem(id);
  }

  /**
   * @User Management APIs
   *
   * apis for user creation, deletion, updation and fetching
   */

  @ApiOperation({ summary: 'Create user with the specified fields' })
  @ApiResponse({
    status: 201,
    description: 'User is successfully created',
    type: User,
  })
  @ApiBody({ type: CreateUserDto, description: 'User creation data' })
  @Roles(Role.SUPER_ADMIN)
  @Post('/user/create_user')
  async createUser(@Body() dto: CreateUserDto) {
    return await this.ownerServiceService.createUser(dto);
  }

  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the user to delete',
  })
  @Roles(Role.SUPER_ADMIN)
  @Delete('/user/delete_user/:id')
  async deleteUserById(@Param('id') id: number) {
    return await this.ownerServiceService.deleteUserById(id);
  }

  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the user to update',
  })
  @ApiBody({ type: UpdateUserDto, description: 'User update data' })
  @Roles(Role.SUPER_ADMIN)
  @Patch('/user/update_user/:id')
  async updateUserById(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    return await this.ownerServiceService.updateUserById(id, dto);
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the user',
  })
  @Roles(Role.SUPER_ADMIN)
  @Get('/user/get_user/:id')
  async getUserById(@Param('id') id: number) {
    return await this.ownerServiceService.getUserById(id);
  }

  @ApiOperation({ summary: 'Get paginated list of users' })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
  })
  @ApiQuery({ type: PaginationDto })
  @Roles(Role.SUPER_ADMIN)
  @Get('/user/get_users')
  async getUsers(@Pagination() dto: PaginationDto) {
    return await this.ownerServiceService.getUsers(dto);
  }
}
