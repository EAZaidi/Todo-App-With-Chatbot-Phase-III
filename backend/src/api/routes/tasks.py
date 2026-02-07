"""
Task API routes.

Implements all 6 CRUD endpoints:
- POST /api/users/{user_id}/tasks - Create task
- GET /api/users/{user_id}/tasks - List all tasks
- GET /api/users/{user_id}/tasks/{task_id} - Get single task
- PUT /api/users/{user_id}/tasks/{task_id} - Full update
- PATCH /api/users/{user_id}/tasks/{task_id} - Partial update
- DELETE /api/users/{user_id}/tasks/{task_id} - Delete task
"""

import logging
from datetime import datetime

# Configure logger for task operations
logger = logging.getLogger(__name__)
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from src.api.dependencies import get_session, get_current_user
from src.api.middleware.auth import verify_user_access
from src.models.task import (
    Task,
    TaskCreate,
    TaskUpdate,
    TaskPartialUpdate,
    TaskResponse,
)

router = APIRouter()


@router.post(
    "/users/{user_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    description="Create a new task for the specified user.",
)
async def create_task(
    user_id: str,
    task_data: TaskCreate,
    session: AsyncSession = Depends(get_session),
    current_user_id: str = Depends(get_current_user),
) -> TaskResponse:
    """
    Create a new task.

    Args:
        user_id: User ID from path parameter (for data isolation)
        task_data: Task creation data (title, description)
        session: Database session (injected dependency)

    Returns:
        TaskResponse: Created task with all fields including id and timestamps

    Raises:
        HTTPException 400: Validation error (invalid data)
        HTTPException 500: Database error
    """
    # Verify user can only create tasks for themselves
    verify_user_access(current_user_id, user_id)

    logger.info(f"CREATE task request - user_id={user_id}, title={task_data.title[:50]}...")
    try:
        # Create task instance with user_id from path
        task = Task(
            user_id=user_id,
            title=task_data.title,
            description=task_data.description,
            completed=False,  # New tasks are always incomplete
            priority=task_data.priority or "medium",
            due_date=task_data.due_date,
        )

        # Save to database
        session.add(task)
        await session.commit()
        await session.refresh(task)

        logger.info(f"CREATE task success - user_id={user_id}, task_id={task.id}")
        return TaskResponse.model_validate(task)
    except Exception as e:
        logger.error(f"CREATE task failed - user_id={user_id}, error={str(e)}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get(
    "/users/{user_id}/tasks",
    response_model=List[TaskResponse],
    summary="List all tasks",
    description="Get all tasks for the specified user.",
)
async def list_tasks(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user_id: str = Depends(get_current_user),
) -> List[TaskResponse]:
    """
    List all tasks for a user.

    Args:
        user_id: User ID from path parameter (for data isolation)
        session: Database session (injected dependency)
        current_user_id: Authenticated user ID from JWT (injected dependency)

    Returns:
        List[TaskResponse]: List of all user's tasks (may be empty)

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 403: Access denied (user ID mismatch)
        HTTPException 500: Database error
    """
    # Verify user can only access their own tasks
    verify_user_access(current_user_id, user_id)

    logger.info(f"LIST tasks request - user_id={user_id}")
    try:
        # Query all tasks for this user
        statement = select(Task).where(Task.user_id == user_id).order_by(Task.created_at.desc())
        result = await session.execute(statement)
        tasks = result.scalars().all()

        logger.info(f"LIST tasks success - user_id={user_id}, count={len(tasks)}")
        return [TaskResponse.model_validate(task) for task in tasks]
    except Exception as e:
        logger.error(f"LIST tasks failed - user_id={user_id}, error={str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get(
    "/users/{user_id}/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Get a single task",
    description="Get details of a specific task.",
)
async def get_task(
    user_id: str,
    task_id: int,
    session: AsyncSession = Depends(get_session),
    current_user_id: str = Depends(get_current_user),
) -> TaskResponse:
    """
    Get a single task by ID.

    Args:
        user_id: User ID from path parameter (for data isolation)
        task_id: Task ID to retrieve
        session: Database session (injected dependency)
        current_user_id: Authenticated user ID from JWT (injected dependency)

    Returns:
        TaskResponse: Task details

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 403: Access denied (user ID mismatch)
        HTTPException 404: Task not found or doesn't belong to user
        HTTPException 500: Database error
    """
    # Verify user can only access their own tasks
    verify_user_access(current_user_id, user_id)

    logger.info(f"GET task request - user_id={user_id}, task_id={task_id}")
    try:
        # Query task with user_id filter (prevents cross-user access)
        statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
        result = await session.execute(statement)
        task = result.scalar_one_or_none()

        if task is None:
            logger.info(f"GET task not found - user_id={user_id}, task_id={task_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        logger.info(f"GET task success - user_id={user_id}, task_id={task_id}")
        return TaskResponse.model_validate(task)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET task failed - user_id={user_id}, task_id={task_id}, error={str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.put(
    "/users/{user_id}/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Update a task (full replacement)",
    description="Update all fields of a task. All fields are required.",
)
async def update_task(
    user_id: str,
    task_id: int,
    task_data: TaskUpdate,
    session: AsyncSession = Depends(get_session),
    current_user_id: str = Depends(get_current_user),
) -> TaskResponse:
    """
    Full update of a task (PUT).

    All fields must be provided (full replacement).

    Args:
        user_id: User ID from path parameter (for data isolation)
        task_id: Task ID to update
        task_data: Complete task data (title, description, completed)
        session: Database session (injected dependency)
        current_user_id: Authenticated user ID from JWT (injected dependency)

    Returns:
        TaskResponse: Updated task

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 403: Access denied (user ID mismatch)
        HTTPException 404: Task not found or doesn't belong to user
        HTTPException 400: Validation error
        HTTPException 500: Database error
    """
    # Verify user can only update their own tasks
    verify_user_access(current_user_id, user_id)

    logger.info(f"UPDATE task request - user_id={user_id}, task_id={task_id}")
    try:
        # Query task with user_id filter
        statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
        result = await session.execute(statement)
        task = result.scalar_one_or_none()

        if task is None:
            logger.info(f"UPDATE task not found - user_id={user_id}, task_id={task_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        # Update all fields
        task.title = task_data.title
        task.description = task_data.description
        task.completed = task_data.completed
        task.priority = task_data.priority
        task.due_date = task_data.due_date
        task.updated_at = datetime.utcnow()

        await session.commit()
        await session.refresh(task)

        logger.info(f"UPDATE task success - user_id={user_id}, task_id={task_id}")
        return TaskResponse.model_validate(task)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UPDATE task failed - user_id={user_id}, task_id={task_id}, error={str(e)}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.patch(
    "/users/{user_id}/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Partially update a task",
    description="Update specific fields of a task. Only provided fields are updated.",
)
async def patch_task(
    user_id: str,
    task_id: int,
    task_data: TaskPartialUpdate,
    session: AsyncSession = Depends(get_session),
    current_user_id: str = Depends(get_current_user),
) -> TaskResponse:
    """
    Partial update of a task (PATCH).

    Only provided fields are updated; others remain unchanged.

    Args:
        user_id: User ID from path parameter (for data isolation)
        task_id: Task ID to update
        task_data: Partial task data (any combination of title, description, completed)
        session: Database session (injected dependency)
        current_user_id: Authenticated user ID from JWT (injected dependency)

    Returns:
        TaskResponse: Updated task

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 403: Access denied (user ID mismatch)
        HTTPException 404: Task not found or doesn't belong to user
        HTTPException 400: Validation error
        HTTPException 500: Database error
    """
    # Verify user can only update their own tasks
    verify_user_access(current_user_id, user_id)

    logger.info(f"PATCH task request - user_id={user_id}, task_id={task_id}")
    try:
        # Query task with user_id filter
        statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
        result = await session.execute(statement)
        task = result.scalar_one_or_none()

        if task is None:
            logger.info(f"PATCH task not found - user_id={user_id}, task_id={task_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        # Update only provided fields
        update_data = task_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)

        # Always update timestamp
        task.updated_at = datetime.utcnow()

        await session.commit()
        await session.refresh(task)

        logger.info(f"PATCH task success - user_id={user_id}, task_id={task_id}, fields={list(update_data.keys())}")
        return TaskResponse.model_validate(task)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PATCH task failed - user_id={user_id}, task_id={task_id}, error={str(e)}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.delete(
    "/users/{user_id}/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task",
    description="Permanently delete a task.",
)
async def delete_task(
    user_id: str,
    task_id: int,
    session: AsyncSession = Depends(get_session),
    current_user_id: str = Depends(get_current_user),
) -> None:
    """
    Delete a task.

    Args:
        user_id: User ID from path parameter (for data isolation)
        task_id: Task ID to delete
        session: Database session (injected dependency)
        current_user_id: Authenticated user ID from JWT (injected dependency)

    Returns:
        None (204 No Content)

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 403: Access denied (user ID mismatch)
        HTTPException 404: Task not found or doesn't belong to user
        HTTPException 500: Database error
    """
    # Verify user can only delete their own tasks
    verify_user_access(current_user_id, user_id)

    logger.info(f"DELETE task request - user_id={user_id}, task_id={task_id}")
    try:
        # Query task with user_id filter
        statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
        result = await session.execute(statement)
        task = result.scalar_one_or_none()

        if task is None:
            logger.info(f"DELETE task not found - user_id={user_id}, task_id={task_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        # Delete the task
        await session.delete(task)
        await session.commit()

        logger.info(f"DELETE task success - user_id={user_id}, task_id={task_id}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DELETE task failed - user_id={user_id}, task_id={task_id}, error={str(e)}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
