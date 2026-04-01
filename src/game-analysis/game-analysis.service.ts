import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Chess } from 'chess.js';
import { GameEngineService } from '../game-engine/game-engine.service';
import {
  AnalyzePositionDto,
  AnalyzePositionResponseDto,
  AnalysisLineResponseDto,
  MoveTypeDto,
} from '../../common';

const DEFAULT_RECOMMENDED_MOVES = 3;
const DEFAULT_DEPTH = 12;

@Injectable()
export class GameAnalysisService {
  constructor(private readonly gameEngineService: GameEngineService) {}

  async analyzePosition(
    dto: AnalyzePositionDto,
  ): Promise<AnalyzePositionResponseDto> {
    let chess: Chess;
    try {
      chess = new Chess(dto.fen.trim());
    } catch {
      throw new BadRequestException('Invalid FEN');
    }

    if (chess.isGameOver()) {
      const fen = chess.fen();
      return {
        fen,
        depth: dto.depth ?? DEFAULT_DEPTH,
        depthReached: 0,
        bestMove: null,
        lines: [],
      };
    }

    const recommendedMovesCount =
      dto.recommendedMovesCount ?? DEFAULT_RECOMMENDED_MOVES;
    const depth = dto.depth ?? DEFAULT_DEPTH;
    const fen = chess.fen();

    let engineResult;
    try {
      engineResult = await this.gameEngineService.analyzeMultiPv({
        fen,
        multiPv: recommendedMovesCount,
        depth,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes('busy')) {
        throw new ServiceUnavailableException(
          'Engine pool is busy; retry shortly.',
        );
      }
      if (message.includes('timeout')) {
        throw new ServiceUnavailableException(
          'Engine analysis timed out; try a lower depth.',
        );
      }
      throw new ServiceUnavailableException(
        'Engine analysis failed; retry shortly.',
      );
    }

    const lines: AnalysisLineResponseDto[] = engineResult.lines.map(
      (row, index) => ({
        rank: index + 1,
        move: this.toMoveDto(row.move),
        evaluation: {
          kind: row.evaluation.kind,
          value: row.evaluation.value,
        },
        pvUci: row.pvUci,
      }),
    );

    let depthReached = engineResult.depthReached;
    if (depthReached === 0 && lines.length > 0) {
      depthReached = Math.max(
        ...engineResult.lines.map((l) => l.depth),
        depth,
      );
    }

    const bestMove: MoveTypeDto | null =
      lines.length > 0 ? lines[0].move : null;

    return {
      fen,
      depth,
      depthReached,
      bestMove,
      lines,
    };
  }

  private toMoveDto(move: {
    from: string;
    to: string;
    promotion?: string;
  }): MoveTypeDto {
    const dto: MoveTypeDto = {
      from: move.from,
      to: move.to,
    };
    if (move.promotion) dto.promotion = move.promotion;
    return dto;
  }
}
