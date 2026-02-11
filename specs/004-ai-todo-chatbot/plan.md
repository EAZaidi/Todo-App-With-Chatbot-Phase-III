# Implementation Plan: AI-Powered Todo Chatbot with MCP

**Branch**: `004-ai-todo-chatbot` | **Date**: 2026-02-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-ai-todo-chatbot/spec.md`

## Summary

Build an AI-powered chatbot that enables users to manage todos via
natural language. The system uses the OpenAI Agents SDK to interpret
user messages, invokes MCP tools over streamable-http transport for
all CRUD operations, and persists conversations in Neon PostgreSQL.
The chat interface replaces the existing manual task management UI
with a streaming chat experience.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript (frontend)
**Primary Dependencies**: FastAPI, OpenAI Agents SDK (`openai-agents`
v0.8+), MCP SDK (`mcp` v1.26+), SQLModel, Next.js 16+
**Storage**: Neon Serverless PostgreSQL (existing + new tables)
**Testing**: Manual end-to-end validation per acceptance scenarios
**Target Platform**: Web (Linux server backend, browser frontend)
**Project Type**: Web application (backend + frontend)
**Performance Goals**: <10s response time for task operations (SC-001)
**Constraints**: Stateless backend, all state in PostgreSQL, JWT auth
**Scale/Scope**: Single-user concurrent sessions, ~50 message context

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-First | ✅ PASS | Spec completed and approved |
| II. Agentic Dev Stack | ✅ PASS | Following spec → plan → tasks → execution |
| III. Security by Design | ✅ PASS | JWT auth on chat endpoints, user_id in all MCP tools |
| IV. Separation of Concerns | ✅ PASS | 5 layers: UI → FastAPI → Agent → MCP Tools → DB |
| V. Reproducibility | ✅ PASS | PHRs created, ADRs suggested below |
| VI. Tech Stack Fixation | ✅ PASS | Using mandated stack + OpenAI Agents SDK + MCP SDK |
| VII. Auditable AI | ✅ PASS | All tool calls logged, agent constrained by system prompt |
| VIII. Stateless Server | ✅ PASS | Conversations in DB, no server memory state |

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js Chat Page                       │   │
│  │  ┌────────────┐  ┌──────────┐  ┌─────────────────┐  │   │
│  │  │ MessageList │  │ChatInput │  │ NewChatButton   │  │   │
│  │  │ (scrollable)│  │(text+send)│  │ (clear context)│  │   │
│  │  └────────────┘  └──────────┘  └─────────────────┘  │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │ POST /api/chat (SSE stream)       │
│                         │ POST /api/chat/new                │
│                         │ GET  /api/chat/history            │
└─────────────────────────┼───────────────────────────────────┘
                          │ JWT Bearer token
┌─────────────────────────┼───────────────────────────────────┐
│                     BACKEND (FastAPI)                        │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │              Chat API Router                         │   │
│  │  • Verify JWT → extract user_id                      │   │
│  │  • Load conversation history from DB                 │   │
│  │  • Create OpenAI Agent with MCP server ref           │   │
│  │  • Run agent with history + new message              │   │
│  │  • Stream response tokens via SSE                    │   │
│  │  • Persist user message + agent response to DB       │   │
│  │  • Log tool invocations to DB                        │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │ MCPServerStreamableHttp            │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │          Existing Task API (Phase I/II)              │   │
│  │  • 6 REST endpoints (unchanged)                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │ streamable-http transport
┌─────────────────────────┼───────────────────────────────────┐
│                   MCP TOOL SERVER                            │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │            FastMCP("Todo Tools")                     │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │   │
│  │  │create_task│ │list_tasks │ │    get_task        │  │   │
│  │  └───────────┘ └───────────┘ └───────────────────┘  │   │
│  │  ┌───────────┐ ┌───────────┐                         │   │
│  │  │update_task│ │delete_task│                         │   │
│  │  └───────────┘ └───────────┘                         │   │
│  │  • Each tool: validate user_id, query DB, return     │   │
│  │  • Lifespan: async DB connection pool                │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │ asyncpg
┌─────────────────────────┼───────────────────────────────────┐
│              NEON SERVERLESS POSTGRESQL                      │
│  ┌──────────┐ ┌──────────────┐ ┌────────┐ ┌──────────────┐ │
│  │  tasks   │ │conversations │ │messages│ │tool_inv_logs │ │
│  │(Phase I) │ │   (new)      │ │ (new)  │ │   (new)      │ │
│  └──────────┘ └──────────────┘ └────────┘ └──────────────┘ │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Better Auth tables (users, sessions, accounts)      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow (POST /api/chat)

```
1. Frontend sends POST /api/chat with JWT + message
2. FastAPI middleware verifies JWT, extracts user_id
3. Chat router loads/creates conversation for user_id
4. Chat router loads last 50 messages from DB
5. Chat router reconstructs OpenAI-format message history
6. Chat router creates Agent with MCP server reference
7. Runner.run_streamed(agent, history + new_message)
8. Stream events back to frontend via SSE:
   a. Token deltas → event: token
   b. Tool calls → event: tool_call (+ log to DB)
   c. Tool results → event: tool_result
   d. Completion → event: done
