/**
 * ProblemsGrid component - displays a grid of problem cards
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { ChessProblem, ProblemDifficultyLevel } from '../../lib/api/puzzles';
import { cn } from '../../lib/utils';

export interface ProblemsGridProps {
  problems: ChessProblem[];
  isLoading?: boolean;
  error?: Error | null;
  onProblemClick?: (problemId: number) => void;
  className?: string;
}

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

export function ProblemsGrid({
  problems,
  isLoading,
  error,
  onProblemClick,
  className,
}: ProblemsGridProps) {
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>
          {error.message || 'Failed to load problems. Please try again later.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (problems.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No problems found. Create one to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {problems.map((problem, index) => {
        const difficultyLabel = difficultyLabels[problem.difficultyLevel] || problem.difficultyLevel;
        const difficultyColor = difficultyColors[problem.difficultyLevel] || 'bg-gray-100 text-gray-800';

        return (
          <Card
            key={problem.id ?? `problem-${index}`}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onProblemClick?.(problem.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg">Problem #{problem.id}</CardTitle>
                  <CardDescription className="line-clamp-2">{problem.description}</CardDescription>
                </div>
                <Badge className={cn('ml-2', difficultyColor)}>{difficultyLabel}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {problem.category && (
                  <span>Category: {typeof problem.category === 'string' ? problem.category : problem.category.name}</span>
                )}
                {problem.theme && (
                  <span>Theme: {typeof problem.theme === 'string' ? problem.theme : problem.theme.name}</span>
                )}
                <span>Moves: {Array.isArray(problem.solutionMoves) ? problem.solutionMoves.length : 0}</span>
              </div>
              <Button className="w-full" variant="outline">
                Preview
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

