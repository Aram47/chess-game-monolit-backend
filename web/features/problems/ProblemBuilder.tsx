/**
 * ProblemBuilder component - combines chessboard and form for creating problems
 */

import { useState, useCallback } from 'react';
import Chessboard from 'chessboardjsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Copy, Play, Undo2, X } from 'lucide-react';
import {
  createChessFromFen,
  makeMove,
  moveToUCI,
  undoMove,
} from '../../lib/chess/utils';
import {
  createEmptyPosition,
  positionToFen,
  fenToPosition,
  placePiece,
  removePiece,
  movePiece,
  type BoardPosition,
  type PieceType,
} from '../../lib/chess/position-editor';
import { ProblemForm } from './ProblemForm';
import type { CreateProblemRequest } from '../../lib/api/puzzles';

export interface ProblemBuilderProps {
  onSubmit: (data: CreateProblemRequest) => void;
  isSubmitting?: boolean;
  error?: string | null;
  onOpenCategoryDialog?: () => void;
}

type BoardOrientation = 'white' | 'black';

export function ProblemBuilder({
  onSubmit,
  isSubmitting = false,
  error,
  onOpenCategoryDialog,
}: ProblemBuilderProps) {
  // Position editor state - manage position as BoardPosition object
  const [boardPosition, setBoardPositionState] = useState<BoardPosition>(createEmptyPosition());
  const [sideToMove, setSideToMove] = useState<'w' | 'b'>('w');
  const [orientation, setOrientation] = useState<BoardOrientation>('white');
  const [isRecording, setIsRecording] = useState(false);
  const [solutionMoves, setSolutionMoves] = useState<Array<{ from: string; to: string }>>([]);
  const [solutionChess] = useState(() => createChessFromFen());
  const [fenInput, setFenInput] = useState('');
  const [showFenError, setShowFenError] = useState(false);

  // Convert board position to FEN for form submission
  const fen = positionToFen(boardPosition, sideToMove);

  // Handle piece drop on main board
  const handleDrop = useCallback(
    ({ sourceSquare, targetSquare, piece }: { sourceSquare: string; targetSquare: string; piece: string }) => {
      if (isSubmitting) return;

      // If recording solution, handle on solution board (use chess.js for legal moves)
      if (isRecording) {
        const move = makeMove(solutionChess, sourceSquare, targetSquare);
        if (move) {
          setSolutionMoves((prev) => [...prev, moveToUCI(move)]);
        }
        return;
      }

      // Position editor mode: handle piece placement/movement
      if (sourceSquare === 'spare') {
        // Piece dropped from spare pieces area
        const pieceType = piece as PieceType;
        setBoardPositionState((prev) => placePiece(prev, targetSquare, pieceType));
      } else if (targetSquare && targetSquare !== 'offboard' && targetSquare.length === 2) {
        // Piece moved on board (valid square like 'e4')
        setBoardPositionState((prev) => movePiece(prev, sourceSquare, targetSquare));
      } else {
        // Piece dragged off board - remove it
        setBoardPositionState((prev) => removePiece(prev, sourceSquare));
      }
    },
    [solutionChess, isRecording, isSubmitting]
  );

  // Handle square click to remove pieces (alternative to dragging off board)
  const handleSquareClick = useCallback(
    (square: string) => {
      if (isSubmitting || isRecording) return;

      // If square has a piece, remove it
      if (boardPosition[square]) {
        setBoardPositionState((prev) => removePiece(prev, square));
      }
    },
    [boardPosition, isSubmitting, isRecording]
  );

  const handleStartPosition = () => {
    // Set to standard starting position
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const { position, sideToMove: stm } = fenToPosition(startFen);
    setBoardPositionState(position);
    setSideToMove(stm);
  };

  const handleClearBoard = () => {
    // Clear all pieces
    setBoardPositionState(createEmptyPosition());
  };

  const handleSetFromFen = () => {
    if (!fenInput.trim()) {
      setShowFenError(true);
      return;
    }

    try {
      const { position, sideToMove: stm } = fenToPosition(fenInput);
      setBoardPositionState(position);
      setSideToMove(stm);
      setFenInput('');
      setShowFenError(false);
    } catch {
      setShowFenError(true);
    }
  };

  const handleCopyFen = () => {
    navigator.clipboard.writeText(fen);
  };

  const handleStartRecording = () => {
    // Load current position into solution board
    const currentFen = positionToFen(boardPosition, sideToMove);
    solutionChess.load(currentFen);
    setSolutionMoves([]);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleUndoSolutionMove = () => {
    if (solutionMoves.length > 0 && undoMove(solutionChess)) {
      setSolutionMoves((prev) => prev.slice(0, -1));
    }
  };

  const handleClearSolution = () => {
    const currentFen = positionToFen(boardPosition, sideToMove);
    solutionChess.load(currentFen);
    setSolutionMoves([]);
    setIsRecording(false);
  };

  const handleFormSubmit = (data: CreateProblemRequest) => {
    onSubmit(data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Problem</h1>
        <p className="text-muted-foreground mt-2">
          Set up a chess position and record the solution
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Chessboard */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chess Board</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOrientation(orientation === 'white' ? 'black' : 'white')}
                >
                  {orientation === 'white' ? 'Black View' : 'White View'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-full max-w-[500px]">
                  <Chessboard
                    position={isRecording ? solutionChess.fen() : fen}
                    onDrop={handleDrop}
                    onSquareClick={!isRecording ? handleSquareClick : undefined}
                    orientation={orientation}
                    sparePieces={!isRecording}
                    dropOffBoard={!isRecording ? 'trash' : undefined}
                    draggable={true}
                    boardStyle={{
                      borderRadius: '4px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>

                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Side to move:</Label>
                    <Select
                      value={sideToMove}
                      onValueChange={(value) => {
                        if (value === 'w' || value === 'b') {
                          setSideToMove(value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[120px]" disabled={isSubmitting || isRecording}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="w">White</SelectItem>
                        <SelectItem value="b">Black</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartPosition}
                      disabled={isSubmitting || isRecording}
                    >
                      Start Position
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearBoard}
                      disabled={isSubmitting || isRecording}
                    >
                      Clear Board
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyFen}
                      disabled={isSubmitting}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy FEN
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fen-input">Set Position from FEN</Label>
                    <div className="flex gap-2">
                      <Input
                        id="fen-input"
                        value={fenInput}
                        onChange={(e) => {
                          setFenInput(e.target.value);
                          setShowFenError(false);
                        }}
                        placeholder="Enter FEN string"
                        className={showFenError ? 'border-destructive' : ''}
                        disabled={isSubmitting}
                      />
                      <Button
                        variant="outline"
                        onClick={handleSetFromFen}
                        disabled={isSubmitting}
                      >
                        Set
                      </Button>
                    </div>
                    {showFenError && (
                      <p className="text-sm text-destructive">Invalid FEN string</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Solution Recording Card */}
          <Card>
            <CardHeader>
              <CardTitle>Solution Recording</CardTitle>
              <CardDescription>
                Record the solution moves by playing them on the board above
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isRecording ? (
                <Button
                  onClick={handleStartRecording}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Recording Solution
                </Button>
              ) : (
                <>
                  <Alert>
                    <AlertDescription>
                      Recording solution... Make moves on the board above.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleUndoSolutionMove}
                      disabled={solutionMoves.length === 0 || isSubmitting}
                      className="flex-1"
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      Undo Move
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClearSolution}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleStopRecording}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Stop
                    </Button>
                  </div>
                </>
              )}

              {solutionMoves.length > 0 && (
                <div className="space-y-2">
                  <Label>Recorded Moves ({solutionMoves.length})</Label>
                  <div className="min-h-[60px] p-3 border rounded-md bg-muted/50">
                    <div className="flex flex-wrap gap-2">
                      {solutionMoves.map((move, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-background rounded text-sm font-mono"
                        >
                          {index + 1}. {move.from}-{move.to}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Form */}
        <div>
          <ProblemForm
            fen={fen}
            solutionMoves={solutionMoves}
            sideToMove={sideToMove === 'w' ? 'white' : 'black'}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            error={error}
            onOpenCategoryDialog={onOpenCategoryDialog}
          />
        </div>
      </div>
    </div>
  );
}
