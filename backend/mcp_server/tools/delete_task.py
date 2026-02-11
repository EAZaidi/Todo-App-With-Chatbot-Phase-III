"""MCP tool: delete_task - Delete a task by ID."""

import json


def register(mcp):
    @mcp.tool()
    async def delete_task(user_id: str, task_id: int) -> str:
        """Delete a task by ID for the specified user.

        Args:
            user_id: Authenticated user ID.
            task_id: Task ID to delete.
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

                await session.delete(task)
                await session.commit()

                return json.dumps({
                    "success": True,
                    "message": "Task deleted successfully",
                    "deleted_task_id": task_id,
                })
        except Exception as e:
            return json.dumps({"success": False, "error": "Failed to delete task"})
