# Research: Frontend Application & API Integration

**Feature**: 002-frontend-api
**Date**: 2026-01-10
**Status**: Complete

## Research Summary

All technical unknowns have been resolved through documentation research and analysis of the existing backend implementation.

---

## Decision 1: Next.js App Router vs Pages Router

**Decision**: Use Next.js App Router (required by Constitution)

**Rationale**:
- Constitution mandates "Next.js 16+ with App Router" (Section VI)
- App Router provides React Server Components for better performance
- Modern data fetching patterns with async/await in components
- Built-in loading and error states via file conventions
- Future-proof architecture aligned with React's direction

**Alternatives Considered**:
- Pages Router: More familiar pattern, but explicitly excluded by Constitution
- App Router is the default in Next.js 16+

---

## Decision 2: Client-Side Data Fetching vs Server Components

**Decision**: Hybrid approach - Server Components for initial load, Client Components for interactions

**Rationale**:
- Initial task list can be fetched server-side for fast first paint
- CRUD operations (create, update, delete, toggle) require client-side state
- User interactions need immediate feedback without page reload
- Spec requires "UI updates immediately without requiring a page reload" (FR-003, FR-005, FR-007)

**Architecture**:
```
app/page.tsx (Server Component)
  ├── Fetches initial tasks from API
  └── Renders TaskList (Client Component)
        ├── Manages local state for optimistic updates
        └── Handles CRUD operations via API client
```

**Alternatives Considered**:
- Pure Server Components with Server Actions: Requires page refresh for updates
- Pure Client-Side: Slower initial load, no SEO benefits
- Chosen approach balances performance with interactivity requirements

---

## Decision 3: Centralized API Client vs Direct Fetch Calls

**Decision**: Centralized API client module

**Rationale**:
- Environment variable handling in one place (`NEXT_PUBLIC_API_URL`)
- Consistent error handling across all API calls
- Type safety with shared interfaces
- Single point for adding authentication headers later (auth-ready)
- Easier testing and mocking

**Structure**:
```
lib/
├── api/
│   ├── client.ts      # Base fetch wrapper with error handling
│   ├── tasks.ts       # Task-specific API functions
│   └── types.ts       # Shared TypeScript interfaces
```

**Alternatives Considered**:
- Direct fetch in components: Simpler but duplicates error handling
- SWR/React Query: Adds dependency, overkill for simple CRUD without caching needs

---

## Decision 4: Responsive Layout Strategy

**Decision**: Tailwind CSS utility classes with mobile-first approach

**Rationale**:
- Constitution allows Tailwind CSS (Section: Technology Stack - Styling)
- No additional dependencies needed (included with Next.js)
- Mobile-first matches spec requirement (320px-1920px, SC-006)
- Rapid development with utility classes
- Built-in responsive breakpoints

**Breakpoint Strategy**:
- Mobile: 320px+ (default styles)
- Tablet: 640px+ (sm: prefix)
- Desktop: 1024px+ (lg: prefix)

**Alternatives Considered**:
- CSS Modules: More verbose, requires more boilerplate
- Styled Components: Additional dependency, SSR complexity
- Plain CSS: Slower development, no utility shortcuts

---

## Decision 5: State Management Approach

**Decision**: React's built-in useState and useReducer (no external libraries)

**Rationale**:
- Constitution specifies "No state management libraries required beyond React's built-in features"
- Simple CRUD operations don't need complex state management
- Local component state sufficient for task list
- Reduces bundle size and complexity

**State Structure**:
```typescript
interface TaskListState {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  editingTaskId: string | null
}
```

**Alternatives Considered**:
- Redux/Zustand: Overkill for single-page task list
- React Context: Could add if state sharing needed across distant components
- Built-in state is simplest viable solution

---

## Decision 6: Form Handling Strategy

**Decision**: Controlled components with React state

**Rationale**:
- Direct control over form values for validation
- Immediate feedback on user input
- Consistent with client-side interaction model
- Simple implementation for 2 fields (title, description)

**Validation Rules** (from Backend Spec):
- Title: Required, non-empty, max 500 characters
- Description: Optional, max 5000 characters

**Alternatives Considered**:
- Uncontrolled forms with FormData: Less control over validation
- React Hook Form: Additional dependency for simple forms

