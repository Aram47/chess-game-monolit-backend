import { MoveType } from '../../common';

export type ParsedInfoLine = {
  multipv: number;
  depth: number;
  cp?: number;
  mate?: number;
  pvUci: string[];
};

export function uciTokenToMoveType(uci: string): MoveType | null {
  if (!uci || uci.length < 4) return null;
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  const move: MoveType = { from, to };
  if (promotion) move.promotion = promotion;
  return move;
}

/**
 * Parse a single Stockfish `info` line that includes a principal variation.
 * When MultiPV is 1, `multipv` may be omitted (defaults to 1).
 */
export function parseStockfishInfoLine(line: string): ParsedInfoLine | null {
  if (!line.startsWith('info ') || !line.includes(' pv ')) return null;

  const multipvMatch = line.match(/\bmultipv\s+(\d+)/);
  const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;

  const depthMatch = line.match(/\bdepth\s+(\d+)/);
  const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;

  const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
  const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);

  const pvMatch = line.match(/\bpv\s+(.+)$/);
  if (!pvMatch) return null;

  const pvUci = pvMatch[1].trim().split(/\s+/).filter(Boolean);
  if (pvUci.length === 0) return null;

  const result: ParsedInfoLine = { multipv, depth, pvUci };
  if (cpMatch) result.cp = parseInt(cpMatch[1], 10);
  if (mateMatch) result.mate = parseInt(mateMatch[1], 10);

  if (result.cp === undefined && result.mate === undefined) return null;

  return result;
}

export function parsedLineToEngineFields(parsed: ParsedInfoLine): {
  evaluation: { kind: 'cp' | 'mate'; value: number };
  move: MoveType;
  pvUci: string[];
  multipv: number;
  depth: number;
} | null {
  const first = parsed.pvUci[0];
  const move = uciTokenToMoveType(first);
  if (!move) return null;

  const evaluation =
    parsed.mate !== undefined
      ? { kind: 'mate' as const, value: parsed.mate }
      : { kind: 'cp' as const, value: parsed.cp ?? 0 };

  return {
    multipv: parsed.multipv,
    depth: parsed.depth,
    evaluation,
    move,
    pvUci: parsed.pvUci,
  };
}
