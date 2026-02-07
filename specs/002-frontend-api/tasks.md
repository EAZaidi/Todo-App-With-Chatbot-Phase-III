# Implementation Tasks: Frontend Application & API Integration

**Feature**: 002-frontend-api | **Branch**: `002-frontend-api` | **Date**: 2026-01-10
**Input**: Design documents from `/specs/002-frontend-api/` (spec.md, plan.md, data-model.md, research.md, quickstart.md, contracts/)

## Task Format

Each task: `- [ ] T00X [P] [USX] Description with file path`
- **[P]**: Parallelizable (different files, no blocking dependencies)
- **[USX]**: User story label (US1-US5 for story-specific tasks, no label for infrastructure)
- File paths reference `frontend/` directory structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Next.js project and development environment

- [x] T001 Initialize Next.js 16+ project with TypeScript in `frontend/` directory using `npx create-next-app@latest`
- [x] T002 Configure Tailwind CSS in `frontend/tailwind.config.ts` and `frontend/app/globals.css`
- [x] T003 [P] Create `.env.example` with `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_DEFAULT_USER_ID`
- [x] T004 [P] Create `.env.local` with local development values (API URL: http://localhost:8000, User ID: default-user)
- [x] T005 Create directory structure: `frontend/components/`, `frontend/lib/api/`, `frontend/lib/utils/`

---

## Phase 2: Foundational - API Layer (Blocking Prerequisites)

**Purpose**: Core API infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] Create TypeScript type definitions in `frontend/lib/api/types.ts` (Task, TaskCreateRequest, TaskUpdateRequest, TaskPartialUpdateRequest, ApiError)
- [x] T007 [P] Create date formatting utility in `frontend/lib/utils/date.ts` for human-readable timestamps
- [x] T008 Create base API client wrapper in `frontend/lib/api/client.ts` with error handling and environment config
- [x] T009 Create task-specific API functions in `frontend/lib/api/tasks.ts` (getTasks, getTask, createTask, updateTask, toggleTaskComplete, deleteTask)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View All Tasks (Priority: P1) 🎯 MVP

**Goal**: Users see all their existing tasks displayed in a clear, organized list on page load

**Independent Test**: Load application → verify all tasks from backend are displayed with correct titles, descriptions, and completion status

### Implementation for User Story 1

- [x] T010 [P] [US1] Create EmptyState component in `frontend/components/EmptyState.tsx` for "No tasks yet" message
- [x] T011 [P] [US1] Create LoadingSpinner component in `frontend/components/LoadingSpinner.tsx` with size variants
- [x] T012 [P] [US1] Create loading skeleton UI in `frontend/app/loading.tsx` for initial page load
- [x] T013 [US1] Create TaskItem component in `frontend/components/TaskItem.tsx` displaying title, description, completion status, and timestamps
- [x] T014 [US1] Create TaskList component in `frontend/components/TaskList.tsx` rendering array of TaskItem components with empty state
- [x] T015 [US1] Create TaskListContainer client component in `frontend/components/TaskListContainer.tsx` with state management for tasks, loading, and error
- [x] T016 [US1] Implement initial task fetching in TaskListContainer using getTasks() on mount
- [x] T017 [US1] Update `frontend/app/page.tsx` to render TaskListContainer as main page content
- [x] T018 [US1] Add visual distinction for completed vs incomplete tasks (strikethrough, opacity) in TaskItem styling

**Checkpoint**: At this point, User Story 1 should be fully functional - users can view all tasks

---

## Phase 4: User Story 2 - Create New Task (Priority: P1) 🎯 MVP

**Goal**: Users can add new tasks via a form with title and optional description

**Independent Test**: Enter task title → submit form → verify task appears in list without page refresh

### Implementation for User Story 2

