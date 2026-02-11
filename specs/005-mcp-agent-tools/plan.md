# Implementation Plan: MCP Tools and Agent Behavior

**Branch**: `005-mcp-agent-tools` | **Date**: 2026-02-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-mcp-agent-tools/spec.md`

## Summary

Implement five deterministic MCP tools and a behaviorally constrained AI agent for the todo chatbot. The MCP tools (create, list, get, update, delete) are stateless, database-backed operations exposed via the official MCP SDK. The agent, built on the OpenAI Agents SDK, maps natural language to tool calls, enforces user isolation, supports multi-step reasoning, and handles errors gracefully. This plan covers the tool layer and agent logic — UI and chat endpoints are covered in Spec-004.

## Technical Context

**Language/Version**: Python 3.11+ (backend only — no frontend work in this spec)
**Primary Dependencies**: FastMCP (MCP SDK v1.26+), OpenAI Agents SDK (`openai-agents` v0.8+), SQLModel, asyncpg
**Storage**: Neon Serverless PostgreSQL (existing `tasks` table, new `tool_invocation_logs` table)
**Testing**: Manual end-to-end validation + tool-level correctness checks
**Target Platform**: Linux/Windows server (MCP server on port 9000, FastAPI on port 8000)
**Project Type**: Backend service (MCP tool server + agent service)
**Performance Goals**: Tool invocation completes in <500ms; end-to-end agent response in <10s (LLM inference dominates)
**Constraints**: Stateless tools, all state in PostgreSQL, user_id required on every tool call, no direct DB access from agent
**Scale/Scope**: Single-user sessions, ~50 message context window, 5 MCP tools

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-First | PASS | Spec-005 completed and approved |
| II. Agentic Dev Stack | PASS | Following spec → plan → tasks → execution |
| III. Security by Design | PASS | user_id required on every tool, validated at DB query level |
| IV. Separation of Concerns | PASS | Agent logic separated from MCP tools; tools separated from DB connection layer |
| V. Reproducibility | PASS | PHRs created, ADR candidates identified below |
| VI. Tech Stack Fixation | PASS | Using mandated stack: FastMCP, OpenAI Agents SDK, SQLModel, Neon PG |
| VII. Auditable AI | PASS | Every tool invocation logged with input/output/user context |
| VIII. Stateless Server | PASS | No in-memory state; all persistence via PostgreSQL |

## Architecture

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                  CHAT API (FastAPI)                        │
│  ┌────────────────────────────────────────────────────┐   │
│  │  POST /api/chat                                    │   │
│  │  1. Verify JWT → extract user_id                   │   │
│  │  2. Load conversation history from DB              │   │
│  │  3. Call agent_service.run_agent_streamed()         │   │
│  │  4. Stream SSE events to client                    │   │
│  │  5. Persist messages + tool logs to DB             │   │
│  └────────────────────┬───────────────────────────────┘   │
│                        │                                   │
│  ┌────────────────────┴───────────────────────────────┐   │
│  │  AGENT SERVICE (agent_service.py)                  │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  OpenAI Agent("Todo Assistant")              │  │   │
│  │  │  ┌────────────────────────────────────────┐  │  │   │
│  │  │  │  SYSTEM PROMPT                         │  │  │   │
│  │  │  │  • Scope: todo operations only         │  │  │   │
│  │  │  │  • User ID: {user_id} injected         │  │  │   │
│  │  │  │  • Rules: clarify, confirm deletes,    │  │  │   │
│  │  │  │    format results, no data fabrication  │  │  │   │
│  │  │  └────────────────────────────────────────┘  │  │   │
│  │  │  Runner.run_streamed() → stream_events()     │  │   │
│  │  └──────────────────────┬───────────────────────┘  │   │
│  └─────────────────────────┼──────────────────────────┘   │
└─────────────────────────────┼─────────────────────────────┘
                              │ MCPServerStreamableHttp
                              │ (http://localhost:9000/mcp)
┌─────────────────────────────┼─────────────────────────────┐
│                   MCP TOOL SERVER (port 9000)               │
│  ┌──────────────────────────┴─────────────────────────┐   │
│  │             FastMCP("Todo Tools")                   │   │
│  │                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │ create_task  │  │ list_tasks  │  │  get_task   │  │   │
│  │  │ user_id [R]  │  │ user_id [R] │  │ user_id [R]│  │   │
│  │  │ title [R]    │  │ completed   │  │ task_id [R] │  │   │
│  │  │ description  │  │ priority    │  └────────────┘  │   │
│  │  │ priority     │  │ due_date    │                   │   │
│  │  │ due_date     │  └─────────────┘  ┌────────────┐  │   │
│  │  └─────────────┘                    │ delete_task │  │   │
│  │  ┌─────────────┐                    │ user_id [R] │  │   │
│  │  │ update_task  │                    │ task_id [R] │  │   │
│  │  │ user_id [R]  │                    └────────────┘  │   │
│  │  │ task_id [R]  │                                    │   │
│  │  │ title/desc/  │   [R] = Required parameter         │   │
│  │  │ completed/   │   All others = Optional             │   │
│  │  │ priority/    │                                    │   │
│  │  │ due_date     │   INVARIANT: Every tool validates   │   │
│  │  └─────────────┘   user_id against DB records         │   │
│  │                                                     │   │
│  │  register(mcp) pattern per tool file                 │   │
│  └──────────────────────────┬─────────────────────────┘   │
└─────────────────────────────┼─────────────────────────────┘
                              │ asyncpg (NullPool, ssl)
┌─────────────────────────────┼─────────────────────────────┐
│              NEON SERVERLESS POSTGRESQL                     │
│  ┌──────────┐  ┌───────────────────┐                       │
│  │  tasks   │  │ tool_invocation   │                       │
│  │ (Phase I)│  │ _logs (Phase III) │                       │
│  └──────────┘  └───────────────────┘                       │
└───────────────────────────────────────────────────────────┘
```

