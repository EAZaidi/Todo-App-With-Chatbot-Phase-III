# Quick Start Guide: Backend Todo API

**Feature**: Backend Todo API & Persistence
**Branch**: `001-backend-todo-api`
**Date**: 2026-01-09

## Prerequisites

Before starting, ensure you have:

- **Python 3.11+** installed
- **Git** installed
- **Neon PostgreSQL account** (free tier) at https://neon.tech
- **Code editor** (VS Code, PyCharm, etc.)
- **Terminal/Command Prompt** access

## Setup Instructions (5 minutes)

### Step 1: Clone Repository and Checkout Branch

```bash
# Clone the repository
git clone <repository-url>
cd todo-app

# Checkout the backend API branch
git checkout 001-backend-todo-api
```

### Step 2: Set Up Python Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Activate virtual environment (macOS/Linux)
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install Python packages
pip install -r requirements.txt
```

**Expected packages** (from `requirements.txt`):
```
fastapi>=0.100.0
sqlmodel>=0.0.14
pydantic>=2.0.0
python-dotenv>=1.0.0
asyncpg>=0.29.0
uvicorn[standard]>=0.24.0
pytest>=7.4.0
httpx>=0.25.0
```

### Step 4: Configure Neon PostgreSQL

1. **Create Neon Project**:
   - Go to https://neon.tech and sign up/login
   - Click "Create Project"
   - Name: "todo-app-dev"
   - Region: Choose closest to you
   - Click "Create Project"

2. **Get Connection String**:
   - After project creation, copy the connection string
   - It looks like: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

3. **Create `.env` file**:
   ```bash
   # In backend/ directory
   touch .env
   ```

4. **Add connection string** to `.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

   **Important**: Change `postgresql://` to `postgresql+asyncpg://` for async support

### Step 5: Initialize Database

```bash
# Run the application (this will auto-create tables)
python -m uvicorn src.main:app --reload
```

**Expected output**:
```
INFO:     Will watch for changes in these directories: ['/path/to/backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Database tables created successfully
INFO:     Application startup complete.
```

### Step 6: Verify Installation

Open your browser and visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

You should see the interactive API documentation.

## Quick Test (2 minutes)

### Using Swagger UI (Easiest)

1. Open http://localhost:8000/docs
2. Expand `POST /api/users/{user_id}/tasks`
3. Click "Try it out"
4. Enter `user_id`: `test-user`
5. Enter request body:
   ```json
   {
     "title": "My first task",
     "description": "Testing the API"
   }
   ```
6. Click "Execute"
7. Verify response: Status 201, task created with ID

8. Expand `GET /api/users/{user_id}/tasks`
9. Click "Try it out"
10. Enter `user_id`: `test-user`
11. Click "Execute"
12. Verify response: Status 200, list contains your task

### Using curl (Command Line)

```bash
# Create a task
curl -X POST http://localhost:8000/api/users/test-user/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}'

# Expected output (201 Created):
# {
#   "id": 1,
#   "user_id": "test-user",
#   "title": "Buy groceries",
#   "description": "Milk, eggs, bread",
#   "completed": false,
#   "created_at": "2026-01-09T10:00:00Z",
#   "updated_at": "2026-01-09T10:00:00Z"
# }

# Get all tasks
curl http://localhost:8000/api/users/test-user/tasks

# Expected output (200 OK):
# [
#   {
#     "id": 1,
#     "user_id": "test-user",
#     "title": "Buy groceries",
#     "description": "Milk, eggs, bread",
#     "completed": false,
#     "created_at": "2026-01-09T10:00:00Z",
#     "updated_at": "2026-01-09T10:00:00Z"
#   }
# ]

# Mark task as complete
curl -X PATCH http://localhost:8000/api/users/test-user/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete task
curl -X DELETE http://localhost:8000/api/users/test-user/tasks/1
```

### Using Python httpx

```python
import httpx

# Create client
client = httpx.Client(base_url="http://localhost:8000")

# Create a task
response = client.post("/api/users/test-user/tasks", json={
    "title": "Buy groceries",
    "description": "Milk, eggs, bread"
})
print(f"Status: {response.status_code}")  # 201
task = response.json()
print(f"Task ID: {task['id']}")

# Get all tasks
response = client.get("/api/users/test-user/tasks")
print(f"Status: {response.status_code}")  # 200
tasks = response.json()
print(f"Total tasks: {len(tasks)}")

# Mark complete
response = client.patch(f"/api/users/test-user/tasks/{task['id']}", json={
    "completed": True
})
print(f"Status: {response.status_code}")  # 200

# Delete task
response = client.delete(f"/api/users/test-user/tasks/{task['id']}")
print(f"Status: {response.status_code}")  # 204
```

## Running Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run only integration tests
pytest tests/integration

# Run only unit tests
pytest tests/unit

# Run with coverage report
pytest --cov=src --cov-report=html
```

**Expected output**:
```
======================= test session starts =======================
collected 15 items

