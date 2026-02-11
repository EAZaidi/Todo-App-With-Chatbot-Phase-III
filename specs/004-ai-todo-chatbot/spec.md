# Feature Specification: AI-Powered Todo Chatbot with MCP

**Feature Branch**: `004-ai-todo-chatbot`
**Created**: 2026-02-07
**Status**: Draft
**Input**: User description: "Phase III – AI-powered Todo Chatbot with MCP. Natural language task management using OpenAI Agents and MCP tools."

## Scope

### In Scope

- Chat-based interface replacing the existing manual task management UI
- AI agent that interprets natural language and invokes MCP tools
- MCP tool server exposing todo CRUD operations as schema-defined tools
- Conversation persistence and session resumption after server restart
- Graceful error handling with clear, user-friendly responses
- All operations scoped to the authenticated user

### Out of Scope

- Voice or multimodal chat (text-only)
- External integrations beyond the todo domain (no calendar, email, etc.)
- Custom LLM fine-tuning (uses OpenAI models as-is)
- Manual task management UI (chat is the sole interface)
- Mobile-native applications
- Real-time collaboration between users
- Task sharing across users

### Assumptions

- The existing Phase I/II backend (6 REST endpoints, Task model, JWT auth via Better Auth) and frontend (Next.js 16+, Tailwind CSS) remain operational and unchanged
- OpenAI API access is available and configured via environment variables
- The existing Task model (id, user_id, title, description, completed, priority, due_date, created_at, updated_at) is sufficient for all chatbot operations
- A single AI agent handles all todo operations for a user session
- Conversation history is bounded to a reasonable window (last 50 messages per conversation) to manage token costs
- Users interact with the chatbot through a single persistent conversation per session

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Todo via Natural Language (Priority: P1)

An authenticated user opens the chat interface and types a natural language message such as "Add a task to buy groceries tomorrow with high priority." The AI agent interprets the message, invokes the appropriate MCP tool to create the task, and responds with a confirmation including the task details.

**Why this priority**: Creating tasks is the most fundamental operation. Without it, the chatbot delivers no value. This story validates the entire pipeline: chat UI → backend → agent → MCP tool → database → response.

**Independent Test**: Can be fully tested by sending a create-task message through the chat interface and verifying the task appears in the database with correct attributes. Delivers core value of natural language task creation.

**Acceptance Scenarios**:

1. **Given** an authenticated user with no tasks, **When** the user types "Add a task to buy groceries tomorrow with high priority", **Then** the system creates a task with title "Buy groceries", due date set to tomorrow, priority "high", completed set to false, and responds with a confirmation message showing the created task details.

2. **Given** an authenticated user, **When** the user types "Create a task called 'Finish report'", **Then** the system creates a task with title "Finish report", default priority "medium", no due date, and confirms creation.

3. **Given** an authenticated user, **When** the user types a vague message like "I need to do something", **Then** the agent asks a clarifying question such as "What task would you like to add?" before creating anything.

4. **Given** an authenticated user, **When** the user types "Add three tasks: buy milk, walk the dog, and clean the house", **Then** the system creates three separate tasks and confirms each one.

---

### User Story 2 - View and Query Tasks via Natural Language (Priority: P1)

An authenticated user asks the chatbot to list, filter, or describe their existing tasks. The AI agent invokes the appropriate MCP tool to retrieve tasks and presents them in a readable format within the chat.

**Why this priority**: Viewing tasks is equally fundamental to creating them. Users need to see their tasks to manage them effectively. This story validates the read path of the pipeline.

**Independent Test**: Can be tested by pre-populating tasks in the database, then asking the chatbot to list or filter them. Verifies the agent correctly retrieves and formats task data.

**Acceptance Scenarios**:

1. **Given** a user with 5 tasks (2 completed, 3 pending), **When** the user types "Show me my tasks", **Then** the agent returns all 5 tasks in a readable format showing title, status, priority, and due date for each.

2. **Given** a user with tasks of varying priorities, **When** the user types "What are my high priority tasks?", **Then** the agent returns only the tasks with priority "high".

3. **Given** a user with no tasks, **When** the user types "Show my tasks", **Then** the agent responds with a friendly message indicating no tasks exist and suggests creating one.

4. **Given** a user with tasks, **When** the user types "Do I have anything due tomorrow?", **Then** the agent filters tasks by due date and returns only those due tomorrow, or indicates none are due.

---

### User Story 3 - Update Tasks via Natural Language (Priority: P2)

An authenticated user asks the chatbot to modify an existing task — changing its title, description, priority, due date, or completion status. The AI agent identifies the target task, invokes the appropriate MCP tool, and confirms the update.

**Why this priority**: Updating tasks is essential for task management but depends on the ability to create and view tasks first. This story validates the update path and the agent's ability to resolve task references from natural language.

