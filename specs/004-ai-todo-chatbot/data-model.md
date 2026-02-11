# Data Model: AI-Powered Todo Chatbot with MCP

**Feature Branch**: `004-ai-todo-chatbot`
**Date**: 2026-02-07

## Existing Entities (No Changes)

### Task (from Phase I)

```
Table: tasks
─────────────────────────────────────────────────────
id          INTEGER      PRIMARY KEY, auto-increment
user_id     VARCHAR(255) NOT NULL, INDEXED
title       VARCHAR(500) NOT NULL
description TEXT         NULLABLE
completed   BOOLEAN      DEFAULT FALSE
priority    VARCHAR(10)  DEFAULT "medium"
due_date    DATE         NULLABLE
created_at  TIMESTAMP    DEFAULT UTC NOW
updated_at  TIMESTAMP    DEFAULT UTC NOW
```

No modifications required. MCP tools operate on this table via the
existing SQLModel ORM.

## New Entities

### Conversation

Represents a user's chat session. A user has one active conversation
at a time.

```
Table: conversations
─────────────────────────────────────────────────────
id          INTEGER      PRIMARY KEY, auto-increment
user_id     VARCHAR(255) NOT NULL, INDEXED, UNIQUE
title       VARCHAR(255) DEFAULT "Todo Chat"
created_at  TIMESTAMP    DEFAULT UTC NOW
updated_at  TIMESTAMP    DEFAULT UTC NOW
```

**Constraints**:
- `UNIQUE(user_id)` — one active conversation per user
- `user_id` indexed for fast lookup
- `updated_at` tracks last activity for session management

### Message

A single message within a conversation. Stores both user messages
and agent responses.

```
Table: messages
─────────────────────────────────────────────────────
id              INTEGER      PRIMARY KEY, auto-increment
conversation_id INTEGER      NOT NULL, FK → conversations.id
role            VARCHAR(20)  NOT NULL (user | assistant)
content         TEXT         NOT NULL
tool_calls      JSONB        NULLABLE (serialized tool call data)
tool_results    JSONB        NULLABLE (serialized tool results)
created_at      TIMESTAMP    DEFAULT UTC NOW
```

**Constraints**:
- `FK(conversation_id)` → `conversations.id` with CASCADE DELETE
- `role` must be one of: "user", "assistant"
- `content` stores the human-readable message text
- `tool_calls` stores serialized MCP tool invocations (JSON array)
- `tool_results` stores serialized tool return values (JSON array)
- Messages ordered by `created_at` ASC within a conversation

### Tool Invocation Log

Audit trail of every MCP tool call made by the agent. Used for
traceability (Constitution Principle VII).

```
Table: tool_invocation_logs
─────────────────────────────────────────────────────
id              INTEGER      PRIMARY KEY, auto-increment
message_id      INTEGER      NULLABLE, FK → messages.id
user_id         VARCHAR(255) NOT NULL, INDEXED
tool_name       VARCHAR(100) NOT NULL
input_params    JSONB        NOT NULL
output_result   JSONB        NOT NULL
success         BOOLEAN      NOT NULL
error_message   TEXT         NULLABLE
created_at      TIMESTAMP    DEFAULT UTC NOW
```

**Constraints**:
- `FK(message_id)` → `messages.id` with SET NULL (log survives
  message deletion)
- `user_id` indexed for user-scoped queries
- `tool_name` identifies which MCP tool was called
- `input_params` and `output_result` are JSONB for flexible schemas
- `success` indicates whether the tool call succeeded
- `error_message` captures failure details when `success = false`

## Entity Relationships

```
┌──────────┐     1:1      ┌──────────────┐
│   User   │─────────────▶│ Conversation │
│ (Better  │              │              │
│  Auth)   │              └──────┬───────┘
│          │                     │ 1:N
│          │              ┌──────┴───────┐
│          │              │   Message    │
│          │              │              │
│          │              └──────┬───────┘
│          │                     │ 1:N
│          │     1:N      ┌──────┴───────┐
│          │─────────────▶│ Tool Invoc.  │
│          │              │    Log       │
│          │              └──────────────┘
│          │
│          │     1:N      ┌──────────────┐
│          │─────────────▶│    Task      │
└──────────┘              └──────────────┘
```

## Context Window Management

When loading conversation history for the AI model:

1. Query messages for the user's conversation, ordered by
   `created_at ASC`
2. Take the most recent 50 messages (FR-019)
3. Reconstruct into OpenAI Agents SDK input format:
   - User messages → `{"role": "user", "content": "..."}`
   - Assistant messages → reconstruct from content + tool_calls +
     tool_results
4. Prepend system prompt (agent instructions)
5. Append the new user message

Older messages remain in the database for audit but are not sent
to the AI model.

## Migration Strategy

New tables are created via SQLModel's `create_all()` during app
startup (same pattern as Phase I). No migration of existing data
required — conversations and messages are new entities.
