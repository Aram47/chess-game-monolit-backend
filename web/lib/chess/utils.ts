/**
 * Chess utilities using chess.js as the single source of truth
 */

import { Chess } from 'chess.js';

export type Move = { from: string; to: string; promotion?: string };

/**
 * Create a new chess instance from FEN
 * If no FEN provided, starts from initial position
 */
export function createChessFromFen(fen?: string): Chess {
  const chess = new Chess();
  if (fen && fen.trim() !== '') {
    try {
      chess.load(fen);
    } catch (error) {
      // If FEN is invalid, return starting position
      console.warn('Invalid FEN, using starting position:', error);
    }
  }
  // If no FEN, chess.js defaults to starting position
  return chess;
}

/**
 * Get current FEN from chess instance
 */
export function getFen(chess: Chess): string {
  return chess.fen();
}

/**
 * Get side to move from FEN
 */
export function getSideToMove(fen: string): 'white' | 'black' {
  const parts = fen.split(' ');
  return parts[1] === 'w' ? 'white' : 'black';
}

/**
 * Validate and make a move
 * Returns the move if valid, null if invalid
 */
export function makeMove(chess: Chess, from: string, to: string, promotion?: string): Move | null {
  try {
    const move = chess.move({ from, to, promotion: promotion as any });
    if (move) {
      return { from, to, promotion };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Convert a move to UCI format { from, to }
 */
export function moveToUCI(move: Move): { from: string; to: string } {
  return { from: move.from, to: move.to };
}

/**
 * Get all legal moves for a position
 */
export function getLegalMoves(chess: Chess): Array<{ from: string; to: string }> {
  const moves = chess.moves({ verbose: true });
  return moves.map((move) => ({
    from: move.from,
    to: move.to,
  }));
}

/**
 * Check if a move is legal
 */
export function isLegalMove(chess: Chess, from: string, to: string): boolean {
  try {
    const moves = chess.moves({ square: from, verbose: true });
    return moves.some((move) => move.to === to);
  } catch {
    return false;
  }
}

/**
 * Undo last move
 */
export function undoMove(chess: Chess): boolean {
  const move = chess.undo();
  return move !== null;
}

/**
 * Reset to starting position
 */
export function resetBoard(chess: Chess): void {
  chess.reset();
}

/**
 * Check if position is checkmate
 */
export function isCheckmate(chess: Chess): boolean {
  return chess.isCheckmate();
}

/**
 * Check if position is stalemate
 */
export function isStalemate(chess: Chess): boolean {
  return chess.isStalemate();
}

/**
 * Check if position is check
 */
export function isCheck(chess: Chess): boolean {
  return chess.isCheck();
}

