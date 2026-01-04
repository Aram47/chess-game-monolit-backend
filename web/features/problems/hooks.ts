/**
 * React Query hooks for problems
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getProblems, createProblem, createProblemCategory, type GetProblemsQuery, type CreateProblemRequest, type CreateProblemCategoryRequest } from '../../lib/api/puzzles';
import { ROUTES } from '../../lib/constants/routes';

export const PROBLEMS_QUERY_KEY = ['problems'] as const;

/**
 * Hook to fetch problems list
 */
export function useProblems(query: GetProblemsQuery = {}) {
  return useQuery({
    queryKey: [...PROBLEMS_QUERY_KEY, query],
    queryFn: () => getProblems(query),
  });
}

/**
 * Hook to create a new problem
 */
export function useCreateProblem() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: CreateProblemRequest) => createProblem(data),
    onSuccess: () => {
      // Invalidate problems list to refetch
      queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY });
      // Navigate to problems list
      navigate(ROUTES.PROBLEMS);
    },
  });
}

/**
 * Hook to create a new problem category
 */
export function useCreateProblemCategory() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: CreateProblemCategoryRequest) => createProblemCategory(data),
    onSuccess: () => {
      // Invalidate problems list to refetch (categories might affect problem filtering)
      queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY });
      // Navigate back to problems list or stay on page for another category
      // For now, we'll stay on the page so user can add multiple categories
    },
  });
}

