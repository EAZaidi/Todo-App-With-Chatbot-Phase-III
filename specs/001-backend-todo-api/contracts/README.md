# API Contracts: Backend Todo API

**Feature**: Backend Todo API & Persistence
**Branch**: `001-backend-todo-api`
**Date**: 2026-01-09

## Overview

This directory contains the formal API contracts for the Backend Todo API. These contracts define the exact request/response formats, validation rules, and error responses that the backend implementation MUST follow.

## Files

- **`openapi.yaml`**: OpenAPI 3.1.0 specification (complete API contract)

## Using the OpenAPI Specification

### Viewing the Specification

**Option 1: Swagger UI (Recommended)**
- Open `openapi.yaml` in Swagger Editor: https://editor.swagger.io/
- Copy/paste the YAML content or upload the file
- Interactive documentation with "Try it out" functionality

**Option 2: FastAPI Auto-Generated Docs**
- Start the backend server: `uvicorn backend.src.main:app --reload`
- Open http://localhost:8000/docs (Swagger UI)
- Open http://localhost:8000/redoc (ReDoc alternative)

### Generating Client Code

The OpenAPI specification can generate client SDKs:

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript/JavaScript client
openapi-generator-cli generate -i openapi.yaml -g typescript-axios -o ./client

# Generate Python client
openapi-generator-cli generate -i openapi.yaml -g python -o ./client

# See all available generators
openapi-generator-cli list
```

### Testing with the Contract

**Using curl:**

```bash
# Create a task
curl -X POST http://localhost:8000/api/users/user123/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}'

# Get all tasks
curl http://localhost:8000/api/users/user123/tasks

# Get a specific task
curl http://localhost:8000/api/users/user123/tasks/1

# Update a task (full update)
curl -X PUT http://localhost:8000/api/users/user123/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries and milk", "description": "Updated list", "completed": false}'

# Partially update a task
curl -X PATCH http://localhost:8000/api/users/user123/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete a task
curl -X DELETE http://localhost:8000/api/users/user123/tasks/1
```

**Using httpx (Python test client):**

```python
import httpx

client = httpx.Client(base_url="http://localhost:8000")

# Create a task
response = client.post("/api/users/user123/tasks", json={
    "title": "Buy groceries",
    "description": "Milk, eggs, bread"
})
assert response.status_code == 201

# Get all tasks
response = client.get("/api/users/user123/tasks")
assert response.status_code == 200
tasks = response.json()
```

## API Endpoints Summary

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/users/{user_id}/tasks` | List all tasks | None | 200 + Task[] |
| POST | `/api/users/{user_id}/tasks` | Create task | TaskCreate | 201 + Task |
| GET | `/api/users/{user_id}/tasks/{task_id}` | Get single task | None | 200 + Task |
| PUT | `/api/users/{user_id}/tasks/{task_id}` | Full update | TaskUpdate | 200 + Task |
| PATCH | `/api/users/{user_id}/tasks/{task_id}` | Partial update | TaskPartialUpdate | 200 + Task |
| DELETE | `/api/users/{user_id}/tasks/{task_id}` | Delete task | None | 204 No Content |

## Request/Response Schemas

### TaskCreate (POST)

```json
{
  "title": "Buy groceries",           // Required, 1-500 chars, non-empty
  "description": "Milk, eggs, bread"  // Optional, max 5000 chars
}
```

### TaskUpdate (PUT - all fields required)

```json
{
  "title": "Buy groceries",           // Required, 1-500 chars, non-empty
  "description": "Milk, eggs, bread", // Optional (null allowed)
  "completed": false                  // Required, boolean
}
```

### TaskPartialUpdate (PATCH - all fields optional)

```json
{
  "title": "Buy groceries",           // Optional
  "description": "Milk, eggs, bread", // Optional
  "completed": true                   // Optional
}
```

### TaskResponse (GET/POST/PUT/PATCH)

```json
{
  "id": 1,
  "user_id": "user123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "created_at": "2026-01-09T10:00:00Z",
  "updated_at": "2026-01-09T10:00:00Z"
}
```

## Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error (empty title, too long, etc.) |
| 404 | Not Found | Task doesn't exist or doesn't belong to user |
| 500 | Internal Server Error | Database failure or unexpected error |

## Validation Rules

