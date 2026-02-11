import { getAuthToken } from '@/lib/auth-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Store authenticated user ID (set after sign-in)
let currentUserId: string | null = null;

export function setUserId(userId: string | null): void {
  currentUserId = userId;
  if (typeof window !== 'undefined') {
    if (userId) {
      localStorage.setItem('user_id', userId);
    } else {
      localStorage.removeItem('user_id');
    }
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Handle auth errors
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
      }
      throw new ApiError(401, 'Not authenticated');
    }
    if (response.status === 403) {
      throw new ApiError(403, 'Access denied');
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const error = await response.json();
      throw new ApiError(response.status, error.detail || 'An error occurred');
    }
    throw new ApiError(response.status, 'An unexpected error occurred');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Attach JWT token if available
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return handleResponse<T>(response);
}

export function getUserId(): string {
  // First check memory
  if (currentUserId) {
    return currentUserId;
  }
  // Then check localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('user_id');
    if (stored) {
      currentUserId = stored;
      return stored;
    }
  }
  throw new ApiError(401, 'Not authenticated');
}

export { API_BASE_URL };
