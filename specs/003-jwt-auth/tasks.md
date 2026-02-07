# Tasks: Authentication & Secure API Access (JWT)

**Input**: Design documents from `/specs/003-jwt-auth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in specification. Integration tests included for security-critical acceptance scenarios.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/app/`, `frontend/lib/`, `frontend/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment

- [X] T001 Install backend dependencies (PyJWT[crypto], httpx, cachetools) in backend/requirements.txt
- [X] T002 [P] Install Better Auth dependency in frontend/package.json
- [X] T003 [P] Add JWKS_URL to backend environment configuration in backend/.env.example
- [X] T004 [P] Add BETTER_AUTH_SECRET and BETTER_AUTH_URL to frontend/.env.example
- [X] T005 [P] Add DATABASE_URL for Better Auth to frontend/.env.example
- [X] T006 Create backend/src/services/ directory structure
- [X] T007 [P] Create backend/src/api/middleware/ directory structure
- [X] T008 [P] Create frontend/components/auth/ directory structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### Backend Core

- [X] T009 Add JWKS_URL setting to Settings class in backend/src/config.py
- [X] T010 Create JWKS fetching and caching service in backend/src/services/jwks.py
- [X] T011 Create JWT verification utility functions in backend/src/api/middleware/auth.py
- [X] T012 Add get_current_user dependency function in backend/src/api/dependencies.py

### Frontend Core

- [X] T013 Create Better Auth server configuration with RS256 JWT plugin in frontend/lib/auth.ts
- [X] T014 Create Better Auth client configuration with jwtClient plugin in frontend/lib/auth-client.ts
- [X] T015 Create Better Auth API route handler in frontend/app/api/auth/[...all]/route.ts
- [X] T016 Create AuthProvider context component in frontend/components/auth/AuthProvider.tsx
- [X] T017 Wrap root layout with AuthProvider in frontend/app/layout.tsx

**Checkpoint**: Foundation ready - Better Auth running, JWKS service available, JWT verification ready

---

## Phase 3: User Story 1 - User Registration (Priority: P1) MVP

**Goal**: New users can create accounts with email/password and receive JWT tokens

**Independent Test**: Create a new account and verify JWT token is returned in response header

### Implementation for User Story 1

- [X] T018 [US1] Create SignUpForm component with email/password fields in frontend/components/auth/SignUpForm.tsx
- [X] T019 [US1] Create sign-up page using SignUpForm in frontend/app/(auth)/sign-up/page.tsx
- [X] T020 [US1] Add form validation for email format and password requirements in frontend/components/auth/SignUpForm.tsx
- [X] T021 [US1] Handle duplicate email error response in SignUpForm
- [X] T022 [US1] Store JWT token from set-auth-jwt header after successful registration

**Checkpoint**: User Story 1 complete - Users can register and receive JWT tokens

---

## Phase 4: User Story 2 - User Sign In (Priority: P1)

**Goal**: Existing users can sign in with credentials and receive JWT tokens

**Independent Test**: Sign in with valid credentials and verify JWT token grants API access

### Implementation for User Story 2

- [X] T023 [US2] Create SignInForm component with email/password fields in frontend/components/auth/SignInForm.tsx
- [X] T024 [US2] Create sign-in page using SignInForm in frontend/app/(auth)/sign-in/page.tsx
- [X] T025 [US2] Handle invalid credentials error with generic message in SignInForm
- [X] T026 [US2] Store JWT token from set-auth-jwt header after successful sign-in
- [X] T027 [US2] Add sign-out functionality using Better Auth client

**Checkpoint**: User Story 2 complete - Users can sign in and receive JWT tokens

---

## Phase 5: User Story 3 - Authenticated API Access (Priority: P1)

**Goal**: Backend verifies JWT tokens on all protected endpoints, returns 401 for invalid/missing tokens

**Independent Test**: Make API requests with/without valid JWT and verify 401 responses for unauthorized requests

### Implementation for User Story 3

- [X] T028 [US3] Implement JWT token extraction from Authorization header in backend/src/api/middleware/auth.py
- [X] T029 [US3] Implement JWT signature verification using JWKS in backend/src/api/middleware/auth.py
- [X] T030 [US3] Implement token expiration validation in backend/src/api/middleware/auth.py
- [X] T031 [US3] Return 401 Unauthorized for missing/invalid/expired tokens in backend/src/api/middleware/auth.py
- [X] T032 [US3] Add auth dependency to POST /users/{user_id}/tasks endpoint in backend/src/api/routes/tasks.py
- [X] T033 [US3] Add auth dependency to GET /users/{user_id}/tasks endpoint in backend/src/api/routes/tasks.py
- [X] T034 [US3] Add auth dependency to GET /users/{user_id}/tasks/{task_id} endpoint in backend/src/api/routes/tasks.py
- [X] T035 [US3] Add auth dependency to PUT /users/{user_id}/tasks/{task_id} endpoint in backend/src/api/routes/tasks.py
- [X] T036 [US3] Add auth dependency to PATCH /users/{user_id}/tasks/{task_id} endpoint in backend/src/api/routes/tasks.py
- [X] T037 [US3] Add auth dependency to DELETE /users/{user_id}/tasks/{task_id} endpoint in backend/src/api/routes/tasks.py
- [X] T038 [US3] Update frontend API client to attach JWT in Authorization header in frontend/lib/api.ts

**Checkpoint**: User Story 3 complete - All API endpoints require valid JWT tokens

---

## Phase 6: User Story 4 - User Isolation (Priority: P1)

**Goal**: Users can only access their own tasks; cross-user access returns 403 Forbidden

**Independent Test**: Attempt to access another user's tasks with valid JWT and verify 403 response

### Implementation for User Story 4

- [X] T039 [US4] Implement user ID extraction from JWT sub claim in backend/src/api/dependencies.py
- [X] T040 [US4] Implement path user_id vs JWT user_id matching in backend/src/api/dependencies.py
- [X] T041 [US4] Return 403 Forbidden when user IDs do not match in backend/src/api/dependencies.py
- [X] T042 [US4] Add user isolation check to all task route handlers in backend/src/api/routes/tasks.py
- [X] T043 [US4] Handle 403 error response in frontend and display appropriate message
- [X] T044 [US4] Ensure frontend only requests tasks for authenticated user's ID

**Checkpoint**: User Story 4 complete - Users can only access their own tasks

---

## Phase 7: Integration & Error Handling

**Purpose**: End-to-end flow validation and error handling

### Integration

- [X] T045 Test full sign-up → sign-in → task access flow manually
- [X] T046 Verify 401 response when accessing tasks without JWT
- [X] T047 Verify 403 response when accessing another user's tasks
- [X] T048 [P] Handle 401 response in frontend by redirecting to sign-in page
- [X] T049 [P] Add loading states to auth forms in SignUpForm and SignInForm

### Error Handling

- [X] T050 Add user-friendly error messages for auth failures in frontend components
- [X] T051 Ensure backend error responses don't leak sensitive information in backend/src/api/middleware/auth.py
- [X] T052 Add logging for authentication events in backend/src/api/middleware/auth.py

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T053 [P] Update backend/.env.example with all required variables
- [X] T054 [P] Update frontend/.env.example with all required variables
- [X] T055 Run quickstart.md validation steps to verify setup
- [X] T056 Verify all success criteria from spec.md are met
- [X] T057 Clean up any unused imports and code

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
- **Integration (Phase 7)**: Depends on all user stories being complete
- **Polish (Phase 8)**: Depends on Integration phase completion

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKS all stories)
    ↓
    ├─→ Phase 3: US1 - Registration
    │       ↓
    ├─→ Phase 4: US2 - Sign In (can parallel with US1)
    │       ↓
    ├─→ Phase 5: US3 - Auth API Access (depends on US1/US2 for testing)
    │       ↓
    └─→ Phase 6: US4 - User Isolation (depends on US3)
            ↓
Phase 7: Integration
    ↓
Phase 8: Polish
```

