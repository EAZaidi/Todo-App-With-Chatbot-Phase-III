"""Conversation model for AI chat sessions."""

from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class Conversation(SQLModel, table=True):
    """One active conversation per user."""

    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(max_length=255, index=True, unique=True, nullable=False)
    title: str = Field(default="Todo Chat", max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
