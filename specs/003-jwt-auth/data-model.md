# Data Model: Authentication & Secure API Access (JWT)

**Feature Branch**: `003-jwt-auth`
**Date**: 2026-01-11
**Status**: Complete

## Entity Overview

```
┌─────────────────┐         ┌─────────────────┐
│     User        │ 1     * │     Task        │
│  (Better Auth)  │─────────│   (Existing)    │
└─────────────────┘         └─────────────────┘
        │
        │ 1
        │
        ▼ *
┌─────────────────┐
│    Session      │
│  (Better Auth)  │
└─────────────────┘
```

## Entities

### User (Better Auth Managed)

The User entity is managed by Better Auth and stored in the `users` table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK, UUID | Unique user identifier |
| email | string | UNIQUE, NOT NULL | User's email address |
| emailVerified | boolean | DEFAULT false | Email verification status |
| name | string | NULLABLE | Display name |
| image | string | NULLABLE | Profile image URL |
| createdAt | timestamp | NOT NULL | Account creation time |
| updatedAt | timestamp | NOT NULL | Last update time |

**Validation Rules**:
- Email must be valid format (RFC 5322)
- Email must be unique across all users
- Password: minimum 8 characters (stored hashed, not in this table)

**Notes**:
- Better Auth stores password hash in `accounts` table, not `users`
- The `id` field is what appears in JWT `sub` claim

---

### Session (Better Auth Managed)

Optional with JWT strategy, but Better Auth may still create sessions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK | Session identifier |
| userId | string | FK → users.id | Associated user |
| token | string | UNIQUE | Session token (hashed) |
| expiresAt | timestamp | NOT NULL | Session expiration |
| ipAddress | string | NULLABLE | Client IP |
| userAgent | string | NULLABLE | Client user agent |
| createdAt | timestamp | NOT NULL | Session creation time |
| updatedAt | timestamp | NOT NULL | Last activity time |

---

### Account (Better Auth Managed)

Stores credential information (passwords, OAuth tokens).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK | Account identifier |
| userId | string | FK → users.id | Associated user |
| accountId | string | NOT NULL | Provider account ID |
| providerId | string | NOT NULL | Auth provider (e.g., "credential") |
| password | string | NULLABLE | Hashed password (for credential auth) |
| accessToken | string | NULLABLE | OAuth access token |
| refreshToken | string | NULLABLE | OAuth refresh token |
| expiresAt | timestamp | NULLABLE | Token expiration |
| createdAt | timestamp | NOT NULL | Account creation time |
| updatedAt | timestamp | NOT NULL | Last update time |

**For email/password auth**:
- `providerId` = "credential"
- `accountId` = user's email
- `password` = bcrypt-hashed password

---

### JWKS (Better Auth Managed)

Stores JWT signing keys for RS256.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK | Key identifier (kid) |
| publicKey | text | NOT NULL | PEM-encoded public key |
| privateKey | text | NOT NULL | Encrypted private key |
| createdAt | timestamp | NOT NULL | Key creation time |

**Notes**:
- Private key encrypted with AES256-GCM
- Public key exposed via `/api/auth/jwks` endpoint
- Multiple keys may exist during rotation

---

### Task (Existing - Modified)

The existing Task entity, with user relationship enforced.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | PK, AUTO | Task identifier |
| user_id | string | FK → users.id, NOT NULL, INDEX | Owner's user ID |
| title | string(500) | NOT NULL | Task title |
| description | string(5000) | NULLABLE | Task description |
| completed | boolean | NOT NULL, DEFAULT false | Completion status |
| created_at | timestamp | NOT NULL | Creation time |
| updated_at | timestamp | NOT NULL | Last update time |

**Changes from existing model**:
- Add foreign key constraint: `user_id REFERENCES users(id) ON DELETE CASCADE`
- This ensures task deletion when user is deleted

**Validation Rules**:
- Title: 1-500 characters, non-empty
- Description: 0-5000 characters
- User ID must exist in users table

---

## Relationships

### User → Task (One-to-Many)
- One user can have many tasks
- Each task belongs to exactly one user
- Deleting a user cascades to delete all their tasks

### User → Session (One-to-Many)
- One user can have multiple active sessions
- Sessions are managed by Better Auth

### User → Account (One-to-Many)
- One user can have multiple accounts (for multi-provider auth)
- For this spec, each user has exactly one "credential" account

---

## JWT Token Structure

Not a database entity, but important for understanding the auth flow.

### JWT Header
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key_identifier_from_jwks"
}
```

### JWT Payload
```json
{
  "iss": "https://your-app.com",
  "aud": "https://your-app.com",
  "sub": "user_id_here",
  "exp": 1704067200,
  "iat": 1704063600,
  "user": {
    "id": "user_id_here",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Claims Used for Authorization

| Claim | Usage |
|-------|-------|
| `sub` | Primary user identifier for path matching |
| `exp` | Token expiration check |
| `iat` | Token freshness (optional) |

---

## Database Migration Plan

### Phase 1: Better Auth Tables (New)
```sql
-- Better Auth will auto-create these tables
-- Listed here for documentation

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    name VARCHAR(255),
    image TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE accounts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    account_id VARCHAR(255) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE jwks (
    id VARCHAR(36) PRIMARY KEY,
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Phase 2: Task Table Modification
```sql
-- Add foreign key constraint (if not exists)
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

**Note**: The `user_id` column already exists in the tasks table. This migration only adds the foreign key constraint for referential integrity.

---

## Index Strategy

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| users | PRIMARY | id | Primary key lookup |
| users | UNIQUE | email | Email uniqueness, login lookup |
| sessions | PRIMARY | id | Session lookup |
| sessions | INDEX | user_id | User's sessions |
| sessions | UNIQUE | token | Token validation |
| accounts | PRIMARY | id | Account lookup |
| accounts | INDEX | user_id | User's accounts |
| accounts | INDEX | provider_id, account_id | Provider login lookup |
| jwks | PRIMARY | id | Key lookup by kid |
| tasks | PRIMARY | id | Task lookup |
| tasks | INDEX | user_id | User's tasks (existing) |
