# Feature Specification: MCP Tools and Agent Behavior for AI Todo Chatbot

**Feature Branch**: `005-mcp-agent-tools`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "Phase III – MCP Tools and Agent Behavior for AI Todo Chatbot. Deterministic task management via MCP tools and explicit agent behavior rules."

## Scope

### In Scope

- Five MCP tools (create, list, get, update, delete) exposed as schema-defined, stateless operations backed by the database
- Agent behavior rules governing how natural language is mapped to tool invocations
- Multi-step reasoning where the agent chains tool calls to fulfill a single user intent (e.g., list then delete)
- User isolation enforced at every tool invocation — each tool receives and validates the authenticated user's identity
- Structured tool responses that the agent interprets and presents to the user
- Tool invocation logging for auditability (input, output, user context, timestamp)
- Agent system prompt rules constraining behavior to todo-domain operations only

### Out of Scope

- Non-todo domain tools (no calendar, email, weather, or general knowledge tools)
- Autonomous agent behavior outside defined rules (no self-initiated actions or background tasks)
- Long-term memory beyond persisted conversations (no learning or preference tracking across sessions)
- Chat UI components, chat endpoints, or streaming transport (covered in Spec-004)
- Authentication system implementation (existing Better Auth with JWT is consumed, not built)
- MCP server infrastructure setup (server lifecycle is an operational concern, not a tool/behavior concern)

### Assumptions

- The existing Task entity (id, user_id, title, description, completed, priority, due_date, created_at, updated_at) is the sole data model for all tool operations — no schema changes required
- The MCP server runs as a separate process accessible via a well-known URL and exposes tools via the official MCP SDK
- The agent receives the authenticated user_id from the chat endpoint and injects it into every tool call — the agent itself does not perform authentication
- Tool schemas are auto-discovered by the agent framework; no manual tool registration in the agent is needed
- A single conversation context per user session is sufficient; the agent does not need to manage multiple parallel conversations
- The AI model (via OpenAI Agents SDK) has sufficient capability to interpret natural language intents and map them to the correct tool calls without fine-tuning

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Task via Natural Language (Priority: P1)

A user tells the chatbot to add a task. The agent interprets the natural language, extracts relevant fields (title, priority, due date), and invokes the `create_task` MCP tool. The agent then confirms the created task details back to the user.

**Why this priority**: Task creation is the most fundamental operation. It validates the complete tool invocation pipeline: natural language parsing → tool selection → parameter extraction → tool execution → result presentation.

**Independent Test**: Can be fully tested by sending a create-intent message and verifying: (a) the correct MCP tool was called with the right parameters, (b) the task exists in the database with correct attributes, and (c) the agent's response confirms the creation with task details.

**Acceptance Scenarios**:

1. **Given** an authenticated user with no tasks, **When** the user says "Add a task to buy groceries tomorrow with high priority", **Then** the agent invokes `create_task` with title "Buy groceries", due_date set to tomorrow's date, priority "high", and the user's ID, and responds with a confirmation including the task title, priority, and due date.

2. **Given** an authenticated user, **When** the user says "Create a task called Finish report", **Then** the agent invokes `create_task` with title "Finish report", default priority "medium", no due date, and the user's ID, and confirms creation.

3. **Given** an authenticated user, **When** the user says "I need to do something", **Then** the agent asks a clarifying question (e.g., "What task would you like to add?") instead of invoking any tool.

4. **Given** an authenticated user, **When** the user says "Add three tasks: buy milk, walk the dog, and clean the house", **Then** the agent invokes `create_task` three times (once per task), each with the user's ID, and confirms each creation.

---

### User Story 2 - View and Query Tasks via Natural Language (Priority: P1)

A user asks to see their tasks or asks a question about them. The agent invokes the `list_tasks` MCP tool with appropriate filters and presents the results in a readable format.

**Why this priority**: Viewing tasks is equally fundamental — users must see their data to manage it. This validates the read path and the agent's ability to apply filters from natural language.

