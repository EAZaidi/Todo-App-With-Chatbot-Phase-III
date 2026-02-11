"""MCP tool: get_task - Get a single task by ID."""

import json


def register(mcp):
    @mcp.tool()
    async def get_task(user_id: str, task_id: int) -> str:
        """Retrieve a single task by ID for the specified user.

        Args:
            user_id: Authenticated user ID.
            task_id: Task ID to retrieve.
        """
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
                        "updated_at": task.updated_at.isoformat() + "Z",
                    },
                })
        except Exception as e:
            return json.dumps({"success": False, "error": "Failed to get task"})
