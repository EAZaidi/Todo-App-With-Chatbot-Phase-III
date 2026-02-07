# Phase 0: Research & Discovery

**Feature**: Backend Todo API & Persistence
**Branch**: `001-backend-todo-api`
**Date**: 2026-01-09
**Status**: Complete

## Research Approach

Research-concurrent workflow: Architectural decisions documented before implementation begins. All decisions align with constitutional principles and spec requirements.

## Key Architectural Decisions

### Decision 1: SQLModel vs Other ORMs

**Options Considered**:
1. **SQLModel** (Selected)
2. SQLAlchemy Core + Pydantic
3. Tortoise ORM
4. Django ORM

**Analysis**:

| Criteria | SQLModel | SQLAlchemy+Pydantic | Tortoise | Django ORM |
|----------|----------|---------------------|----------|------------|
| Type Safety | ✅ Native | ⚠️ Manual sync | ⚠️ Limited | ❌ Runtime only |
| FastAPI Integration | ✅ Built-in | ⚠️ Manual | ⚠️ Manual | ❌ Incompatible |
| Learning Curve | ✅ Simple | ⚠️ Complex | ✅ Simple | ⚠️ Django-specific |
| Validation | ✅ Pydantic | ⚠️ Manual | ⚠️ Manual | ⚠️ Django forms |
| SQLAlchemy Under Hood | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Async Support | ✅ Native | ✅ Yes | ✅ Yes | ⚠️ Limited |

**Trade-offs**:
- **SQLModel**: Simplicity and type safety, but less mature ecosystem
- **SQLAlchemy+Pydantic**: Maximum flexibility, but duplicate model definitions
- **Tortoise**: Async-first, but smaller community and different paradigm
- **Django ORM**: Rich features, but tight Django coupling

**Decision**: **SQLModel**

**Rationale**:
1. **Constitutional Compliance**: Mandated by Principle VI (Technology Stack Fixation)
2. **Type Safety**: Single source of truth for models with full type checking
3. **FastAPI Integration**: Seamless Pydantic validation and serialization
4. **Simplicity**: No model duplication; one class serves as both DB model and API schema
5. **SQLAlchemy Foundation**: Mature SQL toolkit underneath for complex queries if needed
6. **Async Support**: Native async/await for Neon PostgreSQL connections

**Acceptance Criteria**:
- Task model defined once using SQLModel.Field()
- Pydantic validation works automatically for API requests/responses
- SQLAlchemy async engine connects to Neon PostgreSQL
- Type hints provide IDE autocomplete and mypy validation

---

### Decision 2: Neon Serverless PostgreSQL vs Local Database

**Options Considered**:
1. **Neon Serverless PostgreSQL** (Selected)
2. Local PostgreSQL
3. SQLite
4. MySQL/MariaDB

**Analysis**:

| Criteria | Neon Serverless | Local PostgreSQL | SQLite | MySQL |
|----------|-----------------|------------------|--------|-------|
| Setup Complexity | ✅ Zero install | ⚠️ Manual install | ✅ Zero config | ⚠️ Manual install |
| Scalability | ✅ Auto-scale | ⚠️ Manual tuning | ❌ Single file | ⚠️ Manual tuning |
| Production Ready | ✅ Cloud-native | ✅ Yes | ❌ Not for web | ✅ Yes |
| Cost (Dev) | ✅ Free tier | ✅ Free | ✅ Free | ✅ Free |
| Branching Support | ✅ DB branching | ❌ No | ❌ No | ❌ No |
| Serverless | ✅ Yes | ❌ No | ⚠️ Embedded | ❌ No |

**Trade-offs**:
- **Neon**: Instant setup and auto-scaling, but network latency and vendor lock-in
- **Local PostgreSQL**: Full control and no network dependency, but manual setup and no cloud benefits
- **SQLite**: Zero configuration, but not suitable for production web apps
- **MySQL**: Mature and widely supported, but different SQL dialect and no serverless option

**Decision**: **Neon Serverless PostgreSQL**

**Rationale**:
1. **Constitutional Compliance**: Mandated by Principle VI (Technology Stack Fixation)
2. **Zero Setup Friction**: No local installation; connection string only
3. **Production Parity**: Dev and prod use identical cloud PostgreSQL
4. **Scalability**: Auto-scales with usage; no manual capacity planning
5. **Database Branching**: Create isolated DB branches for features/testing
6. **Hackathon Context**: Reviewers can validate without local database setup

**Acceptance Criteria**:
- Application connects to Neon via DATABASE_URL environment variable
- All CRUD operations work without local PostgreSQL installation
- Database schema persists across application restarts
- Connection pooling and async queries function correctly

---

### Decision 3: Path-based User Scoping vs Session Identity

**Options Considered**:
1. **Path-based user_id parameter** (Selected for Phase 1)
2. Session-based authentication with cookies
3. JWT token extraction from Authorization header
4. API key per user

**Analysis**:

