"""
Task model and schemas for Todo API.

Includes:
- Task: SQLModel ORM model (database table)
- TaskCreate: Pydantic schema for creating tasks
- TaskUpdate: Pydantic schema for full updates (PUT)
- TaskPartialUpdate: Pydantic schema for partial updates (PATCH)
- TaskResponse: Pydantic schema for API responses
"""

from datetime import datetime, date
from typing import Optional, Literal
from sqlmodel import Field, SQLModel
from pydantic import BaseModel, field_validator

# Priority levels
PriorityType = Literal["low", "medium", "high"]


class Task(SQLModel, table=True):
    """
    Task entity representing a todo item.

    Used as both:
    - SQLAlchemy ORM model (table=True) for database operations
    - Pydantic schema for data validation and serialization

    Attributes:
        id: Unique task identifier (auto-generated)
        user_id: User who owns the task (for data isolation)
        title: Short task description (required, 1-500 chars)
        description: Detailed task information (optional, max 5000 chars)
        completed: Task completion status (default: False)
        priority: Task priority level (low, medium, high)
        due_date: Optional due date for the task
        created_at: Task creation timestamp (UTC, auto-generated)
        updated_at: Last update timestamp (UTC, auto-managed)
    """

    __tablename__ = "tasks"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # User ownership (for data isolation)
    user_id: str = Field(max_length=255, index=True, nullable=False)

    # Task content
    title: str = Field(max_length=500, nullable=False)
    description: Optional[str] = Field(default=None, max_length=5000)

    # Status and priority
    completed: bool = Field(default=False, nullable=False)
    priority: str = Field(default="medium", max_length=10, nullable=False)
    due_date: Optional[date] = Field(default=None, nullable=True)

    # Timestamps (auto-managed)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class TaskCreate(BaseModel):
    """
    Schema for creating a new task.

    Used for POST /api/users/{user_id}/tasks request body.

    Validation:
    - title: Required, 1-500 characters, cannot be empty or whitespace
    - description: Optional, max 5000 characters
    - priority: Optional, one of "low", "medium", "high" (default: "medium")
    - due_date: Optional, date in YYYY-MM-DD format
    """

    title: str = Field(min_length=1, max_length=500, description="Task title (required, non-empty)")
    description: Optional[str] = Field(default=None, max_length=5000, description="Task description (optional)")
    priority: Optional[str] = Field(default="medium", description="Task priority: low, medium, high")
    due_date: Optional[date] = Field(default=None, description="Due date (YYYY-MM-DD)")

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        """Validate title is not empty or whitespace-only."""
        if not v or not v.strip():
            raise ValueError("Title cannot be empty or whitespace")
        return v.strip()

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> str:
        """Validate priority is one of the allowed values."""
        allowed = ["low", "medium", "high"]
        if v is None:
            return "medium"
        if v.lower() not in allowed:
            raise ValueError(f"Priority must be one of: {', '.join(allowed)}")
        return v.lower()


class TaskUpdate(BaseModel):
    """
    Schema for full task update (PUT).

    Used for PUT /api/users/{user_id}/tasks/{task_id} request body.
    All fields are required (full replacement).

    Validation:
    - title: Required, 1-500 characters, cannot be empty or whitespace
    - description: Optional (can be null), max 5000 characters
    - completed: Boolean (true/false)
    - priority: One of "low", "medium", "high"
    - due_date: Optional date
    """

    title: str = Field(min_length=1, max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)
    completed: bool
    priority: str = Field(default="medium")
    due_date: Optional[date] = Field(default=None)

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        """Validate title is not empty or whitespace-only."""
        if not v or not v.strip():
            raise ValueError("Title cannot be empty or whitespace")
        return v.strip()

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        """Validate priority is one of the allowed values."""
        allowed = ["low", "medium", "high"]
        if v.lower() not in allowed:
            raise ValueError(f"Priority must be one of: {', '.join(allowed)}")
        return v.lower()


class TaskPartialUpdate(BaseModel):
    """
    Schema for partial task update (PATCH).

    Used for PATCH /api/users/{user_id}/tasks/{task_id} request body.
    All fields are optional (only provided fields are updated).

    Validation:
    - title: If provided, must be 1-500 characters and non-empty
    - description: If provided, max 5000 characters
    - completed: If provided, must be boolean
    - priority: If provided, must be one of "low", "medium", "high"
    - due_date: If provided, must be a valid date
    """

    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)
    completed: Optional[bool] = Field(default=None)
    priority: Optional[str] = Field(default=None)
    due_date: Optional[date] = Field(default=None)

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: Optional[str]) -> Optional[str]:
        """Validate title is not empty or whitespace-only if provided."""
        if v is not None and (not v or not v.strip()):
            raise ValueError("Title cannot be empty or whitespace")
        return v.strip() if v else v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        """Validate priority is one of the allowed values if provided."""
        if v is None:
            return v
        allowed = ["low", "medium", "high"]
        if v.lower() not in allowed:
            raise ValueError(f"Priority must be one of: {', '.join(allowed)}")
        return v.lower()


class TaskResponse(BaseModel):
    """
    Schema for task responses.

    Used for all API responses (GET, POST, PUT, PATCH).
    Includes all task fields including auto-generated id and timestamps.

    Configuration:
    - from_attributes=True: Enables ORM mode for SQLModel compatibility
    """

    id: int
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    priority: str
    due_date: Optional[date]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
