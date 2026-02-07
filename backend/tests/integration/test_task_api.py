"""
Integration tests for Task API endpoints.

Tests all 6 REST endpoints:
- POST /api/users/{user_id}/tasks - Create task
- GET /api/users/{user_id}/tasks - List all tasks
- GET /api/users/{user_id}/tasks/{task_id} - Get single task
- PUT /api/users/{user_id}/tasks/{task_id} - Full update
- PATCH /api/users/{user_id}/tasks/{task_id} - Partial update
- DELETE /api/users/{user_id}/tasks/{task_id} - Delete task

Uses httpx AsyncClient for async API testing.
"""

import pytest
from httpx import AsyncClient
from backend.src.main import app


@pytest.fixture
def test_user_id() -> str:
    """Fixture providing a test user ID."""
    return "test-user-123"


@pytest.fixture
def other_user_id() -> str:
    """Fixture providing a different user ID for isolation tests."""
    return "other-user-456"


class TestCreateTask:
    """Test POST /api/users/{user_id}/tasks endpoint."""

    @pytest.mark.asyncio
    async def test_create_task_success(self, test_user_id: str):
        """Test creating a task with valid data."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "Test Task", "description": "Test Description"},
            )
            assert response.status_code == 201
            data = response.json()
            assert data["title"] == "Test Task"
            assert data["description"] == "Test Description"
            assert data["user_id"] == test_user_id
            assert data["completed"] is False
            assert "id" in data
            assert "created_at" in data
            assert "updated_at" in data

    @pytest.mark.asyncio
    async def test_create_task_minimal(self, test_user_id: str):
        """Test creating a task with only required fields."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "Minimal Task"},
            )
            assert response.status_code == 201
            data = response.json()
            assert data["title"] == "Minimal Task"
            assert data["description"] is None
            assert data["completed"] is False

    @pytest.mark.asyncio
    async def test_create_task_missing_title(self, test_user_id: str):
        """Test that creating task without title returns 400."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"description": "No title"},
            )
            assert response.status_code == 400  # Validation error

    @pytest.mark.asyncio
    async def test_create_task_empty_title(self, test_user_id: str):
        """Test that creating task with empty title returns 400."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": ""},
            )
            assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_create_task_whitespace_title(self, test_user_id: str):
        """Test that creating task with whitespace-only title returns 400."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "   "},
            )
            assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_create_task_title_too_long(self, test_user_id: str):
        """Test that creating task with title > 500 chars returns 400."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            long_title = "x" * 501
            response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": long_title},
            )
            assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_create_task_description_too_long(self, test_user_id: str):
        """Test that creating task with description > 5000 chars returns 400."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            long_description = "x" * 5001
            response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "Test", "description": long_description},
            )
            assert response.status_code == 400


class TestListTasks:
    """Test GET /api/users/{user_id}/tasks endpoint."""

    @pytest.mark.asyncio
    async def test_list_tasks_empty(self, test_user_id: str):
        """Test listing tasks returns empty array for new user."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/api/users/{test_user_id}/tasks")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            # Note: May contain tasks from previous tests, so just check it's a list

    @pytest.mark.asyncio
    async def test_list_tasks_after_create(self, test_user_id: str):
        """Test listing tasks includes created task."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create a task
            create_response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "Task for List Test"},
            )
            assert create_response.status_code == 201
            created_task = create_response.json()

            # List tasks
            list_response = await client.get(f"/api/users/{test_user_id}/tasks")
            assert list_response.status_code == 200
            tasks = list_response.json()
            assert isinstance(tasks, list)
            assert len(tasks) > 0
            # Find our task in the list
            task_ids = [task["id"] for task in tasks]
            assert created_task["id"] in task_ids

    @pytest.mark.asyncio
    async def test_list_tasks_multiple(self, test_user_id: str):
        """Test listing tasks returns all user's tasks."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create multiple tasks
            titles = ["Task 1", "Task 2", "Task 3"]
            created_ids = []
            for title in titles:
                response = await client.post(
                    f"/api/users/{test_user_id}/tasks",
                    json={"title": title},
                )
                assert response.status_code == 201
                created_ids.append(response.json()["id"])

            # List tasks
            response = await client.get(f"/api/users/{test_user_id}/tasks")
            assert response.status_code == 200
            tasks = response.json()
            assert isinstance(tasks, list)
            assert len(tasks) >= 3
            # Verify all created tasks are in the list
            task_ids = [task["id"] for task in tasks]
            for created_id in created_ids:
                assert created_id in task_ids

    @pytest.mark.asyncio
    async def test_list_tasks_user_isolation(self, test_user_id: str, other_user_id: str):
        """Test that users only see their own tasks."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create task for test_user
            response1 = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "User 1 Task"},
            )
            assert response1.status_code == 201
            user1_task_id = response1.json()["id"]

            # Create task for other_user
            response2 = await client.post(
                f"/api/users/{other_user_id}/tasks",
                json={"title": "User 2 Task"},
            )
            assert response2.status_code == 201
            user2_task_id = response2.json()["id"]

            # List tasks for test_user
            response = await client.get(f"/api/users/{test_user_id}/tasks")
            assert response.status_code == 200
            user1_tasks = response.json()
            user1_task_ids = [task["id"] for task in user1_tasks]

            # Verify test_user sees their task but not other_user's task
            assert user1_task_id in user1_task_ids
            assert user2_task_id not in user1_task_ids


class TestGetSingleTask:
    """Test GET /api/users/{user_id}/tasks/{task_id} endpoint."""

    @pytest.mark.asyncio
    async def test_get_task_success(self, test_user_id: str):
        """Test getting a single task by ID."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create a task
            create_response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "Get Task Test", "description": "Test Description"},
            )
            assert create_response.status_code == 201
            created_task = create_response.json()

            # Get the task
            response = await client.get(
                f"/api/users/{test_user_id}/tasks/{created_task['id']}"
            )
            assert response.status_code == 200
            task = response.json()
            assert task["id"] == created_task["id"]
            assert task["title"] == "Get Task Test"
            assert task["description"] == "Test Description"

    @pytest.mark.asyncio
    async def test_get_task_not_found(self, test_user_id: str):
        """Test getting non-existent task returns 404."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/api/users/{test_user_id}/tasks/999999")
            assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_task_user_isolation(self, test_user_id: str, other_user_id: str):
        """Test that user cannot access another user's task."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create task for other_user
            create_response = await client.post(
                f"/api/users/{other_user_id}/tasks",
                json={"title": "Other User Task"},
            )
            assert create_response.status_code == 201
            other_task_id = create_response.json()["id"]

            # Try to access with test_user_id
            response = await client.get(
                f"/api/users/{test_user_id}/tasks/{other_task_id}"
            )
            assert response.status_code == 404  # Should not be found