**Independent Test**: Can be tested by creating a task, then asking the chatbot to modify it. Verifies the agent correctly identifies the task and applies the requested changes.

**Acceptance Scenarios**:

1. **Given** a user with a task titled "Buy groceries", **When** the user types "Mark buy groceries as done", **Then** the agent updates the task's completed status to true and confirms the change.

2. **Given** a user with a task titled "Finish report" with priority "medium", **When** the user types "Change the priority of Finish report to high", **Then** the agent updates the priority and confirms.

3. **Given** a user with a task titled "Walk the dog", **When** the user types "Move walk the dog to next Friday", **Then** the agent updates the due date to next Friday and confirms.

4. **Given** a user with multiple tasks, **When** the user types "Mark all my tasks as complete", **Then** the agent updates each task's completed status to true and confirms the bulk operation.

5. **Given** a user asks to update a task that does not exist, **When** the user types "Mark 'nonexistent task' as done", **Then** the agent responds that no matching task was found and suggests listing tasks to find the correct one.

---

### User Story 4 - Delete Tasks via Natural Language (Priority: P2)

An authenticated user asks the chatbot to remove a task. The AI agent identifies the target task, confirms the deletion intent, invokes the appropriate MCP tool, and confirms removal.

**Why this priority**: Deletion is a destructive operation and lower priority than create/read/update but still essential for complete task management.

**Independent Test**: Can be tested by creating a task, then asking the chatbot to delete it. Verifies the agent correctly identifies, confirms, and removes the task.

**Acceptance Scenarios**:

1. **Given** a user with a task titled "Buy groceries", **When** the user types "Delete the buy groceries task", **Then** the agent confirms deletion intent by asking "Are you sure you want to delete 'Buy groceries'?", and upon user confirmation, deletes the task and confirms removal.

2. **Given** a user with multiple completed tasks, **When** the user types "Remove all completed tasks", **Then** the agent lists the completed tasks, asks for confirmation, and upon confirmation deletes them all.

3. **Given** a user asks to delete a task that does not exist, **When** the user types "Delete 'nonexistent task'", **Then** the agent responds that no matching task was found.

---

### User Story 5 - Conversation Persistence and Resumption (Priority: P2)

A user's conversation history persists across sessions. When the user returns after a server restart or session break, the chatbot retains context from previous messages and can reference earlier interactions.

**Why this priority**: Persistence is a core architectural requirement (Constitution Principle VIII) but does not block basic chatbot functionality. It is critical for production readiness.

**Independent Test**: Can be tested by having a conversation, restarting the server, and verifying the chatbot can reference previous messages and maintain coherent context.

**Acceptance Scenarios**:

1. **Given** a user who created tasks in a previous session, **When** the user starts a new session and types "What tasks did I add earlier?", **Then** the agent retrieves the conversation history and task list, responding with the previously created tasks.

2. **Given** a user with conversation history, **When** the server restarts, **Then** the conversation history is fully preserved in the database and available upon the next request.

3. **Given** a user with a long conversation history (50+ messages), **When** the agent processes a new message, **Then** it uses the most recent 50 messages for context while older messages remain stored but are not sent to the AI model.

---

### User Story 6 - Error Handling and Graceful Degradation (Priority: P3)

When the AI agent encounters errors — invalid input, tool failures, or service unavailability — it responds with clear, helpful messages without exposing internal details.

**Why this priority**: Error handling ensures robustness but is not required for the happy-path demonstration of the chatbot.

**Independent Test**: Can be tested by sending malformed requests, simulating tool failures, and verifying the chatbot responds gracefully.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** the user sends an empty message, **Then** the agent responds with a prompt to provide a task-related request.

2. **Given** an authenticated user, **When** the AI model service is temporarily unavailable, **Then** the system responds with a user-friendly error message such as "I'm having trouble processing your request right now. Please try again in a moment."

3. **Given** an authenticated user, **When** the user asks something outside the todo domain (e.g., "What's the weather?"), **Then** the agent politely redirects: "I can only help with task management. Try asking me to create, view, update, or delete tasks."

4. **Given** an unauthenticated request to the chat endpoint, **Then** the system returns a 401 Unauthorized response without processing the message.

---

### Edge Cases

- What happens when a user's message is ambiguous and could match multiple tasks? The agent MUST ask for clarification, listing the matching tasks.
- What happens when the AI model returns an unexpected or malformed response? The system MUST catch the error and return a generic friendly message.
- What happens when the database is temporarily unreachable? The system MUST return a service unavailable message without crashing.
- What happens when a user sends a very long message (>5000 characters)? The system MUST reject it with a message length limit error.
- What happens when the conversation history is corrupted or missing? The agent MUST start a fresh conversation context and inform the user.
- What happens when two requests from the same user arrive simultaneously? The system MUST handle concurrent requests without data corruption.

