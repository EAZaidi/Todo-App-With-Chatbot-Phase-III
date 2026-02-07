"""
Unit tests for Task model and schemas.

Tests:
- Task model validation (required fields, max lengths, defaults)
- TaskCreate schema validation
- TaskUpdate schema validation
- TaskPartialUpdate schema validation
- Timestamp defaults
"""

import pytest
from datetime import datetime
from pydantic import ValidationError
from backend.src.models.task import (
    Task,
    TaskCreate,
    TaskUpdate,
    TaskPartialUpdate,
    TaskResponse,
)


class TestTaskModel:
    """Test Task SQLModel validation."""

    def test_task_creation_with_all_fields(self):
        """Test creating a Task with all fields."""
        task = Task(
            user_id="user123",
            title="Test Task",
            description="Test Description",
            completed=False,
        )
        assert task.user_id == "user123"
        assert task.title == "Test Task"
        assert task.description == "Test Description"
        assert task.completed is False
        assert isinstance(task.created_at, datetime)
        assert isinstance(task.updated_at, datetime)

    def test_task_creation_with_minimal_fields(self):
        """Test creating a Task with only required fields."""
        task = Task(user_id="user123", title="Test Task")
        assert task.user_id == "user123"
        assert task.title == "Test Task"
        assert task.description is None
        assert task.completed is False  # Default value
        assert isinstance(task.created_at, datetime)
        assert isinstance(task.updated_at, datetime)

    def test_task_defaults(self):
        """Test Task model default values."""
        task = Task(user_id="user123", title="Test Task")
        assert task.completed is False
        assert task.description is None
        assert task.id is None  # Not assigned until DB insert

    def test_task_max_lengths(self):
        """Test Task model max length constraints."""
        # Title max length: 500 chars
        long_title = "x" * 500
        task = Task(user_id="user123", title=long_title)
        assert len(task.title) == 500

        # Description max length: 5000 chars
        long_description = "x" * 5000
        task = Task(user_id="user123", title="Test", description=long_description)
        assert len(task.description) == 5000


class TestTaskCreateSchema:
    """Test TaskCreate schema validation."""

    def test_valid_task_create(self):
        """Test creating TaskCreate with valid data."""
        data = {"title": "Test Task", "description": "Test Description"}
        task_create = TaskCreate(**data)
        assert task_create.title == "Test Task"
        assert task_create.description == "Test Description"

    def test_task_create_minimal(self):
        """Test creating TaskCreate with only required fields."""
        data = {"title": "Test Task"}
        task_create = TaskCreate(**data)
        assert task_create.title == "Test Task"
        assert task_create.description is None

    def test_task_create_title_required(self):
        """Test that title is required."""
        with pytest.raises(ValidationError) as exc_info:
            TaskCreate(description="Test")
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("title",) and e["type"] == "missing" for e in errors)

    def test_task_create_title_empty_string(self):
        """Test that empty title is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            TaskCreate(title="")
        errors = exc_info.value.errors()
        assert any("title" in str(e["loc"]) for e in errors)

    def test_task_create_title_whitespace_only(self):
        """Test that whitespace-only title is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            TaskCreate(title="   ")
        errors = exc_info.value.errors()
        assert any("whitespace" in str(e["msg"]).lower() for e in errors)

    def test_task_create_title_too_long(self):
        """Test that title exceeding max length is rejected."""
        long_title = "x" * 501
        with pytest.raises(ValidationError) as exc_info:
            TaskCreate(title=long_title)
        errors = exc_info.value.errors()
        assert any("title" in str(e["loc"]) for e in errors)

    def test_task_create_description_too_long(self):
        """Test that description exceeding max length is rejected."""
        long_description = "x" * 5001
        with pytest.raises(ValidationError) as exc_info:
            TaskCreate(title="Test", description=long_description)
        errors = exc_info.value.errors()
        assert any("description" in str(e["loc"]) for e in errors)

    def test_task_create_title_stripped(self):
        """Test that title is stripped of leading/trailing whitespace."""
        task_create = TaskCreate(title="  Test Task  ")
        assert task_create.title == "Test Task"


