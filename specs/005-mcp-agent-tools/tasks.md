# Tasks: MCP Tools and Agent Behavior

**Input**: Design documents from `/specs/005-mcp-agent-tools/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Manual end-to-end validation per plan testing strategy. No automated test files requested.

**Organization**: Tasks grouped by user story. Tools mapped to the user story they primarily serve. Agent logic in US5 (multi-step reasoning). Validation in each story phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/` (Python), `frontend/` (TypeScript)
- All tasks in this spec are backend-only (MCP tools + agent service)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment for Phase III AI chatbot

- [x] T001 Add Phase III dependencies (openai-agents>=0.8.0, mcp>=1.26.0, sse-starlette>=1.6.0) to backend/requirements.txt
- [x] T002 [P] Add OPENAI_API_KEY and MCP_SERVER_URL settings to backend/src/config.py

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: MCP server infrastructure, database connection, tool logging model, and server entrypoint that MUST be complete before any tool or agent work

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create async database connection module (AsyncEngine with NullPool, ssl=require, get_db_session context manager) in backend/mcp_server/database.py
- [x] T004 [P] Create ToolInvocationLog SQLModel (id, message_id FK, user_id, tool_name, input_params JSON, output_result JSON, success, error_message, created_at) in backend/src/models/tool_log.py
- [x] T005 [P] Create tools package with __init__.py exporting all 5 tool modules in backend/mcp_server/tools/__init__.py
- [x] T006 Register ToolInvocationLog model import in init_db() for table creation in backend/src/database/connection.py
- [x] T007 Create FastMCP server entrypoint with lifespan (engine disposal), streamable-http transport on port 9000, and register(mcp) calls for all 5 tools in backend/mcp_server/server.py

**Checkpoint**: MCP server starts on port 9000 and responds at http://localhost:9000/mcp. DB connection established.

---

## Phase 3: User Story 1 — Create Task via Natural Language (Priority: P1) MVP

**Goal**: Agent invokes create_task MCP tool to create tasks from natural language, returning structured confirmation with task details.

**Independent Test**: Send "Add a task to buy groceries tomorrow with high priority" via chat. Verify: (a) create_task tool called with correct params, (b) task exists in DB, (c) agent confirms with task details.

### Implementation for User Story 1

- [x] T008 [US1] Implement create_task MCP tool with register(mcp) pattern: validate title (1-500 chars, non-empty), priority (low/medium/high, default medium), due_date (YYYY-MM-DD), user_id required; return {success: true, task: {...}} or {success: false, error: "..."} in backend/mcp_server/tools/create_task.py
- [x] T009 [US1] Validate create_task against FR-001 and FR-008: task with all fields created correctly, defaults applied (priority=medium when omitted), empty title returns error, invalid priority returns error, invalid date format returns error, user_id filtering enforced

**Checkpoint**: create_task tool accepts valid input, creates task in DB, returns structured JSON. Invalid inputs rejected with descriptive errors.

---

## Phase 4: User Story 2 — View and Query Tasks via Natural Language (Priority: P1)

**Goal**: Agent invokes list_tasks and get_task MCP tools to retrieve and filter tasks, presenting results in readable format.

**Independent Test**: Pre-populate tasks, send "Show my tasks" and "What are my high priority tasks?" Verify correct tasks returned with proper filtering.

### Implementation for User Story 2

- [x] T010 [P] [US2] Implement list_tasks MCP tool with register(mcp) pattern: optional filters (completed bool, priority string, due_date YYYY-MM-DD), order by created_at DESC, return {success: true, tasks: [...], count: N} in backend/mcp_server/tools/list_tasks.py
- [x] T011 [P] [US2] Implement get_task MCP tool with register(mcp) pattern: retrieve single task by task_id with user_id isolation (WHERE id=task_id AND user_id=user_id), return full task details including description in backend/mcp_server/tools/get_task.py
- [x] T012 [US2] Validate list_tasks against FR-002: priority filter returns only matching tasks, completed filter works, due_date filter works, no-tasks returns {tasks: [], count: 0}, cross-user access returns zero results
- [x] T013 [US2] Validate get_task against FR-003 and FR-010: correct task returned with all fields, non-existent task_id returns "Task not found", another user's task returns "Task not found" (no info leakage)

**Checkpoint**: list_tasks returns filtered results with correct counts. get_task returns full details. User isolation enforced on both tools.

---

## Phase 5: User Story 3 — Update Tasks via Natural Language (Priority: P2)