---

## Decision 7: Error Handling Strategy

**Decision**: Layered error handling with user-friendly messages

**Rationale**:
- Spec requires "user-friendly error messages" (FR-011)
- Spec requires "Error messages are displayed for all failed API operations" (SC-007)
- Backend provides error messages in response body

**Layers**:
1. **API Client Layer**: Catches network/HTTP errors, normalizes format
2. **Component Layer**: Displays errors in UI with retry options
3. **Global Error Boundary**: Catches unexpected React errors

**Error Display**:
- Inline errors for form validation
- Toast/banner for API operation errors
- Full-page error state for initial load failure

---

## Decision 8: Loading State Strategy

**Decision**: Skeleton UI for initial load, inline spinners for operations

**Rationale**:
- Spec requires loading states for all operations (FR-010)
- Next.js loading.tsx for route-level loading
- Inline indicators for CRUD operations (non-blocking)

**Implementation**:
- `app/loading.tsx`: Skeleton layout for initial page load
- Operation buttons: Disabled state with spinner during API call
- Optimistic updates where appropriate (toggle complete)

---

## Decision 9: Default User ID Handling

**Decision**: Hardcoded UUID constant in environment variable

**Rationale**:
- Spec: "hardcoded user ID for all API requests" (FR-014)
- Environment variable allows easy change without code modification
- UUID format matches backend expectations
- Auth-ready: Replace with JWT claim when authentication added

**Implementation**:
```
NEXT_PUBLIC_DEFAULT_USER_ID=default-user
```

---

## Decision 10: Project Structure

**Decision**: Next.js App Router with organized component hierarchy

**Structure**:
```
frontend/
├── app/
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main task list page
│   ├── loading.tsx       # Loading skeleton
│   └── error.tsx         # Error boundary
├── components/
│   ├── TaskList.tsx      # Task list container
│   ├── TaskItem.tsx      # Individual task row
│   ├── TaskForm.tsx      # Create task form
│   ├── EditTaskModal.tsx # Edit dialog
│   └── DeleteConfirm.tsx # Delete confirmation
├── lib/
│   ├── api/
│   │   ├── client.ts     # API client base
│   │   ├── tasks.ts      # Task API functions
│   │   └── types.ts      # TypeScript types
│   └── utils/
│       └── date.ts       # Date formatting
├── .env.local            # Environment variables
├── .env.example          # Example env file
└── package.json
```

---

## Backend API Integration Points

Based on backend spec (001-backend-todo-api), the frontend will consume:

| Operation | Method | Endpoint | Frontend Function |
|-----------|--------|----------|-------------------|
| List Tasks | GET | `/api/users/{user_id}/tasks` | `getTasks()` |
| Create Task | POST | `/api/users/{user_id}/tasks` | `createTask()` |
| Get Task | GET | `/api/users/{user_id}/tasks/{id}` | `getTask()` |
| Update Task | PUT | `/api/users/{user_id}/tasks/{id}` | `updateTask()` |
| Toggle Complete | PATCH | `/api/users/{user_id}/tasks/{id}` | `toggleComplete()` |
| Delete Task | DELETE | `/api/users/{user_id}/tasks/{id}` | `deleteTask()` |

**Backend Running On**: `http://localhost:8000` (default)
**Frontend Variable**: `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

## Technology Versions Confirmed

| Technology | Version | Source |
|------------|---------|--------|
| Next.js | 16+ | Constitution mandate |
| React | 19+ | Included with Next.js 16 |
| TypeScript | Latest | Constitution (Type Safety) |
| Tailwind CSS | Latest | Constitution (Styling) |
| Node.js | 20+ | Spec dependency |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Backend unavailable | Error boundary shows friendly message, retry button |
| Slow network | Loading states, optimistic updates for toggle |
| CORS issues | Backend already configured for `allow_origins=["*"]` in development |
| API contract mismatch | Use TypeScript types matching backend models |

---

## Next Steps

1. Create data-model.md with Task interface and API types
2. Define API contracts in contracts/ directory
3. Generate quickstart.md with setup instructions
4. Complete plan.md with full architecture

**All NEEDS CLARIFICATION items resolved.**
