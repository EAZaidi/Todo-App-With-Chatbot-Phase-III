// Priority levels
export type Priority = 'low' | 'medium' | 'high';

// Task interface matching backend TaskResponse
export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string | null;
  priority?: Priority;
  due_date?: string | null;
}

export interface TaskUpdateRequest {
  title: string;
  description?: string | null;
  completed: boolean;
  priority: Priority;
  due_date?: string | null;
}

export interface TaskPartialUpdateRequest {
  title?: string;
  description?: string | null;
  completed?: boolean;
  priority?: Priority;
  due_date?: string | null;
}

export interface ApiError {
  detail: string;
}
