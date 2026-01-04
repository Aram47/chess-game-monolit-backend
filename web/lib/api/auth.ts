/**
 * Auth API client
 * All endpoints derived from Swagger/OpenAPI specification
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface RegisterRequest {
  name: string;
  surname: string;
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  name: string;
  surname: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  surname: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse extends User {}

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
 * Register a new user
 * POST /api/register
 * Based on Swagger: User registration endpoint
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorData: ApiError | ValidationError;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: 'An error occurred during registration',
        statusCode: response.status,
      };
    }

    // Handle NestJS ValidationPipe error format
    if (Array.isArray(errorData.message)) {
      const errorMessage = errorData.message.join(', ');
      throw new Error(errorMessage);
    }

    throw new Error(
      errorData.message || `Registration failed with status ${response.status}`
    );
  }

  return response.json();
}

/**
 * Login user
 * POST /api/login
 * Based on Swagger: User login endpoint
 * Sets httpOnly cookies for accessToken and refreshToken
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorData: ApiError | ValidationError;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: 'An error occurred during login',
        statusCode: response.status,
      };
    }

    // Handle 401 Unauthorized with friendly message
    if (response.status === 401) {
      throw new Error('Invalid credentials. Please check your login and password.');
    }

    // Handle NestJS ValidationPipe error format
    if (Array.isArray(errorData.message)) {
      const errorMessage = errorData.message.join(', ');
      throw new Error(errorMessage);
    }

    throw new Error(
      errorData.message || `Login failed with status ${response.status}`
    );
  }

  return response.json();
}

/**
 * Refresh access and refresh tokens
 * POST /api/refresh
 * Based on Swagger: Refresh tokens endpoint
 * Uses refreshToken from httpOnly cookie to get new tokens
 */
export async function refreshTokens(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    let errorData: ApiError;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: 'Failed to refresh tokens',
        statusCode: response.status,
      };
    }

    // If refresh fails, user needs to login again
    if (response.status === 401) {
      throw new Error('Session expired. Please login again.');
    }

    throw new Error(
      Array.isArray(errorData.message)
        ? errorData.message.join(', ')
        : errorData.message || `Failed to refresh tokens: ${response.status}`
    );
  }
}

/**
 * Logout user
 * POST /api/logout
 * Based on Swagger: User logout endpoint
 * Clears httpOnly cookies for accessToken and refreshToken
 */
export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    // Even if logout fails, we should clear local state
    console.error('Logout request failed, but clearing local state');
  }
}