### Title Validation
- **Required**: Must be present in POST/PUT
- **Non-empty**: Cannot be empty string or whitespace-only
- **Max Length**: 500 characters
- **Error Example**:
  ```json
  {
    "detail": [
      {
        "loc": ["body", "title"],
        "msg": "Title cannot be empty or whitespace",
        "type": "value_error"
      }
    ]
  }
  ```

### Description Validation
- **Optional**: Can be omitted or set to `null`
- **Max Length**: 5000 characters
- **Error Example**:
  ```json
  {
    "detail": [
      {
        "loc": ["body", "description"],
        "msg": "String should have at most 5000 characters",
        "type": "string_too_long"
      }
    ]
  }
  ```

### User ID Validation
- **Required**: Path parameter, 1-255 characters
- **Phase 1**: No authentication; accepted as-is
- **Phase 3**: Will be validated against JWT token

### Task ID Validation
- **Required**: Path parameter, positive integer
- **Format**: Integer (1, 2, 3, ...)

## Error Response Format

All error responses follow this structure:

```json
{
  "detail": "Error message"
}
```

Or for validation errors:

```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "Error message",
      "type": "error_type"
    }
  ]
}
```

## Data Isolation & Security

### User Scoping
- All endpoints require `{user_id}` path parameter
- All operations filter by `user_id` automatically
- User A cannot access User B's tasks
- Enforced at database query level: `WHERE user_id = ?`

### Phase 1 Security (Current)
- **No Authentication**: `user_id` accepted without verification
- **Data Isolation**: Enforced via SQL WHERE clauses
- **No Authorization**: Any client can access any user's tasks by providing user_id

### Phase 3 Security (Future)
- **JWT Authentication**: Required for all endpoints
- **Token Validation**: Verify JWT signature and claims
- **User Verification**: Compare JWT `user_id` claim with path parameter
- **Authorization**: Reject if JWT `user_id` ≠ path `user_id` (403 Forbidden)

## Contract Compliance Testing

The implementation MUST pass these contract tests:

### Test Suite 1: HTTP Status Codes
- POST with valid data → 201 Created
- GET existing task → 200 OK
- GET non-existent task → 404 Not Found
- PUT with valid data → 200 OK
- PATCH with valid data → 200 OK
- DELETE existing task → 204 No Content
- POST with empty title → 400 Bad Request
- Database failure → 500 Internal Server Error

### Test Suite 2: Response Format
- All successful responses return JSON
- TaskResponse includes all 7 fields (id, user_id, title, description, completed, created_at, updated_at)
- Timestamps in ISO 8601 format with UTC timezone
- Validation errors include `detail` array with `loc`, `msg`, `type`

### Test Suite 3: Data Isolation
- User A creates task → User B cannot GET it (404 Not Found)
- User A updates task → User B cannot UPDATE it (404 Not Found)
- User A deletes task → User B cannot DELETE it (404 Not Found)
- GET /api/users/userA/tasks returns only userA's tasks

### Test Suite 4: Validation Rules
- Empty title → 400 Bad Request
- Title with only spaces → 400 Bad Request
- Title >500 chars → 400 Bad Request
- Description >5000 chars → 400 Bad Request
- Missing required fields → 400 Bad Request

## OpenAPI Specification Features

The `openapi.yaml` file includes:

- ✅ Complete endpoint definitions (6 endpoints)
- ✅ Request/response schemas (4 schemas)
- ✅ Validation rules (minLength, maxLength, required)
- ✅ Error responses (400, 404, 500)
- ✅ Multiple examples per endpoint
- ✅ Detailed descriptions for all fields
- ✅ Parameter definitions (user_id, task_id)
- ✅ Tags for logical grouping

## Contract Versioning

- **Version**: 1.0.0 (Phase 1)
- **Stability**: Draft (subject to change during development)
- **Backward Compatibility**: Not guaranteed until v1.0.0 final release

## Next Steps

After contracts are approved:
1. Implement FastAPI endpoints matching OpenAPI spec exactly
2. Generate Swagger docs from implementation
3. Validate implementation against `openapi.yaml` using validators
4. Run contract compliance tests
5. Update contracts if discrepancies found (with approval)

## Contract Approval

This contract requires approval before implementation begins. Approval criteria:
- [ ] All 6 endpoints match spec requirements
- [ ] Request/response schemas match data model
- [ ] Validation rules match spec requirements
- [ ] Error responses are clear and actionable
- [ ] Examples cover common use cases and edge cases

**Approval Status**: Pending (awaiting review)
