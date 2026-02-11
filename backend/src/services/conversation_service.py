"""Conversation persistence service.

Manages conversations, messages, and tool invocation logs in PostgreSQL.
"""

import json
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.conversation import Conversation
from src.models.message import Message
from src.models.tool_log import ToolInvocationLog

logger = logging.getLogger(__name__)


async def get_or_create_conversation(session: AsyncSession, user_id: str) -> Conversation:
    """Get existing conversation or create new one for user."""
    stmt = select(Conversation).where(Conversation.user_id == user_id)
    result = await session.execute(stmt)
    conversation = result.scalar_one_or_none()

    if conversation is None:
        conversation = Conversation(user_id=user_id)
        session.add(conversation)
        await session.flush()
        logger.info(f"Created conversation id={conversation.id} for user={user_id}")

    return conversation


async def load_message_history(
    session: AsyncSession, conversation_id: int, limit: int = 50
) -> list[Message]:
    """Load the most recent messages for a conversation."""
    # Get total count
    count_stmt = select(func.count()).select_from(Message).where(
        Message.conversation_id == conversation_id
    )
    count_result = await session.execute(count_stmt)
    total = count_result.scalar() or 0

    # Calculate offset for most recent messages
    offset = max(0, total - limit)

    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .offset(offset)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


def reconstruct_input_list(messages: list[Message]) -> list[dict]:
    """Convert DB messages to OpenAI Agents SDK input format."""
    input_list = []
    for msg in messages:
        if msg.role == "user":
            input_list.append({"role": "user", "content": msg.content})
        elif msg.role == "assistant":
            input_list.append({"role": "assistant", "content": msg.content})
    return input_list


async def save_user_message(
    session: AsyncSession, conversation_id: int, content: str
) -> Message:
    """Save a user message to the database."""
    message = Message(
        conversation_id=conversation_id,
        role="user",
        content=content,
    )
    session.add(message)
    await session.flush()
    return message


async def save_assistant_message(
    session: AsyncSession,
    conversation_id: int,
    content: str,
    tool_calls: Optional[list] = None,
    tool_results: Optional[list] = None,
) -> Message:
    """Save an assistant message to the database."""
    message = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=content,
        tool_calls=tool_calls,
        tool_results=tool_results,
    )
    session.add(message)
    await session.flush()
    return message


async def clear_conversation(session: AsyncSession, conversation_id: int) -> None:
    """Delete all messages for a conversation (new chat)."""
    await session.execute(
        delete(Message).where(Message.conversation_id == conversation_id)
    )
    # Update conversation timestamp
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    result = await session.execute(stmt)
    conversation = result.scalar_one_or_none()
    if conversation:
        conversation.updated_at = datetime.utcnow()
    await session.flush()


async def log_tool_invocation(
    session: AsyncSession,
    user_id: str,
    tool_name: str,
    input_params: dict,
    output_result: dict,
    success: bool,
    error_message: Optional[str] = None,
    message_id: Optional[int] = None,
) -> ToolInvocationLog:
    """Log a tool invocation for audit trail."""
    log = ToolInvocationLog(
        message_id=message_id,
        user_id=user_id,
        tool_name=tool_name,
        input_params=input_params,
        output_result=output_result,
        success=success,
        error_message=error_message,
    )
    session.add(log)
    await session.flush()
    return log


async def get_message_history_paginated(
    session: AsyncSession, conversation_id: int, limit: int = 50, offset: int = 0
) -> tuple[list[Message], int]:
    """Get paginated message history."""
    # Total count
    count_stmt = select(func.count()).select_from(Message).where(
        Message.conversation_id == conversation_id
    )
    count_result = await session.execute(count_stmt)
    total = count_result.scalar() or 0

    # Paginated messages
    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .offset(offset)
        .limit(limit)
    )
    result = await session.execute(stmt)
    messages = list(result.scalars().all())

    return messages, total