### Tool Invocation Flow (Single Tool Call)

```
1. Agent receives user message + conversation history
2. Agent selects tool (e.g., create_task) based on intent
3. Agent extracts parameters from natural language:
   "Add buy groceries tomorrow with high priority"
   → create_task(user_id="abc", title="Buy groceries",
                  due_date="2026-02-12", priority="high")
4. MCPServerStreamableHttp sends request to MCP server
5. MCP tool validates inputs:
   a. title non-empty, ≤500 chars ✓
   b. priority ∈ {low, medium, high} ✓
   c. due_date parseable as YYYY-MM-DD ✓
6. MCP tool executes DB query with user_id filter
7. MCP tool returns structured JSON:
   {"success": true, "task": {id: 42, title: "Buy groceries", ...}}
8. Agent receives result, formats human-readable response
9. SSE streams response tokens to client
```

### Multi-Step Reasoning Flow

```
User: "Delete all my high-priority tasks"

Step 1 — Agent reasons: need to find high-priority tasks first
  → list_tasks(user_id="abc", priority="high")
  → returns 3 tasks: [{id:1, title:"Report"}, {id:5, title:"Deploy"}, {id:9, title:"Review"}]

Step 2 — Agent confirms (FR-015 behavior rule):
  → "I found 3 high-priority tasks: Report, Deploy, Review.
     Are you sure you want to delete all of them?"

Step 3 — User confirms: "Yes, delete them"

Step 4 — Agent executes deletions sequentially:
  → delete_task(user_id="abc", task_id=1)  ✓
  → delete_task(user_id="abc", task_id=5)  ✓
  → delete_task(user_id="abc", task_id=9)  ✓

Step 5 — Agent confirms:
  → "Done! I deleted 3 tasks: Report, Deploy, and Review."
```

## Key Design Decisions

### 1. Tool-Based DB Access vs Direct ORM Usage

All task data operations go through MCP tools. The agent never accesses the database directly.

**Why**: Constitution Principle IV (Separation of Concerns) and Principle VII (Auditable AI) require that every data mutation flows through a logged, schema-validated boundary. MCP tools provide this boundary — each tool has a typed schema, validates inputs, returns structured results, and every invocation is logged.

**Alternative rejected**: Having the agent call SQLModel/ORM directly. This would bypass the MCP boundary, making tool logging impossible and mixing concerns between agent logic and data access. It would also prevent the agent framework from auto-discovering available operations.

**Trade-off**: Adds a network hop to the MCP server (~1-5ms local). Acceptable because LLM inference time (2-8s) dominates the response budget. The added auditability and separation justify the minimal latency cost.

