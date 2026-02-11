# Quickstart: AI-Powered Todo Chatbot

**Feature Branch**: `004-ai-todo-chatbot`
**Date**: 2026-02-07

## Prerequisites

- Python 3.11+
- Node.js 18+
- Neon PostgreSQL database (existing from Phase I/II)
- OpenAI API key with access to GPT models
- Better Auth configured (existing from Phase II)

## Environment Variables

### Backend (.env)

```env
# Existing (from Phase I/II)
DATABASE_URL=postgresql+asyncpg://user:pass@host/db?sslmode=require
ENVIRONMENT=development
JWKS_URL=http://localhost:3000/api/auth/jwks
FRONTEND_URL=http://localhost:3000

# New (Phase III)
OPENAI_API_KEY=sk-...
MCP_SERVER_URL=http://localhost:9000/mcp
```

### MCP Server (.env or shared with backend)

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host/db?sslmode=require
```

### Frontend (.env.local)

```env
# Existing (from Phase I/II — no changes)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_URL=http://localhost:3000
```

## Running the Application

### 1. Start the MCP Tool Server (port 9000)

```bash
cd backend
pip install -r requirements.txt
python -m mcp_server.server
```

The MCP server starts on `http://localhost:9000/mcp` with
streamable-http transport.

### 2. Start the Backend API (port 8000)

```bash
cd backend
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Start the Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

### 4. Use the Chatbot

1. Open `http://localhost:3000` in your browser
2. Sign in (or sign up if new user)
3. Navigate to the Chat page
4. Type a message like "Add a task to buy groceries"
5. Watch the AI agent create the task and confirm

## Validation Checklist

- [ ] MCP server starts without errors on port 9000
- [ ] Backend API starts and connects to MCP server
- [ ] Frontend loads chat page after sign-in
- [ ] "Add a task" creates a task in the database
- [ ] "Show my tasks" lists tasks from the database
- [ ] "Mark X as done" updates the task
- [ ] "Delete X" removes the task after confirmation
- [ ] Restart backend → conversation history preserved
- [ ] Request without JWT returns 401
- [ ] Different user sees only their own tasks
