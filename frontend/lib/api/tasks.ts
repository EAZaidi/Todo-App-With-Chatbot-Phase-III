import { apiRequest, getUserId } from './client';
import type { Task, TaskCreateRequest, TaskUpdateRequest, TaskPartialUpdateRequest } from './types';

export async function getTasks(): Promise<Task[]> {
  const userId = getUserId();
  return apiRequest<Task[]>(`/api/users/${userId}/tasks`);
}

export async function getTask(taskId: number): Promise<Task> {
  const userId = getUserId();
  return apiRequest<Task>(`/api/users/${userId}/tasks/${taskId}`);
}

export async function createTask(data: TaskCreateRequest): Promise<Task> {
  const userId = getUserId();
  return apiRequest<Task>(`/api/users/${userId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(taskId: number, data: TaskUpdateRequest): Promise<Task> {
  const userId = getUserId();
  return apiRequest<Task>(`/api/users/${userId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleTaskComplete(taskId: number, completed: boolean): Promise<Task> {
  const userId = getUserId();
  const data: TaskPartialUpdateRequest = { completed };
  return apiRequest<Task>(`/api/users/${userId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(taskId: number): Promise<void> {
  const userId = getUserId();
  return apiRequest<void>(`/api/users/${userId}/tasks/${taskId}`, {
    method: 'DELETE',
  });
}
