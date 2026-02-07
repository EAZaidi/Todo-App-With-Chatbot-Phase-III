# ADR-0002: State and Data Management Strategy

**Status**: Accepted
**Date**: 2026-01-10
**Feature**: 002-frontend-api

## Context

The frontend application needs to manage task data, loading states, error states, and UI state across multiple components. Key requirements include:

- CRUD operations on tasks with immediate UI feedback
- Consistent error handling across all API interactions
- Loading indicators for async operations
- Single source of truth for API configuration
- Support for future authentication integration
- No external state management libraries allowed per constitution

The application must balance simplicity with maintainability while preparing for future auth requirements.

## Decision

We will implement a layered state and data management strategy:

1. **React Built-in State** (`useState`, `useReducer`) for all component state
2. **Centralized API Client Module** for all backend communication
3. **No External State Management Libraries** (no Redux, Zustand, MobX)

### Architecture

```
lib/
├── api/
│   ├── client.ts       # Base fetch wrapper with error handling
│   ├── tasks.ts        # Task-specific API functions (getTasks, createTask, etc.)
│   └── types.ts        # Shared TypeScript interfaces
```

### State Management Pattern

- **Local Component State**: TaskListContainer manages tasks array, loading, and error states
- **Centralized API Logic**: All API calls go through lib/api/client.ts
- **Environment Configuration**: NEXT_PUBLIC_API_URL and NEXT_PUBLIC_DEFAULT_USER_ID in .env.local
- **Error Normalization**: API client converts all errors to consistent format
- **Auth-Ready Design**: API client includes placeholder for Authorization header injection

## Consequences

### Positive

- **Simplicity**: React's built-in hooks are sufficient for single-page task list, reducing complexity
- **Bundle Size**: No additional state management library reduces JavaScript bundle by ~20-50KB
- **Constitution Compliance**: Adheres to "no state management libraries required beyond React's built-in features"
- **Maintainability**: Centralized API client provides single point for error handling, auth, and configuration
- **Type Safety**: Shared TypeScript interfaces ensure frontend/backend contract alignment
- **Testability**: Pure functions in API layer are easy to unit test with mocks
- **Future-Ready**: API client structure supports adding JWT authentication headers with minimal changes

### Negative

- **State Duplication Risk**: Without global state, multiple components needing same data might duplicate fetches
- **Prop Drilling**: Deep component trees would require passing callbacks through multiple levels
- **No Caching**: Unlike React Query/SWR, no automatic request deduplication or background revalidation
- **Manual Optimization**: Developers must implement optimistic updates manually (e.g., toggle completion)

## Alternatives Considered

### 1. Redux Toolkit
- **Rejected**: Constitution explicitly excludes external state management libraries
- Would provide predictable state updates and devtools
- Overkill for simple CRUD operations; adds ~40KB to bundle
- Learning curve for developers unfamiliar with Redux

### 2. Zustand or Jotai
- **Rejected**: Violates constitution's "React built-in features only" requirement
- Lighter than Redux (~3-5KB) but still an external dependency
- Would provide global state without prop drilling

### 3. React Context for Global State
- **Considered**: Valid React built-in feature
- **Not Chosen**: Unnecessary for current scope (single-page app with collocated state)
- Could be added later if state sharing across distant components becomes needed
- Would introduce re-render performance considerations

### 4. Direct Fetch Calls in Components
- **Rejected**: Duplicates error handling, environment variable access, and type definitions
- Simpler initial implementation but unmaintainable at scale
- No single point for adding authentication headers

### 5. SWR or React Query
- **Rejected**: Excellent libraries but violate constitution constraint
- Would provide automatic caching, revalidation, and loading states
- Adds ~12KB (SWR) or ~40KB (React Query) to bundle

## References

- [Plan Document](C:\Users\USER\Desktop\Todo-App\Todo-App-Phase-2\specs\002-frontend-api\plan.md#adr-3-no-external-state-management)
- [Research Document](C:\Users\USER\Desktop\Todo-App\Todo-App-Phase-2\specs\002-frontend-api\research.md#decision-5-state-management-approach)
- [API Client Contract](C:\Users\USER\Desktop\Todo-App\Todo-App-Phase-2\specs\002-frontend-api\contracts\api-client.md)
- [Constitution](C:\Users\USER\Desktop\Todo-App\Todo-App-Phase-2\.specify\memory\constitution.md) - State Management Policy
