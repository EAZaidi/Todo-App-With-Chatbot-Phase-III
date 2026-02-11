"""MCP tool: list_tasks - List tasks for a user with optional filters."""

import json
from typing import Optional


def register(mcp):
    @mcp.tool()
    async def list_tasks(
        user_id: str,
        completed: Optional[bool] = None,
        priority: Optional[str] = None,
        due_date: Optional[str] = None,
    ) -> str:
        """Retrieve all tasks for the specified user with optional filters.

        Args:
            user_id: Authenticated user ID.
            completed: Optional filter by completion status.
            priority: Optional filter by priority level ("low", "medium", "high").
            due_date: Optional filter by due date (YYYY-MM-DD format).
        """
        try:
            from datetime import date as date_type
            from mcp_server.database import get_db_session
            from src.models.task import Task
            from sqlmodel import select

            async with get_db_session() as session:
                stmt = select(Task).where(Task.user_id == user_id)

                if completed is not None:
                    stmt = stmt.where(Task.completed == completed)
                if priority is not None:
                    stmt = stmt.where(Task.priority == priority)
                if due_date is not None:
                    try:
                        parsed_date = date_type.fromisoformat(due_date)
                        stmt = stmt.where(Task.due_date == parsed_date)
                    except ValueError:
                        return json.dumps({"success": False, "error": "Invalid due_date format. Use YYYY-MM-DD"})

                stmt = stmt.order_by(Task.created_at.desc())
                result = await session.execute(stmt)
                tasks = result.scalars().all()

                return json.dumps({
                    "success": True,
                    "tasks": [
                        {
                            "id": t.id,
                            "title": t.title,
                            "completed": t.completed,
                            "priority": t.priority,
                            "due_date": t.due_date.isoformat() if t.due_date else None,
                            "created_at": t.created_at.isoformat() + "Z",
                        }
                        for t in tasks
                    ],
                    "count": len(tasks),
                })
        except Exception as e:
            return json.dumps({"success": False, "error": "Failed to list tasks"})