9. Persist user message to DB (before agent run)
10. Persist agent response to DB (after stream completes)
11. Persist tool invocation logs to DB
```

### Component Responsibilities

| Component | Responsibility | Does NOT |
|-----------|---------------|----------|
| Chat UI (Next.js) | Render messages, send user input, display streaming response | Access DB, run agent logic |
| Chat API (FastAPI) | Auth, conversation persistence, agent orchestration, SSE streaming | Define tool schemas, access tasks directly |
| Agent (OpenAI SDK) | Interpret natural language, select tools, generate responses | Access DB, store state in memory |
| MCP Tools (FastMCP) | Execute CRUD operations on tasks table, return structured results | Auth verification, conversation management |
| Database (Neon PG) | Persist all state: tasks, conversations, messages, tool logs | Business logic, auth |

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-todo-chatbot/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Technology research
├── data-model.md        # Database schema design
├── contracts/
│   ├── chat-api.md      # Chat REST API contract
│   └── mcp-tools.md     # MCP tool input/output schemas
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── tasks.py           # Existing (unchanged)
│   │   │   └── chat.py            # NEW: Chat API endpoints
│   │   ├── middleware/
│   │   │   └── auth.py            # Existing (unchanged)
│   │   └── dependencies.py        # Existing (unchanged)
│   ├── models/
│   │   ├── task.py                # Existing (unchanged)
│   │   ├── conversation.py        # NEW: Conversation model
│   │   └── message.py             # NEW: Message model
│   ├── models/
│   │   └── tool_log.py            # NEW: Tool invocation log
│   ├── services/
│   │   ├── agent_service.py       # NEW: Agent orchestration
│   │   └── conversation_service.py# NEW: Conversation CRUD
│   ├── database/
│   │   └── connection.py          # Existing (update init_db)
│   ├── config.py                  # Existing (add OPENAI_API_KEY,
│   │                              #   MCP_SERVER_URL)
│   └── main.py                    # Existing (add chat router)
├── mcp_server/
│   ├── __init__.py
│   ├── server.py                  # NEW: FastMCP server definition
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── create_task.py         # NEW: create_task tool
│   │   ├── list_tasks.py          # NEW: list_tasks tool
│   │   ├── get_task.py            # NEW: get_task tool
│   │   ├── update_task.py         # NEW: update_task tool
│   │   └── delete_task.py         # NEW: delete_task tool
│   └── database.py                # NEW: MCP server DB connection
└── requirements.txt               # Update with new dependencies

frontend/
├── app/
│   ├── chat/
│   │   └── page.tsx               # NEW: Chat page
│   └── page.tsx                   # Existing (update navigation)
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx      # NEW: Main chat container
│   │   ├── MessageList.tsx        # NEW: Scrollable messages
│   │   ├── MessageBubble.tsx      # NEW: Single message display
│   │   ├── ChatInput.tsx          # NEW: Text input + send
│   │   └── StreamingMessage.tsx   # NEW: Streaming response
│   └── Navbar.tsx                 # Existing (update navigation)
└── lib/
    └── api/
        └── chat.ts                # NEW: Chat API client
```

**Structure Decision**: Web application with existing `backend/` and
`frontend/` directories. New code is additive — no modifications to
existing Phase I/II files except:
- `backend/src/main.py` — add chat router import
- `backend/src/database/connection.py` — add new model imports to
  `init_db()`
- `backend/src/config.py` — add OPENAI_API_KEY, MCP_SERVER_URL
- `backend/requirements.txt` — add openai-agents, mcp dependencies
- `frontend/components/Navbar.tsx` — add chat navigation link
- `frontend/app/page.tsx` — update CTA to point to chat

## Key Design Decisions

### 1. MCP Server as Separate Process

The MCP tool server runs as a standalone process, connected via
`MCPServerStreamableHttp` from the OpenAI Agents SDK.

**Why**: Constitution Principle IV requires clear separation between
Agent Logic and MCP Tools layers. A separate process enforces this
boundary at the OS level and enables independent scaling.

**Trade-off**: Adds network hop latency (~1-5ms local). Acceptable
given the 10-second response budget includes LLM inference time
(which dominates at ~2-8s).

### 2. Conversation Persistence via Custom DB Layer

Conversations are stored in PostgreSQL using SQLModel. On each
request, the chat service loads the last 50 messages, reconstructs
them into OpenAI input format, and passes them to `Runner.run()`.

**Why**: Constitution Principle VIII mandates all state in Neon
PostgreSQL. The OpenAI Agents SDK's `SQLiteSession` uses SQLite
(violates Principle VIII). The `conversation_id` approach stores
state on OpenAI servers (also violates Principle VIII).

