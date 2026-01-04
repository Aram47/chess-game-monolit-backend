/**
 * ProblemForm component - form for creating/editing problems
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, Plus } from 'lucide-react';
import type { ProblemDifficultyLevel } from '../../lib/api/puzzles';
import type { CreateProblemRequest } from '../../lib/api/puzzles';

const problemFormSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  difficultyLevel: z.enum(['l1', 'l2', 'l3', 'l4']),
  isActive: z.boolean().default(true),
  isPayable: z.boolean().default(false),
  fen: z.string().min(1, 'FEN is required'),
  solutionMoves: z.array(z.object({
    from: z.string(),
    to: z.string(),
  })).min(1, 'At least one solution move is required'),
});

export type ProblemFormData = z.infer<typeof problemFormSchema>;

export interface ProblemFormProps {
  fen: string;
  solutionMoves: Array<{ from: string; to: string }>;
  sideToMove: 'white' | 'black';
  onSubmit: (data: CreateProblemRequest) => void;
  isSubmitting?: boolean;
  error?: string | null;
  onOpenCategoryDialog?: () => void;
}

const difficultyOptions: Array<{ value: ProblemDifficultyLevel; label: string }> = [
  { value: 'l1', label: 'Easy' },
  { value: 'l2', label: 'Medium' },
  { value: 'l3', label: 'Hard' },
  { value: 'l4', label: 'Expert' },
];

export function ProblemForm({
  fen,
  solutionMoves,
  sideToMove,
  onSubmit,
  isSubmitting = false,
  error,
  onOpenCategoryDialog,
}: ProblemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProblemFormData>({
    resolver: zodResolver(problemFormSchema),
    defaultValues: {
      description: '',
      category: '',
      difficultyLevel: 'l1',
      isActive: true,
      isPayable: false,
      fen: fen,
      solutionMoves: solutionMoves,
    },
  });

  // Sync form with props
  React.useEffect(() => {
    setValue('fen', fen);
  }, [fen, setValue]);

  React.useEffect(() => {
    setValue('solutionMoves', solutionMoves);
  }, [solutionMoves, setValue]);

  const isActive = watch('isActive');
  const isPayable = watch('isPayable');

  const onFormSubmit = (data: ProblemFormData) => {
    onSubmit({
      fen: data.fen,
      solutionMoves: data.solutionMoves,
      difficultyLevel: data.difficultyLevel,
      isActive: data.isActive,
      isPayable: data.isPayable,
      category: data.category,
      description: data.description,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Problem Builder</CardTitle>
        <CardDescription>
          Fill in the details to create a new chess problem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="A simple checkmate in two moves"
              {...register('description')}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="category">Category *</Label>
              {onOpenCategoryDialog && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onOpenCategoryDialog}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New Category
                </Button>
              )}
            </div>
            <Input
              id="category"
              placeholder="Basic Mate in 2"
              {...register('category')}
              className={errors.category ? 'border-destructive' : ''}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficultyLevel">Difficulty Level *</Label>
            <Select
              value={watch('difficultyLevel')}
              onValueChange={(value) => setValue('difficultyLevel', value as ProblemDifficultyLevel)}
            >
              <SelectTrigger className={errors.difficultyLevel ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.difficultyLevel && (
              <p className="text-sm text-destructive">{errors.difficultyLevel.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fen">FEN Position *</Label>
            <Input
              id="fen"
              {...register('fen')}
              className={errors.fen ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Side to move: <span className="font-medium">{sideToMove}</span>
            </p>
            {errors.fen && (
              <p className="text-sm text-destructive">{errors.fen.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Solution Moves *</Label>
            <div className="min-h-[60px] p-3 border rounded-md bg-muted/50">
              {solutionMoves.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {solutionMoves.map((move, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-background rounded text-sm font-mono"
                    >
                      {move.from}-{move.to}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Record moves on the board to set the solution
                </p>
              )}
            </div>
            {errors.solutionMoves && (
              <p className="text-sm text-destructive">{errors.solutionMoves.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked === true)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Problem is active
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPayable"
              checked={isPayable}
              onCheckedChange={(checked) => setValue('isPayable', checked === true)}
            />
            <Label htmlFor="isPayable" className="cursor-pointer">
              Premium problem
            </Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Problem'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

