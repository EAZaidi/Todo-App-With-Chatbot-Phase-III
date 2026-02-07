"""
Database connection management for Neon Serverless PostgreSQL.

Provides async engine, session factory, and database initialization.
"""

from typing import AsyncGenerator
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from src.config import settings


# Create async database engine
# echo=True in development for SQL query logging
# For Neon serverless: use NullPool to avoid connection pooling issues
from sqlalchemy.pool import NullPool

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.is_development,
    future=True,
    poolclass=NullPool,  # NullPool recommended for serverless
    connect_args={"ssl": "require"},  # SSL for Neon
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> None:
    """
    Initialize database schema.

    Creates all tables defined with SQLModel (table=True) if they don't exist.
    This is idempotent and safe to run multiple times.

    Called during application startup.
    """
    async with engine.begin() as conn:
        # Import all models here to ensure they're registered with SQLModel
        from src.models.task import Task  # noqa: F401

        # Create all tables
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides a database session.

    Yields an async session and ensures it's closed after use.
    Used as a FastAPI dependency: Depends(get_session)

    Yields:
        AsyncSession: Database session for use in route handlers

    Example:
        @app.get("/tasks")
        async def list_tasks(session: AsyncSession = Depends(get_session)):
            # Use session here
            pass
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