**Trade-off**: More implementation work than `SQLiteSession`. But
gives full control over persistence, querying, and retention.

### 3. User ID Passed as Tool Parameter

The FastAPI chat endpoint verifies the JWT and extracts `user_id`.
This `user_id` is included in the agent's instructions so the LLM
passes it to every MCP tool call. Each MCP tool validates user_id
against the task's `user_id` in the database.

**Why**: Keeps auth verification in one place (FastAPI middleware).
MCP tools remain auth-agnostic and focused on data operations.

**Trade-off**: The LLM must correctly pass user_id. Mitigated by:
(a) explicit agent instructions requiring it, (b) MCP tool schema
making it a required parameter, (c) tool-level validation rejecting
mismatches.

### 4. SSE Streaming from FastAPI

Agent responses are streamed to the frontend via Server-Sent Events
(SSE) using `FastAPI StreamingResponse`. The `Runner.run_streamed()`
method yields events that are formatted as SSE and forwarded.

**Why**: Provides real-time feedback as the agent generates text
and invokes tools. Better UX than waiting for complete response.

**Trade-off**: SSE is unidirectional (server → client). Sufficient
for our use case where the client sends a message and receives a
streamed response.

### 5. Single Conversation Per User

Each user has exactly one conversation (enforced by UNIQUE constraint
on `user_id` in conversations table). "New conversation" resets this
conversation's messages.

**Why**: Simplifies the data model and UX. Users interact with a
single persistent chat thread. The "new chat" action clears context
without creating multiple conversation records.

**Trade-off**: No conversation history browsing across multiple
chats. Acceptable for a todo chatbot where the task list itself
serves as the persistent record.

## Agent System Prompt Design

The agent receives a system prompt that:

1. **Constrains scope**: "You are a task management assistant. You
   can ONLY help with creating, viewing, updating, and deleting
   tasks. Politely decline any other requests."

2. **Injects user context**: "The current user's ID is {user_id}.
   You MUST pass this user_id to every tool call."

3. **Defines behavior rules**:
   - Ask for clarification on ambiguous requests
   - Confirm destructive operations (delete) before executing
   - Present task lists in a readable formatted list
   - For bulk operations, process each item individually

4. **Prevents data fabrication**: "Never invent task data. Only
   report information returned by tool calls."

## Error Handling Strategy

| Error Source | Handling |
|-------------|----------|
| Invalid JWT | FastAPI middleware returns 401 (existing) |
| Empty message | Chat router validates, returns 400 |
| Message too long | Chat router validates, returns 400 |
| OpenAI API unavailable | Catch exception, return SSE error event with friendly message |
| MCP server unreachable | Agent receives tool error, responds with retry message |
| MCP tool fails (DB error) | Tool returns `success: false`, agent reports error to user |
| Out-of-scope request | Agent system prompt redirects user to todo operations |
| Concurrent requests | DB transactions with row-level locking (PostgreSQL default) |

## Dependencies (New Packages)

### Backend (Python)

| Package | Version | Purpose |
|---------|---------|---------|
| `openai-agents` | >=0.8.0 | OpenAI Agents SDK |
| `mcp` | >=1.26.0 | MCP server and protocol |
| `sse-starlette` | >=1.6.0 | SSE support for FastAPI |

### Frontend (TypeScript)

No new packages required. Chat UI uses existing React components,
Tailwind CSS, and the native `EventSource` / `fetch` API for SSE.

## Complexity Tracking

No constitution violations. The architecture follows all 8 principles
with the simplest viable implementation for each component.

## Testing Strategy

### End-to-End Validation

| Test | Validates | Method |
|------|-----------|--------|
| Send "Add a task to buy groceries" | US1, FR-006, FR-012, SC-001 | Manual via chat UI |
| Send "Show my tasks" | US2, FR-012, SC-002 | Manual via chat UI |
| Send "Mark buy groceries as done" | US3, FR-012, SC-003 | Manual via chat UI |
| Send "Delete buy groceries" | US4, FR-012, SC-004 | Manual via chat UI |
| Restart server, send "What tasks do I have?" | US5, FR-017, SC-005 | Manual restart + chat |
| Send request without JWT | FR-021, FR-023 | curl without auth header |
| Send "What's the weather?" | US6, FR-028, SC-008 | Manual via chat UI |
| Check tool_invocation_logs table | FR-016, SC-010 | SQL query after operations |
| Sign in as User B, send "Show my tasks" | FR-024, SC-007 | Two-user test |

### Tool-Level Validation

| Test | Validates |
|------|-----------|
| MCP tool returns structured JSON for each operation | FR-015 |
| MCP tool rejects mismatched user_id | FR-013 |
| MCP tool is stateless (no memory between calls) | FR-014 |
| Tool invocations logged with full context | FR-016 |
