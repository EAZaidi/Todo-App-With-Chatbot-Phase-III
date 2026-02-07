# Tasks: Backend Todo API & Persistence

**Input**: Design documents from `/specs/001-backend-todo-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Tests included per spec requirements (SC-010 requires "100 sequential operations without degradation")

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend structure**: `backend/src/`, `backend/tests/`
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend project directory structure (backend/src/models/, backend/src/api/routes/, backend/src/database/, backend/tests/unit/, backend/tests/integration/)
- [X] T002 Initialize Python project with requirements.txt (fastapi>=0.100.0, sqlmodel>=0.0.14, pydantic>=2.0.0, python-dotenv>=1.0.0, asyncpg>=0.29.0, uvicorn[standard]>=0.24.0, pytest>=7.4.0, httpx>=0.25.0)
- [X] T003 [P] Create .env.example file with DATABASE_URL template
- [X] T004 [P] Create backend/src/__init__.py and __init__.py files in all subdirectories

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Setup environment configuration in backend/src/config.py (load DATABASE_URL from .env)
- [X] T006 Implement database connection management in backend/src/database/connection.py (async engine, session factory, init_db function)
- [X] T007 [P] Create API dependencies module in backend/src/api/dependencies.py (get_session dependency for FastAPI)
- [X] T008 [P] Create FastAPI application entry point in backend/src/main.py (app initialization, startup event for init_db, CORS configuration)
- [X] T009 [P] Setup API router structure in backend/src/api/routes/__init__.py
- [X] T010 Verify database connection and table creation (run uvicorn to test init_db)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and View Tasks (Priority: P1) 🎯 MVP

**Goal**: Users can create new todo tasks and view all their tasks. This is the foundational functionality that enables the basic value proposition of a todo application.

**Independent Test**:
1. POST /api/users/test-user/tasks with valid task data → 201 Created with task object
2. GET /api/users/test-user/tasks → 200 OK with array containing the created task
3. Verify task persists across server restarts

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T011 [P] [US1] Create unit test for Task model validation in backend/tests/unit/test_task_model.py (test required fields, max lengths, defaults, timestamps)
- [X] T012 [P] [US1] Create integration test for POST /api/users/{user_id}/tasks in backend/tests/integration/test_task_api.py (test create task success, validation errors, response format)
- [X] T013 [P] [US1] Create integration test for GET /api/users/{user_id}/tasks in backend/tests/integration/test_task_api.py (test list tasks, empty list, multiple tasks, user isolation)

### Implementation for User Story 1

- [X] T014 [US1] Create Task SQLModel in backend/src/models/task.py (id, user_id, title, description, completed, created_at, updated_at with Field definitions and validators)
- [X] T015 [US1] Create TaskCreate Pydantic schema in backend/src/models/task.py (title validation: non-empty, 1-500 chars; description: optional, max 5000 chars)
- [X] T016 [US1] Create TaskResponse Pydantic schema in backend/src/models/task.py (all fields including id and timestamps, from_attributes=True)
- [X] T017 [US1] Implement POST /api/users/{user_id}/tasks endpoint in backend/src/api/routes/tasks.py (create task, save to DB, return 201 with TaskResponse)
- [X] T018 [US1] Implement GET /api/users/{user_id}/tasks endpoint in backend/src/api/routes/tasks.py (query all tasks filtered by user_id, return 200 with list of TaskResponse)
- [X] T019 [US1] Add task router to main app in backend/src/main.py (include_router with /api prefix)
- [X] T020 [US1] Add error handling for database failures (return 500 with generic error message)
- [X] T021 [US1] Run tests to verify User Story 1 is complete (pytest backend/tests/ -v -k "test_task_model or test_create_task or test_list_tasks")

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can create tasks and view their task list.

---

## Phase 4: User Story 2 - Update Task Details (Priority: P2)

**Goal**: Users can modify existing tasks to correct mistakes or update information as situations change.

**Independent Test**:
1. Create a task via POST
2. PUT /api/users/test-user/tasks/{task_id} with updated data → 200 OK with updated task
3. GET the task to verify changes persisted

### Tests for User Story 2

- [X] T022 [P] [US2] Create integration test for PUT /api/users/{user_id}/tasks/{task_id} in backend/tests/integration/test_task_api.py (test full update success, 404 for non-existent task, validation errors, user isolation)

### Implementation for User Story 2

- [X] T023 [US2] Create TaskUpdate Pydantic schema in backend/src/models/task.py (all fields required: title, description, completed)
- [X] T024 [US2] Implement PUT /api/users/{user_id}/tasks/{task_id} endpoint in backend/src/api/routes/tasks.py (query task with user_id filter, update all fields, update updated_at timestamp, return 200 or 404)
- [X] T025 [US2] Add validation for title non-empty in TaskUpdate schema
- [X] T026 [US2] Run tests to verify User Story 2 is complete (pytest backend/tests/ -v -k "test_update_task")

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can create, view, and update tasks.

---

## Phase 5: User Story 3 - Mark Tasks Complete (Priority: P2)

**Goal**: Users can mark tasks as complete to track progress and maintain an organized task list.

**Independent Test**:
1. Create an incomplete task via POST
2. PATCH /api/users/test-user/tasks/{task_id} with {"completed": true} → 200 OK
3. Verify completed field changed to true

### Tests for User Story 3

- [X] T027 [P] [US3] Create integration test for PATCH /api/users/{user_id}/tasks/{task_id} in backend/tests/integration/test_task_api.py (test partial update completed status, update title only, update multiple fields, 404 for non-existent task)

### Implementation for User Story 3

- [X] T028 [US3] Create TaskPartialUpdate Pydantic schema in backend/src/models/task.py (all fields optional: title, description, completed)
- [X] T029 [US3] Implement PATCH /api/users/{user_id}/tasks/{task_id} endpoint in backend/src/api/routes/tasks.py (query task, update only provided fields using exclude_unset, update updated_at, return 200 or 404)
- [X] T030 [US3] Add validation for optional title (if provided, must be non-empty) in TaskPartialUpdate schema
- [X] T031 [US3] Run tests to verify User Story 3 is complete (pytest backend/tests/ -v -k "test_patch_task")

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Users can create, view, update, and mark tasks complete.

---

## Phase 6: User Story 4 - View Single Task Details (Priority: P3)

**Goal**: Users can view detailed information about a specific task.

**Independent Test**:
1. Create a task via POST, note the task_id
2. GET /api/users/test-user/tasks/{task_id} → 200 OK with full task details
3. GET with non-existent task_id → 404 Not Found

### Tests for User Story 4

- [X] T032 [P] [US4] Create integration test for GET /api/users/{user_id}/tasks/{task_id} in backend/tests/integration/test_task_api.py (test get single task success, 404 for non-existent task, user isolation)

### Implementation for User Story 4

- [X] T033 [US4] Implement GET /api/users/{user_id}/tasks/{task_id} endpoint in backend/src/api/routes/tasks.py (query task by id and user_id, return 200 with TaskResponse or 404)
- [X] T034 [US4] Run tests to verify User Story 4 is complete (pytest backend/tests/ -v -k "test_get_task")

**Checkpoint**: At this point, User Stories 1-4 should all work independently. Users can create, view, update, mark complete, and view individual task details.

---

## Phase 7: User Story 5 - Delete Tasks (Priority: P3)

**Goal**: Users can permanently remove tasks that are no longer needed.

**Independent Test**:
1. Create a task via POST, note the task_id
2. DELETE /api/users/test-user/tasks/{task_id} → 204 No Content
3. GET /api/users/test-user/tasks → task no longer in list
4. GET /api/users/test-user/tasks/{task_id} → 404 Not Found

### Tests for User Story 5

- [X] T035 [P] [US5] Create integration test for DELETE /api/users/{user_id}/tasks/{task_id} in backend/tests/integration/test_task_api.py (test delete success 204, 404 for non-existent task, verify task removed from list, user isolation)

### Implementation for User Story 5

- [X] T036 [US5] Implement DELETE /api/users/{user_id}/tasks/{task_id} endpoint in backend/src/api/routes/tasks.py (query task by id and user_id, delete from DB, return 204 or 404)
- [X] T037 [US5] Run tests to verify User Story 5 is complete (pytest backend/tests/ -v -k "test_delete_task")

**Checkpoint**: All user stories should now be independently functional. Full CRUD operations available.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and finalize the implementation

- [X] T038 [P] Add comprehensive logging to all endpoints in backend/src/api/routes/tasks.py (log user_id, task_id, operation, errors)
- [X] T039 [P] Verify OpenAPI documentation accuracy at http://localhost:8000/docs (all 6 endpoints documented, request/response schemas match implementation)
- [X] T040 [P] Create backend/README.md with setup instructions (copy from quickstart.md and adapt)
- [X] T041 Run full test suite and verify all tests pass (pytest backend/tests/ -v --cov=backend/src --cov-report=html)
- [X] T042 Verify SC-004 response time requirement: Task creation completes in <500ms (run performance test with 10 sequential creates, measure average time)
- [X] T043 Verify SC-010 no memory leaks requirement: Run 100 sequential CRUD operations, monitor memory usage (should not grow unbounded)
- [X] T044 Test data persistence across server restarts (create tasks, stop uvicorn, start uvicorn, verify tasks still exist)
- [X] T045 Validate quickstart.md instructions by following them step-by-step (verify all commands work, all tests pass)
- [X] T046 [P] Code cleanup: Remove any unused imports, add docstrings to public functions, format code with black
- [X] T047 [P] Security review: Verify no SQL injection vulnerabilities (all queries use SQLModel parameterized queries), no secrets in code

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P2 → P3 → P3)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Shares Task model with US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Shares Task model with US1 but independently testable
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Uses same endpoint structure as US1 but independently testable
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Uses same endpoint structure as US1 but independently testable

**Note**: All user stories share the Task model (T014), so T014 must complete before any user story endpoints can be implemented. However, tests can be written in parallel before implementation.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Task model and schemas before endpoint implementation
- Endpoint implementation before integration tests pass
- Story complete before moving to next priority

### Parallel Opportunities

- **Setup Phase**: T003 and T004 can run in parallel
- **Foundational Phase**: T007, T008, T009 can run in parallel after T006 completes
- **User Story Tests**: All test tasks within a story marked [P] can run in parallel (write tests before implementation)
- **User Story Schemas**: TaskUpdate (T023) and TaskPartialUpdate (T028) can be created in parallel after TaskResponse (T016)
- **Different User Stories**: Once Task model (T014) is complete, all user story endpoints (US2-US5) can be implemented in parallel by different developers
- **Polish Phase**: T038, T039, T040, T046, T047 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Step 1: Launch all tests for User Story 1 together (write tests first):
Task T011: "Create unit test for Task model validation in backend/tests/unit/test_task_model.py"
Task T012: "Create integration test for POST endpoint in backend/tests/integration/test_task_api.py"
Task T013: "Create integration test for GET list endpoint in backend/tests/integration/test_task_api.py"

# Step 2: Verify tests FAIL (expected since no implementation yet)

# Step 3: Implement Task model and schemas sequentially:
Task T014: "Create Task SQLModel in backend/src/models/task.py"
Task T015: "Create TaskCreate schema in backend/src/models/task.py" (after T014)
Task T016: "Create TaskResponse schema in backend/src/models/task.py" (after T014)

# Step 4: Implement endpoints (can be done by different developers):
Task T017: "Implement POST endpoint in backend/src/api/routes/tasks.py"
Task T018: "Implement GET list endpoint in backend/src/api/routes/tasks.py"

# Step 5: Remaining sequential tasks:
Task T019: "Add router to main app"
Task T020: "Add error handling"
Task T021: "Run tests to verify completion"
```