**Independent Test**: Can be tested by pre-populating tasks, then sending a query message and verifying: (a) the correct MCP tool was called with correct filter parameters, (b) the response accurately reflects the database state.

**Acceptance Scenarios**:

1. **Given** a user with 5 tasks (2 completed, 3 pending), **When** the user says "Show me my tasks", **Then** the agent invokes `list_tasks` with the user's ID and no filters, and presents all 5 tasks showing title, status, priority, and due date.

2. **Given** a user with tasks of varying priorities, **When** the user says "What are my high priority tasks?", **Then** the agent invokes `list_tasks` with priority="high" and returns only matching tasks.

3. **Given** a user with no tasks, **When** the user says "Show my tasks", **Then** the agent invokes `list_tasks`, receives an empty result set, and responds with a friendly message suggesting they create a task.

4. **Given** a user with tasks, **When** the user says "Do I have anything due tomorrow?", **Then** the agent invokes `list_tasks` with due_date set to tomorrow's date and returns only matching tasks, or indicates none are due.

---

### User Story 3 - Update Tasks via Natural Language (Priority: P2)

A user asks the chatbot to modify an existing task. The agent identifies the target task (potentially by first listing tasks to resolve a name reference), invokes `update_task` with the changed fields, and confirms the update.

**Why this priority**: Updating depends on the ability to create and view tasks. It validates the agent's ability to resolve task references from natural language and perform multi-step reasoning (list → identify → update).

**Independent Test**: Can be tested by creating a task, then asking to modify it and verifying: (a) the agent resolved the correct task, (b) `update_task` was called with the right fields, (c) the database reflects the change.

**Acceptance Scenarios**:

1. **Given** a user with a task titled "Buy groceries", **When** the user says "Mark buy groceries as done", **Then** the agent invokes `list_tasks` to find the task, then `update_task` with completed=true and the task's ID, and confirms the change.

2. **Given** a user with a task titled "Finish report" at priority "medium", **When** the user says "Change the priority of Finish report to high", **Then** the agent updates the task's priority to "high" and confirms.

3. **Given** a user with multiple tasks, **When** the user says "Mark all my tasks as complete", **Then** the agent invokes `list_tasks` to get all tasks, then `update_task` for each one with completed=true, and confirms the bulk operation.

4. **Given** a user who references a non-existent task, **When** the user says "Mark 'nonexistent task' as done", **Then** the agent invokes `list_tasks`, finds no match, and responds that no matching task was found, suggesting the user list their tasks.

---

### User Story 4 - Delete Tasks via Natural Language (Priority: P2)

A user asks the chatbot to remove a task. The agent identifies the task, confirms the destructive intent with the user before execution, invokes `delete_task`, and confirms removal.

**Why this priority**: Deletion is destructive and lower priority than create/read/update, but essential for complete task lifecycle management. Validates the agent's confirmation-before-action behavior rule.

**Independent Test**: Can be tested by creating a task, asking to delete it, confirming the agent asks for confirmation, providing confirmation, and verifying the task is removed from the database.

**Acceptance Scenarios**:

1. **Given** a user with a task titled "Buy groceries", **When** the user says "Delete the buy groceries task", **Then** the agent identifies the task via `list_tasks`, asks for deletion confirmation, and upon user confirmation invokes `delete_task` and confirms removal.

2. **Given** a user with multiple completed tasks, **When** the user says "Remove all completed tasks", **Then** the agent lists completed tasks, asks for confirmation, and upon confirmation deletes each one and confirms the bulk operation.

3. **Given** a user who references a non-existent task, **When** the user says "Delete 'nonexistent task'", **Then** the agent invokes `list_tasks`, finds no match, and responds that no matching task was found.

---

### User Story 5 - Multi-Step Reasoning (Priority: P2)

A user makes a request that requires the agent to chain multiple tool calls in sequence. For example, "Delete all my high-priority tasks" requires listing tasks filtered by priority, then deleting each matching task.

**Why this priority**: Multi-step reasoning differentiates this from a simple command-to-tool mapping. It validates the agent's ability to plan and execute a sequence of tool calls to fulfill a single intent.