class TestTaskUpdateSchema:
    """Test TaskUpdate schema validation."""

    def test_valid_task_update(self):
        """Test creating TaskUpdate with valid data."""
        data = {
            "title": "Updated Task",
            "description": "Updated Description",
            "completed": True,
        }
        task_update = TaskUpdate(**data)
        assert task_update.title == "Updated Task"
        assert task_update.description == "Updated Description"
        assert task_update.completed is True

    def test_task_update_all_fields_required(self):
        """Test that all fields are required for TaskUpdate."""
        # Missing completed
        with pytest.raises(ValidationError) as exc_info:
            TaskUpdate(title="Test", description="Test")
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("completed",) and e["type"] == "missing" for e in errors)

    def test_task_update_title_empty(self):
        """Test that empty title is rejected."""
        with pytest.raises(ValidationError) as exc_info:
            TaskUpdate(title="", description="Test", completed=False)
        errors = exc_info.value.errors()
        assert any("title" in str(e["loc"]) for e in errors)

    def test_task_update_title_stripped(self):
        """Test that title is stripped of leading/trailing whitespace."""
        task_update = TaskUpdate(
            title="  Updated Task  ", description="Test", completed=False
        )
        assert task_update.title == "Updated Task"


class TestTaskPartialUpdateSchema:
    """Test TaskPartialUpdate schema validation."""

    def test_partial_update_single_field(self):
        """Test updating only one field."""
        # Update only completed
        partial = TaskPartialUpdate(completed=True)
        assert partial.completed is True
        assert partial.title is None
        assert partial.description is None

        # Update only title
        partial = TaskPartialUpdate(title="New Title")
        assert partial.title == "New Title"
        assert partial.completed is None
        assert partial.description is None

    def test_partial_update_multiple_fields(self):
        """Test updating multiple fields."""
        partial = TaskPartialUpdate(title="New Title", completed=True)
        assert partial.title == "New Title"
        assert partial.completed is True
        assert partial.description is None

    def test_partial_update_all_fields(self):
        """Test updating all fields."""
        partial = TaskPartialUpdate(
            title="New Title", description="New Description", completed=True
        )
        assert partial.title == "New Title"
        assert partial.description == "New Description"
        assert partial.completed is True

    def test_partial_update_no_fields(self):
        """Test creating TaskPartialUpdate with no fields (all None)."""
        partial = TaskPartialUpdate()
        assert partial.title is None
        assert partial.description is None
        assert partial.completed is None

    def test_partial_update_title_empty_rejected(self):
        """Test that empty title is rejected if provided."""
        with pytest.raises(ValidationError) as exc_info:
            TaskPartialUpdate(title="")
        errors = exc_info.value.errors()
        assert any("title" in str(e["loc"]) for e in errors)

    def test_partial_update_title_whitespace_rejected(self):
        """Test that whitespace-only title is rejected if provided."""
        with pytest.raises(ValidationError) as exc_info:
            TaskPartialUpdate(title="   ")
        errors = exc_info.value.errors()
        assert any("whitespace" in str(e["msg"]).lower() for e in errors)

    def test_partial_update_title_stripped(self):
        """Test that title is stripped if provided."""
        partial = TaskPartialUpdate(title="  New Title  ")
        assert partial.title == "New Title"


class TestTaskResponseSchema:
    """Test TaskResponse schema."""

    def test_task_response_from_task_model(self):
        """Test creating TaskResponse from Task model."""
        task = Task(
            id=1,
            user_id="user123",
            title="Test Task",
            description="Test Description",
            completed=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        response = TaskResponse.model_validate(task)
        assert response.id == 1
        assert response.user_id == "user123"
        assert response.title == "Test Task"
        assert response.description == "Test Description"
        assert response.completed is False
        assert isinstance(response.created_at, datetime)
        assert isinstance(response.updated_at, datetime)

    def test_task_response_all_fields_required(self):
        """Test that all fields are required in TaskResponse."""
        with pytest.raises(ValidationError):
            TaskResponse(id=1, user_id="user123", title="Test")
