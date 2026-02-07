# Implementation Plan: Frontend Application & API Integration

**Branch**: `002-frontend-api` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-frontend-api/spec.md`

## Summary

Build a responsive Next.js 16+ frontend application that integrates with the existing FastAPI backend Todo API. The frontend provides a complete task management interface with CRUD operations, optimistic updates, and graceful error handling. Uses App Router with a hybrid Server/Client Component architecture for optimal performance and interactivity.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 16+, React 19+, Tailwind CSS
**Storage**: N/A (frontend consumes backend API)
**Testing**: Manual testing (unit tests out of scope per spec)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: Web application (frontend consuming REST API)
**Performance Goals**: Page load <2s, operations <1s, toggle <500ms (per spec SC-001 to SC-003)
**Constraints**: No state management libraries, no external CSS frameworks beyond Tailwind
**Scale/Scope**: Single-page task list, responsive 320px-1920px

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Gate Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-First Development | ✅ PASS | Spec completed and approved (002-frontend-api/spec.md) |
| II. Agentic Dev Stack Compliance | ✅ PASS | Following spec → plan → tasks → execution workflow |
| III. Security by Design | ✅ PASS | Auth-ready design with hardcoded user ID placeholder |
| IV. Clear Separation of Concerns | ✅ PASS | Frontend communicates only via REST APIs |
| V. Reproducibility and Traceability | ✅ PASS | All decisions documented in research.md |
| VI. Technology Stack Fixation | ✅ PASS | Using mandated Next.js 16+, React, Tailwind CSS |

### Post-Design Gate Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-First Development | ✅ PASS | All components trace to spec requirements |
| II. Agentic Dev Stack Compliance | ✅ PASS | Plan derived from spec, ready for tasks |
| III. Security by Design | ✅ PASS | API client supports future auth headers |
| IV. Clear Separation of Concerns | ✅ PASS | API layer isolated from UI components |
| V. Reproducibility and Traceability | ✅ PASS | ADR candidates identified |
| VI. Technology Stack Fixation | ✅ PASS | No technology deviations |

## Project Structure

### Documentation (this feature)

```text
specs/002-frontend-api/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Data models
├── quickstart.md        # Phase 1: Setup guide
├── contracts/
│   ├── api-client.md    # API client contract
│   └── component-contracts.md  # UI component contracts
└── tasks.md             # Phase 2 output (created by /sp.tasks)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Main task list page (Server Component)
│   ├── loading.tsx          # Loading skeleton
│   ├── error.tsx            # Global error boundary
│   └── globals.css          # Global styles (Tailwind imports)
├── components/
│   ├── TaskListContainer.tsx # Client component with state
│   ├── TaskList.tsx          # Task list rendering
│   ├── TaskItem.tsx          # Individual task row
│   ├── TaskForm.tsx          # Create task form
│   ├── EditTaskModal.tsx     # Edit dialog
│   ├── DeleteConfirmDialog.tsx # Delete confirmation
│   ├── LoadingSpinner.tsx    # Loading indicator
│   ├── ErrorMessage.tsx      # Error display
│   └── EmptyState.tsx        # No tasks display
├── lib/
│   ├── api/
│   │   ├── client.ts         # Base fetch wrapper
│   │   ├── tasks.ts          # Task API functions
│   │   └── types.ts          # TypeScript interfaces
│   └── utils/
│       └── date.ts           # Date formatting helpers
├── .env.example              # Example environment file
├── .env.local                # Local environment (gitignored)
├── package.json              # Dependencies and scripts
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
├── next.config.ts            # Next.js configuration
└── README.md                 # Frontend documentation
```

**Structure Decision**: Web application structure with frontend consuming backend API. Frontend directory at repository root alongside existing backend directory.

## Architecture Overview

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    app/page.tsx (Server Component)               │
│  - Renders initial HTML shell                                   │
│  - Could pre-fetch tasks (optional SSR optimization)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               TaskListContainer (Client Component)               │
│  - Manages all task state                                       │
│  - Handles API interactions                                     │
│  - Controls modal visibility                                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   TaskForm   │  │   TaskList   │  │   Modals     │          │
│  │   (Create)   │  │   (Display)  │  │   (Edit/Del) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                           │                                      │
│                    ┌──────┴──────┐                              │
│                    ▼             ▼                              │
│              TaskItem       TaskItem                            │
│              (toggle)       (actions)                           │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    lib/api/client.ts                             │
│  - Centralized fetch wrapper                                    │
│  - Error normalization                                          │
│  - Environment configuration                                     │
│  - Auth-ready headers                                           │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                         │
│  http://localhost:8000/api/users/{user_id}/tasks                │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → Component State → API Call → Backend → Response → Update State → Re-render
     │                                                                    │
     └──────────────── Optimistic Update (for toggle) ───────────────────┘
```

## Key Architectural Decisions

### ADR-1: Hybrid Server/Client Component Architecture

