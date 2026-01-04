/**
 * User API client
 * All endpoints derived from Swagger/OpenAPI specification
 */

import { apiFetch } from './client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface User {
  id: number;
  name: string;
  surname: string;
  username: string;
  email: string;
  userRelatedData?: UserRelatedData;
  createdAt: string;
  updatedAt: string;
}

export interface UserRelatedData {
  userId: number;
  role: string;
  plan: string;
  xp: number;
  level: number;
  solvedProblems: number;
  winGames: number;
  loseGames: number;
}

export interface ApiError {
  message: string | string[];
  statusCode: number;
  error?: string;
}

/**
 * Get current user
 * GET /api/:id (where id is current user ID from auth)
 * Based on Swagger: Get user by ID endpoint
 */
export async function getCurrentUser(userId: number): Promise<User> {
  const response = await apiFetch(`${API_BASE_URL}/${userId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    let errorData: ApiError;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: 'An error occurred while fetching user data',
        statusCode: response.status,
      };
    }

    throw new Error(
      Array.isArray(errorData.message)
        ? errorData.message.join(', ')
        : errorData.message || `Failed to fetch user: ${response.status}`
    );
  }

  return response.json();
}

