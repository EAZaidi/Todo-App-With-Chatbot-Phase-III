# Implementation Plan: Authentication & Secure API Access (JWT)

**Branch**: `003-jwt-auth` | **Date**: 2026-01-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-jwt-auth/spec.md`

## Summary

Implement JWT-based authentication using Better Auth on the Next.js frontend with RS256 signing, enabling stateless token verification on the FastAPI backend via JWKS. All task API endpoints will require valid JWT authentication with user ID matching between the JWT `sub` claim and the API path parameter.

## Technical Context

**Language/Version**: TypeScript 5.7+ (frontend), Python 3.11+ (backend)
**Primary Dependencies**: Better Auth + JWT plugin (frontend), PyJWT[crypto] + httpx (backend)
**Storage**: Neon Serverless PostgreSQL (shared between Better Auth and FastAPI)
**Testing**: Jest (frontend), pytest (backend)
**Target Platform**: Web application (Next.js 16+ frontend, FastAPI backend)
**Project Type**: Web (frontend + backend)
**Performance Goals**: JWT verification < 50ms latency, 100 concurrent users
**Constraints**: Stateless auth only, no sessions/cookies, RS256 algorithm per constitution
**Scale/Scope**: Single-tenant per user, task isolation enforced

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Spec-First Development | PASS | Spec completed and approved before planning |
| II. Agentic Dev Stack Compliance | PASS | Following spec → plan → tasks workflow |
| III. Security by Design | PASS | JWT auth, 401/403 enforcement, user isolation designed |
| IV. Clear Separation of Concerns | PASS | Frontend auth (Better Auth), Backend verification (PyJWT) |
| V. Reproducibility and Traceability | PASS | Research documented, contracts defined, PHRs created |
| VI. Technology Stack Fixation | PASS | Using mandated stack (Next.js, FastAPI, Better Auth, Neon) |

### Constitution Compliance Details

- **JWT Algorithm**: RS256 per constitution requirement (not EdDSA default)
- **Authentication**: Better Auth with JWT plugin (constitution: "Better Auth with JWT")
- **Backend Verification**: Independent JWT verification via JWKS (constitution: "Backend MUST independently verify JWTs")
- **User Isolation**: Path parameter matching with JWT `sub` claim (constitution: "User ID in JWT MUST match user ID in API request path")

## Project Structure

### Documentation (this feature)

```text
specs/003-jwt-auth/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── data-model.md        # Entity definitions
├── quickstart.md        # Setup guide
├── contracts/
│   ├── auth-api.yaml    # Better Auth endpoints
│   └── tasks-api.yaml   # Protected task endpoints
└── tasks.md             # Phase 2 output (via /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── dependencies.py     # Add JWT verification dependency
│   │   ├── middleware/
│   │   │   └── auth.py         # NEW: JWT verification middleware
│   │   └── routes/
│   │       └── tasks.py        # MODIFY: Add auth dependency
│   ├── models/
│   │   └── task.py             # EXISTS: No changes needed
│   ├── services/
│   │   └── jwks.py             # NEW: JWKS fetching and caching
│   └── config.py               # MODIFY: Add JWKS_URL setting
└── tests/
    ├── unit/
    │   └── test_auth.py        # NEW: JWT verification tests
    └── integration/
        └── test_task_api.py    # MODIFY: Add auth test cases

frontend/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts    # NEW: Better Auth API routes
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── page.tsx        # NEW: Sign-in page
│   │   └── sign-up/
│   │       └── page.tsx        # NEW: Sign-up page
│   └── layout.tsx              # MODIFY: Add auth provider
├── lib/
│   ├── auth.ts                 # NEW: Better Auth server config
│   └── auth-client.ts          # NEW: Better Auth client config
└── components/
    └── auth/
        ├── SignInForm.tsx      # NEW: Sign-in form component
        ├── SignUpForm.tsx      # NEW: Sign-up form component
        └── AuthProvider.tsx    # NEW: Auth context provider
