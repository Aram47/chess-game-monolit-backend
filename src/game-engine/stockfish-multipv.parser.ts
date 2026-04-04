import type { AnalysisEvaluation, MoveType } from '../../common';

/** Raw fields extracted from a Stockfish UCI `info ...` line (with `pv`). */
export type ParsedStockfishInfoLine = {
  multipv: number;
  depth: number;
  scoreKind: 'cp' | 'mate';
  scoreValue: number;
  pvUci: string[];
};

export type ParsedLineEngineFields = {
  multipv: number;
  depth: number;
  evaluation: AnalysisEvaluation;
  move: MoveType;
  pvUci: string[];
};

function uciTokenToMove(uci: string): MoveType | null {
  if (uci.length < 4) return null;
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length >= 5 ? uci[4] : undefined;
  return { from, to, promotion };
}

/**
 * Parses a single Stockfish stdout line like:
 * `info depth 15 multipv 2 score cp -34 nodes 1 nps 1 time 0 pv e7e5 g1f3`
 */
export function parseStockfishInfoLine(line: string): ParsedStockfishInfoLine | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('info ')) return null;

  const tokens = trimmed.split(/\s+/);

  let depth = -1;
  let multipv = 1;
  let scoreKind: 'cp' | 'mate' | null = null;
  let scoreValue = 0;
  let pvStart = -1;

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'depth' && i + 1 < tokens.length) {
      depth = Number.parseInt(tokens[i + 1], 10);
      i += 1;
    } else if (t === 'multipv' && i + 1 < tokens.length) {
      multipv = Number.parseInt(tokens[i + 1], 10);
      i += 1;
    } else if (t === 'score' && i + 2 < tokens.length) {
      const kind = tokens[i + 1];
      if (kind === 'cp' || kind === 'mate') {
        scoreKind = kind;
        scoreValue = Number.parseInt(tokens[i + 2], 10);
        i += 2;
        if (
          i + 1 < tokens.length &&
          (tokens[i + 1] === 'upperbound' || tokens[i + 1] === 'lowerbound')
        ) {
          i += 1;
        }
      }
    } else if (t === 'pv' && i + 1 < tokens.length) {
      pvStart = i + 1;
      break;
    }
  }

  if (depth < 0 || !scoreKind || pvStart < 0) return null;

  const pvUci = tokens.slice(pvStart).filter((s) => s.length > 0);
  if (pvUci.length === 0) return null;

  return { multipv, depth, scoreKind, scoreValue, pvUci };
}

export function parsedLineToEngineFields(
  parsed: ParsedStockfishInfoLine,
): ParsedLineEngineFields | null {
  const first = parsed.pvUci[0];
  const move = uciTokenToMove(first);
  if (!move) return null;

  const evaluation: AnalysisEvaluation =
    parsed.scoreKind === 'cp'
      ? { kind: 'cp', value: parsed.scoreValue }
      : { kind: 'mate', value: parsed.scoreValue };

  return {
    multipv: parsed.multipv,
    depth: parsed.depth,
    evaluation,
    move,
    pvUci: parsed.pvUci,
  };
}