| Criteria | Path Parameter | Session Cookies | JWT Header | API Keys |
|----------|----------------|-----------------|------------|----------|
| Statelessness | ✅ Fully stateless | ❌ Server state | ✅ Stateless | ✅ Stateless |
| Auth Ready | ✅ Yes | ⚠️ Rework needed | ✅ Drop-in | ⚠️ Partial |
| Multi-user | ✅ Explicit | ✅ Yes | ✅ Yes | ✅ Yes |
| REST Semantics | ✅ Resource path | ⚠️ Hidden state | ⚠️ Out-of-band | ⚠️ Out-of-band |
| Testing | ✅ Simple URLs | ⚠️ Cookie mgmt | ⚠️ Token mgmt | ✅ Simple headers |
| Client Simplicity | ✅ Just URL | ⚠️ Cookie handling | ⚠️ Token handling | ✅ Just header |

**Trade-offs**:
- **Path Parameter**: Explicit and testable, but user_id visible in URL (not a security issue since auth not enforced yet)
- **Session Cookies**: Traditional web auth, but requires server-side session storage (stateful)
- **JWT Header**: Industry standard, but requires JWT generation/verification infrastructure
- **API Keys**: Simple, but less granular and no standard expiration

**Decision**: **Path-based user_id parameter** (Phase 1 only; JWT in Phase 3)

**Rationale**:
1. **Constitutional Compliance**: Spec explicitly states "User identification handled via user_id path parameter only"
2. **Stateless Design**: No server-side session state; backend remains horizontally scalable
3. **Auth Readiness**: Easy to add JWT middleware later; `/api/users/{user_id}/tasks` structure remains unchanged
4. **REST Semantics**: User ID is part of the resource path; aligns with RESTful design
5. **Testing Simplicity**: No cookie/token management needed for initial CRUD tests
6. **Phased Implementation**: Backend logic built correctly; authentication layer added separately

**Implementation Notes**:
- Path parameter: `/api/users/{user_id}/tasks`
- All database queries filtered by `user_id` from path
- Future JWT integration: Extract `user_id` from JWT claims, validate against path parameter
- Current phase: Trust client-provided user_id (no verification)

**Acceptance Criteria**:
- API endpoints accept user_id as path parameter
- All task queries filtered by user_id automatically
- User A cannot access User B's tasks (enforced by query filter)
- JWT integration requires minimal backend changes (middleware addition only)

---

### Decision 4: Separate Backend Service vs Monolith

**Options Considered**:
1. **Separate Backend Service** (Selected)
2. Next.js API Routes (monolith)
3. Next.js Server Actions
4. Fullstack Python framework (Django/Flask)

**Analysis**:

| Criteria | Separate Backend | Next.js API Routes | Server Actions | Django/Flask |
|----------|------------------|-------------------|----------------|--------------|
| Separation | ✅ Clear | ⚠️ Coupled | ⚠️ Coupled | ✅ Clear |
| Technology | ✅ Python/FastAPI | ⚠️ Node.js/TS | ⚠️ Node.js/TS | ⚠️ Full rewrite |
| Reusability | ✅ Any client | ⚠️ Next.js only | ❌ Next.js only | ✅ Any client |
| Scalability | ✅ Independent | ⚠️ Shared | ⚠️ Shared | ✅ Independent |
| Testing | ✅ Isolated | ⚠️ Next.js needed | ⚠️ Next.js needed | ✅ Isolated |
| Deployment | ⚠️ Two services | ✅ Single deploy | ✅ Single deploy | ⚠️ Two services |

**Trade-offs**:
- **Separate Backend**: Clear separation and technology flexibility, but two deployment targets
- **Next.js API Routes**: Single deployment, but couples frontend and backend lifecycles
- **Server Actions**: Tightest integration, but Next.js-specific and not RESTful
- **Django/Flask**: Separate service, but different framework and not FastAPI

**Decision**: **Separate Backend Service (FastAPI)**

**Rationale**:
1. **Constitutional Compliance**: Principle IV (Clear Separation of Concerns) and Principle VI (FastAPI mandated)
2. **Technology Independence**: Python backend, TypeScript frontend; no forced coupling
3. **RESTful APIs**: Standard HTTP/JSON contracts; any client can consume (mobile, CLI, other frontends)
4. **Independent Scaling**: Backend and frontend scale separately based on load patterns
5. **Testing Isolation**: Backend tested independently without Next.js runtime
6. **Team Separation**: Backend and frontend can be developed in parallel (future teams)
7. **Hackathon Demonstration**: Clear architectural boundaries for evaluators

**Implementation Notes**:
- Backend: Standalone FastAPI application (`backend/src/main.py`)
- Frontend: Next.js 16+ application (Phase 2 - future)
- Communication: REST APIs only (`/api/users/{user_id}/tasks`)
- CORS: Configured in FastAPI for Next.js origin
- Deployment: Backend (Docker/Cloud Run), Frontend (Vercel/Cloud Run)

**Acceptance Criteria**:
- Backend runs independently on localhost:8000
- Frontend (future) consumes backend via HTTP requests
- Backend can be tested without starting frontend
- API documentation (Swagger) accessible at `/docs`
- No shared code between backend and frontend (except API contracts in docs)

---

## Technology Validation