### Task-Level Dependencies

| Task | Depends On | Reason |
|------|------------|--------|
| T010 | T009 | JWKS service needs JWKS_URL config |
| T011 | T010 | JWT middleware needs JWKS service |
| T012 | T011 | User dependency needs JWT verification |
| T015 | T013, T014 | API routes need both server and client config |
| T017 | T016 | Layout needs AuthProvider component |
| T028-T037 | T012 | Route auth needs get_current_user dependency |
| T039-T042 | T028-T037 | Isolation needs auth working first |

### Parallel Opportunities

**Phase 1 (all can run in parallel)**:
```
T001, T002, T003, T004, T005, T006, T007, T008
```

**Phase 2 Backend + Frontend (can run in parallel)**:
```
Backend: T009 → T010 → T011 → T012
Frontend: T013 → T014 → T015 → T016 → T017
```

**Phase 3+4 (User Stories 1 & 2 can run in parallel)**:
```
US1: T018 → T019 → T020 → T021 → T022
US2: T023 → T024 → T025 → T026 → T027
```

**Phase 5 (Route updates can run in parallel)**:
```
T032, T033, T034, T035, T036, T037 (all [P] - different sections of same file, but independent)
```

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all setup tasks together:
Task: "Install backend dependencies in backend/requirements.txt"
Task: "Install Better Auth dependency in frontend/package.json"
Task: "Add JWKS_URL to backend/.env.example"
Task: "Add BETTER_AUTH_SECRET to frontend/.env.example"
Task: "Create directory structures"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Registration)
4. Complete Phase 4: User Story 2 (Sign In)
5. **STOP and VALIDATE**: Users can register and sign in

### Full Authentication

6. Complete Phase 5: User Story 3 (Protected API)
7. Complete Phase 6: User Story 4 (User Isolation)
8. **VALIDATE**: All acceptance scenarios pass

### Polish

9. Complete Phase 7: Integration testing
10. Complete Phase 8: Final cleanup

---

## Acceptance Criteria Mapping

| Spec Requirement | Task(s) | Verification |
|-----------------|---------|--------------|
| FR-001: Create accounts via Better Auth | T018-T022 | Registration flow works |
| FR-002: Email/password validation | T020 | Invalid inputs rejected |
| FR-003: Sign in with credentials | T023-T026 | Sign-in flow works |
| FR-004: JWT token on auth | T022, T026 | Token in response header |
| FR-005: Frontend attaches JWT | T038 | Authorization header set |
| FR-006: Backend verifies JWT | T028-T030 | Signature verification |
| FR-007: 401 for missing/invalid JWT | T031 | Unauthorized response |
| FR-008: 403 for user ID mismatch | T041 | Forbidden response |
| FR-009: Users access only own tasks | T039-T044 | Cross-user access denied |
| FR-010: Secret from env vars | T003, T009 | No hardcoded secrets |
| FR-011: No session/cookie auth | T013 | JWT-only configuration |
| FR-012: No sensitive info in errors | T051 | Generic error messages |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All four user stories are P1 priority but have logical dependencies
- US1 + US2 provide auth capability
- US3 enables backend protection
- US4 enforces isolation (security-critical)
- Each phase has a checkpoint for validation
- Commit after each task or logical group
