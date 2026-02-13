#!/bin/sh
# Start MCP server in background (localhost only, not exposed externally)
python -m mcp_server.server &

# Start FastAPI backend on HF Spaces port
uvicorn src.main:app --host 0.0.0.0 --port 7860