**Decision**: Use Server Component for page shell, Client Component for interactive task list

**Context**: Next.js 16 App Router supports both Server and Client Components

**Options Considered**:
1. Pure Server Components with Server Actions
2. Pure Client Components
3. Hybrid: Server shell + Client interactivity

**Chosen**: Option 3 - Hybrid approach

**Rationale**:
- Server Component provides fast initial HTML
- Client Component enables immediate UI updates
- Spec requires "UI updates immediately without page reload"

### ADR-2: Centralized API Client

**Decision**: Single API client module for all backend communication

**Rationale**:
- Consistent error handling
- Single point for auth header injection (future)
- Environment configuration in one place
- Easier testing and mocking

### ADR-3: No External State Management

**Decision**: Use React's built-in useState/useReducer

**Rationale**:
- Constitution allows only "React's built-in features"
- Simple CRUD operations don't need Redux/Zustand
- Reduces bundle size and complexity

### ADR-4: Tailwind CSS for Styling

**Decision**: Use Tailwind CSS utility classes with mobile-first approach

**Rationale**:
- Constitution mandates Tailwind CSS
- Rapid development with utility classes
- Built-in responsive breakpoints
- No additional dependencies

## Implementation Phases

### Phase 1: Project Setup
1. Initialize Next.js 16+ project with TypeScript
2. Configure Tailwind CSS
3. Set up environment variables
4. Create basic directory structure

### Phase 2: API Layer
1. Create TypeScript type definitions (matching backend)
2. Implement base API client with error handling
3. Create task-specific API functions
4. Add date formatting utilities

### Phase 3: Core Components
1. Implement TaskListContainer with state management
2. Create TaskForm for new task creation
3. Build TaskList and TaskItem components
4. Add loading and empty states

### Phase 4: CRUD Operations
1. Implement task creation flow
2. Add completion toggle with optimistic update
3. Build edit modal with form validation
4. Create delete confirmation dialog

### Phase 5: Error Handling & Polish
1. Implement error boundary
2. Add loading skeletons
3. Style responsive layout
4. Test all user flows

## Requirement Mapping

| Spec Requirement | Implementation |
|------------------|----------------|
| FR-001: Display all tasks | TaskList component + getTasks() API |
| FR-002: Create task form | TaskForm component |
| FR-003: Create task API | createTask() in lib/api/tasks.ts |
| FR-004: Toggle completion | TaskItem checkbox + toggleComplete() |
| FR-005: Completion API | PATCH endpoint in API client |
| FR-006: Edit interface | EditTaskModal component |
| FR-007: Update API | updateTask() in lib/api/tasks.ts |
| FR-008: Delete with confirm | DeleteConfirmDialog component |
| FR-009: Remove from UI | State update after deleteTask() |
| FR-010: Loading states | LoadingSpinner, loading.tsx |
| FR-011: Error messages | ErrorMessage component |
| FR-012: Responsive design | Tailwind responsive classes |
| FR-013: Environment config | NEXT_PUBLIC_API_URL variable |
| FR-014: Hardcoded user ID | NEXT_PUBLIC_DEFAULT_USER_ID |
| FR-015: Visual completion | TaskItem styling (strikethrough) |
| FR-016: Empty state | EmptyState component |
| FR-017: Timestamp display | formatDate() utility |

## Success Criteria Mapping

| Criterion | Validation Method |
|-----------|------------------|
| SC-001: 2s page load | Manual timing, Network tab |
| SC-002: 1s task creation | Manual timing |
| SC-003: 500ms toggle | Manual timing, optimistic update |
| SC-004: CRUD works | Manual testing all operations |
| SC-005: Feedback display | Visual inspection of states |
| SC-006: Responsive | Browser resize 320px-1920px |
| SC-007: Error display | Stop backend, verify messages |
| SC-008: No console errors | Check browser console |
| SC-009: Local setup works | Follow quickstart.md |
| SC-010: Backend unavailable | Stop backend, verify graceful handling |

## Complexity Tracking

No constitution violations requiring justification. All decisions align with mandated technologies and principles.

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Backend unavailable | ErrorMessage with retry, loading.tsx skeleton |
| Slow network | Loading states, optimistic updates for toggle |
| Type mismatch | TypeScript interfaces matching backend models |
| CORS issues | Backend already configured for development |

## Dependencies Summary

| Dependency | Version | Purpose |
|------------|---------|---------|
| next | 16+ | React framework with App Router |
| react | 19+ | UI library (included with Next.js) |
| react-dom | 19+ | React DOM (included with Next.js) |
| typescript | 5+ | Type safety |
| tailwindcss | 3+ | Styling |
| @types/node | latest | Node.js types |
| @types/react | latest | React types |

## Next Steps

1. Run `/sp.tasks` to generate implementation tasks
2. Execute tasks via Claude Code agents
3. Validate against success criteria
4. Document any deviations

---

**Plan Status**: Complete
**Ready for**: `/sp.tasks` command