**Goal**: Agent invokes update_task MCP tool to modify task fields, supporting partial updates and multi-field changes.

**Independent Test**: Create a task, send "Mark buy groceries as done". Verify completed=true in DB and agent confirms the change.

### Implementation for User Story 3

- [x] T014 [US3] Implement update_task MCP tool with register(mcp) pattern: accept task_id + user_id (required), optional fields (title, description, completed, priority, due_date), validate changed fields, set updated_at=utcnow(), return updated task; reject if no fields provided in backend/mcp_server/tools/update_task.py
- [x] T015 [US3] Validate update_task against FR-004 and FR-008: single field update works (completed=true), multi-field update works (priority+due_date), no-fields-provided returns "No fields to update" error, non-existent task returns "Task not found", cross-user access blocked

**Checkpoint**: update_task supports partial and multi-field updates. Validation errors returned for invalid inputs. User isolation enforced.

---

## Phase 6: User Story 4 — Delete Tasks via Natural Language (Priority: P2)

**Goal**: Agent invokes delete_task MCP tool to remove tasks, with confirmation step enforced by agent behavior rules.

**Independent Test**: Create a task, send "Delete buy groceries". Verify agent asks for confirmation, then deletes after user confirms.

### Implementation for User Story 4

- [x] T016 [US4] Implement delete_task MCP tool with register(mcp) pattern: accept task_id + user_id (required), verify task belongs to user (WHERE id=task_id AND user_id=user_id), delete and return {success: true, message: "Task deleted successfully", deleted_task_id: N} in backend/mcp_server/tools/delete_task.py
- [x] T017 [US4] Validate delete_task against FR-005 and FR-010: task removed from DB on success, confirmation message with deleted_task_id returned, non-existent task returns "Task not found", another user's task returns "Task not found"

**Checkpoint**: delete_task removes correct task and returns confirmation. User isolation enforced. Not-found cases handled cleanly.

---

## Phase 7: User Story 5 — Multi-Step Reasoning and Agent Logic (Priority: P2)

**Goal**: Agent maps natural language to correct tool calls, chains multiple tools for compound requests, confirms destructive actions, and presents results in human-readable format.

**Independent Test**: Send "Delete all my high-priority tasks". Verify agent calls list_tasks(priority=high), asks confirmation, then calls delete_task for each.

### Implementation for User Story 5

- [x] T018 [US5] Implement agent system prompt in SYSTEM_PROMPT_TEMPLATE with 4 sections: (1) scope constraint — todo operations only, (2) user context — "user_id is {user_id}, MUST pass to every tool call", (3) behavior rules — clarify ambiguity, confirm deletes, format results readably, process bulk individually, (4) fabrication prevention — "never invent data, only report tool results" in backend/src/services/agent_service.py
- [x] T019 [US5] Implement run_agent_streamed() async generator: create Agent with MCPServerStreamableHttp(url=MCP_SERVER_URL), inject system prompt with user_id, call Runner.run_streamed(), yield SSE events (token/tool_call/tool_result/done/_metadata) from stream_events() in backend/src/services/agent_service.py
- [x] T020 [US5] Validate multi-step reasoning against FR-016: agent chains list_tasks → update_task for "mark X as done" (resolves task by name), chains list_tasks → delete_task for compound delete requests, updates multiple fields in single update_task call for "change priority and set due date"
- [x] T021 [US5] Validate agent behavior rules against FR-015 and FR-017: agent asks confirmation before delete operations, agent presents task lists in formatted readable output (not raw JSON), agent handles bulk operations by processing each task individually

**Checkpoint**: Agent correctly selects tools from natural language, chains multi-step operations, confirms destructive actions, and formats results readably.

---

## Phase 8: User Story 6 — Scope Enforcement and Error Handling (Priority: P3)

**Goal**: Agent politely declines non-todo requests, translates tool errors into friendly messages, and clarifies ambiguous input.

**Independent Test**: Send "What's the weather?", verify polite redirection. Trigger a tool error, verify no raw JSON exposed.

### Implementation for User Story 6

- [x] T022 [US6] Validate scope enforcement against FR-012 and FR-018: agent declines "What's the weather?" with polite redirection to task management, agent declines "Tell me a joke" similarly, agent never invokes tools for non-todo requests
- [x] T023 [US6] Validate error handling against FR-019: agent translates {success: false, error: "Task not found"} into friendly message ("I couldn't find that task"), agent does not expose raw JSON or stack traces to user, agent handles MCP server connection errors with retry-friendly message
- [x] T024 [US6] Validate clarification behavior against FR-014: agent asks for clarification on "I need to do something" (vague intent), agent lists matching tasks when reference is ambiguous (multiple tasks with similar names), agent resolves task references via list_tasks before update/delete