tests/unit/test_task_model.py ........                    [ 53%]
tests/integration/test_task_api.py .......                [100%]

======================= 15 passed in 2.35s ========================
```

## Common Commands

### Development Server

```bash
# Start server with auto-reload
uvicorn src.main:app --reload

# Start on different port
uvicorn src.main:app --reload --port 8080

# Start with specific host (allow external connections)
uvicorn src.main:app --reload --host 0.0.0.0
```

### Database Management

```bash
# Reset database (drop all tables and recreate)
python scripts/reset_db.py

# Seed sample data
python scripts/seed_data.py

# Backup database
python scripts/backup_db.py
```

### Code Quality

```bash
# Format code with black
black src/ tests/

# Lint code with ruff
ruff check src/ tests/

# Type check with mypy
mypy src/

# Run all checks
./scripts/check_code.sh
```

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/{user_id}/tasks` | Create task |
| GET | `/api/users/{user_id}/tasks` | List all tasks |
| GET | `/api/users/{user_id}/tasks/{task_id}` | Get single task |
| PUT | `/api/users/{user_id}/tasks/{task_id}` | Full update |
| PATCH | `/api/users/{user_id}/tasks/{task_id}` | Partial update |
| DELETE | `/api/users/{user_id}/tasks/{task_id}` | Delete task |

See [contracts/README.md](contracts/README.md) for detailed API documentation.

## Project Structure

```
backend/
├── src/
│   ├── models/
│   │   └── task.py           # Task SQLModel model
│   ├── api/
│   │   ├── routes/
│   │   │   └── tasks.py      # Task CRUD endpoints
│   │   └── dependencies.py   # Shared dependencies
│   ├── database/
│   │   └── connection.py     # DB connection setup
│   ├── config.py             # Environment configuration
│   └── main.py               # FastAPI app entry point
├── tests/
│   ├── integration/
│   │   └── test_task_api.py  # API endpoint tests
│   └── unit/
│       └── test_task_model.py # Model validation tests
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment template
└── README.md                 # Backend documentation
```

## Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**: Activate virtual environment and install dependencies
```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Issue: `Could not connect to database`

**Solution**: Check `.env` file has correct DATABASE_URL
1. Verify connection string format: `postgresql+asyncpg://...`
2. Test connection in Neon dashboard
3. Check network connectivity
4. Verify SSL mode: `?sslmode=require`

### Issue: `Table 'tasks' doesn't exist`

**Solution**: Run application to auto-create tables
```bash
uvicorn src.main:app --reload
```
Tables are created on startup automatically.

### Issue: `Port 8000 already in use`

**Solution**: Use a different port or kill the existing process
```bash
# Use different port
uvicorn src.main:app --reload --port 8080

# Or find and kill process on port 8000 (Linux/macOS)
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Issue: Tests failing with `asyncpg.exceptions.InvalidPasswordError`

**Solution**: Check DATABASE_URL password special characters
- URL-encode special characters in password
- Example: `pass@word` → `pass%40word`
- Or use Neon connection string from dashboard (already encoded)

## Next Steps

1. **Implement Tasks** (Phase 2):
   - Run `/sp.tasks` to generate implementation tasks
   - Follow task breakdown to implement each endpoint

2. **Test Coverage**:
   - Ensure all endpoints have integration tests
   - Verify data isolation between users
   - Test error cases (404, 400, 500)

3. **Documentation**:
   - Update README with any setup changes
   - Document environment variables
   - Add troubleshooting tips

4. **Frontend Integration** (Phase 3):
   - Next.js frontend consumes these APIs
   - Add CORS configuration for frontend origin
   - Implement JWT authentication

## Support & Resources

- **API Documentation**: http://localhost:8000/docs (when server running)
- **OpenAPI Spec**: [contracts/openapi.yaml](contracts/openapi.yaml)
- **Data Model**: [data-model.md](data-model.md)
- **Architecture**: [research.md](research.md)
- **Specification**: [spec.md](spec.md)

## Success Criteria Checklist

After completing quickstart, verify:

- [ ] Backend server starts without errors
- [ ] Swagger UI accessible at http://localhost:8000/docs
- [ ] Can create a task via POST endpoint
- [ ] Can retrieve tasks via GET endpoint
- [ ] Can update task via PUT/PATCH endpoint
- [ ] Can delete task via DELETE endpoint
- [ ] Task data persists across server restarts
- [ ] Different user_ids have isolated tasks
- [ ] All tests pass: `pytest`

If all items are checked, the backend is ready for Phase 2 (implementation)!

## Estimated Time

- **Initial Setup**: 5 minutes
- **Quick Test**: 2 minutes
- **Full Verification**: 10 minutes
- **Total**: ~15-20 minutes

## Phase 1 Complete

Once you've verified all success criteria, the Backend Todo API is ready for task breakdown and implementation.

**Next Command**: `/sp.tasks` (generate implementation tasks)
