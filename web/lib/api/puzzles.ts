/**
 * Puzzles API client
 * All endpoints derived from Swagger/OpenAPI specification
 */

import { apiFetch } from './client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export enum ProblemDifficultyLevel {
  L1 = 'l1',
  L2 = 'l2',
  L3 = 'l3',
  L4 = 'l4',
}

export interface ProblemCategory {
  id: number;
  name: string;
}

export interface ProblemTheme {
  id: number;
  name: string;
}

export interface ChessProblem {
  id: number;
  fen: string;
  solutionMoves: Array<{ from: string; to: string }>;
  description: string;
  difficultyLevel: ProblemDifficultyLevel;
  isPayable: boolean;
  isActive: boolean;
  category?: ProblemCategory;
  theme?: ProblemTheme;
}

export interface GetProblemsQuery {
  page?: number;
  limit?: number;
  categoryId?: number;
  themeId?: number;
  difficultyLevel?: ProblemDifficultyLevel;
  isPayable?: boolean;
}

export interface GetProblemsResponse {
  data: ChessProblem[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string | string[];
  statusCode: number;
  error?: string;
}

export interface ValidationError {
  message: string[];
  error: string;
  statusCode: number;
}

/**
 * Get list of problems
 * GET /problems
 * Based on Swagger: Get list of problems endpoint
 */
export async function getProblems(
  query: GetProblemsQuery = {}
): Promise<GetProblemsResponse> {
  const params = new URLSearchParams();
  
  if (query.page !== undefined) params.append('page', query.page.toString());
  if (query.limit !== undefined) params.append('limit', query.limit.toString());
  if (query.categoryId !== undefined) params.append('categoryId', query.categoryId.toString());
  if (query.themeId !== undefined) params.append('themeId', query.themeId.toString());
  if (query.difficultyLevel) params.append('difficultyLevel', query.difficultyLevel);
  if (query.isPayable !== undefined) params.append('isPayable', query.isPayable.toString());

  // Note: Problems endpoint is at /problems (game service controller)
  // Adjust if your setup routes it differently
  const PROBLEMS_BASE_URL = import.meta.env.VITE_PROBLEMS_API_URL || `${API_BASE_URL.replace('/api', '')}/problems`;
  const response = await apiFetch(`${PROBLEMS_BASE_URL}?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    let errorData: ApiError;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: 'An error occurred while fetching problems',
        statusCode: response.status,
      };
    }

    throw new Error(
      Array.isArray(errorData.message)
        ? errorData.message.join(', ')
        : errorData.message || `Failed to fetch problems: ${response.status}`
    );
  }

  const data = await response.json();
  
  // Handle tuple response from backend: [entities, count]
  // This is a legacy format that should be removed once all endpoints are updated
  if (Array.isArray(data) && data.length === 2 && Array.isArray(data[0]) && typeof data[1] === 'number') {
    const [entities, total] = data;
    return {
      data: entities,
      total,
      page: query.page || 1,
      limit: query.limit || 10,
    };
  }
  
  // Handle simple array response (legacy)
  if (Array.isArray(data) && (data.length === 0 || !Array.isArray(data[0]))) {
    return {
      data,
      total: data.length,
      page: query.page || 1,
      limit: query.limit || 10,
    };
  }

  // Handle proper paginated response: { data, total, page, limit }
  return data;
}

export interface CreateProblemRequest {
  fen: string;
  solutionMoves: Array<{ from: string; to: string }>;
  difficultyLevel: ProblemDifficultyLevel;
  isActive: boolean;
  isPayable: boolean;
  category: string;
  description: string;
}

export interface CreateProblemResponse extends ChessProblem {}

/**
 * Create a new chess problem
 * 
 * Endpoint: POST /owner-service/create-chess-problem
 * Source: OwnerServiceController.createChessProblem() - @Controller('owner-service') @Post('create-chess-problem')
 * Swagger Tag: Owner Service
 * Requires: ADMIN role (enforced by @Roles(Role.ADMIN))
 * 
 * @see src/owner-service/owner-service.controller.ts
 */
export async function createProblem(
  data: CreateProblemRequest
): Promise<CreateProblemResponse> {
  // Path derived from controller: @Controller('owner-service') + @Post('create-chess-problem')
  // Base URL: http://localhost:3000 (removing /api prefix to match controller path)
  const OWNER_SERVICE_URL = import.meta.env.VITE_OWNER_SERVICE_URL || `${API_BASE_URL.replace('/api', '')}/owner-service`;
  const response = await apiFetch(`${OWNER_SERVICE_URL}/create-chess-problem`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorData: ApiError | ValidationError;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: 'An error occurred while creating the problem',
        statusCode: response.status,
      };
    }

    // Handle NestJS ValidationPipe error format
    if (Array.isArray(errorData.message)) {
      const errorMessage = errorData.message.join(', ');
      throw new Error(errorMessage);
    }

    throw new Error(
      errorData.message || `Failed to create problem: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Get a single problem by ID
 * Note: Since there's no dedicated endpoint, we fetch from the list
 * In the future, this should use GET /problems/:id
 */
export async function getProblemById(id: number): Promise<ChessProblem> {
  // Fetch all problems and find by ID
  // This is not ideal but works until a dedicated endpoint is added
  const response = await getProblems({ limit: 1000 });
  const problem = response.data.find((p) => p.id === id);
  
  if (!problem) {
    throw new Error(`Problem with ID ${id} not found`);
  }
  
  return problem;
}

export interface CreateProblemCategoryRequest {
  name: string;
  description: string;
  isActive: boolean;
}

export interface CreateProblemCategoryResponse {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  order: number;
}

/**
 * Create a new problem category
 * 
 * Endpoint: POST /owner-service/create-problem-category
 * Source: OwnerServiceController.createProblemCategory() - @Controller('owner-service') @Post('create-problem-category')
 * Swagger Tag: Owner Service
 * Requires: ADMIN role (enforced by @Roles(Role.ADMIN))
 * 
 * @see src/owner-service/owner-service.controller.ts
 */
export async function createProblemCategory(
  data: CreateProblemCategoryRequest
): Promise<CreateProblemCategoryResponse> {
  const OWNER_SERVICE_URL = import.meta.env.VITE_OWNER_SERVICE_URL || `${API_BASE_URL.replace('/api', '')}/owner-service`;
  const response = await apiFetch(`${OWNER_SERVICE_URL}/create-problem-category`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorData: ApiError | ValidationError;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: 'An error occurred while creating the category',
        statusCode: response.status,
      };
    }

    // Handle NestJS ValidationPipe error format
    if (Array.isArray(errorData.message)) {
      const errorMessage = errorData.message.join(', ');
      throw new Error(errorMessage);
    }

    throw new Error(
      errorData.message || `Failed to create category: ${response.status}`
    );
  }

  return response.json();
}

