# Backend Todo API

RESTful backend service for Todo task management with persistent storage using Neon Serverless PostgreSQL.

## Features

- 6 REST API endpoints for complete CRUD operations
- User-scoped data isolation
- Async/await architecture with SQLModel ORM
- Comprehensive test suite (unit + integration)
- Auto-generated OpenAPI documentation

## Tech Stack

- **Python**: 3.11+
- **Framework**: FastAPI
- **ORM**: SQLModel
- **Database**: Neon Serverless PostgreSQL
- **Testing**: pytest, httpx

## Project Structure

```
backend/
├── src/
│   ├── models/
│   │   └── task.py           # Task model and schemas
│   ├── api/
│   │   ├── routes/
│   │   │   └── tasks.py      # Task CRUD endpoints
│   │   └── dependencies.py   # Shared dependencies
│   ├── database/
│   │   └── connection.py     # Database connection
│   ├── config.py             # Environment configuration
│   └── main.py               # FastAPI app entry point
├── tests/
│   ├── unit/
│   │   └── test_task_model.py
│   └── integration/
│       └── test_task_api.py
├── requirements.txt
├── .env.example
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Python 3.11 or higher
- Neon PostgreSQL database (create at https://neon.tech)
- pip (Python package installer)

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your Neon database connection string:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql+asyncpg://username:password@your-neon-host.neon.tech/todo_db
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
```

### 4. Run the Server

```bash
# From the backend directory
python -m uvicorn backend.src.main:app --reload

# Or from the repository root
uvicorn backend.src.main:app --reload
```

The server will start at http://localhost:8000

### 5. Access API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/

## API Endpoints

All endpoints are prefixed with `/api`

### Create Task
```http
POST /api/users/{user_id}/tasks
Content-Type: application/json

{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

### List All Tasks
```http
GET /api/users/{user_id}/tasks
```

### Get Single Task
```http
GET /api/users/{user_id}/tasks/{task_id}
```

### Update Task (Full)
```http
PUT /api/users/{user_id}/tasks/{task_id}
Content-Type: application/json

{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread, butter",
  "completed": true
}
```

### Update Task (Partial)
```http
PATCH /api/users/{user_id}/tasks/{task_id}
Content-Type: application/json

{
  "completed": true
}
```

### Delete Task
```http
DELETE /api/users/{user_id}/tasks/{task_id}
```

## Testing

### Run All Tests

```bash
# From backend directory
pytest tests/ -v

# With coverage
pytest tests/ -v --cov=backend.src --cov-report=html
```

### Run Specific Test Suites

```bash
# Unit tests only
pytest tests/unit/ -v

# Integration tests only
pytest tests/integration/ -v

# Specific user story tests
pytest tests/ -v -k "test_create_task or test_list_tasks"
```

## Database Schema

### tasks table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-generated task ID |
| user_id | VARCHAR(255) | NOT NULL, INDEXED | User who owns the task |
| title | VARCHAR(500) | NOT NULL | Task title |
| description | TEXT | NULLABLE | Task description (optional) |
| completed | BOOLEAN | NOT NULL, DEFAULT FALSE | Completion status |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp (UTC) |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp (UTC) |

## Development

### Code Style

- Follow PEP 8 style guide
- Use type hints for all functions
- Add docstrings to all public functions and classes
- Keep functions focused and single-purpose

### Adding New Endpoints

1. Define request/response schemas in `models/`
2. Implement endpoint in `api/routes/`
3. Write tests in `tests/integration/`
4. Update OpenAPI documentation
5. Update this README

### Error Handling

- 400 Bad Request: Validation errors
- 404 Not Found: Task not found or doesn't belong to user
- 500 Internal Server Error: Database failures (generic message, no details leaked)

## Troubleshooting

### Database Connection Errors

- Verify DATABASE_URL is correct in `.env`
- Check Neon database is running and accessible
- Ensure connection string uses `postgresql+asyncpg://` scheme

### Import Errors

- Ensure you're in the correct directory
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.11+)

### Test Failures

- Ensure database is accessible
- Check all environment variables are set
- Run tests with `-v` flag for verbose output
- Check test isolation (tests should not depend on each other)

## Performance

- Response time: <500ms for task operations under normal load
- Supports 100+ sequential CRUD operations without degradation
- Connection pooling: 10 connections (configurable)
- Async architecture for efficient I/O handling

## Security

- User-scoped data isolation (enforced via user_id path parameter)
- SQL injection prevention (parameterized queries via SQLModel)
- No secrets in code (environment variables only)
- Generic error messages (no internal details leaked)
- CORS configured (all origins in development, restricted in production)

## Future Enhancements

- JWT authentication (Phase 3)
- Pagination for task lists
- Search and filtering
- Task sorting options
- Soft delete (trash/archive)
- Audit logging
- Rate limiting

## License

[Your License Here]

## Contact

[Your Contact Information]