```

**Structure Decision**: Web application structure with separate frontend (Next.js) and backend (FastAPI) directories. This matches the existing project layout and constitution requirements for clear separation of concerns.

## Architecture Design

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐                    ┌──────────────┐                ┌──────────┐
  │ Browser  │                    │  Next.js +   │                │ FastAPI  │
  │          │                    │ Better Auth  │                │ Backend  │
  └────┬─────┘                    └──────┬───────┘                └────┬─────┘
       │                                 │                              │
       │  1. POST /api/auth/sign-in     │                              │
       │────────────────────────────────▶│                              │
       │                                 │                              │
       │                                 │  2. Validate credentials     │
       │                                 │     (check accounts table)   │
       │                                 │                              │
       │  3. Response + JWT in header   │                              │
       │◀────────────────────────────────│                              │
       │     (set-auth-jwt header)       │                              │
       │                                 │                              │
       │  4. GET /api/users/{id}/tasks  │                              │
       │     Authorization: Bearer JWT   │                              │
       │─────────────────────────────────┼─────────────────────────────▶│
       │                                 │                              │
       │                                 │  5. GET /api/auth/jwks      │
       │                                 │◀─────────────────────────────│
       │                                 │     (cached after first)     │
       │                                 │                              │
       │                                 │  6. Return JWKS             │
       │                                 │─────────────────────────────▶│
       │                                 │                              │
       │                                 │  7. Verify JWT signature     │
       │                                 │     Check sub == user_id     │
       │                                 │                              │
       │  8. Tasks response             │                              │
       │◀────────────────────────────────┼──────────────────────────────│
       │                                 │                              │
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| Better Auth (Frontend) | User registration, sign-in, JWT issuance, JWKS endpoint |
| JWT Plugin | RS256 key generation, token signing, key rotation |
| Auth Client | Token retrieval, session management on client |
| FastAPI Middleware | JWT extraction from header, signature verification |
| JWKS Service | Fetch and cache public keys from Better Auth |
| Auth Dependency | Inject verified user ID into route handlers |

### Security Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                         TRUST BOUNDARY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND (Next.js)              │  BACKEND (FastAPI)           │
│  ─────────────────               │  ─────────────────           │
│  • User input validation         │  • JWT signature verify      │
│  • Better Auth manages users     │  • User ID path matching     │
│  • JWT storage in memory         │  • Task ownership enforce    │
│  • HTTPS only                    │  • Rate limiting (future)    │
│                                  │  • Input sanitization        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Decisions

### D1: RS256 Algorithm (Constitution Mandated)

**Decision**: Use RS256 instead of Better Auth's default EdDSA

**Rationale**: Constitution v1.0.0 specifies "JWT tokens signed with RS256 algorithm"

**Configuration**:
```typescript
jwt({
  jwks: {
    keyPairConfig: {
      alg: "RS256"
    }
  },
  jwt: {
    expiresIn: 60 * 60 * 24 // 24 hours
  }
})
```

### D2: JWKS-Based Verification (Stateless)

**Decision**: Backend fetches JWKS once and caches, verifies tokens locally

**Rationale**:
- No shared secret to manage or leak
- Backend can verify without calling frontend on every request
- Standard JWT verification approach for distributed systems

**Trade-off**: Initial JWKS fetch adds ~100ms on first request, but cached thereafter

### D3: User ID in Path + JWT Matching

**Decision**: Require JWT `sub` claim to match `user_id` path parameter

**Rationale**:
- Double validation prevents URL manipulation attacks
- Clear authorization model (explicit in URL)
- Matches existing API structure

**Alternative Rejected**: Extract user_id only from JWT - would require API restructuring

### D4: 24-Hour Token Expiration (No Refresh)

**Decision**: JWT expires after 24 hours, user must re-authenticate

**Rationale**:
- Token refresh explicitly out of scope per spec
- 24 hours balances security with user experience
- Simpler implementation without refresh token flow

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION ORDER                          │
└─────────────────────────────────────────────────────────────────┘

Phase 1: Backend Foundation
─────────────────────────────
[1.1] JWKS Service        →  [1.2] JWT Middleware    →  [1.3] Update Routes
      (fetch/cache keys)        (verify tokens)            (add auth dep)

Phase 2: Frontend Foundation
─────────────────────────────
[2.1] Better Auth Config  →  [2.2] Auth API Routes   →  [2.3] Auth Client
      (server setup)            (sign-up/in)              (token access)

Phase 3: UI Components
─────────────────────────────
[3.1] Sign-Up Page        →  [3.2] Sign-In Page      →  [3.3] Protected Routes
                                                           (token injection)

Phase 4: Integration
─────────────────────────────
[4.1] API Client Update   →  [4.2] E2E Auth Flow     →  [4.3] Error Handling
      (add JWT header)          (test full flow)          (401/403 UI)
```

## Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| JWKS endpoint unavailable | Low | High | Cache JWKS aggressively with 1h TTL, retry with backoff |
| Clock skew causes validation failure | Medium | Medium | Add 30-second leeway in JWT verification |
| Key rotation during active sessions | Low | Medium | Better Auth grace period handles overlap |
| Database schema conflicts | Low | High | Better Auth auto-creates tables, verify before migration |

## Testing Strategy

### Unit Tests (Backend)
- JWT signature verification with valid/invalid tokens
- JWKS parsing and key extraction
- User ID matching logic
- Token expiration handling

### Unit Tests (Frontend)
- Better Auth client configuration
- Token retrieval and storage
- Sign-up/sign-in form validation

### Integration Tests
- Full sign-up → sign-in → API access flow
- 401 response for missing/invalid tokens
- 403 response for cross-user access attempts
- Token expiration behavior

### Security Tests
- Malformed JWT rejection
- Tampered signature rejection
- Expired token rejection
- User ID mismatch rejection

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `backend/src/services/jwks.py` | JWKS fetching and caching service |
| `backend/src/api/middleware/auth.py` | JWT verification middleware |
| `backend/tests/unit/test_auth.py` | Auth unit tests |
| `frontend/lib/auth.ts` | Better Auth server configuration |
| `frontend/lib/auth-client.ts` | Better Auth client configuration |
| `frontend/app/api/auth/[...all]/route.ts` | Better Auth API route handler |
| `frontend/app/(auth)/sign-in/page.tsx` | Sign-in page |
| `frontend/app/(auth)/sign-up/page.tsx` | Sign-up page |
| `frontend/components/auth/SignInForm.tsx` | Sign-in form component |
| `frontend/components/auth/SignUpForm.tsx` | Sign-up form component |
| `frontend/components/auth/AuthProvider.tsx` | Auth context provider |

### Modified Files
| File | Changes |
|------|---------|
| `backend/src/config.py` | Add JWKS_URL setting |
| `backend/src/api/dependencies.py` | Add get_current_user dependency |
| `backend/src/api/routes/tasks.py` | Add auth dependency to all routes |
| `backend/requirements.txt` | Add PyJWT, httpx, cachetools |
| `backend/.env.example` | Add JWKS_URL variable |
| `frontend/package.json` | Add better-auth dependency |
| `frontend/.env.example` | Add BETTER_AUTH_* variables |
| `frontend/app/layout.tsx` | Wrap with AuthProvider |
| `frontend/lib/api.ts` | Add JWT to Authorization header |

## Complexity Tracking

No constitution violations requiring justification. Architecture follows all mandated patterns:
- Clear frontend/backend separation
- Stateless JWT authentication
- RS256 signing algorithm
- Independent backend verification
- Environment-based configuration
