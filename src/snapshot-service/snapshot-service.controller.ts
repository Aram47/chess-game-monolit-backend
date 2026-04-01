import {
  Get,
  Param,
  Query,
  UseGuards,
  Controller,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard, UserDecorator, UserDecoratorDto } from '../../common';
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 20;
    return this.snapshotServiceService.getUserGameHistory(
      String(userMetaData.sub),
      parsedPage,
      parsedLimit,
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
