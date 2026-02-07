# FastAPI Endpoint Generator

## Purpose
Create FastAPI endpoints from approved backend specifications, including request/response models, routing, and basic validation.

## Used by
- backend-engineer

## Overview
FastAPI endpoint generation is the specialized skill of creating Python-based API endpoints using FastAPI, SQLModel, and Pydantic. This skill combines async programming, type safety, database operations, and REST API design to build performant and well-documented backend services.

## Core Patterns

### Basic Endpoint Structure
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from models import User, UserCreate, UserResponse
from database import get_session

router = APIRouter(prefix="/api/v1/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    session: Session = Depends(get_session)
) -> User:
    """
    Create a new user.

    - **email**: Valid email address (unique)
    - **password**: Minimum 8 characters
    - **name**: User's full name
    """
    # Check if user exists
    existing = await session.exec(
        select(User).where(User.email == user_data.email)
    )
    if existing.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = hash_password(user_data.password)

    # Create user
    user = User(
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name
    )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return user


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session)
) -> List[User]:
    """Get list of users with pagination."""
    query = select(User).offset(skip).limit(limit)
    result = await session.exec(query)
    return result.all()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    session: Session = Depends(get_session)
) -> User:
    """Get user by ID."""
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    session: Session = Depends(get_session)
) -> User:
    """Update user information."""
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )

    # Update fields
    for key, value in user_data.dict(exclude_unset=True).items():
        setattr(user, key, value)

    await session.commit()
    await session.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    session: Session = Depends(get_session)
):
    """Delete a user."""
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )

    await session.delete(user)
    await session.commit()
```

## Model Definitions

### SQLModel (Database + Pydantic)
```python
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from pydantic import EmailStr, validator

class UserBase(SQLModel):
    """Base user model with shared fields."""
    email: EmailStr
    name: str = Field(min_length=2, max_length=100)

class User(UserBase, table=True):
    """Database user model."""
    __tablename__ = "users"

    id: Optional[str] = Field(default=None, primary_key=True)
    password_hash: str
    role: str = Field(default="user")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(UserBase):
    """Schema for creating users."""
    password: str = Field(min_length=8, max_length=64)

    @validator('password')
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain number')
        return v

class UserUpdate(SQLModel):
    """Schema for updating users."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class UserResponse(UserBase):
    """Schema for user responses (excludes sensitive data)."""
    id: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True
```

## Authentication & Authorization

### JWT Authentication
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCookie
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "RS256"

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Generate JWT token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    token: str = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """Validate JWT and return current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await session.get(User, user_id)
    if user is None:
        raise credentials_exception

    return user

def require_role(required_role: str):
    """Dependency to check user role."""
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Usage in endpoints
@router.post("/admin-only")
async def admin_endpoint(
    current_user: User = Depends(require_role("admin"))
):
    return {"message": "Admin access granted"}
```

## Error Handling

### Custom Exceptions
```python
class AppException(Exception):
    """Base application exception."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class NotFoundError(AppException):
    """Resource not found."""
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_404_NOT_FOUND)

class ValidationError(AppException):
    """Validation failed."""
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)

# Exception handlers
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "code": exc.status_code}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "Validation error", "details": exc.errors()}
    )
```

## Database Operations

### Async Database Session
```python
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_session() -> AsyncSession:
    """Dependency to get database session."""
    async with async_session_maker() as session:
        yield session

# Complex queries
@router.get("/users/search")
async def search_users(
    query: str,
    session: AsyncSession = Depends(get_session)
):
    """Search users by name or email."""
    statement = select(User).where(
        or_(
            User.name.contains(query),
            User.email.contains(query)
        )
    ).order_by(User.created_at.desc())

    result = await session.exec(statement)
    return result.all()
```

## Request Validation

```python
from pydantic import BaseModel, Field, validator
from typing import Optional
from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"

class CreateOrderRequest(BaseModel):
    """Request schema for creating orders."""
    items: List[OrderItem] = Field(..., min_items=1, max_items=100)
    shipping_address: str = Field(..., min_length=10)
    notes: Optional[str] = Field(None, max_length=500)

    @validator('items')
    def validate_items(cls, v):
        total = sum(item.quantity for item in v)
        if total > 1000:
            raise ValueError('Total quantity cannot exceed 1000')
        return v

    class Config:
        schema_extra = {
            "example": {
                "items": [{"product_id": "123", "quantity": 2}],
                "shipping_address": "123 Main St, City, Country",
                "notes": "Please deliver before 5 PM"
            }
        }
```

## Best Practices

### DO:
✅ Use async/await for database operations
✅ Define Pydantic models for validation
✅ Use dependency injection
✅ Implement proper error handling
✅ Add docstrings to endpoints
✅ Use type hints everywhere
✅ Return appropriate status codes
✅ Validate input thoroughly
✅ Use transactions for multiple operations
✅ Log errors and important events

### DON'T:
❌ Use synchronous database calls
❌ Skip input validation
❌ Return raw database models (use response models)
❌ Expose password hashes
❌ Ignore error handling
❌ Skip authentication on protected routes
❌ Use SELECT * queries
❌ Forget to close database sessions
❌ Hard-code sensitive data
❌ Return 200 for errors

## Testing

```python
from fastapi.testclient import TestClient
import pytest

@pytest.fixture
def client():
    return TestClient(app)

def test_create_user(client):
    """Test user creation endpoint."""
    response = client.post("/api/v1/users", json={
        "email": "test@example.com",
        "password": "SecurePass123!",
        "name": "Test User"
    })

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "password" not in data
    assert "id" in data

def test_create_duplicate_user(client):
    """Test duplicate email validation."""
    # Create first user
    client.post("/api/v1/users", json={
        "email": "test@example.com",
        "password": "SecurePass123!",
        "name": "Test User"
    })

    # Try to create duplicate
    response = client.post("/api/v1/users", json={
        "email": "test@example.com",
        "password": "SecurePass123!",
        "name": "Test User 2"
    })

    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]
```

## Related Skills
- **Code Generation**: General coding principles
- **Validation**: Testing endpoints
- **Technical Documentation**: API documentation
- **JWT Middleware**: Authentication implementation
