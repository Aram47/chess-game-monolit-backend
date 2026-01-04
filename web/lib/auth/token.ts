/**
 * Auth token utility
 * Handles authentication state management
 * 
 * Note: Tokens are stored in httpOnly cookies by the backend,
 * so we can't directly access them from JavaScript.
 * This utility manages client-side auth state.
 */

const AUTH_USER_KEY = 'auth_user';

export interface AuthUser {
  id: number;
  name: string;
  surname: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Store authenticated user in localStorage
 */
export function setAuthUser(user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store auth user:', error);
  }
}

/**
 * Get authenticated user from localStorage
 */
export function getAuthUser(): AuthUser | null {
  try {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    if (!userStr) return null;
    return JSON.parse(userStr) as AuthUser;
  } catch (error) {
    console.error('Failed to get auth user:', error);
    return null;
  }
}

/**
 * Clear authenticated user from localStorage
 */
export function clearAuthUser(): void {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (error) {
    console.error('Failed to clear auth user:', error);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}

