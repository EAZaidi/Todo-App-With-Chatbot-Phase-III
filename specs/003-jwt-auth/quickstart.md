# Quickstart: Authentication & Secure API Access (JWT)

**Feature Branch**: `003-jwt-auth`
**Date**: 2026-01-11

## Prerequisites

- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- Neon PostgreSQL database (existing)
- Environment variables configured

## Setup Steps

### 1. Backend Setup

```bash
cd backend

# Install new dependencies
pip install PyJWT[crypto] httpx cachetools

# Add to requirements.txt
echo "PyJWT[crypto]>=2.8.0" >> requirements.txt
echo "httpx>=0.25.0" >> requirements.txt
echo "cachetools>=5.3.0" >> requirements.txt

# Update .env with JWKS URL
echo "JWKS_URL=http://localhost:3000/api/auth/jwks" >> .env
```

### 2. Frontend Setup

```bash
cd frontend

# Install Better Auth
npm install better-auth

# Update .env.local
echo "BETTER_AUTH_SECRET=your-32-char-secret-here" >> .env.local
echo "BETTER_AUTH_URL=http://localhost:3000" >> .env.local
echo "DATABASE_URL=postgresql://..." >> .env.local
```

### 3. Database Migration

Better Auth will auto-create its tables on first run. Verify tables exist:

```sql
-- Check Better Auth tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'sessions', 'accounts', 'jwks');
```

### 4. Start Services

```bash
# Terminal 1: Backend
cd backend
uvicorn src.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 5. Verify Authentication Flow

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecureP@ss123","name":"Test User"}'

# Sign in and get JWT
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecureP@ss123"}' \
  -i  # Include headers to see set-auth-jwt

# Fetch JWKS (should return public keys)
curl http://localhost:3000/api/auth/jwks

# Access protected endpoint with JWT
curl http://localhost:8000/api/users/{user_id}/tasks \
  -H "Authorization: Bearer <jwt_token>"
```

## Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql+asyncpg://... |
| JWKS_URL | Better Auth JWKS endpoint | http://localhost:3000/api/auth/jwks |
| ENVIRONMENT | Environment name | development |

### Frontend (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| BETTER_AUTH_SECRET | 32+ character secret | abc123... |
| BETTER_AUTH_URL | Application URL | http://localhost:3000 |
| DATABASE_URL | PostgreSQL connection string | postgresql://... |
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:8000 |

## Test Authentication

### Test 1: Unauthenticated Request (Expect 401)

```bash
curl -i http://localhost:8000/api/users/test123/tasks
# Expected: HTTP 401 Unauthorized
```

### Test 2: Valid JWT (Expect 200)

```bash
# Use JWT from sign-in response
curl -i http://localhost:8000/api/users/{your_user_id}/tasks \
  -H "Authorization: Bearer <your_jwt>"
# Expected: HTTP 200 OK with tasks array
```

### Test 3: Cross-User Access (Expect 403)

```bash
# Try to access another user's tasks
curl -i http://localhost:8000/api/users/other_user_id/tasks \
  -H "Authorization: Bearer <your_jwt>"
# Expected: HTTP 403 Forbidden
```

## Troubleshooting

### JWKS Fetch Fails
- Ensure frontend is running on port 3000
- Check JWKS_URL in backend .env
- Verify `/api/auth/jwks` returns valid JSON

### JWT Verification Fails
- Check token is not expired (default: 24h)
- Ensure kid in JWT header matches a key in JWKS
- Verify RS256 algorithm is configured

### 403 on Own Resources
- Ensure user_id in URL matches `sub` claim in JWT
- Decode JWT at jwt.io to inspect claims

## Architecture Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Browser       │     │   Next.js +      │     │    FastAPI       │
│                  │────▶│   Better Auth    │────▶│    Backend       │
│                  │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                        │                        │
        │                        │                        │
        │    1. Sign up/in       │                        │
        │───────────────────────▶│                        │
        │                        │                        │
        │    2. JWT token        │                        │
        │◀───────────────────────│                        │
        │                        │                        │
        │    3. API request      │                        │
        │    + JWT header        │                        │
        │───────────────────────────────────────────────▶│
        │                        │                        │
        │                        │    4. Fetch JWKS       │
        │                        │◀───────────────────────│
        │                        │                        │
        │    5. Verified         │                        │
        │       response         │                        │
        │◀───────────────────────────────────────────────│
        │                        │                        │
```

## Next Steps

After completing this quickstart:

1. Run `/sp.tasks` to generate implementation tasks
2. Implement Better Auth configuration on frontend
3. Implement JWT verification middleware on backend
4. Add user isolation checks to all task endpoints
5. Run integration tests to verify authentication flow