**Independent Test**: Can be tested by creating multiple tasks with different attributes, then issuing a compound request and verifying the agent made the correct sequence of tool calls.

**Acceptance Scenarios**:

1. **Given** a user with 3 high-priority tasks and 2 low-priority tasks, **When** the user says "Delete all my high-priority tasks", **Then** the agent invokes `list_tasks` with priority="high", asks for confirmation listing the 3 tasks, and upon confirmation invokes `delete_task` for each, confirming 3 deletions.

2. **Given** a user with 5 tasks (3 completed), **When** the user says "How many tasks do I still need to do?", **Then** the agent invokes `list_tasks` with completed=false and responds with the count (2) and optionally lists them.

3. **Given** a user with a task titled "Buy groceries" at priority "low", **When** the user says "Change buy groceries to high priority and set it due next Monday", **Then** the agent resolves the task via `list_tasks`, invokes `update_task` with both priority="high" and due_date set to next Monday, and confirms both changes.

---

### User Story 6 - Agent Scope Enforcement and Error Handling (Priority: P3)

When a user makes an out-of-scope request or the system encounters an error, the agent responds gracefully without exposing internal details.

**Why this priority**: Error handling and scope enforcement ensure robustness but do not block the happy-path demonstration of core tool operations.

**Independent Test**: Can be tested by sending out-of-scope messages, invalid requests, and simulating tool failures, then verifying the agent's responses are user-friendly and appropriate.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** the user says "What's the weather?", **Then** the agent responds politely that it can only help with task management and suggests task-related actions.

2. **Given** an authenticated user, **When** a tool call returns a failure response (e.g., `{"success": false, "error": "Task not found"}`), **Then** the agent translates the error into a user-friendly message without exposing the raw JSON.

3. **Given** an authenticated user, **When** the user sends a message with ambiguous task references matching multiple tasks, **Then** the agent lists the matching tasks and asks the user to clarify which one they mean.

4. **Given** an authenticated user, **When** the user says "Tell me a joke", **Then** the agent declines and redirects to task management capabilities.

---

### Edge Cases

- What happens when a user's message matches multiple tasks by name? The agent MUST invoke `list_tasks` to find candidates and ask the user to clarify which task they mean by referencing task IDs or titles.
- What happens when a tool returns an unexpected error format? The agent MUST respond with a generic friendly message ("I had trouble processing that. Please try again.") without exposing error internals.
- What happens when the agent is asked to operate on another user's tasks? The tool MUST enforce user_id matching — if the task's user_id does not match the requesting user's ID, the tool returns "Task not found" (no information leakage about other users' data).
- What happens when the user provides an invalid priority value (e.g., "urgent")? The tool MUST reject it with a clear error, and the agent MUST relay the valid options (low, medium, high).
- What happens when the user provides an invalid date format? The tool MUST reject it with a format hint (YYYY-MM-DD), and the agent MUST relay this to the user.
- What happens when the user asks to create a task with an empty title? The tool MUST reject it, and the agent MUST ask the user to provide a title.
- What happens when `list_tasks` is called for a user with hundreds of tasks? The tool returns all tasks; the agent MUST present them in a summarized format (e.g., counts by status, top items) rather than dumping all data.

## Requirements *(mandatory)*

### Functional Requirements

**MCP Tool Contracts:**
- **FR-001**: System MUST expose a `create_task` tool that accepts user_id (required), title (required), description (optional), priority (optional, defaults to "medium"), and due_date (optional) and returns the created task with all attributes
- **FR-002**: System MUST expose a `list_tasks` tool that accepts user_id (required), completed (optional), priority (optional), and due_date (optional) and returns a list of matching tasks with count
- **FR-003**: System MUST expose a `get_task` tool that accepts user_id (required) and task_id (required) and returns the full task details including description
- **FR-004**: System MUST expose an `update_task` tool that accepts user_id (required), task_id (required), and one or more optional fields (title, description, completed, priority, due_date) and returns the updated task
- **FR-005**: System MUST expose a `delete_task` tool that accepts user_id (required) and task_id (required) and returns a success confirmation with the deleted task ID