class TestUpdateTask:
    """Test PUT /api/users/{user_id}/tasks/{task_id} endpoint."""

    @pytest.mark.asyncio
    async def test_update_task_success(self, test_user_id: str):
        """Test full update of task."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create a task
            create_response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "Original Title", "description": "Original Description"},
            )
            assert create_response.status_code == 201
            task_id = create_response.json()["id"]

            # Update the task
            update_response = await client.put(
                f"/api/users/{test_user_id}/tasks/{task_id}",
                json={
                    "title": "Updated Title",
                    "description": "Updated Description",
                    "completed": True,
                },
            )
            assert update_response.status_code == 200
            updated_task = update_response.json()
            assert updated_task["title"] == "Updated Title"
            assert updated_task["description"] == "Updated Description"
            assert updated_task["completed"] is True

    @pytest.mark.asyncio
    async def test_update_task_not_found(self, test_user_id: str):
        """Test updating non-existent task returns 404."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                f"/api/users/{test_user_id}/tasks/999999",
                json={"title": "Test", "description": "Test", "completed": False},
            )
            assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_task_missing_fields(self, test_user_id: str):
        """Test that PUT requires all fields."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create a task
            create_response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "Test Task"},
            )
            assert create_response.status_code == 201
            task_id = create_response.json()["id"]

            # Try to update with missing completed field
            response = await client.put(
                f"/api/users/{test_user_id}/tasks/{task_id}",
                json={"title": "Updated", "description": "Updated"},
            )
            assert response.status_code == 400  # Validation error

    @pytest.mark.asyncio
    async def test_update_task_user_isolation(self, test_user_id: str, other_user_id: str):
        """Test that user cannot update another user's task."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create task for other_user
            create_response = await client.post(
                f"/api/users/{other_user_id}/tasks",
                json={"title": "Other User Task"},
            )
            assert create_response.status_code == 201
            other_task_id = create_response.json()["id"]

            # Try to update with test_user_id
            response = await client.put(
                f"/api/users/{test_user_id}/tasks/{other_task_id}",
                json={"title": "Hacked", "description": None, "completed": False},
            )
            assert response.status_code == 404


