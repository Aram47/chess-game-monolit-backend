/**
 * Position editor utilities for creating custom chess positions
 */

import { Chess } from 'chess.js';

export type PieceType = 'wP' | 'wR' | 'wN' | 'wB' | 'wQ' | 'wK' | 'bP' | 'bR' | 'bN' | 'bB' | 'bQ' | 'bK';
export type Square = string;

export interface BoardPosition {
  [square: string]: PieceType;
}

/**
 * Create an empty board position
 */
export function createEmptyPosition(): BoardPosition {
  return {};
}

/**
 * Convert board position object to FEN
 */
export function positionToFen(position: BoardPosition, sideToMove: 'w' | 'b' = 'w'): string {
  const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Fill board from position
  for (const [square, piece] of Object.entries(position)) {
    const file = square.charCodeAt(0) - 97; // a=0, h=7
    const rank = 8 - parseInt(square[1]); // 1=7, 8=0
    
    if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
      board[rank][file] = piece;
    }
  }
  
  // Convert board to FEN notation
  const fenRows: string[] = [];
  for (let rank = 0; rank < 8; rank++) {
    let fenRow = '';
    let emptyCount = 0;
    
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fenRow += emptyCount.toString();
          emptyCount = 0;
        }
        // Convert piece notation: wP -> P, bP -> p, etc.
        const pieceChar = piece[1]; // Get piece type (P, R, N, B, Q, K)
        fenRow += piece[0] === 'w' ? pieceChar : pieceChar.toLowerCase();
      }
    }
    
    if (emptyCount > 0) {
      fenRow += emptyCount.toString();
    }
    
    fenRows.push(fenRow || '8');
  }
  
  const boardFen = fenRows.join('/');
  return `${boardFen} ${sideToMove} - - 0 1`;
}

/**
 * Convert FEN to board position object
 */
export function fenToPosition(fen: string): { position: BoardPosition; sideToMove: 'w' | 'b' } {
  const position: BoardPosition = {};
  const parts = fen.split(' ');
  const boardFen = parts[0];
  const sideToMove = (parts[1] || 'w') as 'w' | 'b';
  
  const ranks = boardFen.split('/');
  
  for (let rank = 0; rank < 8; rank++) {
    const rankStr = ranks[rank] || '';
    let file = 0;
    
    for (let i = 0; i < rankStr.length; i++) {
      const char = rankStr[i];
      const num = parseInt(char);
      
      if (!isNaN(num)) {
        file += num;
      } else {
        const square = String.fromCharCode(97 + file) + (8 - rank);
        const isWhite = char === char.toUpperCase();
        const pieceType = char.toUpperCase();
        
        let piece: PieceType;
        if (pieceType === 'P') piece = isWhite ? 'wP' : 'bP';
        else if (pieceType === 'R') piece = isWhite ? 'wR' : 'bR';
        else if (pieceType === 'N') piece = isWhite ? 'wN' : 'bN';
        else if (pieceType === 'B') piece = isWhite ? 'wB' : 'bB';
        else if (pieceType === 'Q') piece = isWhite ? 'wQ' : 'bQ';
        else if (pieceType === 'K') piece = isWhite ? 'wK' : 'bK';
        else continue;
        
        position[square] = piece;
        file++;
      }
    }
  }
  
  return { position, sideToMove };
}

/**
 * Place a piece on the board
 */
export function placePiece(
  position: BoardPosition,
  square: Square,
  piece: PieceType
): BoardPosition {
  return { ...position, [square]: piece };
}

/**
 * Remove a piece from the board
 */
export function removePiece(position: BoardPosition, square: Square): BoardPosition {
  const newPosition = { ...position };
  delete newPosition[square];
  return newPosition;
}

/**
 * Move a piece on the board
 */
export function movePiece(
  position: BoardPosition,
  from: Square,
  to: Square
): BoardPosition {
  const piece = position[from];
  if (!piece) return position;
  
  const newPosition = { ...position };
  delete newPosition[from];
  newPosition[to] = piece;
  return newPosition;
}

/**
 * Validate position with chess.js
 */
export function validatePosition(fen: string): { valid: boolean; error?: string } {
  try {
    const chess = new Chess();
    chess.load(fen);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid position',
    };
  }
}

