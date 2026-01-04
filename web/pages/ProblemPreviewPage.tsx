/**
 * ProblemPreviewPage - page for previewing and solving chess problems
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Chessboard from 'chessboardjsx';
import { Chess } from 'chess.js';
import { Navbar } from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Lightbulb, RotateCcw, ArrowLeft } from 'lucide-react';
import { getProblemById, type ChessProblem, ProblemDifficultyLevel } from '../lib/api/puzzles';
import {
  createChessFromFen,
  isLegalMove,
} from '../lib/chess/utils';
import { ROUTES } from '../lib/constants/routes';
import { cn } from '../lib/utils';

const difficultyLabels: Record<ProblemDifficultyLevel, string> = {
  l1: 'Easy',
  l2: 'Medium',
  l3: 'Hard',
  l4: 'Expert',
};

const difficultyColors: Record<ProblemDifficultyLevel, string> = {
  l1: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  l2: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  l3: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  l4: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

type ProblemState = 'loading' | 'ready' | 'solving' | 'solved' | 'error';

export function ProblemPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const problemId = id ? parseInt(id, 10) : null;

  const [chess, setChess] = useState<Chess | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [userMoves, setUserMoves] = useState<Array<{ from: string; to: string }>>([]);
  const [state, setState] = useState<ProblemState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [isShowingHint, setIsShowingHint] = useState(false);
  const [userSide, setUserSide] = useState<'w' | 'b' | null>(null);
  const autoMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chessRef = useRef<Chess | null>(null);

  const { data: problem, isLoading, error } = useQuery<ChessProblem>({
    queryKey: ['problem', problemId],
    queryFn: () => {
      if (!problemId) throw new Error('Problem ID is required');
      return getProblemById(problemId);
    },
    enabled: !!problemId,
  });

  // Initialize chess position when problem loads
  useEffect(() => {
    if (problem && !chess) {
      const initialChess = createChessFromFen(problem.fen);
      setChess(initialChess);
      chessRef.current = initialChess;
      
      // The side to move in the initial FEN is the user's side
      const initialTurn = initialChess.turn();
      setUserSide(initialTurn);
      
      // Check if the first solution move is for the user's side
      const solutionMoves = problem.solutionMoves || [];
      if (solutionMoves.length > 0) {
        const firstMove = solutionMoves[0];
        const piece = initialChess.get(firstMove.from as any);
        const isFirstMoveForUser = !!(piece && piece.color === initialTurn);
        setIsUserTurn(isFirstMoveForUser);
      } else {
        setIsUserTurn(true);
      }
      
      setState('ready');
    }
  }, [problem, chess]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoMoveTimeoutRef.current) {
        clearTimeout(autoMoveTimeoutRef.current);
      }
    };
  }, []);

  const resetProblem = useCallback(() => {
    if (problem) {
      const initialChess = createChessFromFen(problem.fen);
      setChess(initialChess);
      chessRef.current = initialChess;
      setCurrentMoveIndex(0);
      setUserMoves([]);
      setState('ready');
      setErrorMessage(null);
      setIsShowingHint(false);
      
      const initialTurn = initialChess.turn();
      setUserSide(initialTurn);
      
      const solutionMoves = problem.solutionMoves || [];
      if (solutionMoves.length > 0) {
        const firstMove = solutionMoves[0];
        const piece = initialChess.get(firstMove.from as any);
        const isFirstMoveForUser = !!(piece && piece.color === initialTurn);
        setIsUserTurn(isFirstMoveForUser);
      } else {
        setIsUserTurn(true);
      }
      
      if (autoMoveTimeoutRef.current) {
        clearTimeout(autoMoveTimeoutRef.current);
        autoMoveTimeoutRef.current = null;
      }
    }
  }, [problem]);

  const getCurrentExpectedMove = useCallback((): { from: string; to: string } | null => {
    if (!problem || !problem.solutionMoves || problem.solutionMoves.length === 0) {
      return null;
    }
    
    // currentMoveIndex tracks the total number of moves made (both user and opponent)
    if (currentMoveIndex >= problem.solutionMoves.length) {
      return null;
    }
    
    return problem.solutionMoves[currentMoveIndex];
  }, [problem, currentMoveIndex]);

  const makeAutoMove = useCallback(() => {
    const currentChess = chessRef.current;
    if (!currentChess || !problem || state === 'solved' || !userSide) return;
    
    const solutionMoves = problem.solutionMoves || [];
    
    // Use a functional update to get the current index
    setCurrentMoveIndex((prevIndex) => {
      if (prevIndex >= solutionMoves.length) {
        setState('solved');
        setIsUserTurn(false);
        return prevIndex;
      }
      
      const expectedMove = solutionMoves[prevIndex];
      if (!expectedMove) {
        setState('solved');
        setIsUserTurn(false);
        return prevIndex;
      }
      
      // Use the ref to get the most current chess position
      const chessInstance = chessRef.current;
      if (!chessInstance) {
        return prevIndex;
      }
      
      // Create a fresh chess instance from current position
      const freshChess = createChessFromFen(chessInstance.fen());
      
      // Validate move is legal before attempting
      if (!isLegalMove(freshChess, expectedMove.from, expectedMove.to)) {
        console.error('Invalid auto-move:', expectedMove, 'Position:', freshChess.fen());
        // If move is invalid, stop auto-moving
        setIsUserTurn(true);
        setErrorMessage('An error occurred with the opponent\'s move.');
        return prevIndex;
      }
      
      // Make the opponent's move with error handling
      try {
        const moveResult = freshChess.move({ from: expectedMove.from, to: expectedMove.to });
        if (moveResult) {
          setChess(freshChess);
          chessRef.current = freshChess;
          setIsShowingHint(false);
          
          const newIndex = prevIndex + 1;
          
          // Check if problem is solved
          if (newIndex >= solutionMoves.length) {
            setState('solved');
            setIsUserTurn(false);
            return newIndex;
          }
          
          // Check if next move is for user
          const nextMove = solutionMoves[newIndex];
          const piece = freshChess.get(nextMove.from as any);
          const nextMoveIsForUser = !!(piece && piece.color === userSide);
          setIsUserTurn(nextMoveIsForUser);
          
          // If next move is also opponent's, make it automatically
          if (!nextMoveIsForUser) {
            if (autoMoveTimeoutRef.current) {
              clearTimeout(autoMoveTimeoutRef.current);
            }
            autoMoveTimeoutRef.current = setTimeout(() => {
              makeAutoMove();
            }, 200);
          }
          
          return newIndex;
        }
      } catch (error) {
        console.error('Error making auto-move:', error);
        setIsUserTurn(true);
        setErrorMessage('An error occurred with the opponent\'s move.');
        return prevIndex;
      }
      
      return prevIndex;
    });
  }, [problem, state, userSide]);

  const handleMove = useCallback((from: string, to: string) => {
    if (!chess || !problem || state === 'solved' || !isUserTurn) return;
    
    // Check if move is legal
    if (!isLegalMove(chess, from, to)) {
      setErrorMessage('That move is not legal. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    // Get expected move
    const expectedMove = getCurrentExpectedMove();
    if (!expectedMove) {
      setErrorMessage('Problem solution is incomplete.');
      return;
    }
    
    // Check if move matches expected move
    if (from !== expectedMove.from || to !== expectedMove.to) {
      setErrorMessage('That move is not correct. Try again!');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    // Move is correct - apply it
    const newChess = createChessFromFen(chess.fen());
    const moveResult = newChess.move({ from, to });
    if (!moveResult) {
      setErrorMessage('Failed to apply move.');
      return;
    }
    
    setChess(newChess);
    chessRef.current = newChess;
    setUserMoves((prev) => [...prev, { from, to }]);
    const newMoveIndex = currentMoveIndex + 1;
    setCurrentMoveIndex(newMoveIndex);
    setErrorMessage(null);
    setIsShowingHint(false);
    setState('solving');
    
    // Check if problem is solved
    const solutionMoves = problem.solutionMoves || [];
    if (newMoveIndex >= solutionMoves.length) {
      // Problem solved!
      setState('solved');
      setIsUserTurn(false);
      return;
    }
    
    // Check if next move is opponent's turn
    const nextMove = solutionMoves[newMoveIndex];
    // Determine if next move is for opponent by checking if the piece color matches userSide
    // If it doesn't match, it's opponent's move
    const piece = newChess.get(nextMove.from as any);
    const nextMoveIsForUser = userSide && piece && piece.color === userSide;
    
    if (!nextMoveIsForUser) {
      // Opponent's turn - make auto move after 200ms
      setIsUserTurn(false);
      if (autoMoveTimeoutRef.current) {
        clearTimeout(autoMoveTimeoutRef.current);
      }
      autoMoveTimeoutRef.current = setTimeout(() => {
        makeAutoMove();
      }, 200);
    } else {
      // Still user's turn
      setIsUserTurn(true);
    }
  }, [chess, problem, state, isUserTurn, userMoves.length, getCurrentExpectedMove, makeAutoMove]);

  const handleDrop = useCallback((moveObj: { sourceSquare: string; targetSquare: string; piece: string }) => {
    const { sourceSquare, targetSquare } = moveObj;
    handleMove(sourceSquare, targetSquare);
  }, [handleMove]);


  const handleShowHint = useCallback(() => {
    if (!problem || state === 'solved') return;
    
    const expectedMove = getCurrentExpectedMove();
    if (expectedMove) {
      setIsShowingHint(true);
      setErrorMessage(null);
    }
  }, [problem, state, getCurrentExpectedMove]);

  const handleBack = useCallback(() => {
    navigate(ROUTES.PROBLEMS);
  }, [navigate]);

  if (isLoading || state === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load problem. Please try again.'}
            </AlertDescription>
          </Alert>
          <Button onClick={handleBack} className="mt-4" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Problems
          </Button>
        </div>
      </div>
    );
  }

  const expectedMove = getCurrentExpectedMove();
  const difficultyLabel = difficultyLabels[problem.difficultyLevel] || problem.difficultyLevel;
  const difficultyColor = difficultyColors[problem.difficultyLevel] || 'bg-gray-100 text-gray-800';
  const solutionMoves = problem.solutionMoves || [];
  const progress = solutionMoves.length > 0 ? (userMoves.length / solutionMoves.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Problem #{problem.id}</h1>
            <p className="text-muted-foreground mt-1">{problem.description}</p>
          </div>
          <Badge className={cn(difficultyColor)}>{difficultyLabel}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chessboard */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Chess Board</CardTitle>
                <CardDescription>
                  {state === 'solved' 
                    ? 'Congratulations! You solved the problem!' 
                    : isUserTurn 
                    ? 'Your turn - make a move'
                    : 'Opponent\'s turn...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-full max-w-[500px]">
                    <Chessboard
                      position={chess?.fen()}
                      onDrop={handleDrop}
                      orientation={chess?.turn() === 'w' ? 'white' : 'black'}
                      draggable={isUserTurn && state !== 'solved'}
                      boardStyle={{
                        borderRadius: '4px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                      }}
                    />
                  </div>
                </div>

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                {isShowingHint && expectedMove && (
                  <Alert>
                    <AlertDescription>
                      <strong>Hint:</strong> Try moving from <strong>{expectedMove.from}</strong> to <strong>{expectedMove.to}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {state === 'solved' && (
                  <Alert>
                    <AlertDescription>
                      <strong>Well done!</strong> You've successfully solved this problem. Great job!
                    </AlertDescription>
                  </Alert>
                )}

                {/* Progress bar */}
                {solutionMoves.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span>{userMoves.length} / {solutionMoves.length} moves</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Controls */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleShowHint}
                    variant="outline"
                    disabled={state === 'solved' || !isUserTurn}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Hint
                  </Button>
                  <Button
                    onClick={resetProblem}
                    variant="outline"
                    disabled={isLoading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Problem Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Problem Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="text-sm">
                    {problem.category 
                      ? (typeof problem.category === 'string' ? problem.category : problem.category.name)
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Difficulty</p>
                  <Badge className={cn(difficultyColor)}>{difficultyLabel}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Moves</p>
                  <p className="text-sm">{solutionMoves.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-sm capitalize">{state}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

