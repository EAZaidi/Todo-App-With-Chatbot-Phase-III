# Phase 1: Data Model & Database Schema

**Feature**: Backend Todo API & Persistence
**Branch**: `001-backend-todo-api`
**Date**: 2026-01-09
**Status**: Complete

## Database Schema

### Database: Neon Serverless PostgreSQL

**Connection**: Via `DATABASE_URL` environment variable
**Driver**: `asyncpg` (async PostgreSQL driver for Python)
**Schema**: `public` (default PostgreSQL schema)

---

## Entity: Task

### Table Name: `tasks`

### Columns

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| `id` | `INTEGER` | PRIMARY KEY, AUTO_INCREMENT | Auto-generated | Unique task identifier |
| `user_id` | `VARCHAR(255)` | NOT NULL, INDEX | None | User who owns the task |
| `title` | `VARCHAR(500)` | NOT NULL | None | Short task description |
| `description` | `TEXT` | NULL | `NULL` | Detailed task information (optional) |
| `completed` | `BOOLEAN` | NOT NULL | `FALSE` | Task completion status |
| `created_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP` | Task creation timestamp (UTC) |
| `updated_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP` | Last update timestamp (UTC) |

### Indexes

```sql
-- Primary key index (automatic)
CREATE UNIQUE INDEX tasks_pkey ON tasks (id);

-- User scoping index (for filtering tasks by user_id)
CREATE INDEX idx_tasks_user_id ON tasks (user_id);

-- Composite index for user tasks query optimization
CREATE INDEX idx_tasks_user_id_created_at ON tasks (user_id, created_at DESC);
```

**Rationale**:
- `idx_tasks_user_id`: All queries filter by user_id; this index is critical for performance
- `idx_tasks_user_id_created_at`: Optimizes "get all user tasks" query with implicit ordering by creation date

---

## SQLModel Model Definition

### File: `backend/src/models/task.py`

```python
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class Task(SQLModel, table=True):
    """
    Task entity representing a todo item.

    Used as both:
    - SQLAlchemy ORM model (table=True)
    - Pydantic schema for API validation and serialization
    """
    __tablename__ = "tasks"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # User ownership
    user_id: str = Field(max_length=255, index=True, nullable=False)

    # Task content
    title: str = Field(max_length=500, nullable=False)
    description: Optional[str] = Field(default=None, sa_column_kwargs={"type_": "TEXT"})

    # Status
    completed: bool = Field(default=False, nullable=False)

    # Timestamps (auto-managed)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
```

**Model Features**:
- **Dual Purpose**: Serves as both DB model and API schema (SQLModel magic)
- **Type Safety**: Full type hints for IDE autocomplete and mypy validation
- **Pydantic Validation**: Automatic validation on API requests (max_length, required fields)
- **Auto Timestamps**: `created_at` and `updated_at` set automatically via `default_factory`
- **Optional ID**: `id=None` for creation (DB auto-generates); present after insert
- **Optional Description**: `Optional[str]` allows null/omitted in requests

---

## API Request/Response Schemas

### Schema: TaskCreate (POST /api/users/{user_id}/tasks)

```python
from pydantic import BaseModel, Field, field_validator


class TaskCreate(BaseModel):
    """Schema for creating a new task."""
    title: str = Field(min_length=1, max_length=500, description="Task title (required, non-empty)")
    description: Optional[str] = Field(default=None, max_length=5000, description="Task description (optional)")

    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        """Validate title is not empty or whitespace-only."""
        if not v or not v.strip():
            raise ValueError('Title cannot be empty or whitespace')
        return v.strip()
```

**Validation Rules**:
- `title`: Required, 1-500 characters, cannot be empty/whitespace
- `description`: Optional, max 5000 characters

---

### Schema: TaskUpdate (PUT /api/users/{user_id}/tasks/{task_id})

```python
class TaskUpdate(BaseModel):
    """Schema for full task update (all fields required)."""
    title: str = Field(min_length=1, max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)
    completed: bool

    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Title cannot be empty or whitespace')
        return v.strip()
```

**Validation Rules**:
- All fields required (full replacement)
- `title`: Same validation as TaskCreate
- `completed`: Boolean (true/false)

---

### Schema: TaskPartialUpdate (PATCH /api/users/{user_id}/tasks/{task_id})

```python
class TaskPartialUpdate(BaseModel):
    """Schema for partial task update (all fields optional)."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)
    completed: Optional[bool] = Field(default=None)

    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError('Title cannot be empty or whitespace')
        return v.strip() if v else v
```

**Validation Rules**:
- All fields optional (partial update)
- If `title` provided, must be non-empty
- Only provided fields are updated; others remain unchanged

---

### Schema: TaskResponse (All GET/POST/PUT/PATCH responses)

```python
class TaskResponse(BaseModel):
    """Schema for task responses (includes all fields)."""
    id: int
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Enable ORM mode for SQLModel compatibility
```

**Response Format**:
- Includes all task fields including auto-generated `id` and timestamps
- `from_attributes=True`: Allows conversion from SQLModel Task instances
- Used for all success responses (201 Created, 200 OK)

---

## Data Flow

### Create Task (POST)
1. Client sends `TaskCreate` JSON → FastAPI validates → Pydantic model
2. Server creates `Task` model with user_id from path + validated data
3. SQLModel inserts into database → Database generates `id`, sets timestamps
4. Server returns `TaskResponse` with all fields (201 Created)

### Get Tasks (GET list)
1. Server queries: `SELECT * FROM tasks WHERE user_id = ?`
2. SQLModel returns list of `Task` instances
3. Server converts to `List[TaskResponse]` → JSON (200 OK)

