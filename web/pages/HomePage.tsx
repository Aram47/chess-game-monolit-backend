import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { FeatureCard } from '../components/FeatureCard';
import { PuzzleCard } from '../features/puzzles/PuzzleCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getAuthUser } from '../lib/auth/token';
import { getProblems, type ProblemDifficultyLevel } from '../lib/api/puzzles';
import { getMockUserProgress, getMockProblems, USE_MOCK_DATA } from '../lib/api/mock';
import { ROUTES } from '../lib/constants/routes';
import { Puzzle, Play, Bot, TrendingUp, Target, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2 } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Fetch user progress (mock for now)
  const userProgress = USE_MOCK_DATA ? getMockUserProgress() : {
    solvedCount: 0,
    streak: 0,
    accuracy: 0,
    lastPuzzle: undefined,
  };

  // Fetch puzzles
  const {
    data: puzzlesData,
    isLoading: puzzlesLoading,
    error: puzzlesError,
  } = useQuery({
    queryKey: ['puzzles', selectedTheme, selectedDifficulty],
    queryFn: () => {
      if (USE_MOCK_DATA) {
        return getMockProblems();
      }
      return getProblems({
        themeId: selectedTheme !== 'all' ? Number(selectedTheme) : undefined,
        difficultyLevel: selectedDifficulty !== 'all' ? selectedDifficulty as ProblemDifficultyLevel : undefined,
        limit: 6,
      });
    },
    enabled: !!user, // Only fetch if user is logged in
  });

  const handleStartPuzzle = (puzzleId?: number) => {
    // Navigate to puzzle page
    navigate(`${ROUTES.PUZZLES}${puzzleId ? `/${puzzleId}` : ''}`);
  };

  const handleFindMatch = () => {
    navigate(ROUTES.PLAY);
  };

  const handlePlayVsAI = () => {
    // Premium feature - show upgrade prompt
    alert('Play vs AI is a premium feature. Upgrade to unlock!');
  };

  // Landing page for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-slate-900">
                Master Chess with Interactive Training
              </h1>
              <p className="text-xl text-muted-foreground">
                Solve puzzles, play online, and improve your game with AI-powered analysis
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate(ROUTES.LOGIN)}>
                Log in
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate(ROUTES.REGISTER)}>
                Sign up
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <Card>
                <CardHeader>
                  <Puzzle className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Puzzle Training</CardTitle>
                  <CardDescription>
                    Solve thousands of chess puzzles to improve your tactical skills
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Play className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Online Play</CardTitle>
                  <CardDescription>
                    Play against players from around the world in real-time matches
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Bot className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>AI Analysis</CardTitle>
                  <CardDescription>
                    Get deep insights into your games with advanced AI-powered analysis
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Continue Training Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Continue Training</CardTitle>
                <CardDescription>
                  {userProgress.lastPuzzle
                    ? 'Resume your last puzzle'
                    : 'Start your first puzzle to begin training'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {userProgress.lastPuzzle ? (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Puzzle #{userProgress.lastPuzzle.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {userProgress.lastPuzzle.description}
                  </p>
                </div>
                <Button onClick={() => handleStartPuzzle(userProgress.lastPuzzle?.id)}>
                  Resume
                </Button>
              </div>
            ) : (
              <Button onClick={() => handleStartPuzzle()}>Start Your First Puzzle</Button>
            )}
          </CardContent>
        </Card>

        {/* Quick Start Actions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Quick Start</h2>
            <Button variant="outline" onClick={() => navigate(ROUTES.PROBLEMS)}>
              Browse All Problems
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              title="Start Puzzle"
              description="Choose a theme and difficulty to start solving puzzles"
              action={{
                label: 'Select Theme',
                onClick: () => handleStartPuzzle(),
              }}
              icon={<Puzzle className="h-5 w-5 text-primary" />}
            />
            <FeatureCard
              title="Find Match"
              description="Play against other players online"
              action={{
                label: 'Find Match',
                onClick: handleFindMatch,
              }}
              icon={<Play className="h-5 w-5 text-primary" />}
            />
            <FeatureCard
              title="Play vs AI"
              description="Challenge our advanced AI opponent"
              action={{
                label: 'Play vs AI',
                onClick: handlePlayVsAI,
              }}
              locked
              lockedMessage="Premium"
              icon={<Bot className="h-5 w-5 text-primary" />}
            />
          </div>
        </div>

        {/* Your Progress */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Solved</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{userProgress.solvedCount}</p>
                <p className="text-sm text-muted-foreground">Puzzles solved</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Streak</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{userProgress.streak}</p>
                <p className="text-sm text-muted-foreground">Day streak</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Accuracy</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{userProgress.accuracy}%</p>
                <p className="text-sm text-muted-foreground">Success rate</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommended Puzzles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recommended Puzzles</h2>
            <div className="flex gap-2">
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Themes</SelectItem>
                  <SelectItem value="1">Tactics</SelectItem>
                  <SelectItem value="2">Endgame</SelectItem>
                  <SelectItem value="3">Opening</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="l1">Easy</SelectItem>
                  <SelectItem value="l2">Medium</SelectItem>
                  <SelectItem value="l3">Hard</SelectItem>
                  <SelectItem value="l4">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {puzzlesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : puzzlesError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load puzzles. Please try again later.
              </AlertDescription>
            </Alert>
          ) : puzzlesData && puzzlesData.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {puzzlesData.data.map((puzzle, index) => (
                <PuzzleCard
                  key={puzzle.id ?? `puzzle-${index}`}
                  puzzle={puzzle}
                  onStart={handleStartPuzzle}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No puzzles found. Try adjusting your filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

