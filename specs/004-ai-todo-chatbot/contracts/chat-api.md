# Chat API Contract

**Feature Branch**: `004-ai-todo-chatbot`
**Date**: 2026-02-07

## Endpoints

### POST /api/chat

Send a message to the AI agent and receive a streamed response.

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```json
{
  "message": "Add a task to buy groceries tomorrow with high priority"
}
```

| Field   | Type   | Required | Constraints          |
|---------|--------|----------|----------------------|
| message | string | Yes      | 1–5000 characters    |

**Response**: Server-Sent Events (SSE) stream

```
Content-Type: text/event-stream

event: token
data: {"delta": "I'll"}

event: token
data: {"delta": " create"}

event: token
data: {"delta": " that task"}

event: tool_call
data: {"tool": "create_task", "input": {"user_id": "...", "title": "Buy groceries", "priority": "high", "due_date": "2026-02-08"}}

event: tool_result
data: {"tool": "create_task", "output": {"id": 42, "title": "Buy groceries", "priority": "high", "due_date": "2026-02-08", "completed": false}}

event: token
data: {"delta": " for you."}

event: done
data: {"final_output": "I'll create that task for you. Done! Here's your new task:\n- **Buy groceries** (High priority, due Feb 8)"}
```

**SSE Event Types**:

| Event       | Description                                |
|-------------|--------------------------------------------|
| `token`     | Text delta from the agent response         |
| `tool_call` | MCP tool invocation (tool name + input)    |
| `tool_result` | MCP tool result (output data)            |
| `done`      | Stream complete with final output          |
| `error`     | Error occurred during processing           |

**Error Responses**:

| Status | Condition                    | Body                                    |
|--------|------------------------------|-----------------------------------------|
| 400    | Empty or oversized message   | `{"detail": "Message must be 1-5000 characters"}` |
| 401    | Missing/invalid JWT          | `{"detail": "Not authenticated"}`       |
| 500    | Internal error               | `{"detail": "Internal server error"}`   |

---

### POST /api/chat/new

Start a new conversation (clears history context).

**Authentication**: Required (JWT Bearer token)

**Request Body**: None

**Response**:
```json
{
  "conversation_id": 1,
  "message": "Conversation started. How can I help you manage your tasks?"
}
```

| Status | Condition           | Body                                    |
|--------|---------------------|-----------------------------------------|
| 200    | Success             | New conversation created                |
| 401    | Missing/invalid JWT | `{"detail": "Not authenticated"}`       |

---

### GET /api/chat/history

Retrieve conversation history for the authenticated user.

**Authentication**: Required (JWT Bearer token)

**Query Parameters**:

| Param  | Type | Default | Description               |
|--------|------|---------|---------------------------|
| limit  | int  | 50      | Max messages to return    |
| offset | int  | 0       | Messages to skip          |

**Response**:
```json
{
  "conversation_id": 1,
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "Add a task to buy groceries",
      "created_at": "2026-02-07T10:30:00Z"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "Done! I've created the task 'Buy groceries' for you.",
      "created_at": "2026-02-07T10:30:05Z"
    }
  ],
  "total": 2
}
```

| Status | Condition           | Body                                    |
|--------|---------------------|-----------------------------------------|
| 200    | Success             | Message history                         |
| 401    | Missing/invalid JWT | `{"detail": "Not authenticated"}`       |
