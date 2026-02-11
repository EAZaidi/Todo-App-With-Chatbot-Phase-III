---
id: 002
title: OpenAI Agents SDK and MCP SDK Research
stage: plan
date: 2026-02-07
surface: agent
model: claude-opus-4-6
feature: 004-ai-todo-chatbot
branch: null
user: USER
command: research
labels: ["openai-agents-sdk", "mcp-sdk", "architecture-research", "python", "fastapi"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - history/prompts/004-ai-todo-chatbot/002-openai-agents-mcp-sdk-research.plan.prompt.md
tests:
  - none
---

## Prompt

Research the OpenAI Agents SDK and the Official MCP SDK for Python. I need accurate, current information for architectural planning. Answer these specific questions:

1. **OpenAI Agents SDK (openai-agents or agents-sdk)**:
   - What is the correct pip package name?
   - How do you create an Agent with tools? Show the basic pattern.
   - How does the Agent connect to MCP servers? Does it have built-in MCP support?
   - How do you run an agent with conversation history (list of messages)?
   - Does it support streaming responses?
   - What is the Runner.run() / Runner.run_streamed() API?

2. **MCP SDK for Python (mcp)**:
   - What is the correct pip package name?
   - How do you create an MCP server with tools? Show the basic pattern.
   - How do you define tool schemas (input/output)?
   - What transport options exist (stdio, SSE, streamable-http)?
   - How does an MCP server connect to a database (async)?
   - Can the MCP server run in-process or does it need to be a separate process?

3. **Integration pattern**: How does OpenAI Agents SDK connect to an MCP server? Is there a built-in MCPServerStdio or MCPServerSse class? How do you pass MCP tools to an Agent?

4. **FastAPI integration**: How would you integrate the OpenAI Agents SDK agent runner into a FastAPI endpoint? Can you stream responses via SSE from FastAPI?

Please search the web for the latest documentation (2025-2026) and provide concrete code patterns, not hypothetical ones.

## Response snapshot

Comprehensive research completed covering: OpenAI Agents SDK (pip: openai-agents v0.8.0), MCP Python SDK (pip: mcp v1.26.0), built-in MCP integration via MCPServerStdio/MCPServerSse/MCPServerStreamableHttp, Runner.run()/run_streamed() API with conversation history via to_input_list() or SQLiteSession, FastAPI SSE streaming pattern with async generators and StreamingResponse. All code patterns sourced from official documentation and verified repositories.

## Outcome

- Impact: Provides verified architectural foundation for AI chatbot feature planning
- Tests: N/A - research only
- Files: PHR created
- Next prompts: Architecture plan for AI chatbot, ADR for SDK choices
- Reflection: Both SDKs are mature and well-integrated; OpenAI Agents SDK has first-class MCP support built in

## Evaluation notes (flywheel)

- Failure modes observed: None - documentation is comprehensive and current
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Use research to draft architecture plan
