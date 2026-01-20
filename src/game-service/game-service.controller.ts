import {
  MoveType,
  mergeDtos,
  AuthGuard,
  Pagination,
  MergePayload,
  ChessProblem,
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
import {
  ApiTags,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('Game Service')
@Controller('/game')
export class GameServiceController {
  constructor(private readonly gameService: GameServiceService) {}

  @ApiOperation({ summary: 'Get list of problems' })
  @ApiResponse({
    status: 200,
    description: 'List of problems retrieved successfully',
    type: ChessProblem,
  })
  @ApiQuery({ type: GetProblemsQueryDto })
  @UseGuards(AuthGuard)
  @Get('/problems')
  async getProblems(
    @Pagination() dto: PaginationDto,
    @Query() filters: GetProblemsQueryDto,
  ) {
    const mergedPayload: MergePayload<[PaginationDto, GetProblemsQueryDto]> =
      mergeDtos<[PaginationDto, GetProblemsQueryDto]>(dto, filters);
    const [problems, total] = await this.gameService.getProblems(mergedPayload);

    // Return paginated response format expected by frontend
    return {
      data: problems,
      total,
      page: mergedPayload.page || 1,
      limit: mergedPayload.limit || 10,
    };
  }

  @ApiOperation({ summary: 'Start a problem' })
  @ApiResponse({
    status: 200,
    description: 'Problem started successfully',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the problem to start',
    type: Number,
  })
  @UseGuards(AuthGuard)
  @Post('/problems/:id/start')
  async startProblem(
    @Param(':id') id: number,
    @UserDecorator() userMetaData: UserDecoratorDto,
  ) {
    return await this.gameService.startProblem(id, userMetaData);
  }

  // May be we will havn't need for this api
  @ApiOperation({ summary: 'Finish a problem' })
  @ApiResponse({
    status: 200,
    description: 'Problem finished successfully',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the problem to finish',
    type: Number,
  })
  @UseGuards(AuthGuard)
  @Post('/problems/:id/finsh')
  async finishProblem(
    @Param(':id') id: number,
    @UserDecorator() userMetaData: UserDecoratorDto,
  ) {
    return await this.gameService.finishProblem(id, userMetaData.sub);
  }

  @ApiOperation({ summary: 'Make a move in a problem' })
  @ApiResponse({
    status: 200,
    description: 'Move made successfully',
    type: String,
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the problem to make a move in',
    type: Number,
  })
  @ApiBody({ type: ProblemMoveDto })
  @UseGuards(AuthGuard)
  @Post('/problems/:id/move')
  async move(
    @Param(':id') id: number,
    @Body() dto: ProblemMoveDto,
    @UserDecorator() userMetaData: UserDecoratorDto,
  ) {
    return await this.gameService.makeMove(id, userMetaData.sub, dto);
  }

  @UseGuards(AuthGuard)
  @Post('/start')
  async startGameWithBot(@UserDecorator() userMetaData: UserDecoratorDto) {
    return await this.gameService.startGameWithBot(userMetaData);
  }

  @UseGuards(AuthGuard)
  @Post('/move/:id')
  async makeMoveInTheGameWithBot(
    @Param('id') roomId: string,
    @Body() move: MoveType,
    @UserDecorator() userMetaData: UserDecoratorDto,
  ) {
    return await this.gameService.makeMoveInTheGameWithBot(
      roomId,
      move,
      userMetaData,
    );
  }
}