### 2. Stateless MCP Tools with DB Persistence

Each MCP tool is stateless — it receives all context via parameters, queries the database, and returns results. No tool maintains in-memory state between invocations.

**Why**: Constitution Principle VIII (Stateless Server with Persistent State) mandates all state lives in PostgreSQL. Stateless tools are also simpler to reason about, test, and scale — each invocation is independent and deterministic for the same inputs and DB state.

**Implementation**: Each tool function follows the pattern:
1. Validate input parameters
2. Open async DB session via `get_db_session()` context manager
3. Execute query with `user_id` filter
4. Return structured JSON result
5. Session auto-commits on success, auto-rollbacks on failure

**Trade-off**: Each tool call opens a new DB session. For Neon serverless PostgreSQL with NullPool, this is the recommended pattern (no persistent connection pool).

### 3. Single Agent vs Multi-Agent

A single agent handles all todo operations. No delegation to sub-agents.

**Why**: The todo domain has exactly 5 operations (CRUD + list). A single agent with a well-crafted system prompt can reliably map natural language to the correct tool. Multi-agent architectures add complexity (routing logic, inter-agent communication, state sharing) that is unjustified for this scope.

**Alternative rejected**: Separate agents for read operations vs write operations, or a router agent that delegates to specialist agents. This would increase latency (multiple LLM calls) and complexity without improving accuracy for a 5-tool domain.

**Trade-off**: If the tool set expanded significantly (20+ tools across multiple domains), a multi-agent approach would become necessary. For the current 5-tool scope, single agent is optimal.

### 4. Error Handling Strategy

Errors are handled at two layers: (a) MCP tools return structured error JSON, (b) the agent translates errors into user-friendly messages.

**Tool layer errors** (FR-007, FR-008):
- Input validation failures → `{"success": false, "error": "Title must be 1-500 characters"}`
- Task not found (including cross-user access) → `{"success": false, "error": "Task not found"}`
- Database failures → `{"success": false, "error": "Failed to [operation] task"}`

**Agent layer handling** (FR-019):
- The agent reads the `success` field and `error` message from tool results
- On failure, the agent generates a human-friendly explanation without exposing raw JSON
- The system prompt instructs the agent to never show internal error details

**Why this split**: Tools should report errors precisely (for logging and debugging). The agent should translate errors for users (for UX). Keeping these separate maintains Principle IV (separation of concerns).

### 5. User ID Injection via System Prompt

The authenticated user_id is injected into the agent's system prompt. The agent is instructed to pass this user_id to every tool call. Each tool validates user_id against the database.

**Why**: Authentication is verified once at the FastAPI layer (JWT validation). The MCP tools themselves are auth-agnostic — they simply receive and validate user_id as a data parameter. This keeps auth concerns in one place and tools focused on data operations.

**Defense in depth**:
1. FastAPI middleware verifies JWT and extracts user_id
2. System prompt tells agent: "The current user's ID is {user_id}. You MUST pass this user_id to every tool call."
3. MCP tool schema makes user_id a required parameter (agent cannot omit it)
4. MCP tool DB query filters by user_id (even if agent passes wrong ID, the DB enforces isolation)

**Risk**: The LLM could theoretically pass an incorrect user_id. Mitigated by: the system prompt is unambiguous, the schema enforces the parameter, and the DB query ensures data isolation regardless of what the agent sends.

## Agent System Prompt Design

The system prompt is the primary control mechanism for agent behavior. It consists of four sections:

### 1. Scope Constraint

```
You are a task management assistant. You can ONLY help with creating,
viewing, updating, and deleting tasks. Politely decline any other requests.
```

Maps to: FR-012 (todo-only scope), FR-018 (decline out-of-scope)

### 2. User Context Injection

```
The current user's ID is {user_id}. You MUST pass this user_id to
every tool call.
```

Maps to: FR-011 (user_id in every invocation), FR-009 (tool requires user_id)

### 3. Behavior Rules

```
- Ask for clarification on ambiguous requests
- Confirm destructive operations (delete) before executing
- Present task lists in a readable formatted list
- For bulk operations, process each item individually
- When showing tasks, format them nicely with title, priority,
  status, and due date if available.
```

Maps to: FR-014 (clarify ambiguity), FR-015 (confirm deletes), FR-016 (multi-step), FR-017 (human-readable format)

