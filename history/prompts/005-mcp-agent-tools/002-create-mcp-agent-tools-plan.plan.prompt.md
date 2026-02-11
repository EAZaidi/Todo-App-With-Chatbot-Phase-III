---
id: 002
title: Create MCP Agent Tools Plan
stage: plan
date: 2026-02-11
surface: agent
model: claude-opus-4-6
feature: 005-mcp-agent-tools
branch: 005-mcp-agent-tools
user: USER
command: /sp.plan
labels: ["mcp", "agent-behavior", "architecture", "phase-iii"]
links:
  spec: specs/005-mcp-agent-tools/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-mcp-agent-tools/plan.md
tests:
  - null
---

## Prompt

/sp.plan

Create:
- Architecture sketch (Agent ↔ MCP Server ↔ Database)
- Section structure (MCP tools, Agent rules, Error handling)
- Quality validation (tool correctness, statelessness)

Decisions needing documentation:
- Tool-based DB access vs direct ORM usage
- Stateless MCP tools with DB persistence
- Single-agent vs multi-agent tradeoff
- Error handling strategy within agent responses

Testing strategy:
- Natural language mapped to correct MCP tool
- Multi-step tool invocation correctness
- Task ownership enforcement
- Invalid task and auth error handling

Technical details:
- Follow Spec-Driven Development workflow
- Persist all task state in Neon PostgreSQL
- Organize by phases: Foundation → Tool Layer → Agent Logic → Validation

## Response snapshot

Created comprehensive implementation plan covering:
- Architecture diagram showing 3-tier system: Chat API → Agent (with system prompt) → MCP Tool Server → Neon PostgreSQL
- 5 key design decisions documented with alternatives and trade-offs: (1) Tool-based DB access over direct ORM, (2) Stateless tools with DB persistence, (3) Single agent over multi-agent, (4) Two-layer error handling (tool + agent), (5) User ID injection via system prompt
- Agent system prompt design with 4 sections: scope constraint, user context injection, behavior rules, data fabrication prevention
- 4 implementation phases: Foundation → Tool Layer → Agent Logic → Validation
- Detailed testing strategy: 18 tool-level tests, 17 agent behavior tests, 4 user isolation tests, 3 logging tests
- Error handling matrix mapping 10 error sources to layer, handling, and user-facing message
- Constitution check passing all 8 principles

## Outcome

- Impact: Complete architectural plan for MCP tools and agent behavior — ready for task breakdown
- Tests: Testing strategy defined with 42 test cases across 4 categories
- Files: 1 file created (plan.md)
- Next prompts: `/sp.tasks` to generate implementation tasks, or `/sp.adr` for architectural decisions
- Reflection: Plan builds directly on existing 004 implementation — this spec formalizes and validates what's built rather than designing from scratch

## Evaluation notes (flywheel)

- Failure modes observed: None — plan generation was straightforward given existing codebase context
- Graders run and results (PASS/FAIL): Constitution check PASS (8/8 principles)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
