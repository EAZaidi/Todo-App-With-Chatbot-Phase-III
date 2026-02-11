/**
 * API client for task operations with JWT authentication.
 *
 * Features:
 * - Automatic JWT token attachment to all requests
 * - Error handling for 401 (redirect to sign-in) and 403 (access denied)
 * - Type-safe task CRUD operations
 */

import { getAuthToken } from "./auth-client";

// Base URL for API endpoints (expects routes mounted under /api)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE_URL = `${API_BASE}/api`;

interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface TaskCreate {
  title: string;
  description?: string | null;
}

interface TaskUpdate {
  title: string;
  description: string | null;
  completed: boolean;
}

interface TaskPartialUpdate {
  title?: string;
  description?: string | null;
  completed?: boolean;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Get authorization headers with JWT token.
 *
 * @returns Headers object with Authorization header if token exists
 */
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handle API response and errors.
 *
 * @param response - Fetch response object
 * @returns Parsed JSON response
 * @throws ApiError for non-2xx responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let message = "An error occurred";

    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {
      // Response may not be JSON
    }

    // Handle authentication and authorization errors
    if (response.status === 401) {
      // Token is invalid or expired - redirect to sign-in
      if (typeof window !== "undefined") {
        window.location.href = "/sign-in";
      }
      throw new ApiError(401, "Not authenticated");
    }

    if (response.status === 403) {
      throw new ApiError(403, "Access denied");
    }

    throw new ApiError(response.status, message);
  }

  return response.json();
}

/**
 * Task API client.
 *
 * All methods require authentication via JWT token stored in auth-client.
 */
export const taskApi = {
  /**
   * Create a new task.
   *
   * @param userId - User ID (must match authenticated user)
   * @param data - Task creation data
   * @returns Created task
   */
  async create(userId: string, data: TaskCreate): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/tasks`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse<Task>(response);
  },

  /**
   * List all tasks for a user.
   *
   * @param userId - User ID (must match authenticated user)
   * @returns Array of tasks
   */
  async list(userId: string): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/tasks`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<Task[]>(response);
  },

  /**
   * Get a single task.
   *
   * @param userId - User ID (must match authenticated user)
   * @param taskId - Task ID
   * @returns Task details
   */
  async get(userId: string, taskId: number): Promise<Task> {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/tasks/${taskId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    return handleResponse<Task>(response);
  },

  /**
   * Update a task (full replacement).
   *
   * @param userId - User ID (must match authenticated user)
   * @param taskId - Task ID
   * @param data - Complete task data
   * @returns Updated task
   */
  async update(userId: string, taskId: number, data: TaskUpdate): Promise<Task> {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/tasks/${taskId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    return handleResponse<Task>(response);
  },

  /**
   * Partially update a task.
   *
   * @param userId - User ID (must match authenticated user)
   * @param taskId - Task ID
   * @param data - Partial task data
   * @returns Updated task
   */
  async patch(
    userId: string,
    taskId: number,
    data: TaskPartialUpdate
  ): Promise<Task> {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    return handleResponse<Task>(response);
  },

  /**
   * Delete a task.
   *
   * @param userId - User ID (must match authenticated user)
   * @param taskId - Task ID
   */
  async delete(userId: string, taskId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/tasks/${taskId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    await handleResponse<void>(response);
  },

  /**
   * Toggle task completion status.
   *
   * @param userId - User ID (must match authenticated user)
   * @param taskId - Task ID
   * @param completed - New completion status
   * @returns Updated task
   */
  async toggleComplete(
    userId: string,
    taskId: number,
    completed: boolean
  ): Promise<Task> {
    return this.patch(userId, taskId, { completed });
  },
};

// Export types for use in components
export type { Task, TaskCreate, TaskUpdate, TaskPartialUpdate, ApiError };