### Update Task (PUT/PATCH)
1. Server queries: `SELECT * FROM tasks WHERE id = ? AND user_id = ?`
2. If not found → 404 Not Found
3. Server updates fields from `TaskUpdate` or `TaskPartialUpdate`
4. Server updates `updated_at` timestamp
5. SQLModel commits changes
6. Server returns updated `TaskResponse` (200 OK)

### Delete Task (DELETE)
1. Server queries: `SELECT * FROM tasks WHERE id = ? AND user_id = ?`
2. If not found → 404 Not Found
3. SQLModel deletes row
4. Server returns 204 No Content (empty body)

---

## Database Initialization

### Automatic Schema Creation

```python
# backend/src/database/connection.py
from sqlmodel import create_engine, SQLModel
from backend.src.models.task import Task  # Import registers table


async def init_db():
    """Initialize database schema (create tables if not exist)."""
    engine = create_async_engine(DATABASE_URL, echo=True)

    async with engine.begin() as conn:
        # Create all tables defined with SQLModel
        await conn.run_sync(SQLModel.metadata.create_all)
```

**Behavior**:
- Runs on application startup
- Creates `tasks` table if it doesn't exist
- Idempotent: Safe to run multiple times
- No migrations needed for initial schema (Phase 1 only)

---

## Data Validation Rules

### Field-Level Validation

| Field | Validation Rule | Error Response |
|-------|----------------|----------------|
| `title` | Required, 1-500 chars, non-empty | 400 Bad Request: "Title cannot be empty" |
| `description` | Optional, max 5000 chars | 400 Bad Request: "Description too long" |
| `completed` | Boolean (true/false) | 400 Bad Request: "Invalid boolean value" |
| `user_id` | Required (from path), non-empty | 400 Bad Request: "User ID required" |

### Entity-Level Validation

- **Task Ownership**: All operations check `WHERE user_id = ?` (data isolation)
- **Task Existence**: GET/PUT/PATCH/DELETE return 404 if task not found
- **Cross-User Access**: Prevented by combining `id` and `user_id` in WHERE clauses

---

## Error Responses

### 400 Bad Request (Validation Failure)

```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "Title cannot be empty or whitespace",
      "type": "value_error"
    }
  ]
}
```

### 404 Not Found (Task Not Found)

```json
{
  "detail": "Task not found"
}
```

### 500 Internal Server Error (Database Failure)

```json
{
  "detail": "Internal server error"
}
```

**Error Handling Strategy**:
- Pydantic validation errors → 400 with detailed field-level errors
- Task not found → 404 with simple message
- Database exceptions → 500 with generic message (no internal details leaked)

---

## Data Isolation & Security

### User Scoping (All Operations)

```python
# All queries include user_id filter
# Example: Get all tasks for a user
tasks = await session.exec(
    select(Task).where(Task.user_id == user_id)
).all()

# Example: Get single task (prevents cross-user access)
task = await session.exec(
    select(Task).where(Task.id == task_id, Task.user_id == user_id)
).first()
```

**Security Properties**:
- No task operation possible without user_id
- User A cannot access User B's tasks (enforced by AND clause)
- Database-level enforcement via WHERE clauses (not application logic only)

### SQL Injection Prevention

- **Parameterized Queries**: SQLModel/SQLAlchemy uses parameter binding (no string concatenation)
- **No Raw SQL**: All queries via SQLModel query builder
- **Type Safety**: Python type hints prevent incorrect types

---

## Performance Considerations

### Indexes (Query Optimization)

```sql
-- User tasks list query: SELECT * FROM tasks WHERE user_id = ?
-- Uses: idx_tasks_user_id (covers user_id column)

-- Single task query: SELECT * FROM tasks WHERE id = ? AND user_id = ?
-- Uses: tasks_pkey (id) + idx_tasks_user_id (user_id)
```

### Connection Pooling

- **Async Engine**: Uses asyncpg connection pool
- **Pool Size**: Default 10 connections (configurable)
- **Timeout**: 30 seconds (configurable)

### Query Efficiency

- **Batch Operations**: Not needed (Phase 1 scope: individual CRUD only)
- **N+1 Prevention**: No relationships in Phase 1 (single table only)
- **Pagination**: Not implemented (Phase 1 scope: full list retrieval)

---

## Future Enhancements (Out of Scope for Phase 1)

### Database Migrations
- **Tool**: Alembic (when schema changes needed)
- **Current**: `SQLModel.metadata.create_all()` sufficient for initial schema

### Soft Delete
- **Future**: Add `deleted_at` timestamp column
- **Current**: Hard delete (permanent removal)

### Audit Logging
- **Future**: Track who/when/what changed
- **Current**: Only `updated_at` timestamp

### Advanced Queries
- **Future**: Search, filtering, sorting, pagination
- **Current**: Simple list retrieval only

---

## Phase 1 Data Model Checklist

- [x] Database schema defined (table structure, columns, types, constraints)
- [x] Indexes specified for query optimization (user_id, composite index)
- [x] SQLModel Task model defined with validation rules
- [x] API request schemas defined (TaskCreate, TaskUpdate, TaskPartialUpdate)
- [x] API response schema defined (TaskResponse)
- [x] Data flow documented (create, read, update, delete)
- [x] Database initialization strategy defined (auto-create on startup)
- [x] Validation rules documented (field-level and entity-level)
- [x] Error responses specified (400, 404, 500)
- [x] Data isolation and security strategy documented
- [x] Performance considerations addressed (indexes, connection pooling)

**Status**: ✅ Phase 1 Data Model Complete - Ready for API Contracts