**Checkpoint**: Agent never answers non-todo questions. All tool errors produce friendly messages. Ambiguous input handled via clarification.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Tool invocation logging, final validation across all success criteria

- [x] T025 Implement tool invocation logging: log_tool_invocation() saves tool_name, input_params, output_result, success, user_id, message_id, created_at to tool_invocation_logs table in backend/src/services/conversation_service.py
- [x] T026 Validate tool logging completeness against FR-020 and FR-021: every tool call produces a log row, all fields populated (no null tool_name/input_params/output_result/user_id/created_at), failed tool calls logged with success=false and error_message
- [x] T027 Run end-to-end validation of all 10 success criteria (SC-001 through SC-010): 100% tool-based operations (SC-001), create <10s (SC-002), correct query results (SC-003), all attributes updatable (SC-004), delete confirmation (SC-005), multi-step chaining (SC-006), user isolation (SC-007), scope enforcement (SC-008), friendly errors (SC-009), full audit logging (SC-010)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–8)**: All depend on Foundational phase completion
  - US1 (P1) and US2 (P1) can proceed in parallel (different tool files)
  - US3 (P2) and US4 (P2) can proceed in parallel (different tool files)
  - US5 (P2) depends on all 5 tools being implemented (US1–US4)
  - US6 (P3) depends on agent service from US5
- **Polish (Phase 9)**: Depends on US5 agent service + all tool implementations

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKS ALL)
    ↓
┌───────────────────────┐
│  P1 Stories (parallel) │
│  US1: create_task      │
│  US2: list_tasks +     │
│       get_task          │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│  P2 Stories (parallel) │
│  US3: update_task      │
│  US4: delete_task      │
└───────────┬───────────┘
            ↓
    US5: Agent Logic + Multi-Step
    (depends on all 5 tools)
            ↓
    US6: Scope & Error Handling
    (depends on agent service)
            ↓
    Phase 9: Polish & Validation
```

### Within Each User Story

- Implement tool before validation
- Core logic before edge cases
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 2**: T003, T004, T005 can run in parallel (different files)
- **Phase 3+4**: T008 (create_task), T010 (list_tasks), T011 (get_task) can run in parallel (different files)
- **Phase 5+6**: T014 (update_task), T016 (delete_task) can run in parallel (different files)

---

## Parallel Example: US1 + US2 (P1 Stories)

```bash
# These tool implementations can be launched in parallel:
T008: "Implement create_task tool in backend/mcp_server/tools/create_task.py"
T010: "Implement list_tasks tool in backend/mcp_server/tools/list_tasks.py"
T011: "Implement get_task tool in backend/mcp_server/tools/get_task.py"

# After all complete, run validations:
T009: "Validate create_task"
T012: "Validate list_tasks"
T013: "Validate get_task"
```

## Parallel Example: US3 + US4 (P2 Stories)

```bash
# These tool implementations can be launched in parallel:
T014: "Implement update_task tool in backend/mcp_server/tools/update_task.py"
T016: "Implement delete_task tool in backend/mcp_server/tools/delete_task.py"

# After all complete, run validations:
T015: "Validate update_task"
T017: "Validate delete_task"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 (create_task)
4. **STOP and VALIDATE**: create_task tool works independently
5. Demonstrate: user can create tasks via natural language

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 (create_task) → Test independently → MVP!
3. US2 (list_tasks + get_task) → Test independently → Users can create + view
4. US3 (update_task) + US4 (delete_task) → Full CRUD via tools
5. US5 (agent logic) → Multi-step reasoning works
6. US6 (scope + errors) → Production-ready behavior
7. Polish → Logging verified, all success criteria pass

---

## Notes

- [P] tasks = different files, no dependencies — safe to run in parallel
- [Story] label maps task to specific user story for traceability
- All 5 MCP tools follow the register(mcp) pattern in separate files
- Tools are stateless — each invocation opens new DB session via get_db_session()
- Agent system prompt is the primary control mechanism for behavior rules
- Tool logging (T025) is cross-cutting but implemented after agent service exists
- Validation tasks (T009, T012–T013, T015, T017, T020–T024, T026–T027) are manual checks against the running system
- Total: 27 tasks across 9 phases
