import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import type { ChessProblem, ProblemDifficultyLevel } from '../../lib/api/puzzles';
import { cn } from '../../lib/utils';

export interface PuzzleCardProps {
  puzzle: ChessProblem;
  onStart?: (puzzleId: number) => void;
  onResume?: (puzzleId: number) => void;
  isResumable?: boolean;
  className?: string;
}

const difficultyLabels: Record<ProblemDifficultyLevel, string> = {
  l1: 'Easy',
  l2: 'Medium',
  l3: 'Hard',
  l4: 'Expert',
};

const difficultyColors: Record<ProblemDifficultyLevel, string> = {
  l1: 'bg-green-100 text-green-800',
  l2: 'bg-yellow-100 text-yellow-800',
  l3: 'bg-orange-100 text-orange-800',
  l4: 'bg-red-100 text-red-800',
};

export function PuzzleCard({
  puzzle,
  onStart,
  onResume,
  isResumable = false,
  className,
}: PuzzleCardProps) {
  const difficultyLabel = difficultyLabels[puzzle.difficultyLevel] || puzzle.difficultyLevel;
  const difficultyColor = difficultyColors[puzzle.difficultyLevel] || 'bg-gray-100 text-gray-800';

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Puzzle #{puzzle.id}</CardTitle>
            <CardDescription className="line-clamp-2">{puzzle.description}</CardDescription>
          </div>
          <Badge className={difficultyColor}>{difficultyLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {puzzle.category && (
            <span>Category: {puzzle.category.name}</span>
          )}
          {puzzle.theme && (
            <span>Theme: {puzzle.theme.name}</span>
          )}
          {puzzle.solutionMoves && (
            <span>Moves: {puzzle.solutionMoves.length}</span>
          )}
        </div>
        <div className="flex gap-2">
          {isResumable && onResume ? (
            <Button
              onClick={() => onResume(puzzle.id)}
              className="flex-1"
            >
              Resume
            </Button>
          ) : (
            <Button
              onClick={() => onStart?.(puzzle.id)}
              className="flex-1"
              disabled={!onStart}
            >
              Start Puzzle
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

