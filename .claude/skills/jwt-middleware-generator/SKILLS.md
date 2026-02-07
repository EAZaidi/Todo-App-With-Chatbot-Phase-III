# JWT Middleware Generator

## Purpose
Generate JWT authentication and authorization middleware for FastAPI backends with secure token handling, validation, and role-based access control.

## Used by
- backend-engineer

## Overview
JWT (JSON Web Token) middleware generation is the specialized skill of implementing secure authentication and authorization layers in FastAPI applications. This involves token generation, validation, refresh mechanisms, role-based access control, and proper error handling for authentication failures.

## Core Concepts

### JWT Structure
```
Header.Payload.Signature

Header:
{
  "alg": "RS256",  // Algorithm
  "typ": "JWT"     // Token type
}

Payload:
{
  "sub": "user_id",           // Subject (user identifier)
  "email": "user@example.com",
  "role": "admin",
  "exp": 1704850800,          // Expiration timestamp
  "iat": 1704764400,          // Issued at timestamp
  "jti": "unique-token-id"    // JWT ID (for blacklisting)
}

Signature:
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

## Middleware Patterns

### Pattern 1: Basic JWT Authentication
```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

app = FastAPI()
security = HTTPBearer()

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "RS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class TokenData:
    """Token payload data model."""
    def __init__(self, user_id: str, email: str, role: str):
        self.user_id = user_id
        self.email = email
        self.role = role

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate JWT access token."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4())
    })

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """Verify and decode JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception

        return TokenData(
            user_id=user_id,
            email=payload.get("email"),
            role=payload.get("role")
        )
    except JWTError:
        raise credentials_exception

@app.get("/protected")
async def protected_route(token_data: TokenData = Depends(verify_token)):
    """Protected endpoint requiring valid JWT."""
    return {"message": "Access granted", "user_id": token_data.user_id}
```

### Pattern 2: Role-Based Access Control (RBAC)
```python
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

def require_role(allowed_roles: list[UserRole]):
    """Dependency factory for role-based access control."""
    async def role_checker(token_data: TokenData = Depends(verify_token)) -> TokenData:
        if token_data.role not in [role.value for role in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return token_data
    return role_checker

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: TokenData = Depends(require_role([UserRole.ADMIN]))
):
    """Admin-only endpoint."""
    return {"message": f"User {user_id} deleted"}
```

### Pattern 3: Refresh Token System
```python
from sqlmodel import Field, Session, select

class RefreshToken(SQLModel, table=True):
    """Refresh token database model."""
    __tablename__ = "refresh_tokens"
    
    id: Optional[str] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    token: str = Field(unique=True, index=True)
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    revoked: bool = Field(default=False)

def create_refresh_token(user_id: str, session: Session) -> str:
    """Create refresh token for user."""
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    refresh_token = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    
    session.add(refresh_token)
    session.commit()
    return token
```

## Security Best Practices

```python
# Use environment variables
SECRET_KEY = os.getenv("JWT_SECRET")  # Strong random key (256+ bits)
ALGORITHM = "RS256"  # Use asymmetric for production

# Token expiration
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Short-lived access tokens
REFRESH_TOKEN_EXPIRE_DAYS = 7     # Longer refresh tokens
```

### Password Hashing
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

## Testing

```python
import pytest
from fastapi.testclient import TestClient

def test_protected_route_with_valid_token(client):
    """Test accessing protected route with valid token."""
    token = create_access_token({
        "sub": "user123",
        "email": "test@example.com",
        "role": "user"
    })
    
    response = client.get(
        "/protected",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
```

## Best Practices

### DO:
✅ Use RS256 (asymmetric) for production
✅ Set short expiration for access tokens (15-30 min)
✅ Store secrets in environment variables
✅ Implement refresh token rotation
✅ Blacklist tokens on logout
✅ Use HTTPS only in production
✅ Validate all token claims
✅ Hash passwords with bcrypt
✅ Implement rate limiting on auth endpoints
✅ Log authentication events

### DON'T:
❌ Store sensitive data in JWT payload
❌ Use HS256 with weak secrets
❌ Skip token expiration validation
❌ Store tokens in localStorage (XSS risk)
❌ Use same secret for all environments
❌ Return detailed error messages to clients
❌ Skip password hashing
❌ Allow unlimited login attempts
❌ Hardcode secrets in code
❌ Trust client-provided role claims

## Related Skills
- **FastAPI Endpoint Generator**: Integrating auth into endpoints
- **Code Generation**: Writing secure authentication code
- **Validation**: Testing authentication flows
- **Technical Documentation**: Documenting auth requirements
