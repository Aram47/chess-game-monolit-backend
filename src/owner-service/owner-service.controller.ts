import { OwnerServiceService } from './owner-service.service';
import {
  Role,
  Roles,
  AuthGuard,
  RolesGuard,
  CreateProblemDto,
  CreateProblemCategoryDto,
} from '../../common';
import {
  Post,
  Body,
  Query,
  Delete,
  Controller,
  UseGuards,
} from '@nestjs/common';

@UseGuards(AuthGuard, RolesGuard)
@Controller('owner-service')
export class OwnerServiceController {
  constructor(private readonly ownerServiceService: OwnerServiceService) {}

  @Roles(Role.ADMIN)
  @Post('create-chess-problem')
  async createChessProblem(@Body() dto: CreateProblemDto) {
    return this.ownerServiceService.createChessProblem(dto);
  }

  @Roles(Role.ADMIN)
  @Post('create-problem-category')
  async createProblemCategory(@Body() dto: CreateProblemCategoryDto) {
    return await this.ownerServiceService.createProblemCategory(dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/delete-chess-problem')
  async deleteChessProblemById(@Query('id') id: number) {
    return this.ownerServiceService.deleteChessProblemById(id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/delete-problem-category')
  async deleteProblemCategoryById(@Query('id') id: number) {
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
