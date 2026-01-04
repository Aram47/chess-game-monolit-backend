import { OwnerServiceService } from './owner-service.service';
import {
  Role,
  Roles,
  AuthGuard,
  RolesGuard,
  ChessProblem,
  CreateProblemDto,
  CreateProblemCategoryDto,
  ProblemCategory,
} from '../../common';
import {
  ApiTags,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  Post,
  Body,
  Param,
  Delete,
  Controller,
  UseGuards,
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

  /**
   * @Important
   * Here we will add User CRUD operations in the future
   * Using UserService via OwnerServiceService
   * Here we can set which role have user
   * Only Super Admin can access these endpoints
   * Because only Super Admin can set roles and permissions
   */
}
