"""
JWT authentication middleware for FastAPI.

Provides functions for extracting, verifying, and validating JWT tokens
from Authorization headers using JWKS from Better Auth.
"""

import logging
from typing import Any, Optional

import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient, PyJWK

from src.config import settings

logger = logging.getLogger(__name__)

# Initialize PyJWKClient for RS256 verification
_jwk_client: Optional[PyJWKClient] = None


def get_jwk_client() -> PyJWKClient:
    """
    Get or create PyJWKClient for JWKS fetching.

    Returns:
        PyJWKClient instance configured with JWKS URL.
    """
    global _jwk_client
    if _jwk_client is None:
        _jwk_client = PyJWKClient(
            settings.JWKS_URL,
            cache_keys=True,
            lifespan=3600,  # Cache keys for 1 hour
        )
    return _jwk_client


def extract_token_from_header(authorization: Optional[str]) -> str:
    """
    Extract JWT token from Authorization header.

    Args:
        authorization: Authorization header value (e.g., "Bearer <token>").

    Returns:
        JWT token string.

    Raises:
        HTTPException: 401 if header is missing or malformed.
    """
    if not authorization:
        logger.warning("Missing Authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()

    if len(parts) != 2 or parts[0].lower() != "bearer":
        logger.warning(f"Malformed Authorization header: {authorization[:50]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return parts[1]


def verify_token(token: str) -> dict[str, Any]:
    """
    Verify JWT token signature and expiration using JWKS.

    Args:
        token: JWT token string.

    Returns:
        Decoded token payload.

    Raises:
        HTTPException: 401 if token is invalid, expired, or signature fails.
    """
    import time

    try:
        # Debug: Decode without verification to see claims
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            exp = unverified.get("exp", 0)
            iat = unverified.get("iat", 0)
            now = int(time.time())
            logger.info(f"Token debug - exp: {exp}, iat: {iat}, now: {now}, exp-now: {exp - now}s")
        except Exception as e:
            logger.warning(f"Could not decode token for debug: {e}")

        # Get the signing key from JWKS
        jwk_client = get_jwk_client()
        signing_key = jwk_client.get_signing_key_from_jwt(token)

        # Decode and verify the token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
                "verify_aud": False,  # Better Auth tokens may have aud claim we don't need to verify
                "require": ["sub", "exp", "iat"],
            },
            leeway=30,  # 30 second leeway for clock skew
        )

        logger.debug(f"Token verified for user: {payload.get('sub')}")
        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_user_id_from_token(token: str) -> str:
    """
    Extract user ID from verified JWT token.

    Args:
        token: JWT token string.

    Returns:
        User ID from the 'sub' claim.

    Raises:
        HTTPException: 401 if token is invalid or missing 'sub' claim.
    """
    payload = verify_token(token)
    user_id = payload.get("sub")

    if not user_id:
        logger.warning("Token missing 'sub' claim")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


def verify_user_access(token_user_id: str, path_user_id: str) -> None:
    """
    Verify that the JWT user ID matches the path user ID.

    Args:
        token_user_id: User ID from JWT 'sub' claim.
        path_user_id: User ID from URL path parameter.

    Raises:
        HTTPException: 403 if user IDs do not match.
    """
    if token_user_id != path_user_id:
        logger.warning(
            f"User ID mismatch: token={token_user_id}, path={path_user_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