- [x] T019 [P] [US2] Create ErrorMessage component in `frontend/components/ErrorMessage.tsx` with retry and dismiss options
- [x] T020 [US2] Create TaskForm component in `frontend/components/TaskForm.tsx` with controlled inputs for title and description
- [x] T021 [US2] Add client-side validation to TaskForm (title required, non-empty, max 500 chars; description max 5000 chars)
- [x] T022 [US2] Integrate TaskForm into TaskListContainer with onSubmit handler calling createTask() API
- [x] T023 [US2] Update TaskListContainer state to add new task to list on successful creation
- [x] T024 [US2] Add success feedback and form reset after task creation
- [x] T025 [US2] Add error handling for failed task creation with user-friendly error messages

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can view and create tasks (MVP complete)

---

## Phase 5: User Story 3 - Mark Task Complete/Incomplete (Priority: P2)

**Goal**: Users can toggle task completion status to track progress

**Independent Test**: Click completion checkbox on task → verify visual state changes → refresh page → verify persistence

### Implementation for User Story 3

- [x] T026 [US3] Add checkbox toggle UI to TaskItem component for completion status
- [x] T027 [US3] Add onToggleComplete callback prop to TaskItem and wire to parent TaskList
- [x] T028 [US3] Implement toggle handler in TaskListContainer calling toggleTaskComplete() API with PATCH request
- [x] T029 [US3] Add optimistic UI update in TaskListContainer for immediate visual feedback before API response
- [x] T030 [US3] Add rollback logic if API call fails to restore previous completion state
- [x] T031 [US3] Add pending operation state to prevent multiple simultaneous toggles on same task

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently - full task lifecycle except edit/delete

---

## Phase 6: User Story 4 - Edit Existing Task (Priority: P2)

**Goal**: Users can modify task title and description to correct mistakes or update information

**Independent Test**: Click edit on task → modify title in modal → save → verify changes persist after page refresh

### Implementation for User Story 4

- [x] T032 [US4] Create EditTaskModal component in `frontend/components/EditTaskModal.tsx` with dialog, form inputs, save/cancel buttons
- [x] T033 [US4] Pre-fill EditTaskModal form with current task values (title, description, completed status)
- [x] T034 [US4] Add validation to EditTaskModal (same rules as TaskForm: title required, length limits)
- [x] T035 [US4] Add edit button to TaskItem component with onClick handler
- [x] T036 [US4] Manage modal visibility state in TaskListContainer (editingTask state)
- [x] T037 [US4] Implement onSave handler in EditTaskModal calling updateTask() API with PUT request
- [x] T038 [US4] Update TaskListContainer state to replace edited task on successful update
- [x] T039 [US4] Add cancel functionality to close modal without saving changes
- [x] T040 [US4] Add error handling for failed updates with inline error display

**Checkpoint**: At this point, User Stories 1-4 should all work independently - users can create, view, complete, and edit tasks

---

## Phase 7: User Story 5 - Delete Task (Priority: P3)

**Goal**: Users can permanently remove tasks that are no longer relevant

**Independent Test**: Click delete on task → confirm deletion → verify task removed from list and backend

### Implementation for User Story 5

- [x] T041 [US5] Create DeleteConfirmDialog component in `frontend/components/DeleteConfirmDialog.tsx` with confirm/cancel buttons
- [x] T042 [US5] Add delete button to TaskItem component with onClick handler
- [x] T043 [US5] Manage delete confirmation state in TaskListContainer (deletingTaskId state)
- [x] T044 [US5] Implement onConfirm handler in DeleteConfirmDialog calling deleteTask() API with DELETE request
- [x] T045 [US5] Update TaskListContainer state to remove deleted task from list on successful deletion
- [x] T046 [US5] Add cancel functionality to close confirmation dialog without deleting
- [x] T047 [US5] Add error handling for failed deletions with user-friendly error messages

**Checkpoint**: All five user stories should now be independently functional - complete feature set

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories

- [x] T048 [P] Create global error boundary in `frontend/app/error.tsx` for unexpected React errors
- [x] T049 [P] Update `frontend/app/layout.tsx` with proper metadata (title, description, viewport)
- [x] T050 Add responsive styling with Tailwind breakpoints (mobile 320px+, tablet 640px+, desktop 1024px+) across all components
- [x] T051 Add ARIA attributes to components for accessibility (role, aria-label, aria-checked, aria-modal)
- [x] T052 Add keyboard navigation support (Enter to submit, Escape to close modals, Tab navigation)
- [x] T053 [P] Create `frontend/README.md` documenting setup, scripts, and development workflow
- [x] T054 Run full integration test: create task → view → edit → complete → delete → verify backend state
- [x] T055 Verify quickstart.md instructions work from clean state

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Builds on US1 components but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Extends TaskItem from US1
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent modal, integrates with TaskListContainer
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independent dialog, integrates with TaskListContainer

