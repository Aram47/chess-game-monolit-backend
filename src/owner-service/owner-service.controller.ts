import { Post, Controller, UseGuards } from '@nestjs/common';
import { OwnerServiceService } from './owner-service.service';
import { AuthGuard, RolesGuard, Roles, Role } from '../../common';

@UseGuards(AuthGuard, RolesGuard)
@Controller('owner-service')
export class OwnerServiceController {
  constructor(private readonly ownerServiceService: OwnerServiceService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('create-chess-problem')
  async createChessProblem() {}
}