class TestPatchTask:
    """Test PATCH /api/users/{user_id}/tasks/{task_id} endpoint."""

    @pytest.mark.asyncio
    async def test_patch_task_completed(self, test_user_id: str):
        """Test marking task as completed."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create a task
            create_response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "Task to Complete"},
            )
            assert create_response.status_code == 201
            task_id = create_response.json()["id"]
            original_title = create_response.json()["title"]

            # Mark as completed
            patch_response = await client.patch(
                f"/api/users/{test_user_id}/tasks/{task_id}",
                json={"completed": True},
            )
            assert patch_response.status_code == 200
            updated_task = patch_response.json()
            assert updated_task["completed"] is True
            assert updated_task["title"] == original_title  # Title unchanged

    @pytest.mark.asyncio
    async def test_patch_task_title_only(self, test_user_id: str):
        """Test updating only title."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create a task
            create_response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "Original Title", "description": "Original Description"},
            )
            assert create_response.status_code == 201
            task_id = create_response.json()["id"]

            # Update only title
            patch_response = await client.patch(
                f"/api/users/{test_user_id}/tasks/{task_id}",
                json={"title": "New Title"},
            )
            assert patch_response.status_code == 200
            updated_task = patch_response.json()
            assert updated_task["title"] == "New Title"
            assert updated_task["description"] == "Original Description"  # Unchanged
            assert updated_task["completed"] is False  # Unchanged

    @pytest.mark.asyncio
    async def test_patch_task_multiple_fields(self, test_user_id: str):
        """Test updating multiple fields."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create a task
            create_response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "Original Title"},
            )
            assert create_response.status_code == 201
            task_id = create_response.json()["id"]

            # Update title and completed
            patch_response = await client.patch(
                f"/api/users/{test_user_id}/tasks/{task_id}",
                json={"title": "New Title", "completed": True},
            )
            assert patch_response.status_code == 200
            updated_task = patch_response.json()
            assert updated_task["title"] == "New Title"
            assert updated_task["completed"] is True

    @pytest.mark.asyncio
    async def test_patch_task_not_found(self, test_user_id: str):
        """Test patching non-existent task returns 404."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.patch(
                f"/api/users/{test_user_id}/tasks/999999",
                json={"completed": True},
            )
            assert response.status_code == 404


class TestDeleteTask:
    """Test DELETE /api/users/{user_id}/tasks/{task_id} endpoint."""

    @pytest.mark.asyncio
    async def test_delete_task_success(self, test_user_id: str):
        """Test deleting a task."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create a task
            create_response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "Task to Delete"},
            )
            assert create_response.status_code == 201
            task_id = create_response.json()["id"]

            # Delete the task
            delete_response = await client.delete(
                f"/api/users/{test_user_id}/tasks/{task_id}"
            )
            assert delete_response.status_code == 204
            assert delete_response.text == ""  # No content

            # Verify task is gone
            get_response = await client.get(
                f"/api/users/{test_user_id}/tasks/{task_id}"
            )
            assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_task_not_found(self, test_user_id: str):
        """Test deleting non-existent task returns 404."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(f"/api/users/{test_user_id}/tasks/999999")
            assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_task_removed_from_list(self, test_user_id: str):
        """Test deleted task no longer appears in list."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create a task
            create_response = await client.post(
                f"/api/users/{test_user_id}/tasks",
                json={"title": "Task to Delete from List"},
            )
            assert create_response.status_code == 201
            task_id = create_response.json()["id"]

            # Delete the task
            await client.delete(f"/api/users/{test_user_id}/tasks/{task_id}")

            # Verify not in list
            list_response = await client.get(f"/api/users/{test_user_id}/tasks")
            assert list_response.status_code == 200
            tasks = list_response.json()
            task_ids = [task["id"] for task in tasks]
            assert task_id not in task_ids

    @pytest.mark.asyncio
    async def test_delete_task_user_isolation(self, test_user_id: str, other_user_id: str):
        """Test that user cannot delete another user's task."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create task for other_user
            create_response = await client.post(
                f"/api/users/{other_user_id}/tasks",
                json={"title": "Other User Task"},
            )
            assert create_response.status_code == 201
            other_task_id = create_response.json()["id"]

            # Try to delete with test_user_id
            response = await client.delete(
                f"/api/users/{test_user_id}/tasks/{other_task_id}"
            )
            assert response.status_code == 404

            # Verify task still exists for other_user
            get_response = await client.get(
                f"/api/users/{other_user_id}/tasks/{other_task_id}"
            )
            assert get_response.status_code == 200