### 4. Data Fabrication Prevention

```
Never invent task data. Only report information returned by tool calls.
```

Maps to: FR-013 (all data via tools), SC-001 (100% tool-based operations)

## MCP Tool Contracts

Defined in detail in [specs/004-ai-todo-chatbot/contracts/mcp-tools.md](../004-ai-todo-chatbot/contracts/mcp-tools.md). Summary:

| Tool | Required Params | Optional Params | Returns |
|------|----------------|-----------------|---------|
| `create_task` | user_id, title | description, priority, due_date | `{success, task}` |
| `list_tasks` | user_id | completed, priority, due_date | `{success, tasks[], count}` |
| `get_task` | user_id, task_id | — | `{success, task}` |
| `update_task` | user_id, task_id | title, description, completed, priority, due_date | `{success, task}` |
| `delete_task` | user_id, task_id | — | `{success, message, deleted_task_id}` |

**Common patterns across all tools**:
- Return `{"success": true, ...}` on success
- Return `{"success": false, "error": "..."}` on failure
- Filter all queries by `user_id` (user isolation)
- Cross-user access returns `"Task not found"` (no info leakage)
- All input validation happens before DB operations

## Error Handling Strategy

| Error Source | Layer | Handling | User Sees |
|-------------|-------|----------|-----------|
| Invalid title (empty, >500 chars) | MCP Tool | Returns `{success: false, error: "..."}` | Agent: "Please provide a title between 1-500 characters." |
| Invalid priority (not low/medium/high) | MCP Tool | Returns `{success: false, error: "..."}` | Agent: "Priority must be low, medium, or high." |
| Invalid date format | MCP Tool | Returns `{success: false, error: "..."}` | Agent: "Please use YYYY-MM-DD format for dates." |
| Task not found | MCP Tool | Returns `{success: false, error: "Task not found"}` | Agent: "I couldn't find that task. Want me to list your tasks?" |
| No fields to update | MCP Tool | Returns `{success: false, error: "No fields to update"}` | Agent: "What would you like to change about this task?" |
| Database error | MCP Tool | Returns `{success: false, error: "Failed to [op] task"}` | Agent: "I had trouble processing that. Please try again." |
| MCP server unreachable | Agent Service | MCPServerStreamableHttp raises exception | SSE error event: "I'm having trouble right now. Please try again." |
| OpenAI API unavailable | Agent Service | Runner raises exception | SSE error event: "I'm having trouble right now. Please try again." |
| Out-of-scope request | Agent (prompt) | Agent declines via system prompt rules | Agent: "I can only help with task management." |
| Ambiguous task reference | Agent (prompt) | Agent lists candidates and asks | Agent: "I found multiple matches. Which one did you mean?" |

## Project Structure

### Documentation (this feature)

```text
specs/005-mcp-agent-tools/
├── spec.md              # Feature specification
├── plan.md              # This file
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/sp.tasks)
```

### Source Code (existing — implemented in 004 branch, verified in 005)

```text
backend/
├── mcp_server/
│   ├── __init__.py
│   ├── server.py              # FastMCP server (port 9000, streamable-http)
│   ├── database.py            # Async DB connection (NullPool, ssl)
│   └── tools/
│       ├── __init__.py
│       ├── create_task.py     # create_task tool
│       ├── list_tasks.py      # list_tasks tool
│       ├── get_task.py        # get_task tool
│       ├── update_task.py     # update_task tool
│       └── delete_task.py     # delete_task tool
├── src/
│   ├── services/
│   │   └── agent_service.py   # Agent orchestration + system prompt
│   ├── models/
│   │   └── tool_log.py        # Tool invocation log model
│   └── ...
└── requirements.txt           # openai-agents, mcp dependencies
```

**Structure Decision**: This spec covers the MCP tool layer (`backend/mcp_server/`) and agent behavior (`backend/src/services/agent_service.py`). These are backend-only components. The code is already implemented on branch `004-ai-todo-chatbot` — this spec formalizes the contracts and behavior rules for validation and documentation purposes.

## Implementation Phases

### Phase 1: Foundation — MCP Tool Server Setup

**Goal**: MCP server running as separate process, accepting connections, with DB access.

