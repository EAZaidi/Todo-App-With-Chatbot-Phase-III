# Tasks: AI-Powered Todo Chatbot with MCP

**Input**: Design documents from `/specs/004-ai-todo-chatbot/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested — validation is manual end-to-end per acceptance scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `backend/mcp_server/`, `frontend/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment for Phase III

- [x] T001 Add openai-agents>=0.8.0, mcp>=1.26.0, and sse-starlette>=1.6.0 to backend/requirements.txt
- [x] T002 Add OPENAI_API_KEY and MCP_SERVER_URL settings to backend/src/config.py (extend existing Settings class with new env vars and defaults)
- [x] T003 [P] Create backend/mcp_server/__init__.py as empty package init
- [x] T004 [P] Create backend/mcp_server/tools/__init__.py as empty package init

**Checkpoint**: Dependencies installed, config extended, MCP server package structure exists.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core models, services, and MCP server scaffold that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Models

- [x] T005 [P] Create Conversation SQLModel in backend/src/models/conversation.py (id, user_id UNIQUE indexed, title, created_at, updated_at per data-model.md)
- [x] T006 [P] Create Message SQLModel in backend/src/models/message.py (id, conversation_id FK, role, content, tool_calls JSONB, tool_results JSONB, created_at per data-model.md)
- [x] T007 [P] Create ToolInvocationLog SQLModel in backend/src/models/tool_log.py (id, message_id FK nullable, user_id indexed, tool_name, input_params JSONB, output_result JSONB, success, error_message, created_at per data-model.md)
- [x] T008 Update backend/src/database/connection.py init_db() to import Conversation, Message, and ToolInvocationLog models so tables are created on startup

### MCP Server Scaffold

- [x] T009 Create MCP server database connection module in backend/mcp_server/database.py (async engine with asyncpg + NullPool for Neon, async session factory, lifespan context manager pattern per research.md)
- [x] T010 Create FastMCP server entry point in backend/mcp_server/server.py (FastMCP("Todo Tools") with lifespan for DB connection, streamable-http transport on port 9000, imports all tools from tools/ package)

### Backend Services

- [x] T011 Create conversation service in backend/src/services/conversation_service.py (get_or_create_conversation, load_message_history with 50-message limit, save_user_message, save_assistant_message, clear_conversation, log_tool_invocation)
- [x] T012 Create agent service scaffold in backend/src/services/agent_service.py (create_agent function that builds Agent with system prompt and MCPServerStreamableHttp reference, run_agent_streamed function that calls Runner.run_streamed and yields SSE-formatted events)

### Chat API Router

- [x] T013 Create chat API router in backend/src/api/routes/chat.py (POST /api/chat with SSE streaming, POST /api/chat/new, GET /api/chat/history — all requiring JWT auth via existing get_current_user dependency, with request validation per contracts/chat-api.md)
- [x] T014 Register chat router in backend/src/main.py (import and include_router with prefix="/api" and tags=["Chat"])

**Checkpoint**: Foundation ready — all models created, MCP server scaffold running, conversation service operational, chat API router registered. User story implementation can now begin.

---

## Phase 3: User Story 1 — Create a Todo via Natural Language (Priority: P1) 🎯 MVP

**Goal**: User types "Add a task to buy groceries tomorrow with high priority" and the AI agent creates the task via MCP tool

**Independent Test**: Send a create-task message through the chat UI, verify task appears in database with correct attributes

### Implementation for User Story 1

- [x] T015 [US1] Implement create_task MCP tool in backend/mcp_server/tools/create_task.py (receives user_id, title, description, priority, due_date; validates input; creates task in DB via SQLModel; returns structured JSON with success flag and task data per contracts/mcp-tools.md)
- [x] T016 [US1] Register create_task tool in backend/mcp_server/server.py (import and verify tool is discoverable by MCP client)
- [x] T017 [US1] Configure agent system prompt in backend/src/services/agent_service.py to include user_id injection, scope constraint to todo operations only, clarification behavior for vague requests, and data fabrication prevention (per plan.md Agent System Prompt Design section)
- [x] T018 [US1] Wire end-to-end flow in POST /api/chat: validate message → save user message → load history → create agent with MCP server → run_streamed → stream SSE tokens/tool_calls/tool_results/done events → save assistant response → log tool invocations (update backend/src/api/routes/chat.py)

