---
id: 002
title: AI Chatbot Architecture Planning
stage: plan
date: 2026-02-07
surface: agent
model: claude-opus-4-6
feature: 004-ai-todo-chatbot
branch: 004-ai-todo-chatbot
user: USER
command: /sp.plan
labels: ["plan", "architecture", "mcp", "openai-agents", "phase-iii"]
links:
  spec: specs/004-ai-todo-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/004-ai-todo-chatbot/plan.md
 - specs/004-ai-todo-chatbot/research.md
 - specs/004-ai-todo-chatbot/data-model.md
 - specs/004-ai-todo-chatbot/quickstart.md
 - specs/004-ai-todo-chatbot/contracts/chat-api.md
 - specs/004-ai-todo-chatbot/contracts/mcp-tools.md
tests:
 - None
---

## Prompt

/sp.plan

Create:
- Architecture sketch (ChatKit → FastAPI → Agent → MCP → DB)
- Section structure (Chat API, Agent, MCP tools, Persistence)
- Quality validation (correct tool use, statelessness)

Decisions needing documentation:
- Single-spec vs multi-spec tradeoff
- Stateless agent with DB-backed memory
- MCP tools vs direct DB access
- JWT verification approach

Testing strategy:
- Natural language → correct MCP tool call
- Task ownership enforcement
- Conversation recovery after restart
- Unauthorized request rejection

Technical details:
- Follow Spec-Driven Development workflow
- Persist conversations, messages, tasks in Neon DB
- Organize by phases: Foundation → Agent Logic → MCP Tools → Validation

## Response snapshot

Created comprehensive architectural plan with 6 artifacts:

**plan.md**: Full implementation plan with system architecture diagram showing 5-layer flow (Frontend → FastAPI → OpenAI Agent → MCP Server → Neon PostgreSQL). Includes constitution check (all 8 principles pass), component responsibilities, request flow, error handling strategy, and testing strategy.

**research.md**: Technology research covering OpenAI Agents SDK (v0.8.0) and MCP Python SDK (v1.26.0) with concrete integration patterns. Documents 4 architecture decisions with rationale.

**data-model.md**: Database schema for 3 new tables (conversations, messages, tool_invocation_logs) plus entity relationships and context window management strategy.

**contracts/chat-api.md**: REST API contract for 3 endpoints (POST /api/chat with SSE streaming, POST /api/chat/new, GET /api/chat/history) with request/response schemas.

**contracts/mcp-tools.md**: MCP tool contracts for 5 tools (create_task, list_tasks, get_task, update_task, delete_task) with input/output schemas and logging requirements.

**quickstart.md**: Setup and validation guide for running all 3 processes (MCP server on 9000, FastAPI on 8000, Next.js on 3000).

**Key architecture decisions**:
1. MCP server as separate process (streamable-http) — enforces layer separation
2. Custom DB persistence (not SQLiteSession) — all state in Neon PostgreSQL
3. User ID as tool parameter — auth stays in FastAPI, tools stay auth-agnostic
4. SSE streaming — real-time response delivery via Runner.run_streamed()
5. Single conversation per user — UNIQUE(user_id) simplifies data model

## Outcome

- ✅ Impact: Complete architectural plan ready for task generation
- 🧪 Tests: Testing strategy defined in plan (9 E2E tests, 4 tool-level tests)
- 📁 Files: 6 artifacts created in specs/004-ai-todo-chatbot/
- 🔁 Next prompts: /sp.tasks to generate implementation tasks
- 🧠 Reflection: Research phase was critical — discovered that OpenAI Agents SDK has built-in MCPServerStreamableHttp connector and that MCP SDK includes FastMCP internally. This shaped the architecture significantly.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS - All 8 constitution principles verified, all spec requirements mapped to plan components
- Prompt variant (if applicable): Standard /sp.plan workflow with dedicated research subagent
- Next experiment (smallest change to try): Proceed to /sp.tasks for task decomposition
