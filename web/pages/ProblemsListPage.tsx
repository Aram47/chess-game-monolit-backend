/**
 * ProblemsListPage - page for listing all chess problems
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ProblemsGrid } from '../features/problems/ProblemsGrid';
import { useProblems } from '../features/problems/hooks';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus } from 'lucide-react';
import { ROUTES } from '../lib/constants/routes';
import type { ProblemDifficultyLevel } from '../lib/api/puzzles';

export function ProblemsListPage() {
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 12;

  const {
    data: problemsData,
    isLoading,
    error,
    refetch,
  } = useProblems({
    difficultyLevel: selectedDifficulty !== 'all' ? (selectedDifficulty as ProblemDifficultyLevel) : undefined,
    page,
    limit,
  });

  const handleProblemClick = (problemId: number) => {
    // Navigate to problem detail if endpoint exists
    // For now, just log it
    console.log('Problem clicked:', problemId);
  };

  const handleCreateNew = () => {
    navigate(ROUTES.PROBLEMS_NEW);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Chess Problems</h1>
            <p className="text-muted-foreground mt-2">
              Browse and solve chess puzzles to improve your game
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Problem
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="l1">Easy</SelectItem>
              <SelectItem value="l2">Medium</SelectItem>
              <SelectItem value="l3">Hard</SelectItem>
              <SelectItem value="l4">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ProblemsGrid
          problems={problemsData?.data || []}
          isLoading={isLoading}
          error={error}
          onProblemClick={handleProblemClick}
        />

        {/* Pagination */}
        {problemsData && problemsData.total > limit && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(problemsData.total / limit)}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(problemsData.total / limit) || isLoading}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

