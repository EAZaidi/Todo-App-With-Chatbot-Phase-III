"""MCP tool: update_task - Update an existing task."""

import json
from datetime import date, datetime
from typing import Optional


def register(mcp):
    @mcp.tool()
    async def update_task(
        user_id: str,
        task_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        completed: Optional[bool] = None,
        priority: Optional[str] = None,
        due_date: Optional[str] = None,
    ) -> str:
        """Update one or more fields of an existing task.

        Args:
            user_id: Authenticated user ID.
            task_id: Task ID to update.
            title: New title (1-500 chars).
            description: New description (max 5000 chars).
            completed: New completion status.
            priority: New priority ("low", "medium", "high").
            due_date: New due date (YYYY-MM-DD format).
        """
        # Check at least one field is provided
        if all(v is None for v in [title, description, completed, priority, due_date]):
            return json.dumps({"success": False, "error": "No fields to update"})

        # Validate title if provided
        if title is not None and (not title.strip() or len(title) > 500):
            return json.dumps({"success": False, "error": "Title must be 1-500 characters"})

        # Validate priority if provided
        if priority is not None and priority not in ("low", "medium", "high"):
            return json.dumps({"success": False, "error": "Priority must be low, medium, or high"})

        # Parse due_date if provided
        parsed_due_date = None
        has_due_date = False
        if due_date is not None:
            has_due_date = True
            if due_date:  # non-empty string
                try:
                    parsed_due_date = date.fromisoformat(due_date)
                except ValueError:
                    return json.dumps({"success": False, "error": "Invalid due_date format. Use YYYY-MM-DD"})

        try:
            from mcp_server.database import get_db_session
            from src.models.task import Task
            from sqlmodel import select

            async with get_db_session() as session:
                stmt = select(Task).where(Task.id == task_id, Task.user_id == user_id)
                result = await session.execute(stmt)
                task = result.scalar_one_or_none()

                if task is None:
                    return json.dumps({"success": False, "error": "Task not found"})

                if title is not None:
                    task.title = title.strip()
                if description is not None:
                    task.description = description
                if completed is not None:
                    task.completed = completed
                if priority is not None:
                    task.priority = priority
                if has_due_date:
                    task.due_date = parsed_due_date
                task.updated_at = datetime.utcnow()

                await session.commit()
                await session.refresh(task)

                return json.dumps({
                    "success": True,
                    "task": {
                        "id": task.id,
                        "title": task.title,
                        "completed": task.completed,
                        "priority": task.priority,
                        "due_date": task.due_date.isoformat() if task.due_date else None,
                        "updated_at": task.updated_at.isoformat() + "Z",
                    },
                })
        except Exception as e:
            return json.dumps({"success": False, "error": "Failed to update task"})
