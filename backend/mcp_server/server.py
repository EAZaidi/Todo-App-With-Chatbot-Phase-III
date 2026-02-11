"""MCP Tool Server for Todo operations.

Runs as a standalone process on port 9000 with streamable-http transport.
Tools are registered via @mcp.tool() decorator and auto-discovered by
the OpenAI Agents SDK via MCPServerStreamableHttp.
"""

import os
import sys
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from dotenv import load_dotenv

# Load .env from backend directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# Add backend root to path so we can import src.models
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from mcp.server.fastmcp import FastMCP


@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[dict]:
    """Lifespan context manager for MCP server."""
    from mcp_server.database import engine
    yield {}
    await engine.dispose()


mcp = FastMCP(
    "Todo Tools",
    host="0.0.0.0",
    port=9000,
    lifespan=app_lifespan,
)

# Register all MCP tools
from mcp_server.tools import create_task, list_tasks, get_task, update_task, delete_task

create_task.register(mcp)
list_tasks.register(mcp)
get_task.register(mcp)
update_task.register(mcp)
delete_task.register(mcp)


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
