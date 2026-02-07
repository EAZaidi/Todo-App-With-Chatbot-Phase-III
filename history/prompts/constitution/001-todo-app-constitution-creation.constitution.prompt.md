---
id: 001
title: Todo App Constitution Creation
stage: constitution
date: 2026-01-09
surface: agent
model: claude-sonnet-4-5
feature: none
branch: master
user: USER
command: /sp.constitution
labels: ["constitution", "project-setup", "governance"]
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

Project: Todo Full-Stack Web Application (Spec-Driven, Agentic Development)

Core principles:
- Spec-first development (no implementation before approved specs)
- Agentic Dev Stack compliance (spec → plan → tasks → execution)
- Zero manual coding (all code generated via Claude Code)
- Security by design with enforced authentication and authorization
- Clear separation of concerns (frontend, backend, database, auth)
- Reproducibility (reviewers can reproduce results using specs and prompts)

Key standards:
- Every feature must originate from an explicit spec requirement
- Specs must be completed and approved before planning begins
- Plans must be derived strictly from specs
- Tasks must map one-to-one with plan items
- All REST API endpoints must be defined before implementation
- All API behavior must exactly match the written specs
- All data access must be user-scoped and authorization-checked
- Authentication must be stateless using JWT
- Frontend and backend may communicate only via documented REST APIs
- Shared secrets must be environment-based and never hardcoded
- Architectural decisions must be documented with rationale and tradeoffs
- Technology stack must remain fixed: Next.js 16+, FastAPI, SQLModel, Neon PostgreSQL, Better Auth

Constraints:
- No manual code edits are allowed at any stage
- All implementation must be done via Claude Code
- REST API endpoints must follow the defined URL structure and HTTP methods
- After authentication is enabled, all endpoints require a valid JWT
- Requests without valid JWT must return 401 Unauthorized
- User ID in the JWT must match the user ID in the API request path
- Each user can only view or modify their own tasks
- Backend must independently verify JWTs without relying on frontend sessions
- Secrets must be provided via environment variables
- Project must be runnable and deployable using documented setup steps

Success criteria:
- All three specs (Backend, Frontend, Authentication) are fully implemented and integrated
- All five basic Todo features work correctly in a multi-user environment
- Users can sign up, sign in, and manage only their own tasks
- Persistent storage is verified using Neon Serverless PostgreSQL
- Secure JWT-based authentication is enforced across all APIs
- Unauthorized access and cross-user data leakage are impossible
- API responses use correct HTTP status codes
- The full spec → plan → task → execution workflow is auditable
- Hackathon reviewers can trace every feature from spec to implementation

## Response snapshot

Created comprehensive project constitution (v1.0.0) for Todo Full-Stack Web Application with 6 core non-negotiable principles:

1. **Spec-First Development**: All features must originate from approved specs
2. **Agentic Dev Stack Compliance**: Strict spec → plan → tasks → execution workflow
3. **Security by Design**: JWT authentication, authorization, and data isolation enforced
4. **Clear Separation of Concerns**: Frontend, backend, database, auth boundaries maintained
5. **Reproducibility and Traceability**: All decisions documented with PHRs and ADRs
6. **Technology Stack Fixation**: Next.js 16+, FastAPI, SQLModel, Neon PostgreSQL, Better Auth

Constitution includes:
- Core principles with explicit rules and rationale
- Technology stack mandates with integration requirements
- Development workflow with 4 phase gates (Spec, Plan, Task, Implementation)
- Code generation requirements (100% Claude Code, zero manual coding)
- Documentation requirements (PHRs, ADRs, API docs, setup guides)
- Governance procedures (amendment process, compliance review, success criteria)

All templates verified for alignment with constitutional requirements.

## Outcome

- ✅ Impact: Project constitution established as foundational governance document
- 🧪 Tests: N/A (constitution is a policy document)
- 📁 Files: Created .specify/memory/constitution.md (v1.0.0)
- 🔁 Next prompts: /sp.specify (to create feature specifications following constitutional requirements)
- 🧠 Reflection: Constitution provides clear governance framework for spec-driven, agentic development with strong security and traceability requirements

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS - All constitutional principles align with agentic development best practices
- Prompt variant (if applicable): Standard constitution creation workflow
- Next experiment (smallest change to try): Begin feature specification following constitutional spec-first principle
