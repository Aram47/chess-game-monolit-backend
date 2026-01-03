import {
  mergeDtos,
  AuthGuard,
  Pagination,
  MergePayload,
  UserDecorator,
  PaginationDto,
  ProblemMoveDto,
  UserDecoratorDto,
  GetProblemsQueryDto,
} from '../../common';
import { GameServiceService } from './game-service.service';
import {
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Controller,
} from '@nestjs/common';

@Controller('/problems')
export class GameServiceController {
  constructor(private readonly gameService: GameServiceService) {}

  @UseGuards(AuthGuard)
  @Get('')
  async getProblems(
    @Pagination() dto: PaginationDto,
    @Query() filters: GetProblemsQueryDto,
  ) {
    const mergedPayload: MergePayload<[PaginationDto, GetProblemsQueryDto]> =
      mergeDtos<[PaginationDto, GetProblemsQueryDto]>(dto, filters);
    return this.gameService.getProblems(mergedPayload);
  }

  @UseGuards(AuthGuard)
  @Post(':id/start')
  async startProblem(
    @Param(':id') id: number,
    @UserDecorator() userMetaData: UserDecoratorDto,
  ) {
    return await this.gameService.startProblem(id, userMetaData);
  }

  // May be we will havn't need for this api
  @UseGuards(AuthGuard)
  @Post(':id/finsh')
  async finishProblem(
    @Param(':id') id: number,
    @UserDecorator() userMetaData: UserDecoratorDto,
  ) {
    return await this.gameService.finishProblem(id, userMetaData.sub);
  }

  @UseGuards(AuthGuard)
  @Post(':id/move')
  async move(
    @Param(':id') id: number,
    @Body() dto: ProblemMoveDto,
    @UserDecorator() userMetaData: UserDecoratorDto,
  ) {
    return await this.gameService.makeMove(id, userMetaData.sub, dto);
  }
}
