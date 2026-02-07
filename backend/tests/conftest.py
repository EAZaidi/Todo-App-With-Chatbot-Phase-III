"""
Pytest configuration and shared fixtures.

Provides test fixtures for async testing and database setup.
"""

import pytest
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlmodel import SQLModel
from backend.src.database.connection import get_session
from backend.src.main import app


# Configure asyncio event loop for tests
@pytest.fixture(scope="session")
def event_loop():
    """
    Create an event loop for the entire test session.

    This ensures all async tests share the same event loop.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# Database fixtures can be added here if needed for test isolation
# For now, tests will use the configured database from .env
