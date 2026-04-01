import {
  Get,
  Param,
  UseGuards,
  Controller,
  NotFoundException,
} from '@nestjs/common';
import {
  AuthGuard,
  Pagination,
  PaginationDto,
  UserDecorator,
  UserDecoratorDto,
} from '../../common';
import { SnapshotServiceService } from './snapshot-service.service';

@UseGuards(AuthGuard)
@Controller('snapshot-service')
export class SnapshotServiceController {
  constructor(
    private readonly snapshotServiceService: SnapshotServiceService,
  ) {}

  @Get('/games/my')
  async getMyGames(
    @UserDecorator() userMetaData: UserDecoratorDto,
    @Pagination() pagination: PaginationDto,
  ) {
    return this.snapshotServiceService.getUserGameHistory(
      String(userMetaData.sub),
      pagination.page,
      pagination.limit,
    );
  }

  @Get('/games/my/:id')
  async getMyGameById(
    @UserDecorator() userMetaData: UserDecoratorDto,
    @Param('id') id: string,
  ) {
    const game = await this.snapshotServiceService.getUserGameById(
      String(userMetaData.sub),
      id,
    );
    if (!game) {
      throw new NotFoundException('Game snapshot not found');
    }
    return game;
  }
}
