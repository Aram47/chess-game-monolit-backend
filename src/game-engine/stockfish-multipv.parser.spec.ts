import {
  parseStockfishInfoLine,
  uciTokenToMoveType,
  parsedLineToEngineFields,
} from './stockfish-multipv.parser';

describe('stockfish-multipv.parser', () => {
  it('parses multipv info line with cp score', () => {
    const line =
      'info depth 12 seldepth 18 multipv 2 score cp -34 nodes 12345 nps 1000000 pv e7e5 g1f3 b8c6';
    const p = parseStockfishInfoLine(line);
    expect(p).toEqual({
      multipv: 2,
      depth: 12,
      cp: -34,
      pvUci: ['e7e5', 'g1f3', 'b8c6'],
    });
  });

  it('defaults multipv to 1 when omitted', () => {
    const line =
      'info depth 15 score mate 3 nodes 1 pv f1b5 a7a6 b5c6 b8c6';
    const p = parseStockfishInfoLine(line);
    expect(p?.multipv).toBe(1);
    expect(p?.mate).toBe(3);
    expect(p?.pvUci[0]).toBe('f1b5');
  });

  it('uciTokenToMoveType handles promotion', () => {
    expect(uciTokenToMoveType('e7e8q')).toEqual({
      from: 'e7',
      to: 'e8',
      promotion: 'q',
    });
  });

  it('parsedLineToEngineFields builds evaluation and move', () => {
    const parsed = parseStockfishInfoLine(
      'info depth 10 multipv 1 score cp 12 pv e2e4 e7e5',
    )!;
    const f = parsedLineToEngineFields(parsed);
    expect(f?.evaluation).toEqual({ kind: 'cp', value: 12 });
    expect(f?.move).toEqual({ from: 'e2', to: 'e4' });
    expect(f?.pvUci).toEqual(['e2e4', 'e7e5']);
  });
});