### Within Each User Story

- Components marked [P] can be built in parallel (different files)
- Component creation before integration into container
- API integration after component UI is stable
- Error handling after core functionality works

### Parallel Opportunities

**Phase 1 - Setup**: All tasks can run in parallel (T003 and T004 both create files)

**Phase 2 - Foundational**: T006 and T007 can run in parallel (different files)

**Phase 3 - User Story 1**: T010, T011, T012 can run in parallel (different component files)

**Phase 4 - User Story 2**: T019 can run in parallel with other US2 tasks (different file)

**Phase 8 - Polish**: T048, T049, T053 can run in parallel (different files)

**Cross-Story Parallelization**: Once Phase 2 completes, multiple developers can work on different user stories simultaneously:
- Developer A: User Story 1 (T010-T018)
- Developer B: User Story 2 (T019-T025, after US1 provides TaskListContainer base)
- Developer C: User Story 3 (T026-T031, after US1 provides TaskItem base)

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T009) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T010-T018) - View tasks
4. Complete Phase 4: User Story 2 (T019-T025) - Create tasks
5. **STOP and VALIDATE**: Test viewing and creating tasks independently
6. Deploy/demo MVP with view + create capabilities

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T009)
2. Add User Story 1 → Test independently → Deploy/Demo (T010-T018)
3. Add User Story 2 → Test independently → Deploy/Demo (T019-T025) - **MVP complete**
4. Add User Story 3 → Test independently → Deploy/Demo (T026-T031)
5. Add User Story 4 → Test independently → Deploy/Demo (T032-T040)
6. Add User Story 5 → Test independently → Deploy/Demo (T041-T047)
7. Add Polish → Final release (T048-T055)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T009)
2. Once Foundational is done:
   - Developer A: User Story 1 (T010-T018)
   - Wait for TaskListContainer base from US1
   - Developer B: User Story 2 (T019-T025) - builds on US1
   - Developer C: User Story 3 (T026-T031) - builds on US1
   - Developer D: User Story 4 (T032-T040) - independent modal
   - Developer E: User Story 5 (T041-T047) - independent dialog
3. Stories complete and integrate independently

---

## Summary

**Total Tasks**: 55
**MVP Tasks**: 34 (Phase 1-4: Setup + Foundational + US1 + US2)
**P1 User Stories**: 2 (View All Tasks, Create New Task)
**P2 User Stories**: 2 (Toggle Complete, Edit Task)
**P3 User Stories**: 1 (Delete Task)

**Tasks by Phase**:
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 4 tasks
- Phase 3 (User Story 1): 9 tasks
- Phase 4 (User Story 2): 7 tasks
- Phase 5 (User Story 3): 6 tasks
- Phase 6 (User Story 4): 9 tasks
- Phase 7 (User Story 5): 7 tasks
- Phase 8 (Polish): 8 tasks

**Parallel Opportunities**:
- 8 tasks marked [P] can run in parallel within their phases
- All user stories (Phase 3-7) can be worked on in parallel after Foundational phase completes

**MVP Scope**: Phase 1-4 (T001-T025) delivers a functional task management app with view and create capabilities

---

## Notes

- No test tasks included (tests not requested in spec.md FR requirements)
- All tasks include exact file paths from plan.md structure
- Each user story independently completable and testable
- Optimistic updates used for toggle (US3) to meet <500ms requirement (SC-003)
- Error handling included in every user story per FR-011 requirement
- Loading states included in every operation per FR-010 requirement
- Responsive design addressed in Phase 8 to meet SC-006 requirement
- Accessibility basics (ARIA, keyboard nav) included in Phase 8
- Backend API must be running at http://localhost:8000 before frontend testing