**Components**:
- `mcp_server/server.py` — FastMCP instance on port 9000, streamable-http transport
- `mcp_server/database.py` — Async engine + session factory for Neon PG
- Lifespan context manager for engine disposal on shutdown

**Validation**:
- Server starts and responds at `http://localhost:9000/mcp`
- DB connection established successfully

### Phase 2: Tool Layer — Five MCP Tools

**Goal**: All five tools registered, validated, and returning structured JSON.

**Components** (one file per tool under `mcp_server/tools/`):
- `create_task.py` — Validates title/priority/date, creates task, returns task object
- `list_tasks.py` — Applies optional filters, returns task array with count
- `get_task.py` — Retrieves single task by ID, returns full details
- `update_task.py` — Validates changed fields, updates task, returns updated object
- `delete_task.py` — Removes task by ID, returns confirmation

**Validation per tool**:
- Input validation rejects invalid data with clear error messages
- User isolation enforced via `WHERE user_id = :user_id`
- Cross-user access returns "Task not found" (no info leakage)
- Structured JSON response with `success` boolean
- Stateless — no in-memory state between calls

### Phase 3: Agent Logic — System Prompt and Orchestration

**Goal**: Agent correctly maps natural language to tool calls with defined behavior rules.

**Components**:
- `agent_service.py` — Agent creation, system prompt injection, streaming orchestration
- System prompt with 4 sections: scope, user context, behavior rules, fabrication prevention

**Validation**:
- Agent selects correct tool for each intent type (create/list/get/update/delete)
- Agent extracts correct parameters from natural language
- Agent asks for clarification on ambiguous input
- Agent confirms before delete operations
- Agent presents results in human-readable format
- Agent declines out-of-scope requests

### Phase 4: Validation — Quality and Correctness

**Goal**: All spec requirements verified, edge cases tested, logging confirmed.

**Validation checklist**:
- [ ] FR-001–FR-005: All 5 tools expose correct schemas
- [ ] FR-006: Tools are stateless (no shared state between calls)
- [ ] FR-007: All responses use `{success, data/error}` format
- [ ] FR-008: Input validation catches all invalid inputs
- [ ] FR-009–FR-010: User isolation enforced, cross-user access blocked
- [ ] FR-011: Agent passes user_id to every tool call
- [ ] FR-012–FR-019: Agent behavior rules verified (scope, clarify, confirm, format, decline, error handling)
- [ ] FR-020–FR-021: Tool invocation logs persisted with full context
- [ ] SC-001–SC-010: All success criteria pass

## Testing Strategy

### Tool-Level Tests

| Test Case | Tool | Input | Expected Output | Validates |
|-----------|------|-------|-----------------|-----------|
| Create task with all fields | create_task | user_id, title, desc, priority, due_date | `{success: true, task: {...}}` | FR-001 |
| Create task with defaults | create_task | user_id, title only | `{success: true, task: {priority: "medium"}}` | FR-001 |
| Create with empty title | create_task | user_id, title="" | `{success: false, error: "Title cannot be empty"}` | FR-008 |
| Create with invalid priority | create_task | priority="urgent" | `{success: false, error: "Priority must be..."}` | FR-008 |
| Create with invalid date | create_task | due_date="tomorrow" | `{success: false, error: "Invalid due_date format"}` | FR-008 |
| List all tasks | list_tasks | user_id only | `{success: true, tasks: [...], count: N}` | FR-002 |
| List with filter | list_tasks | user_id, priority="high" | Only high-priority tasks returned | FR-002 |
| List for user with no tasks | list_tasks | user_id (no tasks) | `{success: true, tasks: [], count: 0}` | FR-002 |
| Get existing task | get_task | user_id, task_id | `{success: true, task: {...}}` | FR-003 |
| Get non-existent task | get_task | user_id, task_id=999 | `{success: false, error: "Task not found"}` | FR-003, FR-010 |
| Get another user's task | get_task | wrong user_id | `{success: false, error: "Task not found"}` | FR-010 |
| Update single field | update_task | user_id, task_id, completed=true | `{success: true, task: {completed: true}}` | FR-004 |
| Update multiple fields | update_task | user_id, task_id, priority+due_date | Both fields changed | FR-004 |
| Update with no fields | update_task | user_id, task_id only | `{success: false, error: "No fields to update"}` | FR-008 |
| Update non-existent task | update_task | user_id, bad task_id | `{success: false, error: "Task not found"}` | FR-010 |
| Delete existing task | delete_task | user_id, task_id | `{success: true, deleted_task_id: N}` | FR-005 |
| Delete non-existent task | delete_task | user_id, bad task_id | `{success: false, error: "Task not found"}` | FR-005, FR-010 |
| Delete another user's task | delete_task | wrong user_id | `{success: false, error: "Task not found"}` | FR-010 |