**Checkpoint**: User can type a natural language message to create a task. Agent invokes create_task MCP tool and confirms creation. Full pipeline validated: Chat UI → FastAPI → Agent → MCP → DB → SSE response.

---

## Phase 4: User Story 2 — View and Query Tasks via Natural Language (Priority: P1) 🎯 MVP

**Goal**: User types "Show me my tasks" or "What are my high priority tasks?" and the AI agent retrieves and displays tasks

**Independent Test**: Pre-populate tasks in DB, ask chatbot to list/filter them, verify correct results returned

### Implementation for User Story 2

- [x] T019 [P] [US2] Implement list_tasks MCP tool in backend/mcp_server/tools/list_tasks.py (receives user_id and optional filters: completed, priority, due_date; queries tasks table with filters; returns structured JSON with tasks array and count per contracts/mcp-tools.md)
- [x] T020 [P] [US2] Implement get_task MCP tool in backend/mcp_server/tools/get_task.py (receives user_id and task_id; queries single task with user_id validation; returns structured JSON or error if not found per contracts/mcp-tools.md)
- [x] T021 [US2] Register list_tasks and get_task tools in backend/mcp_server/server.py (import both and verify discoverable)

**Checkpoint**: User can create tasks (US1) AND view/query tasks (US2) via natural language. Both P1 stories complete — MVP is functional.

---

## Phase 5: User Story 3 — Update Tasks via Natural Language (Priority: P2)

**Goal**: User types "Mark buy groceries as done" or "Change priority of Finish report to high" and the agent updates the task

**Independent Test**: Create a task, then ask chatbot to modify it — verify changes persisted in database

### Implementation for User Story 3

- [x] T022 [US3] Implement update_task MCP tool in backend/mcp_server/tools/update_task.py (receives user_id, task_id, and optional fields: title, description, completed, priority, due_date; validates at least one field provided; updates task with user_id check; returns updated task data per contracts/mcp-tools.md)
- [x] T023 [US3] Register update_task tool in backend/mcp_server/server.py (import and verify discoverable)

**Checkpoint**: User can create, view, AND update tasks via natural language. Update operations (mark done, change priority, move due date) all functional.

---

## Phase 6: User Story 4 — Delete Tasks via Natural Language (Priority: P2)

**Goal**: User types "Delete the buy groceries task" and the agent confirms then removes the task

**Independent Test**: Create a task, ask chatbot to delete it, verify task removed from database

### Implementation for User Story 4

- [x] T024 [US4] Implement delete_task MCP tool in backend/mcp_server/tools/delete_task.py (receives user_id and task_id; validates task exists and belongs to user; deletes task; returns success confirmation with deleted_task_id per contracts/mcp-tools.md)
- [x] T025 [US4] Register delete_task tool in backend/mcp_server/server.py (import and verify discoverable)

**Checkpoint**: Full CRUD via natural language complete — create, view, update, delete all operational through MCP tools.

---

## Phase 7: User Story 5 — Conversation Persistence and Resumption (Priority: P2)

**Goal**: Conversation history persists across server restarts — user can reference earlier messages after reconnecting

**Independent Test**: Have a conversation, restart the backend server, send a new message and verify agent has context from prior messages

### Implementation for User Story 5

