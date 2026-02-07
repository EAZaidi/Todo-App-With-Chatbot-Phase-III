---
id: 002
title: Phase III Constitution Amendment
stage: constitution
date: 2026-02-07
surface: agent
model: claude-opus-4-6
feature: none
branch: main
user: USER
command: /sp.constitution
labels: ["constitution", "phase-iii", "ai-chatbot", "mcp", "openai-agents"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
tests:
 - None
---

## Prompt

Project: Phase III – AI-powered Todo Chatbot using MCP and OpenAI Agents

Core principles:
- Spec-driven development (behavior defined before implementation)
- Stateless server architecture with persistent database state
- Clear separation of concerns (UI, Agent logic, MCP tools, storage)
- Deterministic and auditable AI behavior via explicit tool contracts

Key standards:
- All agent actions must be explainable via MCP tool calls
- MCP tools must be stateless and database-backed
- AI behavior must strictly follow defined tool schemas and rules
- Authentication and user isolation enforced on every operation

Constraints:
- No manual coding; implementation via Claude Code only
- Use OpenAI Agents SDK and Official MCP SDK
- Backend must remain stateless across requests
- All state persisted in Neon PostgreSQL
- JWT-based authentication via Better Auth

Success criteria:
- Users can manage todos via natural language
- AI correctly invokes MCP tools for all task operations
- Conversations resume correctly after server restart
- Unauthorized access is rejected
- All actions are traceable in database records

## Response snapshot

Amended project constitution from v1.0.0 to v2.0.0 (MAJOR bump) for Phase III – AI-Powered Todo Chatbot. Key changes:

**Modified Principles:**
- IV. Clear Separation of Concerns: Expanded from 4-layer (Frontend, Backend, Database, Auth) to 5-layer (UI, Agent Logic, MCP Tools, Storage, Auth) architecture
- VI. Technology Stack Fixation: Added OpenAI Agents SDK and Official MCP SDK

**New Principles:**
- VII. Deterministic and Auditable AI Behavior (NON-NEGOTIABLE): All agent actions must be explainable via MCP tool calls with explicit schemas
- VIII. Stateless Server with Persistent State (NON-NEGOTIABLE): Backend stateless across requests; all state in Neon PostgreSQL

**Other Updates:**
- New AI/Agent Stack subsection in Technology Stack
- MCP and Agent integration patterns in Integration Requirements
- Updated Phase Gates to include MCP tool contracts and conversation persistence
- Updated Success Criteria for AI chatbot scenarios
- Consistency propagation verified across all templates (spec, plan, tasks)

Sync Impact Report embedded as HTML comment at top of constitution file.

## Outcome

- ✅ Impact: Constitution upgraded to v2.0.0 with AI/MCP/Agent governance principles
- 🧪 Tests: N/A (constitution is a policy document)
- 📁 Files: Updated .specify/memory/constitution.md (v1.0.0 → v2.0.0)
- 🔁 Next prompts: /sp.specify to create Phase III feature specification for AI chatbot
- 🧠 Reflection: MAJOR version bump justified because Principle IV was redefined (new architectural layers) and two new non-negotiable principles were added, fundamentally changing project governance scope

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS - All 8 principles are declarative, testable, and use MUST/MUST NOT language; no vague "should" statements; no unresolved placeholders
- Prompt variant (if applicable): Standard constitution amendment workflow
- Next experiment (smallest change to try): Begin Phase III feature specification following updated constitutional principles
