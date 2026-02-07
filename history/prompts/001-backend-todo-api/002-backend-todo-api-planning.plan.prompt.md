---
id: 002
title: Backend Todo API Planning
stage: plan
date: 2026-01-09
surface: agent
model: claude-sonnet-4-5
feature: 001-backend-todo-api
branch: 001-backend-todo-api
user: USER
command: /sp.plan
labels: ["backend", "api", "rest", "architecture", "planning", "fastapi", "sqlmodel", "neon"]
links:
  spec: specs/001-backend-todo-api/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-backend-todo-api/plan.md
 - specs/001-backend-todo-api/research.md
 - specs/001-backend-todo-api/data-model.md
 - specs/001-backend-todo-api/contracts/openapi.yaml
 - specs/001-backend-todo-api/contracts/README.md
 - specs/001-backend-todo-api/quickstart.md
 - CLAUDE.md (updated with technology stack)
tests:
 - None (planning phase - no tests yet)
---

## Prompt

Architecture sketch:
- FastAPI (Python 3.11+) for REST APIs
- SQLModel for ORM and data models
- Neon Serverless PostgreSQL for database
- Async database connections via asyncpg
- Automatic database schema creation on startup
- User-scoped data isolation via user_id path parameter

Plan structure:
- Phase 0 (Research): Document architectural decisions with rationale and tradeoffs
- Phase 1 (Design): Data model, API contracts (OpenAPI spec), quickstart guide
- Phase 2 (Tasks): Task breakdown (handled by /sp.tasks command, not /sp.plan)

Research approach (research-concurrent):
- Architectural decisions documented before implementation begins
- All decisions aligned with constitutional principles
- Trade-offs analyzed for each technology choice

Decisions needing documentation:
- SQLModel vs other ORMs (simplicity vs flexibility)
- Neon Serverless PostgreSQL vs local DB (scalability vs control)
- Path-based user scoping vs session identity (statelessness vs convenience)
- Separate backend service vs monolith (modularity vs simplicity)

Testing strategy:
- Unit tests: Model validation (pytest)
- Integration tests: API endpoint contracts (pytest + httpx)
- Test organization: tests/unit/ and tests/integration/
- Test database: Separate Neon test database or in-memory SQLite

Technical details requested:
- Database schema with indexes for query optimization
- SQLModel model definitions with validation rules
- API request/response schemas (Pydantic)
- OpenAPI 3.1.0 specification with all 6 endpoints
- Environment configuration (.env with DATABASE_URL)
- Quick start guide for local setup and testing

## Response snapshot

Created comprehensive implementation plan for Backend Todo API with complete architectural documentation:

**Phase 0: Research & Discovery (research.md)**
- Documented 4 major architectural decisions with options, trade-offs, and rationale:
  1. **SQLModel vs Other ORMs**: Selected SQLModel for type safety, FastAPI integration, and simplicity (constitutional requirement)
  2. **Neon Serverless PostgreSQL vs Local Database**: Selected Neon for zero setup, scalability, production parity, and database branching
  3. **Path-based User Scoping vs Session Identity**: Selected path parameter for statelessness, REST semantics, and auth readiness (JWT in Phase 3)
  4. **Separate Backend Service vs Monolith**: Selected separate FastAPI backend for clear separation, technology independence, and independent scaling
- Technology validation: FastAPI, SQLModel, Neon PostgreSQL, Python 3.11+
- Testing strategy: Unit tests (model validation), Integration tests (API contracts)
- Security considerations: Data isolation via SQL WHERE clauses, auth-ready design for Phase 3 JWT
- Risk analysis: Connection latency, SQLModel maturity, user ID spoofing (expected in Phase 1)

**Phase 1: Data Model & Database Schema (data-model.md)**
- Database schema: `tasks` table with 7 columns (id, user_id, title, description, completed, created_at, updated_at)
- Indexes: Primary key (id), user scoping index (user_id), composite index (user_id, created_at DESC)
- SQLModel Task model: Dual-purpose (ORM + Pydantic schema), type-safe, auto-timestamps
- API schemas: TaskCreate (POST), TaskUpdate (PUT), TaskPartialUpdate (PATCH), TaskResponse (all responses)
- Validation rules: Non-empty title (1-500 chars), optional description (max 5000 chars), boolean completed
- Data flow: Create, Read, Update, Delete with user_id filtering
- Error responses: 400 (validation), 404 (not found), 500 (server error)
- Data isolation: All queries scoped to user_id, SQL injection prevention via parameterized queries

**Phase 1: API Contracts (contracts/openapi.yaml + contracts/README.md)**
- Complete OpenAPI 3.1.0 specification with:
  - 6 REST endpoints (GET list, POST, GET single, PUT, PATCH, DELETE)
  - Request/response schemas with validation rules
  - Error responses (400, 404, 500) with examples
  - Multiple examples per endpoint (minimal, with description, edge cases)
  - Detailed parameter descriptions (user_id, task_id)
  - Tags for logical grouping
- Contracts README with:
  - API endpoint summary table
  - Request/response format examples
  - Status codes reference
  - Validation rules documentation
  - Data isolation & security notes (Phase 1 vs Phase 3)
  - Contract compliance testing requirements
  - Usage examples (curl, httpx, Swagger UI)

**Phase 1: Quick Start Guide (quickstart.md)**
- Prerequisites: Python 3.11+, Git, Neon account, code editor
- 6-step setup (5 minutes): Clone, venv, install deps, Neon config, init DB, verify
- Quick test (2 minutes): Swagger UI walkthrough, curl examples, Python httpx examples
- Running tests: pytest commands (all, verbose, integration, unit, coverage)
- Common commands: Dev server, database management, code quality
- API endpoints reference table
- Project structure overview
- Troubleshooting section (5 common issues with solutions)
- Success criteria checklist (9 items)

**Plan.md Sections Completed**:
- Summary: Project overview
- Technical Context: Python 3.11+, FastAPI, SQLModel, Neon PostgreSQL, pytest
- Constitution Check: ALL 6 PRINCIPLES PASS
- Project Structure: Backend-only architecture (backend/src/, backend/tests/)
- Complexity Tracking: N/A (no violations)

**Agent Context Updated**:
- CLAUDE.md updated with technology stack:
  - Language: Python 3.11+
  - Framework: FastAPI (web framework), SQLModel (ORM), Pydantic (validation), python-dotenv (environment config)
  - Database: Neon Serverless PostgreSQL

## Outcome

- ✅ Impact: Complete architectural plan created with research, data model, API contracts, and quickstart guide - ready for task breakdown
- 🧪 Tests: N/A (planning phase - implementation and tests will be created in subsequent phases)
- 📁 Files: Created 6 planning artifacts (plan.md, research.md, data-model.md, openapi.yaml, contracts README, quickstart.md) + updated CLAUDE.md
- 🔁 Next prompts: /sp.tasks (generate actionable, dependency-ordered implementation tasks from this plan)
- 🧠 Reflection: Planning successfully completed all phases (Phase 0 research + Phase 1 design). All 4 architectural decisions documented with rationale and trade-offs. Database schema optimized with indexes for user-scoped queries. OpenAPI specification provides complete API contracts for implementation. Quick start guide enables rapid local setup and verification. No ambiguities remain; ready for task generation.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS - All planning artifacts complete, constitutional compliance verified, architectural decisions justified, API contracts fully specified
- Prompt variant (if applicable): Standard /sp.plan workflow with research-concurrent approach
- Next experiment (smallest change to try): Proceed to /sp.tasks to generate implementation task breakdown from plan artifacts
