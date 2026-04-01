import {
  Body,
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthGuard,
  AnalyzePositionDto,
  AnalyzePositionResponseDto,
} from '../../common';
import { GameAnalysisService } from './game-analysis.service';

@ApiTags('Game Service')
@UseGuards(AuthGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
@Controller('/game')
export class GameAnalysisController {
  constructor(private readonly gameAnalysisService: GameAnalysisService) {}

  @Post('position/analyze')
  @ApiOperation({
    summary: 'Analyze a chess position (MultiPV + per-line evaluation)',
    description:
      'Returns the best move and additional recommended lines with Stockfish evaluations. ' +
      'Scores are from the side to move perspective (cp = centipawns, mate = mate distance).',
  })
  @ApiBody({ type: AnalyzePositionDto })
  @ApiResponse({
    status: 200,
    description: 'Analysis completed.',
    type: AnalyzePositionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid FEN or request body.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 503,
    description: 'Engine busy, timeout, or failure.',
  })
  async analyzePosition(
    @Body() dto: AnalyzePositionDto,
  ): Promise<AnalyzePositionResponseDto> {
    return this.gameAnalysisService.analyzePosition(dto);
  }
}
