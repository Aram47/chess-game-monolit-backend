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

  @ApiOperation({ summary: 'Create a new chess problem' })
  @ApiResponse({
    status: 201,
    description: 'Chess problem created successfully',
    type: ChessProblem,
  })
  @ApiBody({ type: CreateProblemDto })
  @Roles(Role.ADMIN)
  @Post('create-chess-problem')
  async createChessProblem(@Body() dto: CreateProblemDto) {
    return this.ownerServiceService.createChessProblem(dto);
  }

  @ApiOperation({ summary: 'Create a new problem category' })
  @ApiResponse({
    status: 201,
    description: 'Problem category created successfully',
    type: ProblemCategory,
  })
  @ApiBody({ type: CreateProblemCategoryDto })
  @Roles(Role.ADMIN)
  @Post('create-problem-category')
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
  @Delete(':id/delete-chess-problem')
  async deleteChessProblemById(@Param('id') id: number) {
    return this.ownerServiceService.deleteChessProblemById(id);
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
  @Delete(':id/delete-problem-category')
  async deleteProblemCategoryById(@Param('id') id: number) {
    return this.ownerServiceService.deleteProblemCategoryById(id);
  }

  @ApiOperation({ summary: 'Create user with the specified fields' })
  @ApiResponse({
    status: 201,
    description: 'User is successfully created',
    type: User,
  })
  @ApiBody({ type: CreateUserDto, description: 'User creation data' })
  @Roles(Role.SUPER_ADMIN)
  @Post('/create_user')
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
  @Delete('/delete_user/:id')
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
  @Patch('/update_user/:id')
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
  @Get('/get_user/:id')
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
  @Get('/get_users')
  async getUsers(@Pagination() dto: PaginationDto) {
    return await this.ownerServiceService.getUsers(dto);
  }
}
