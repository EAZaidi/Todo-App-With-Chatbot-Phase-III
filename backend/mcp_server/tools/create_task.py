"""MCP tool: create_task - Create a new task for a user."""

import json
from datetime import date, datetime
from typing import Optional


def register(mcp):
    @mcp.tool()
    async def create_task(
        user_id: str,
        title: str,
        description: Optional[str] = None,
        priority: str = "medium",
        due_date: Optional[str] = None,
    ) -> str:
        """Create a new task for the specified user.

        Args:
            user_id: Authenticated user ID.
            title: Task title (1-500 chars).
            description: Optional task description (max 5000 chars).
            priority: Priority level - "low", "medium", or "high" (default: "medium").
            due_date: Optional due date in YYYY-MM-DD format.
        """
        # Validate title
        if not title or not title.strip():
            return json.dumps({"success": False, "error": "Title cannot be empty"})
        if len(title) > 500:
            return json.dumps({"success": False, "error": "Title must be 500 characters or less"})

        # Validate priority
        if priority not in ("low", "medium", "high"):
            return json.dumps({"success": False, "error": "Priority must be low, medium, or high"})

        # Parse due_date
        parsed_due_date = None
        if due_date:
            try:
                parsed_due_date = date.fromisoformat(due_date)
            except ValueError:
                return json.dumps({"success": False, "error": "Invalid due_date format. Use YYYY-MM-DD"})

        try:
            from mcp_server.database import get_db_session
            from src.models.task import Task

            async with get_db_session() as session:
                task = Task(
                    user_id=user_id,
                    title=title.strip(),
                    description=description,
                    completed=False,
                    priority=priority,
                    due_date=parsed_due_date,
                )
                session.add(task)
                await session.commit()
                await session.refresh(task)

                return json.dumps({
                    "success": True,
                    "task": {
                        "id": task.id,
                        "title": task.title,
                        "description": task.description,
                        "completed": task.completed,
                        "priority": task.priority,
                        "due_date": task.due_date.isoformat() if task.due_date else None,
                        "created_at": task.created_at.isoformat() + "Z",
                    },
                })
        except Exception as e:
            return json.dumps({"success": False, "error": "Failed to create task"})
