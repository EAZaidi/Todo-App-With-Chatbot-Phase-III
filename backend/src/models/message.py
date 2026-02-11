"""Message model for conversation messages."""

import json
from datetime import datetime
from typing import Optional, Any
from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text, JSON


class Message(SQLModel, table=True):
    """A single message within a conversation."""

    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", nullable=False, index=True)
    role: str = Field(max_length=20, nullable=False)  # "user" or "assistant"
    content: str = Field(sa_column=Column(Text, nullable=False))
    tool_calls: Optional[Any] = Field(default=None, sa_column=Column(JSON, nullable=True))
    tool_results: Optional[Any] = Field(default=None, sa_column=Column(JSON, nullable=True))
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