## Requirements *(mandatory)*

### Functional Requirements

**Chat Interface:**
- **FR-001**: System MUST provide a chat interface where users send natural language messages and receive AI-generated responses
- **FR-002**: System MUST display a scrollable message history showing both user messages and agent responses
- **FR-003**: System MUST display a text input field for composing messages with a send button
- **FR-004**: System MUST show a loading indicator while the agent processes a message
- **FR-005**: System MUST render agent responses as they are generated (streaming display)

**AI Agent:**
- **FR-006**: System MUST use an AI agent that interprets user messages and selects appropriate MCP tools
- **FR-007**: Agent MUST be configured with a system prompt that constrains behavior to todo operations only
- **FR-008**: Agent MUST invoke MCP tools for all data operations (create, read, update, delete tasks); the agent MUST NOT access the database directly
- **FR-009**: Agent MUST include the authenticated user's ID in every MCP tool invocation to enforce data isolation
- **FR-010**: Agent MUST handle ambiguous user input by asking clarifying questions before taking action
- **FR-011**: Agent MUST support multi-step operations (e.g., "create three tasks" results in three separate tool calls)

**MCP Tools:**
- **FR-012**: System MUST expose the following MCP tools with explicit input/output schemas:
  - `create_task` — Creates a new task for the authenticated user
  - `list_tasks` — Retrieves all tasks for the authenticated user, with optional filters (completed status, priority, due date)
  - `get_task` — Retrieves a single task by ID for the authenticated user
  - `update_task` — Updates one or more fields of an existing task
  - `delete_task` — Deletes a task by ID for the authenticated user
- **FR-013**: Each MCP tool MUST validate that the user_id in the request matches the authenticated user
- **FR-014**: Each MCP tool MUST be stateless — receiving all required context via parameters and retrieving additional state from the database
- **FR-015**: Each MCP tool MUST return structured results (not free-form text) that the agent can interpret and present to the user
- **FR-016**: MCP tool invocations MUST be logged with input parameters, output results, timestamp, and user context

**Conversation Persistence:**
- **FR-017**: System MUST store all conversation messages (user and agent) in the database with timestamps, message role, and content
- **FR-018**: System MUST load conversation history from the database when processing each new message (stateless server)
- **FR-019**: System MUST limit the conversation context sent to the AI model to the most recent 50 messages
- **FR-020**: System MUST support starting a new conversation (clearing context) via a user action

**Authentication and Security:**
- **FR-021**: All chat endpoints MUST require valid JWT authentication (consistent with existing Phase I/II auth)
- **FR-022**: The chat endpoint MUST extract the user ID from the JWT and pass it to the agent and all MCP tools
- **FR-023**: Unauthenticated requests to chat endpoints MUST return 401 Unauthorized
- **FR-024**: MCP tools MUST enforce user isolation — a user can only access their own tasks

**Error Handling:**
- **FR-025**: System MUST return user-friendly error messages for all failure scenarios without exposing internal implementation details
- **FR-026**: System MUST validate message length (maximum 5000 characters) before processing
- **FR-027**: System MUST handle AI model service unavailability with a retry-friendly message
- **FR-028**: System MUST handle out-of-scope requests by politely redirecting users to todo operations

### Key Entities

- **Conversation**: Represents a user's chat session. Attributes: unique identifier, user reference, creation timestamp, last activity timestamp.
- **Message**: A single message within a conversation. Attributes: unique identifier, conversation reference, role (user or assistant), content text, timestamp, optional metadata (tool calls made, tool results).
- **Task**: Existing entity from Phase I/II. Attributes: id, user_id, title, description, completed, priority, due_date, created_at, updated_at. No changes required.
- **MCP Tool Invocation Log**: A record of each tool call made by the agent. Attributes: unique identifier, message reference, tool name, input parameters, output result, timestamp, user reference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a task via natural language in under 10 seconds from message send to confirmation response
- **SC-002**: Users can list, filter, and query their tasks via natural language with correct results returned for every valid query
- **SC-003**: Users can update any task attribute (title, description, priority, due date, completion status) via natural language
- **SC-004**: Users can delete tasks via natural language with confirmation before destructive action
- **SC-005**: Conversation history persists across server restarts — users can reference previous messages after reconnecting
- **SC-006**: 100% of data operations are performed through MCP tools — no direct database access from the agent
- **SC-007**: 100% of operations are scoped to the authenticated user — no cross-user data access is possible
- **SC-008**: Out-of-scope requests receive a polite redirection response within 3 seconds
- **SC-009**: Service errors produce user-friendly messages with no internal details exposed
- **SC-010**: All MCP tool invocations are logged with input, output, and user context for full auditability
