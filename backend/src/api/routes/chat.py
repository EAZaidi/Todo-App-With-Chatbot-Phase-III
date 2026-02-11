"""Chat API routes for AI-powered todo chatbot.

Endpoints:
- POST /api/chat - Send message and receive streamed response
- POST /api/chat/new - Start new conversation
- GET /api/chat/history - Get conversation history
"""

import json
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user
from src.database.connection import get_session, AsyncSessionLocal
from src.services import conversation_service
from src.services.agent_service import run_agent_streamed

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    """Request body for POST /api/chat."""
    message: str = Field(min_length=1, max_length=5000)


@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Send a message to the AI agent and receive a streamed response."""
    logger.info(f"Chat request from user={current_user_id}")

    # Get or create conversation
    conversation = await conversation_service.get_or_create_conversation(
        session, current_user_id
    )

    # Save user message
    await conversation_service.save_user_message(
        session, conversation.id, request.message
    )

    # Load conversation history
    messages = await conversation_service.load_message_history(
        session, conversation.id
    )
    history = conversation_service.reconstruct_input_list(messages[:-1])  # Exclude the just-saved message

    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()

    await session.commit()

    async def event_stream():
        final_text = ""
        tool_calls = []
        tool_results = []

        try:
            async for event in run_agent_streamed(
                current_user_id, request.message, history
            ):
                if event["event"] == "_metadata":
                    # Internal metadata, don't send to client
                    metadata = json.loads(event["data"])
                    final_text = metadata.get("final_text", "")
                    tool_calls = metadata.get("tool_calls", [])
                    tool_results = metadata.get("tool_results", [])
                    continue

                yield f"event: {event['event']}\ndata: {event['data']}\n\n"

        except Exception as e:
            logger.error(f"Agent error for user={current_user_id}: {e}")
            error_data = json.dumps({"error": "I encountered an issue processing your request. Please try again."})
            yield f"event: error\ndata: {error_data}\n\n"
            final_text = "I encountered an error processing your request."

        # Save assistant response after stream completes
        try:
            async with AsyncSessionLocal() as save_session:
                try:
                    conv = await conversation_service.get_or_create_conversation(
                        save_session, current_user_id
                    )
                    assistant_msg = await conversation_service.save_assistant_message(
                        save_session,
                        conv.id,
                        final_text,
                        tool_calls=tool_calls if tool_calls else None,
                        tool_results=tool_results if tool_results else None,
                    )

                    # Log tool invocations
                    for i, tc in enumerate(tool_calls):
                        tr = tool_results[i] if i < len(tool_results) else {}
                        await conversation_service.log_tool_invocation(
                            save_session,
                            user_id=current_user_id,
                            tool_name=tc.get("tool", "unknown"),
                            input_params=tc,
                            output_result=tr,
                            success=True,
                            message_id=assistant_msg.id,
                        )

                    await save_session.commit()
                except Exception as save_err:
                    logger.error(f"Failed to save assistant response: {save_err}")
                    await save_session.rollback()
        except Exception as session_err:
            logger.error(f"Failed to create save session: {session_err}")

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat/new")
async def new_chat(
    current_user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Start a new conversation (clears history context)."""
    conversation = await conversation_service.get_or_create_conversation(
        session, current_user_id
    )
    await conversation_service.clear_conversation(session, conversation.id)
    await session.commit()

    return {
        "conversation_id": conversation.id,
        "message": "Conversation started. How can I help you manage your tasks?",
    }


@router.get("/chat/history")
async def chat_history(
    limit: int = 50,
    offset: int = 0,
    current_user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Retrieve conversation history for the authenticated user."""
    conversation = await conversation_service.get_or_create_conversation(
        session, current_user_id
    )

    messages, total = await conversation_service.get_message_history_paginated(
        session, conversation.id, limit=limit, offset=offset
    )

    return {
        "conversation_id": conversation.id,
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat() + "Z",
            }
            for msg in messages
        ],
        "total": total,
    }
