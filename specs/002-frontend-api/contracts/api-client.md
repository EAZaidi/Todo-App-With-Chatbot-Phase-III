# API Client Contract: Frontend ↔ Backend

**Feature**: 002-frontend-api
**Date**: 2026-01-10
**Backend Spec**: 001-backend-todo-api

## Overview

This document defines the API client contract for the frontend to communicate with the backend Todo API. All endpoints follow the REST conventions defined in the backend specification.

---

## Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_USER_ID=default-user
```

### Base URL Construction

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'default-user';
```

---

## API Client Functions

### 1. Get All Tasks

**Purpose**: Fetch all tasks for the current user.

```typescript
async function getTasks(): Promise<Task[]>
```

**HTTP Request**:
```
GET /api/users/{user_id}/tasks
```

**Headers**:
```
Accept: application/json
```

**Success Response** (200 OK):
```json
[
  {
    "id": 1,
    "user_id": "default-user",
    "title": "Buy groceries",
    "description": "Milk, bread, eggs",
    "completed": false,
    "created_at": "2026-01-10T12:00:00Z",
    "updated_at": "2026-01-10T12:00:00Z"
  }
]
```

**Error Responses**:
- 500 Internal Server Error: `{ "detail": "Database connection failed" }`

---

### 2. Get Single Task

**Purpose**: Fetch a specific task by ID.

```typescript
async function getTask(taskId: number): Promise<Task>
```

**HTTP Request**:
```
GET /api/users/{user_id}/tasks/{task_id}
```

**Success Response** (200 OK):
```json
{
  "id": 1,
  "user_id": "default-user",
  "title": "Buy groceries",
  "description": "Milk, bread, eggs",
  "completed": false,
  "created_at": "2026-01-10T12:00:00Z",
  "updated_at": "2026-01-10T12:00:00Z"
}
```

**Error Responses**:
- 404 Not Found: `{ "detail": "Task not found" }`

---

### 3. Create Task

**Purpose**: Create a new task.

```typescript
async function createTask(data: TaskCreateRequest): Promise<Task>
```

**HTTP Request**:
```
POST /api/users/{user_id}/tasks
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Buy groceries",
  "description": "Milk, bread, eggs"  // optional
}
```

**Success Response** (201 Created):
```json
{
  "id": 1,
  "user_id": "default-user",
  "title": "Buy groceries",
  "description": "Milk, bread, eggs",
  "completed": false,
  "created_at": "2026-01-10T12:00:00Z",
  "updated_at": "2026-01-10T12:00:00Z"
}
```

**Error Responses**:
- 400 Bad Request: `{ "detail": "Title cannot be empty or whitespace" }`
- 422 Validation Error: `{ "detail": [...] }`

---

### 4. Update Task (Full)

**Purpose**: Replace all task fields.

```typescript
async function updateTask(taskId: number, data: TaskUpdateRequest): Promise<Task>
```

**HTTP Request**:
```
PUT /api/users/{user_id}/tasks/{task_id}
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Buy groceries and milk",
  "description": "Updated list",
  "completed": true
}
```

**Success Response** (200 OK):
```json
{
  "id": 1,
  "user_id": "default-user",
  "title": "Buy groceries and milk",
  "description": "Updated list",
  "completed": true,
  "created_at": "2026-01-10T12:00:00Z",
  "updated_at": "2026-01-10T12:30:00Z"
}
```

**Error Responses**:
- 400 Bad Request: `{ "detail": "Title cannot be empty or whitespace" }`
- 404 Not Found: `{ "detail": "Task not found" }`

---

### 5. Toggle Task Completion (Partial Update)

**Purpose**: Toggle the completed status of a task.

```typescript
async function toggleTaskComplete(taskId: number, completed: boolean): Promise<Task>
```

**HTTP Request**:
```
PATCH /api/users/{user_id}/tasks/{task_id}
Content-Type: application/json
```

**Request Body**:
```json
{
  "completed": true
}
```

**Success Response** (200 OK):
```json
{
  "id": 1,
  "user_id": "default-user",
  "title": "Buy groceries",
  "description": null,
  "completed": true,
  "created_at": "2026-01-10T12:00:00Z",
  "updated_at": "2026-01-10T12:30:00Z"
}
```

**Error Responses**:
- 404 Not Found: `{ "detail": "Task not found" }`

---

### 6. Delete Task

**Purpose**: Permanently remove a task.

```typescript
async function deleteTask(taskId: number): Promise<void>
```

**HTTP Request**:
```
DELETE /api/users/{user_id}/tasks/{task_id}
```

**Success Response** (204 No Content):
- Empty body

**Error Responses**:
- 404 Not Found: `{ "detail": "Task not found" }`

---

## Error Handling Contract

### Error Response Format

All API errors follow this format:

```typescript
interface ApiErrorResponse {
  detail: string | ValidationError[];
}

interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}
```

### HTTP Status Code Mapping

| Status Code | Meaning | Frontend Action |
|-------------|---------|-----------------|
| 200 | Success (read/update) | Update UI with response |
| 201 | Created | Add new item to list |
| 204 | Deleted | Remove item from list |
| 400 | Bad Request | Show validation error |
| 404 | Not Found | Show "not found" message, refresh list |
| 422 | Validation Error | Show field-specific errors |
| 500 | Server Error | Show generic error, offer retry |

### Client Error Handler

```typescript
async function handleApiError(response: Response): Promise<never> {
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    const error = await response.json();
    throw new ApiError(response.status, error.detail);
  }

  throw new ApiError(response.status, 'An unexpected error occurred');
}
```

---

## Request Headers

### Standard Headers

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
```

### Future Auth Header (Auth-Ready)

```typescript
// To be added when authentication is implemented
const authHeaders = {
  ...headers,
  'Authorization': `Bearer ${accessToken}`,
};
```

---

## API Client Implementation Pattern

```typescript
// lib/api/client.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID;

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
```

---

## Timeout and Retry Policy

### Timeout

```typescript
const FETCH_TIMEOUT = 10000; // 10 seconds
```

### Retry Policy

- Retries: 0 (no automatic retry)
- User can manually retry via UI "Try again" button
- Network errors display user-friendly message

---

## CORS Considerations

Backend CORS is configured to allow:
- Origins: `*` (development mode)
- Methods: `*` (all methods)
- Headers: `*` (all headers)
- Credentials: `true`

No special CORS handling required on frontend for local development.