**Tool Statelesness and Data Integrity:**
- **FR-006**: Each MCP tool MUST be stateless — receiving all required context via parameters, retrieving data from the database, and holding no in-memory state between invocations
- **FR-007**: Each MCP tool MUST return structured JSON results with a `success` boolean and either the data payload or an `error` message
- **FR-008**: Each MCP tool MUST validate all input parameters before performing database operations and return descriptive error messages for invalid inputs

**User Isolation:**
- **FR-009**: Every MCP tool MUST accept `user_id` as a required parameter and filter all database queries by that user_id
- **FR-010**: When a tool is asked to retrieve, update, or delete a task, it MUST verify the task belongs to the requesting user_id — if not, it MUST return "Task not found" (no information about other users' data)
- **FR-011**: The agent MUST include the authenticated user's ID in every tool invocation — the user_id is injected into the agent's system prompt by the chat endpoint

**Agent Behavior Rules:**
- **FR-012**: The agent MUST be constrained via system prompt to only perform todo-related operations (create, view, update, delete tasks)
- **FR-013**: The agent MUST invoke MCP tools for all data operations — the agent MUST NOT access the database directly or fabricate task data
- **FR-014**: The agent MUST ask clarifying questions when user intent is ambiguous (e.g., vague task descriptions, ambiguous task references)
- **FR-015**: The agent MUST confirm destructive operations (delete) with the user before executing the tool call
- **FR-016**: The agent MUST support multi-step reasoning — chaining multiple tool calls to fulfill a single user intent (e.g., list tasks then delete specific ones)
- **FR-017**: The agent MUST present tool results in a human-readable format — not raw JSON or technical output
- **FR-018**: The agent MUST politely decline out-of-scope requests and redirect users to task management capabilities
- **FR-019**: The agent MUST handle tool errors gracefully by translating error responses into user-friendly messages

**Tool Invocation Logging:**
- **FR-020**: System MUST log every tool invocation with: tool name, input parameters, output result, success/failure status, user ID, associated message ID, and timestamp
- **FR-021**: Tool logs MUST be stored persistently in the database for auditability

### Key Entities

- **Task**: The existing data entity managed by all tools. Attributes: unique identifier, user reference, title, description, completion status, priority level (low/medium/high), due date, creation timestamp, last-updated timestamp. No changes to this entity are required.
- **MCP Tool**: A schema-defined operation exposed by the MCP server. Each tool has a name, typed input parameters, and a structured JSON output. Tools are auto-discovered by the agent framework.
- **Tool Invocation Log**: A record of each tool call. Attributes: unique identifier, tool name, input parameters, output result, success/failure, user reference, associated message reference, timestamp.
- **Agent System Prompt**: The behavioral configuration that constrains the agent to todo-domain operations, injects the user_id, and defines interaction rules (clarification, confirmation, formatting).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of task data operations are performed exclusively through MCP tools — no direct database access from the agent layer
- **SC-002**: Users can create a task via natural language and receive confirmation with correct task details within 10 seconds
- **SC-003**: Users can list, filter, and query tasks via natural language with correct results for every valid query — zero data discrepancies between tool output and database state
- **SC-004**: Users can update any task attribute (title, description, priority, due date, completion status) via natural language and receive confirmation of the change
- **SC-005**: Users can delete tasks via natural language with a confirmation step before any destructive action
- **SC-006**: Multi-step user intents (e.g., "delete all completed tasks") are resolved by the agent chaining the correct sequence of tool calls without user intervention between steps
- **SC-007**: 100% of tool invocations enforce user isolation — no cross-user data access is possible, verified by attempting to access another user's task and receiving "Task not found"
- **SC-008**: Out-of-scope requests receive a polite redirection response — the agent never attempts to answer non-todo questions
- **SC-009**: All tool errors produce user-friendly messages — no raw JSON, stack traces, or internal error details are exposed to the user
- **SC-010**: 100% of tool invocations are logged with input, output, user context, and timestamp for full auditability