- [x] T026 [US5] Implement POST /api/chat/new endpoint logic in backend/src/api/routes/chat.py (delete all messages for user's conversation, return fresh conversation acknowledgment per contracts/chat-api.md)
- [x] T027 [US5] Implement GET /api/chat/history endpoint logic in backend/src/api/routes/chat.py (load messages with limit/offset pagination, return conversation_id + messages array + total count per contracts/chat-api.md)
- [x] T028 [US5] Verify conversation history reconstruction in backend/src/services/conversation_service.py loads last 50 messages and correctly formats them as OpenAI Agents SDK input list (user messages as role:user, assistant messages reconstructed with tool_calls and tool_results metadata)

**Checkpoint**: Conversations survive server restarts. User can start new conversations. History endpoint returns paginated messages. 50-message context window enforced.

---

## Phase 8: User Story 6 — Error Handling and Graceful Degradation (Priority: P3)

**Goal**: Errors produce friendly messages — invalid input, service unavailability, out-of-scope requests all handled gracefully

**Independent Test**: Send empty message, oversized message, off-topic request, request without JWT — verify appropriate error responses

### Implementation for User Story 6

- [x] T029 [US6] Add message validation to POST /api/chat in backend/src/api/routes/chat.py (reject empty messages and messages >5000 characters with 400 status per FR-026)
- [x] T030 [US6] Add OpenAI API error handling in backend/src/services/agent_service.py (catch service unavailability, timeout, and malformed response exceptions; return SSE error event with user-friendly message per FR-027)
- [x] T031 [US6] Add MCP server connection error handling in backend/src/services/agent_service.py (catch MCPServerStreamableHttp connection failures; return friendly retry message)

**Checkpoint**: All error scenarios handled gracefully — no internal details exposed, friendly messages for all failure modes.

---

## Phase 9: Frontend Chat Interface

**Purpose**: Build the Next.js chat UI that consumes the backend chat API

- [x] T032 [P] Create chat API client in frontend/lib/api/chat.ts (sendMessage function using fetch with ReadableStream for SSE consumption, getHistory function, startNewChat function — all with JWT token attachment via existing getAuthToken)
- [x] T033 [P] Create MessageBubble component in frontend/components/chat/MessageBubble.tsx (renders single message with user vs assistant styling, timestamps, markdown support for agent responses)
- [x] T034 [P] Create ChatInput component in frontend/components/chat/ChatInput.tsx (text input field with send button, Enter key submit, disabled state during loading, 5000 char limit)
- [x] T035 [P] Create StreamingMessage component in frontend/components/chat/StreamingMessage.tsx (displays agent response tokens as they arrive, shows loading indicator during processing, renders tool call/result events inline)
- [x] T036 Create MessageList component in frontend/components/chat/MessageList.tsx (scrollable container rendering MessageBubble for each message, auto-scrolls to bottom on new messages, renders StreamingMessage for in-progress responses)
- [x] T037 Create ChatContainer component in frontend/components/chat/ChatContainer.tsx (main state management: messages array, loading state, SSE stream handling; calls chat API client; manages conversation lifecycle with New Chat button; loads initial history on mount)
- [x] T038 Create chat page in frontend/app/chat/page.tsx (authenticated route that renders ChatContainer, redirects to sign-in if not authenticated)
- [x] T039 Update frontend/components/Navbar.tsx to add Chat navigation link pointing to /chat
- [x] T040 Update frontend/app/page.tsx to update primary CTA to navigate to /chat instead of task list

**Checkpoint**: Full chat UI functional — messages display, streaming works, new chat button resets context, navigation updated.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and improvements across all stories

- [x] T041 Add tool invocation logging to all 5 MCP tools (each tool call writes to tool_invocation_logs table via the conversation_service.log_tool_invocation method, capturing tool_name, input_params, output_result, success, error_message, user_id per FR-016)
- [x] T042 Run quickstart.md validation checklist (start MCP server on 9000, backend on 8000, frontend on 3000; verify all 10 checklist items pass)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — first MCP tool + end-to-end wiring
- **US2 (Phase 4)**: Depends on Phase 2 — can run in parallel with US1 (different tool files) but end-to-end test benefits from US1 being complete
- **US3 (Phase 5)**: Depends on Phase 2 — independent MCP tool, can run after foundation
- **US4 (Phase 6)**: Depends on Phase 2 — independent MCP tool, can run after foundation
- **US5 (Phase 7)**: Depends on Phase 2 — builds on conversation_service from foundation
- **US6 (Phase 8)**: Depends on Phase 3 (needs working chat endpoint to add error handling to)
- **Frontend (Phase 9)**: Depends on Phase 3 (needs working POST /api/chat to consume)
- **Polish (Phase 10)**: Depends on all prior phases being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — creates create_task tool and wires E2E flow
- **US2 (P1)**: Can start after Phase 2 — creates list_tasks and get_task tools (parallel with US1)
- **US3 (P2)**: Can start after Phase 2 — creates update_task tool (parallel with US1/US2)
- **US4 (P2)**: Can start after Phase 2 — creates delete_task tool (parallel with US1/US2/US3)
- **US5 (P2)**: Can start after Phase 2 — adds new chat and history endpoints
- **US6 (P3)**: Requires Phase 3 complete — adds error handling to existing chat flow

### Within Each User Story

- MCP tool implementation before registration
- Registration before end-to-end testing
- Backend complete before frontend integration

### Parallel Opportunities

- T003, T004 (package inits) can run in parallel
- T005, T006, T007 (DB models) can run in parallel
- T019, T020 (list_tasks + get_task tools) can run in parallel
- T032, T033, T034, T035 (frontend components) can run in parallel
- MCP tool phases (US1-US4) can run in parallel after Phase 2 since each tool is a separate file

---

## Parallel Example: Foundation Phase

```bash
# Launch all DB models together:
Task: "Create Conversation SQLModel in backend/src/models/conversation.py"
Task: "Create Message SQLModel in backend/src/models/message.py"
Task: "Create ToolInvocationLog SQLModel in backend/src/models/tool_log.py"
```

## Parallel Example: MCP Tools (after Phase 2)

```bash
# Launch all MCP tool implementations together:
Task: "Implement create_task MCP tool in backend/mcp_server/tools/create_task.py"
Task: "Implement list_tasks MCP tool in backend/mcp_server/tools/list_tasks.py"
Task: "Implement get_task MCP tool in backend/mcp_server/tools/get_task.py"
Task: "Implement update_task MCP tool in backend/mcp_server/tools/update_task.py"
Task: "Implement delete_task MCP tool in backend/mcp_server/tools/delete_task.py"
```

## Parallel Example: Frontend Components

```bash
# Launch all independent frontend components together:
Task: "Create chat API client in frontend/lib/api/chat.ts"
Task: "Create MessageBubble component in frontend/components/chat/MessageBubble.tsx"
Task: "Create ChatInput component in frontend/components/chat/ChatInput.tsx"
Task: "Create StreamingMessage component in frontend/components/chat/StreamingMessage.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 — Create tasks via natural language
4. Complete Phase 4: US2 — View/query tasks via natural language
5. Complete Phase 9: Frontend chat interface
6. **STOP and VALIDATE**: User can create and view tasks via chat

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 + Frontend → MVP (create + view tasks via chat)
3. US3 → Add update capability
4. US4 → Add delete capability
5. US5 → Add persistence verification + new chat
6. US6 → Add error handling
7. Polish → Logging + validation

### Sequential Execution (Single Developer)

1. T001–T004: Setup (4 tasks)
2. T005–T014: Foundation (10 tasks)
3. T015–T018: US1 — Create (4 tasks)
4. T019–T021: US2 — View (3 tasks)
5. T022–T023: US3 — Update (2 tasks)
6. T024–T025: US4 — Delete (2 tasks)
7. T026–T028: US5 — Persistence (3 tasks)
8. T029–T031: US6 — Error handling (3 tasks)
9. T032–T040: Frontend (9 tasks)
10. T041–T042: Polish (2 tasks)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each MCP tool is in its own file — can be implemented in parallel
- Frontend phase can start after US1 backend is complete (needs working POST /api/chat)
- Conversation persistence (US5) builds on foundation — models and service already exist from Phase 2
- Error handling (US6) refines existing chat endpoint — must come after basic flow works
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