### Agent Behavior Tests

| Test Case | User Message | Expected Agent Behavior | Validates |
|-----------|-------------|------------------------|-----------|
| Simple create | "Add a task to buy groceries" | Calls create_task, confirms | FR-012, FR-013 |
| Create with details | "Add buy milk tomorrow, high priority" | Extracts title, date, priority → create_task | FR-012 |
| Ambiguous create | "I need to do something" | Asks for clarification, no tool call | FR-014 |
| Bulk create | "Add: buy milk, walk dog, clean house" | 3x create_task calls, confirms each | FR-016 |
| Simple list | "Show my tasks" | Calls list_tasks, presents readable list | FR-012, FR-017 |
| Filtered list | "What are my high priority tasks?" | Calls list_tasks with priority="high" | FR-012 |
| Empty list | "Show tasks" (no tasks exist) | Calls list_tasks, suggests creating one | FR-017 |
| Simple update | "Mark buy groceries as done" | list_tasks to find, then update_task | FR-016 |
| Bulk update | "Mark all tasks complete" | list_tasks, then N x update_task | FR-016 |
| Update not found | "Mark nonexistent as done" | list_tasks, no match → reports not found | FR-014 |
| Simple delete | "Delete buy groceries" | list_tasks to find, ASK CONFIRMATION, then delete_task | FR-015 |
| Bulk delete | "Remove all completed tasks" | list_tasks, ASK CONFIRMATION, then N x delete_task | FR-015, FR-016 |
| Delete confirmation skipped | "Delete buy groceries" → user says "no" | Agent does NOT call delete_task | FR-015 |
| Out of scope | "What's the weather?" | Politely declines, suggests task operations | FR-018 |
| Out of scope | "Tell me a joke" | Politely declines | FR-018 |
| Tool error | Tool returns `{success: false}` | Agent shows friendly message, not raw JSON | FR-019 |
| Multi-step compound | "Change groceries to high priority and due Monday" | list_tasks + update_task with both fields | FR-016 |

### User Isolation Tests

| Test Case | Method | Expected Result | Validates |
|-----------|--------|-----------------|-----------|
| User A creates task, User B lists tasks | Two JWT sessions | User B sees 0 tasks | FR-009, FR-010 |
| User A creates task, User B tries get_task with ID | Direct tool call | "Task not found" | FR-010 |
| User A creates task, User B tries delete_task | Direct tool call | "Task not found" | FR-010 |
| Agent passes user_id to every call | Inspect tool_invocation_logs | user_id present on all rows | FR-011 |

### Tool Invocation Logging Tests

| Test Case | Method | Expected Result | Validates |
|-----------|--------|-----------------|-----------|
| Create task via chat | Check tool_invocation_logs | Row with tool_name="create_task", input, output, user_id | FR-020 |
| Failed tool call | Trigger validation error | Row with success=false, error_message populated | FR-020 |
| All log fields populated | Query all logs | No null tool_name, input_params, output_result, user_id, created_at | FR-021 |

## Dependencies (Packages)

| Package | Version | Purpose |
|---------|---------|---------|
| `openai-agents` | >=0.8.0 | Agent creation, Runner.run_streamed(), MCPServerStreamableHttp |
| `mcp` | >=1.26.0 | FastMCP server, @mcp.tool() decorator, streamable-http transport |
| `sqlmodel` | >=0.0.14 | ORM for Task and ToolInvocationLog models |
| `asyncpg` | >=0.29.0 | Async PostgreSQL driver for Neon |

All packages are already in `backend/requirements.txt`.

## Complexity Tracking

No constitution violations. The architecture follows all 8 principles with the simplest viable implementation:
- Single agent (not multi-agent)
- 5 stateless tools (not a generic tool framework)
- Direct DB queries (not a repository pattern)
- System prompt rules (not fine-tuned model behavior)
