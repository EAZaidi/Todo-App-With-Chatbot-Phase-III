"""
API dependencies for FastAPI dependency injection.

Provides reusable dependencies for route handlers.
"""

from typing import Optional
from fastapi import Header
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.connection import get_session
from src.api.middleware.auth import (
    extract_token_from_header,
    get_user_id_from_token,
)

# Re-export get_session for use in route handlers
__all__ = ["get_session", "get_current_user"]


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization")
) -> str:
    """
    FastAPI dependency to get the current authenticated user ID.

    Extracts and verifies the JWT token from the Authorization header,
    returning the user ID from the 'sub' claim.

    Args:
        authorization: Authorization header value.

    Returns:
        User ID string from the verified JWT token.

    Raises:
        HTTPException: 401 if token is missing, invalid, or expired.
    """
    token = extract_token_from_header(authorization)
    user_id = get_user_id_from_token(token)
    return user_id