---

## Parallel Example: Multiple User Stories (After Foundational Complete)

```bash
# After Phase 2 (Foundational) completes and Task model (T014-T016) is ready:

# Developer A works on User Story 1:
- Implements POST and GET list endpoints (T017, T018)
- Adds router and error handling (T019, T020)

# Developer B works on User Story 2 (in parallel):
- Creates TaskUpdate schema (T023)
- Implements PUT endpoint (T024)
- Adds validation (T025)

# Developer C works on User Story 3 (in parallel):
- Creates TaskPartialUpdate schema (T028)
- Implements PATCH endpoint (T029)
- Adds validation (T030)

# Developer D works on User Story 4 (in parallel):
- Implements GET single endpoint (T033)

# Developer E works on User Story 5 (in parallel):
- Implements DELETE endpoint (T036)

# All developers can work independently on their user stories
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T010) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T011-T021)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Run: `pytest backend/tests/ -v -k "US1"`
   - Verify: Create task → View task list → Task persists
5. Deploy/demo if ready (Users can create and view tasks!)

### Incremental Delivery

1. **Foundation** (Setup + Foundational) → Database, FastAPI app, routing ready
2. **MVP** (Add User Story 1) → Test independently → Deploy/Demo
   - Users can: Create tasks, View all tasks
3. **Iteration 2** (Add User Story 2 + 3) → Test independently → Deploy/Demo
   - Users can: Create, View, Update, Mark complete
4. **Iteration 3** (Add User Story 4 + 5) → Test independently → Deploy/Demo
   - Users can: Full CRUD operations
5. **Final Polish** (Phase 8) → Production-ready

Each iteration adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (T001-T010)
2. **One developer creates Task model** (T014-T016) - blocks all stories
3. **Once Task model is ready**:
   - Developer A: User Story 1 (POST + GET list)
   - Developer B: User Story 2 (PUT)
   - Developer C: User Story 3 (PATCH)
   - Developer D: User Story 4 (GET single)
   - Developer E: User Story 5 (DELETE)
4. Stories complete and integrate independently
5. Team completes Polish phase together (T038-T047)

---

## Notes

- **[P]** tasks = different files, no dependencies, can run in parallel
- **[Story]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All endpoints share the same Task model, so model must be created first
- User isolation enforced via `user_id` path parameter filtering in all queries
- No authentication in Phase 1 (auth-ready design for Phase 3 JWT integration)
- Database tables created automatically on first run via `init_db()` in startup event
- All timestamps in UTC using `datetime.utcnow()`

---

## Task Count Summary

- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (Foundational)**: 6 tasks (BLOCKS all user stories)
- **Phase 3 (User Story 1 - P1)**: 11 tasks (MVP)
- **Phase 4 (User Story 2 - P2)**: 5 tasks
- **Phase 5 (User Story 3 - P2)**: 5 tasks
- **Phase 6 (User Story 4 - P3)**: 3 tasks
- **Phase 7 (User Story 5 - P3)**: 3 tasks
- **Phase 8 (Polish)**: 10 tasks

**Total**: 47 tasks

**Parallel Opportunities**: 18 tasks marked [P] can run in parallel within their phases

**MVP Scope** (User Story 1 only): 21 tasks (T001-T021)
**Full Implementation**: 47 tasks (T001-T047)