### FastAPI Framework
- **Version**: Latest stable (>= 0.100.0)
- **Rationale**: High-performance async framework with automatic OpenAPI docs
- **Validation**: FastAPI is industry-standard for Python REST APIs; Pydantic integration built-in

### SQLModel ORM
- **Version**: Latest stable (>= 0.0.14)
- **Rationale**: Type-safe ORM combining SQLAlchemy and Pydantic
- **Validation**: Official FastAPI documentation recommends SQLModel for typed models

### Neon Serverless PostgreSQL
- **Connection**: PostgreSQL-compatible connection string
- **Driver**: asyncpg (async PostgreSQL driver)
- **Validation**: Neon is production-grade PostgreSQL; no SQL compatibility issues

### Python Version
- **Version**: 3.11+ (3.11 or 3.12 recommended)
- **Rationale**: Type hints improvements, performance gains, async enhancements
- **Validation**: FastAPI and SQLModel fully support Python 3.11+

---

## Testing Strategy

### Unit Tests
- **Framework**: pytest
- **Scope**: SQLModel model validation (Task model)
- **Coverage**: Model field validation, timestamp auto-generation, defaults

### Integration Tests
- **Framework**: pytest + httpx (TestClient)
- **Scope**: End-to-end API contract testing
- **Coverage**: All 6 REST endpoints (POST, GET list, GET single, PUT, PATCH, DELETE)
- **Test Database**: In-memory SQLite or separate Neon test database

### Test Organization
```
backend/tests/
├── unit/
│   └── test_task_model.py      # Model validation tests
└── integration/
    └── test_task_api.py         # API endpoint tests
```

### Acceptance Test Cases (per spec success criteria)
- SC-001: HTTP status codes (200, 201, 204, 400, 404, 500)
- SC-002: Data persistence across restarts
- SC-003: User isolation (user A cannot access user B's tasks)
- SC-004: Response time <500ms for task creation
- SC-005: Consistent JSON format across endpoints
- SC-006: Database schema correctness
- SC-007: Clear error messages
- SC-008: Setup documentation accuracy
- SC-009: Swagger docs accuracy
- SC-010: 100 sequential operations without degradation

---

## Security Considerations (Phase 1)

### Current Phase (No Authentication)
- User ID accepted from path parameter without verification
- Data isolation enforced via SQL WHERE clauses (user_id filter)
- No cross-user data leakage (enforced at application layer)

### Future Phase (JWT Authentication - Phase 3)
- JWT middleware validates token on every request
- Extract user_id from JWT claims
- Compare JWT user_id with path parameter user_id
- Reject requests where JWT user_id ≠ path user_id (403 Forbidden)

### Security by Design (Current Implementation)
- All queries scoped to user_id (SQL injection prevention via parameterized queries)
- Input validation via Pydantic models
- No SQL raw queries; SQLModel query builder only
- Environment-based secrets (DATABASE_URL in .env, never hardcoded)

---

## Risk Analysis

### Risk 1: Neon Connection Latency
- **Likelihood**: Medium (network-dependent)
- **Impact**: Medium (affects response time SC-004)
- **Mitigation**: Connection pooling, async queries, timeout configuration
- **Acceptance**: <500ms response time target includes network latency

### Risk 2: SQLModel Maturity
- **Likelihood**: Low (actively maintained by FastAPI creator)
- **Impact**: Medium (could require ORM changes)
- **Mitigation**: SQLModel wraps mature SQLAlchemy; fallback to SQLAlchemy Core if needed
- **Acceptance**: Constitutional requirement; no alternative without constitution amendment

### Risk 3: User ID Spoofing (Phase 1 only)
- **Likelihood**: High (no auth in Phase 1)
- **Impact**: Low (expected; auth deferred to Phase 3)
- **Mitigation**: Document clearly in README; enforce in Phase 3
- **Acceptance**: Spec explicitly states "auth-ready but not enforce authentication yet"

---

## Dependencies

### Python Packages
```
fastapi>=0.100.0       # Web framework
sqlmodel>=0.0.14       # ORM
pydantic>=2.0.0        # Validation (SQLModel dependency)
python-dotenv>=1.0.0   # Environment config
asyncpg>=0.29.0        # PostgreSQL async driver
uvicorn[standard]>=0.24.0  # ASGI server
pytest>=7.4.0          # Testing
httpx>=0.25.0          # API testing client
```

### External Services
- **Neon Serverless PostgreSQL**: Database hosting (connection string required)

### Environment Variables
```
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
```

---

## Phase 0 Completion Checklist

- [x] SQLModel vs other ORMs decision documented with rationale
- [x] Neon Serverless PostgreSQL vs local DB decision documented
- [x] Path-based user scoping vs session identity decision documented
- [x] Separate backend service vs monolith decision documented
- [x] Technology stack validated (FastAPI, SQLModel, Neon, Python 3.11+)
- [x] Testing strategy defined (unit + integration)
- [x] Security considerations for current and future phases documented
- [x] Risk analysis completed with mitigation strategies
- [x] Dependencies listed (Python packages, external services, env vars)

**Status**: ✅ Phase 0 Complete - Ready for Phase 1 (Data Model & API Contracts)
