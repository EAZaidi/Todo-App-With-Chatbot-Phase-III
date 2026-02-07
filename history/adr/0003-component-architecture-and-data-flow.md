# ADR-0003: Component Architecture and Data Flow

**Status**: Accepted
**Date**: 2026-01-10
**Feature**: 002-frontend-api

## Context

The task management interface requires a component structure that balances:

- Single Responsibility Principle (each component has one clear purpose)
- Efficient data flow without unnecessary prop drilling
- Reusability of UI components
- Clear separation between data fetching and presentation
- Support for optimistic updates (toggle completion must feel instant)
- Loading and error states at appropriate granularity

The spec requires "UI updates immediately without requiring a page reload" and "toggle completion feels instant (<500ms perceived latency)".

## Decision

We will implement a three-tier component architecture:

1. **Container Component** (TaskListContainer): Manages state and API interactions
2. **Presentation Components** (TaskList, TaskItem, TaskForm): Render UI based on props
3. **Utility Components** (LoadingSpinner, ErrorMessage, EmptyState): Shared UI elements

### Component Hierarchy

```
app/page.tsx (Server Component)
└── TaskListContainer (Client Component) - State owner
    ├── TaskForm - Create tasks
    ├── TaskList - Display list
    │   └── TaskItem (multiple) - Individual row
    ├── EditTaskModal - Edit dialog
    ├── DeleteConfirmDialog - Confirmation
    ├── LoadingSpinner - Loading state
    └── ErrorMessage - Error display
```

### Data Flow Pattern

```
User Action → Component Event Handler → API Call → Backend
                                            ↓
                                      Response
                                            ↓
                                  Update State → Re-render
                                            ↑
                          Optimistic Update (toggle only)
```

### Optimistic Update Strategy

For the **toggle completion** operation only:
1. Immediately update UI (flip checkbox state)
2. Send API request in background
3. If API fails, revert UI and show error

For other operations (create, update, delete):
- Show loading indicator
- Wait for API confirmation
- Update UI on success

## Consequences

### Positive

- **Single Responsibility**: Each component has one clear job (Container = state, TaskItem = display, TaskForm = input)
- **Instant Feedback**: Optimistic updates make toggle feel immediate, meeting <500ms target
- **Testability**: Presentation components are pure functions of props, easy to test
- **Reusability**: LoadingSpinner, ErrorMessage can be used across features
- **Maintainability**: Clear separation between data logic (container) and UI (presentational)
- **Performance**: Presentational components can be memoized with React.memo if needed
- **Developer Experience**: Predictable props flow makes debugging easier

### Negative

- **Optimistic Update Complexity**: Toggle operation requires rollback logic if API fails
- **Prop Drilling**: TaskListContainer passes callbacks through TaskList to TaskItem (3 levels)
- **State Colocation**: All state in one component could become unwieldy if feature expands
- **Boilerplate**: More components means more files to maintain
- **Inconsistent UX**: Toggle feels instant, but create/edit/delete show loading (necessary tradeoff)

## Alternatives Considered

### 1. Flat Component Structure (All in One)
- **Rejected**: Violates Single Responsibility Principle
- Simpler file structure with fewer components
- Would create a monolithic 500+ line component
- Hard to test, hard to understand, hard to maintain

### 2. Pessimistic Updates for All Operations
- **Rejected**: Toggle completion would feel slow (network latency visible)
- Consistent UX (everything shows loading)
- Simpler implementation (no rollback logic needed)
- Fails spec requirement: "toggle feels instant"

### 3. Optimistic Updates for All Operations
- **Rejected**: Create/edit/delete are complex and error-prone if rolled back
- Would feel very fast but confusing if operations fail
- Toggle is safe to revert (single boolean), but create/edit have validation failures that need UI feedback
- Risk: User sees task created, then it disappears on validation error

### 4. Compound Components Pattern
- **Considered**: TaskList.Container, TaskList.Item, TaskList.Form as nested components
- More idiomatic React pattern for related components
- **Not Chosen**: Adds abstraction complexity for minimal benefit in current scope
- Could revisit if component relationships become more complex

### 5. Render Props or Slots Pattern
- **Rejected**: Overengineering for current requirements
- Would provide ultimate flexibility for customization
- Harder to understand for developers unfamiliar with advanced patterns

## References

- [Plan Document](C:\Users\USER\Desktop\Todo-App\Todo-App-Phase-2\specs\002-frontend-api\plan.md#component-architecture)
- [Research Document](C:\Users\USER\Desktop\Todo-App\Todo-App-Phase-2\specs\002-frontend-api\research.md#decision-2-client-side-data-fetching-vs-server-components)
- [Component Contracts](C:\Users\USER\Desktop\Todo-App\Todo-App-Phase-2\specs\002-frontend-api\contracts\component-contracts.md)
- [Data Model](C:\Users\USER\Desktop\Todo-App\Todo-App-Phase-2\specs\002-frontend-api\data-model.md)
