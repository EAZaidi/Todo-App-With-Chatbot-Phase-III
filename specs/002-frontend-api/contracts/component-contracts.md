# Component Contracts: Frontend UI Components

**Feature**: 002-frontend-api
**Date**: 2026-01-10

## Overview

This document defines the interface contracts for all UI components in the frontend application. Each component has defined props, events, and expected behaviors.

---

## Component Hierarchy

```
app/page.tsx (Server Component)
└── TaskListContainer (Client Component)
    ├── TaskForm
    │   └── Form inputs (title, description)
    ├── TaskList
    │   └── TaskItem (multiple)
    │       ├── Completion toggle
    │       ├── Edit button
    │       └── Delete button
    ├── EditTaskModal (conditional)
    ├── DeleteConfirmDialog (conditional)
    ├── LoadingSpinner (conditional)
    └── ErrorMessage (conditional)
```

---

## Component Contracts

### 1. TaskListContainer

**Purpose**: Main container managing task state and API interactions.

**Type**: Client Component (`'use client'`)

```typescript
interface TaskListContainerProps {
  /** Initial tasks loaded from server component */
  initialTasks: Task[];
}

// Events emitted internally (no external events)

// State managed:
// - tasks: Task[]
// - isLoading: boolean
// - error: string | null
// - editingTask: Task | null
// - deletingTaskId: number | null
```

**Behavior**:
- Fetches fresh tasks on mount
- Handles all CRUD operations
- Manages loading and error states
- Coordinates modal visibility

---

### 2. TaskForm

**Purpose**: Form for creating new tasks.

**Type**: Client Component

```typescript
interface TaskFormProps {
  /** Called when form is submitted with valid data */
  onSubmit: (data: TaskCreateRequest) => Promise<void>;

  /** Whether form submission is in progress */
  isSubmitting: boolean;

  /** Error message to display (if any) */
  error?: string | null;
}
```

**Behavior**:
- Validates title is non-empty before submit
- Clears form on successful submission
- Shows inline validation errors
- Disables submit button while submitting

---

### 3. TaskList

**Purpose**: Displays list of tasks.

**Type**: Client Component

```typescript
interface TaskListProps {
  /** Array of tasks to display */
  tasks: Task[];

  /** Called when completion toggle is clicked */
  onToggleComplete: (taskId: number, completed: boolean) => Promise<void>;

  /** Called when edit button is clicked */
  onEdit: (task: Task) => void;

  /** Called when delete button is clicked */
  onDelete: (taskId: number) => void;

  /** Set of task IDs with pending operations */
  pendingOperations: Set<number>;
}
```

**Behavior**:
- Renders empty state when no tasks
- Maps tasks to TaskItem components
- Passes callbacks to each TaskItem

---

### 4. TaskItem

**Purpose**: Single task row with actions.

**Type**: Client Component

```typescript
interface TaskItemProps {
  /** Task data to display */
  task: Task;

  /** Called when completion toggle is clicked */
  onToggleComplete: () => Promise<void>;

  /** Called when edit button is clicked */
  onEdit: () => void;

  /** Called when delete button is clicked */
  onDelete: () => void;

  /** Whether an operation is pending for this task */
  isPending: boolean;
}
```

**Behavior**:
- Displays title, description (if exists), completion status
- Visual distinction for completed tasks (strikethrough, opacity)
- Shows human-readable created date
- Disables actions while operation pending

---

### 5. EditTaskModal

**Purpose**: Modal dialog for editing task details.

**Type**: Client Component

```typescript
interface EditTaskModalProps {
  /** Task being edited */
  task: Task;

  /** Whether modal is visible */
  isOpen: boolean;

  /** Called when save is clicked */
  onSave: (data: TaskUpdateRequest) => Promise<void>;

  /** Called when cancel or close is clicked */
  onClose: () => void;

  /** Whether save operation is in progress */
  isSaving: boolean;

  /** Error message to display (if any) */
  error?: string | null;
}
```

**Behavior**:
- Pre-fills form with current task values
- Validates title before save
- Closes on successful save
- Shows error inline on failure

---

### 6. DeleteConfirmDialog

**Purpose**: Confirmation before permanent deletion.

**Type**: Client Component

```typescript
interface DeleteConfirmDialogProps {
  /** Task being deleted (for display) */
  taskTitle: string;

  /** Whether dialog is visible */
  isOpen: boolean;

  /** Called when confirm button is clicked */
  onConfirm: () => Promise<void>;

  /** Called when cancel is clicked */
  onCancel: () => void;

  /** Whether delete operation is in progress */
  isDeleting: boolean;
}
```

**Behavior**:
- Displays task title for confirmation
- Shows "Deleting..." state during operation
- Closes on successful deletion

---

### 7. LoadingSpinner

**Purpose**: Loading indicator for async operations.

**Type**: Client Component (can be Server Component if no interactivity)

```typescript
interface LoadingSpinnerProps {
  /** Size variant */
  size?: 'small' | 'medium' | 'large';

  /** Optional label text */
  label?: string;
}
```

**Behavior**:
- Displays animated spinner
- Accessible (aria-busy, role="status")

---

### 8. ErrorMessage

**Purpose**: Display error messages to user.

**Type**: Client Component

```typescript
interface ErrorMessageProps {
  /** Error message to display */
  message: string;

  /** Called when retry button is clicked (optional) */
  onRetry?: () => void;

  /** Called when dismiss button is clicked (optional) */
  onDismiss?: () => void;
}
```

**Behavior**:
- Displays error with icon
- Shows retry button if onRetry provided
- Shows dismiss button if onDismiss provided

---

### 9. EmptyState

**Purpose**: Display when no tasks exist.

**Type**: Client Component (can be Server Component)

```typescript
interface EmptyStateProps {
  /** Primary message */
  title: string;

  /** Secondary message */
  description?: string;
}
```

**Default Content**:
```
title: "No tasks yet"
description: "Create your first task to get started!"
```

---

## Styling Contracts

### Tailwind CSS Classes by Component

| Component | Key Classes |
|-----------|-------------|
| TaskListContainer | `container mx-auto px-4 py-8 max-w-2xl` |
| TaskForm | `flex gap-2 mb-6` |
| TaskList | `space-y-2` |
| TaskItem | `flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm border` |
| TaskItem (completed) | `opacity-60 line-through` |
| EditTaskModal | `fixed inset-0 bg-black/50 flex items-center justify-center` |
| LoadingSpinner | `animate-spin h-5 w-5 border-2 border-blue-500 rounded-full` |
| ErrorMessage | `bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded` |

### Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Default | 320px+ | Single column, full width |
| sm | 640px+ | Slightly larger padding |
| md | 768px+ | Centered container |
| lg | 1024px+ | Max-width constraint |

---

## Accessibility Contracts

### ARIA Requirements

| Component | ARIA Attributes |
|-----------|-----------------|
| TaskItem checkbox | `role="checkbox"`, `aria-checked` |
| Edit button | `aria-label="Edit task"` |
| Delete button | `aria-label="Delete task"` |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| LoadingSpinner | `role="status"`, `aria-busy="true"` |
| ErrorMessage | `role="alert"` |

### Keyboard Navigation

| Action | Key |
|--------|-----|
| Toggle task completion | Space/Enter on checkbox |
| Submit form | Enter in input |
| Close modal | Escape |
| Navigate between tasks | Tab |
