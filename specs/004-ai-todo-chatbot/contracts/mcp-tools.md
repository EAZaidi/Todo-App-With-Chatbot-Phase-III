# MCP Tool Contracts

**Feature Branch**: `004-ai-todo-chatbot`
**Date**: 2026-02-07

All MCP tools are registered on the MCP server and auto-discovered
by the OpenAI Agents SDK via `MCPServerStreamableHttp`.

Every tool receives `user_id` as a required parameter. The FastAPI
chat endpoint extracts user_id from the verified JWT and passes it
to the agent, which includes it in every tool call.

---

## create_task

Creates a new task for the specified user.

**Input Parameters**:

| Parameter   | Type           | Required | Description                     |
|-------------|----------------|----------|---------------------------------|
| user_id     | string         | Yes      | Authenticated user ID           |
| title       | string         | Yes      | Task title (1–500 chars)        |
| description | string \| null | No       | Task description (max 5000)     |
| priority    | string         | No       | "low", "medium", "high" (default: "medium") |
| due_date    | string \| null | No       | Due date in YYYY-MM-DD format   |

**Output**:

```json
{
  "success": true,
  "task": {
    "id": 42,
    "title": "Buy groceries",
    "description": null,
    "completed": false,
    "priority": "high",
    "due_date": "2026-02-08",
    "created_at": "2026-02-07T10:30:00Z"
  }
}
```

**Errors**:
- Invalid title (empty/too long) → `{"success": false, "error": "..."}`
- Invalid priority value → `{"success": false, "error": "..."}`
- Database error → `{"success": false, "error": "Failed to create task"}`

---

## list_tasks

Retrieves all tasks for the specified user with optional filters.

**Input Parameters**:

| Parameter | Type           | Required | Description                     |
|-----------|----------------|----------|---------------------------------|
| user_id   | string         | Yes      | Authenticated user ID           |
| completed | boolean \| null| No       | Filter by completion status     |
| priority  | string \| null | No       | Filter by priority level        |
| due_date  | string \| null | No       | Filter tasks due on this date   |

**Output**:

```json
{
  "success": true,
  "tasks": [
    {
      "id": 42,
      "title": "Buy groceries",
      "completed": false,
      "priority": "high",
      "due_date": "2026-02-08",
      "created_at": "2026-02-07T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

## get_task

Retrieves a single task by ID for the specified user.

**Input Parameters**:

| Parameter | Type   | Required | Description              |
|-----------|--------|----------|--------------------------|
| user_id   | string | Yes      | Authenticated user ID    |
| task_id   | int    | Yes      | Task ID to retrieve      |

**Output**:

```json
{
  "success": true,
  "task": {
    "id": 42,
    "title": "Buy groceries",
    "description": "Get milk, bread, eggs",
    "completed": false,
    "priority": "high",
    "due_date": "2026-02-08",
    "created_at": "2026-02-07T10:30:00Z",
    "updated_at": "2026-02-07T10:30:00Z"
  }
}
```

**Errors**:
- Task not found → `{"success": false, "error": "Task not found"}`
- Task belongs to another user → `{"success": false, "error": "Task not found"}`

---

## update_task

Updates one or more fields of an existing task.

**Input Parameters**:

| Parameter   | Type           | Required | Description                    |
|-------------|----------------|----------|--------------------------------|
| user_id     | string         | Yes      | Authenticated user ID          |
| task_id     | int            | Yes      | Task ID to update              |
| title       | string \| null | No       | New title (1–500 chars)        |
| description | string \| null | No       | New description (max 5000)     |
| completed   | boolean \| null| No       | New completion status           |
| priority    | string \| null | No       | New priority level             |
| due_date    | string \| null | No       | New due date (YYYY-MM-DD)      |

**Output**:

```json
{
  "success": true,
  "task": {
    "id": 42,
    "title": "Buy groceries",
    "completed": true,
    "priority": "high",
    "due_date": "2026-02-08",
    "updated_at": "2026-02-07T11:00:00Z"
  }
}
```

**Errors**:
- Task not found → `{"success": false, "error": "Task not found"}`
- No fields provided → `{"success": false, "error": "No fields to update"}`

---

## delete_task

Deletes a task by ID for the specified user.

**Input Parameters**:

| Parameter | Type   | Required | Description              |
|-----------|--------|----------|--------------------------|
| user_id   | string | Yes      | Authenticated user ID    |
| task_id   | int    | Yes      | Task ID to delete        |

**Output**:

```json
{
  "success": true,
  "message": "Task deleted successfully",
  "deleted_task_id": 42
}
```

**Errors**:
- Task not found → `{"success": false, "error": "Task not found"}`

---

## Tool Invocation Logging

Every tool call is logged to the `tool_invocation_logs` table with:
- `tool_name`: Name of the MCP tool invoked
- `input_params`: Full input parameters as JSONB
- `output_result`: Full output result as JSONB
- `success`: Whether the tool call succeeded
- `error_message`: Error details if `success = false`
- `user_id`: Authenticated user who triggered the call
- `message_id`: Reference to the conversation message (if available)
- `created_at`: Timestamp of the invocation

This satisfies Constitution Principle VII (auditability) and
FR-016 (tool invocation logging).
