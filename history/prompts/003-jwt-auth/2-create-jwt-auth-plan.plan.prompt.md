---
id: 2
title: Create JWT Auth Implementation Plan
stage: plan
date: 2026-01-11
surface: agent
model: claude-opus-4-5-20251101
feature: 003-jwt-auth
branch: 003-jwt-auth
user: USER
command: /sp.plan
labels: ["authentication", "jwt", "architecture", "better-auth", "fastapi"]
links:
  spec: specs/003-jwt-auth/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-jwt-auth/plan.md
  - specs/003-jwt-auth/research.md
  - specs/003-jwt-auth/data-model.md
  - specs/003-jwt-auth/quickstart.md
  - specs/003-jwt-auth/contracts/auth-api.yaml
  - specs/003-jwt-auth/contracts/tasks-api.yaml
tests:
  - null
---

## Prompt

Authentication & Secure API Access (JWT)

Create:
- Architecture sketch: Next.js frontend using Better Auth to issue JWTs, FastAPI backend verifying JWTs with shared secret, stateless request-based authorization
- Section structure: Auth configuration → Token flow → Backend verification → Access enforcement → Validation
- Research approach: Research-concurrent exploration of JWT-based stateless auth while defining frontend–backend boundaries
- Quality validation: Only authenticated requests succeed; cross-user access is rejected

Decisions needing documentation:
- JWT-based auth vs session-based auth (statelessness vs simplicity)
- Frontend-only auth provider vs shared auth service (decoupling vs centralization)
- Path-based user scoping combined with JWT claims (clarity vs redundancy)
- Shared-secret verification vs remote auth calls (performance vs coupling)

Testing strategy:
- Verify JWT required on all protected routes
- Validate 401 responses for missing or invalid tokens
- Confirm user ID mismatch between JWT and URL is rejected
- Ensure users can only access their own tasks

Technical details:
- Use research-concurrent approach
- Follow Constitution standards
- Phases: Research → Foundation → Analysis → Synthesis

## Response snapshot

Created comprehensive implementation plan for JWT-based authentication:

**Phase 0 - Research** (research.md):
- Resolved Better Auth JWT configuration (RS256 per constitution, not default EdDSA)
- Determined JWKS-based verification approach for stateless backend validation
- Mapped JWT `sub` claim to user ID for authorization
- Identified database requirements (Better Auth auto-creates users, sessions, accounts, jwks tables)
- Set 24-hour token expiration per spec (no refresh tokens)

**Phase 1 - Design**:
- data-model.md: User, Session, Account, JWKS entities (Better Auth managed) + Task (existing)
- contracts/auth-api.yaml: OpenAPI spec for Better Auth endpoints (sign-up, sign-in, session, token, JWKS)
- contracts/tasks-api.yaml: OpenAPI spec for protected task endpoints with JWT security
- quickstart.md: Setup guide with environment variables and verification steps

**Key Architectural Decisions**:
1. RS256 algorithm (constitution compliance)
2. JWKS-based stateless verification (no shared secret)
3. User ID path + JWT matching (double validation)
4. 24-hour expiration without refresh (per spec scope)

**Implementation Order**:
- Phase 1: Backend Foundation (JWKS service → JWT middleware → Route updates)
- Phase 2: Frontend Foundation (Better Auth config → API routes → Client setup)
- Phase 3: UI Components (Sign-up → Sign-in → Protected routes)
- Phase 4: Integration (API client → E2E testing → Error handling)

All constitution principles verified and passed.

## Outcome

- ✅ Impact: Complete architecture for JWT authentication enabling secure multi-user task management
- 🧪 Tests: Testing strategy defined (unit + integration + security tests)
- 📁 Files: 6 files created (plan.md, research.md, data-model.md, quickstart.md, 2 OpenAPI contracts)
- 🔁 Next prompts: /sp.tasks to generate implementation tasks
- 🧠 Reflection: Research resolved key unknowns; RS256 vs EdDSA decision required constitution alignment

## Evaluation notes (flywheel)

- Failure modes observed: None - research resolved all ambiguities before design
- Graders run and results (PASS/FAIL): Constitution check PASSED (all 6 principles)
- Prompt variant (if applicable): Standard /sp.plan with research-concurrent approach
- Next experiment (smallest change to try): N/A - proceeding to task generation
