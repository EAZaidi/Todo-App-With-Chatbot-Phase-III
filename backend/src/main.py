"""
Backend Todo API - FastAPI Application Entry Point.

Main application initialization, middleware setup, and startup events.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.database.connection import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.

    Runs on startup and shutdown:
    - Startup: Initialize database schema
    - Shutdown: Cleanup resources
    """
    # Startup: Initialize database
    print("Initializing database...")
    await init_db()
    print("Database initialized successfully!")

    yield

    # Shutdown: Cleanup (if needed)
    print("Shutting down...")


# Create FastAPI application
app = FastAPI(
    title="Todo API",
    description="Backend API for Todo application with persistent storage",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.is_development else [settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
async def health_check():
    """
    Health check endpoint.

    Returns:
        dict: Status message confirming API is running
    """
    return {
        "status": "ok",
        "message": "Todo API is running",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


# Import and include routers
from src.api.routes.tasks import router as tasks_router
app.include_router(tasks_router, prefix="/api", tags=["Tasks"])
