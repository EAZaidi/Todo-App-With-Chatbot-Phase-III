# Research: AI-Powered Todo Chatbot with MCP

**Feature Branch**: `004-ai-todo-chatbot`
**Date**: 2026-02-07

## Technology Research

### OpenAI Agents SDK (`openai-agents` v0.8.0)

**Purpose**: Agent framework that interprets natural language and
invokes tools to fulfill user requests.

**Key capabilities**:
- `Agent(name, instructions, mcp_servers)` — create agent with MCP
  tool access
- `Runner.run(agent, input)` — async execution returning `RunResult`
- `Runner.run_streamed(agent, input)` — streaming execution with
  `stream_events()` yielding token deltas and tool call events
- `result.to_input_list()` — serialize conversation state for
  multi-turn persistence
- Built-in MCP connectors: `MCPServerStdio`,
  `MCPServerStreamableHttp`, `MCPServerSse` (deprecated)
- Tools discovered automatically from connected MCP servers via
  `mcp_servers=` parameter

**Conversation history**: Use `result.to_input_list()` to serialize
after each turn. On next turn, prepend history and append new user
message. This is the approach we will use for DB-backed persistence
(store serialized input list in PostgreSQL, load on each request).

### MCP Python SDK (`mcp` v1.26.0)

**Purpose**: Tool server implementing Model Context Protocol.

**Key capabilities**:
- `FastMCP("name")` from `mcp.server.fastmcp` — create MCP server
- `@mcp.tool()` decorator — register tools with auto-generated
  schemas from type hints
- Lifespan pattern for async database connections
- Transport options: `stdio`, `streamable-http` (recommended), `sse`
  (deprecated)
- Can run standalone or mounted as ASGI app into FastAPI

**Tool schema**: Automatically derived from Python type annotations
and docstrings. No manual JSON Schema needed.

### Integration Pattern

The OpenAI Agents SDK connects to MCP servers via
`MCPServerStreamableHttp`:

```python
async with MCPServerStreamableHttp(
    name="Todo MCP",
    params={"url": "http://localhost:9000/mcp"},
    cache_tools_list=True,
) as server:
    agent = Agent(
        name="Todo Assistant",
        instructions="...",
        mcp_servers=[server],
    )
    result = await Runner.run(agent, user_message)
```

### FastAPI SSE Streaming

`Runner.run_streamed()` integrates with FastAPI via
`StreamingResponse(media_type="text/event-stream")`. Events include
token deltas, tool call notifications, and completion signals.

## Architecture Decision: MCP Server Deployment

**Decision**: Run MCP server as a separate process accessible via
streamable-http transport.

**Rationale**:
- Constitution Principle IV requires clear separation between Agent
  Logic and MCP Tools layers
- Separate process enables independent scaling and testing
- `streamable-http` is the MCP spec-recommended production transport
- `MCPServerStdio` requires subprocess management which adds
  complexity to the FastAPI server lifecycle
- Separate process means the MCP server can be restarted independently

**Alternative rejected**: In-process ASGI mounting — would blur the
boundary between Agent and MCP layers, violating Principle IV.

## Architecture Decision: Conversation Persistence

**Decision**: Store conversation messages in PostgreSQL using a custom
persistence layer, reconstruct `to_input_list()` format on each
request.

**Rationale**:
- Constitution Principle VIII requires all state in Neon PostgreSQL
- `SQLiteSession` is not suitable (uses SQLite, not PostgreSQL)
- `conversation_id` (OpenAI server-side) stores data on OpenAI's
  servers, violating our persistence requirements
- Custom DB persistence gives full control over message format,
  retention, and querying

**Alternative rejected**: `SQLiteSession` — violates Principle VIII
(all state must be in Neon PostgreSQL). `conversation_id` — stores
state on OpenAI servers, not in our database.

## Architecture Decision: Single Spec vs Multi-Spec

**Decision**: Single spec covering chat UI, agent logic, and MCP tools.

**Rationale**:
- All three components are tightly coupled and meaningless in isolation
- A chat UI without an agent is an empty shell
- An agent without MCP tools has no capabilities
- MCP tools without an agent have no consumer
- Single spec ensures all acceptance scenarios test the full pipeline

**Alternative rejected**: Separate specs per layer — would create
artificial boundaries and complicate cross-layer acceptance testing.

## Architecture Decision: JWT Verification Approach

**Decision**: Reuse existing `get_current_user` dependency from
Phase I/II for the new chat endpoint. Pass user_id as a parameter
to MCP tools.

**Rationale**:
- The existing JWT verification via JWKS is proven and tested
- No need to verify JWT inside the MCP server — the FastAPI endpoint
  already verifies it and extracts the user_id
- MCP tools receive user_id as a required parameter, enforcing user
  isolation at the tool level
- This keeps the MCP server simpler and focused on data operations

**Alternative rejected**: JWT verification inside MCP tools — would
require the MCP server to have JWKS access, duplicating auth logic
across layers.
