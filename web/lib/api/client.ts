/**
 * API Client with automatic token refresh
 * Intercepts 401 errors and automatically refreshes tokens
 */

import { refreshTokens } from './auth';
import { clearAuthUser } from '../auth/token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface FetchOptions extends RequestInit {
  skipAuthRefresh?: boolean;
}

// Track if we're currently refreshing to avoid multiple simultaneous refresh calls
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

/**
 * Refresh tokens with deduplication
 * Only one refresh call will be made even if multiple requests fail simultaneously
 */
async function handleTokenRefresh(): Promise<void> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = refreshTokens()
    .catch((error) => {
      // If refresh fails, clear auth state
      clearAuthUser();
      throw error;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * Enhanced fetch with automatic token refresh on 401
 * 
 * @param url - Request URL (can be relative or absolute)
 * @param options - Fetch options (extends RequestInit)
 * @returns Promise<Response>
 */
export async function apiFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuthRefresh = false, ...fetchOptions } = options;

  // Ensure credentials are included for cookie-based auth
  const requestOptions: RequestInit = {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  };

  // Make the initial request
  let response = await fetch(url, requestOptions);

  // If we get a 401 and auth refresh is not skipped, try to refresh tokens
  if (response.status === 401 && !skipAuthRefresh) {
    try {
      // Attempt to refresh tokens
      await handleTokenRefresh();

      // Retry the original request with new tokens
      response = await fetch(url, requestOptions);
    } catch (error) {
      // If refresh fails, the error will be thrown
      // This means the user needs to login again
      throw error;
    }
  }

  return response;
}

/**
 * Helper to build full API URL
 */
export function getApiUrl(path: string): string {
  // If path already includes the base URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // If path already starts with 'api/', use it directly with base URL
  if (cleanPath.startsWith('api/')) {
    const baseWithoutApi = API_BASE_URL.replace('/api', '');
    return `${baseWithoutApi}/${cleanPath}`;
  }

  // Otherwise, prepend API_BASE_URL
  return `${API_BASE_URL}/${cleanPath}`;
}

