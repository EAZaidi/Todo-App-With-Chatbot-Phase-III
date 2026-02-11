"""Tool invocation log model for audit trail."""

from datetime import datetime
from typing import Optional, Any
from sqlmodel import Field, SQLModel, Column
from sqlalchemy import Text, JSON


class ToolInvocationLog(SQLModel, table=True):
    """Audit trail of every MCP tool call."""

    __tablename__ = "tool_invocation_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    message_id: Optional[int] = Field(default=None, foreign_key="messages.id", nullable=True)
    user_id: str = Field(max_length=255, index=True, nullable=False)
    tool_name: str = Field(max_length=100, nullable=False)
    input_params: Any = Field(sa_column=Column(JSON, nullable=False))
    output_result: Any = Field(sa_column=Column(JSON, nullable=False))
    success: bool = Field(nullable=False)
    error_message: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
