"""
JWKS (JSON Web Key Set) fetching and caching service.

Fetches public keys from Better Auth's JWKS endpoint for JWT verification.
Caches keys to avoid repeated HTTP requests.
"""

import logging
from typing import Any, Optional

import httpx
from cachetools import TTLCache  # type: ignore[import-untyped]

from src.config import settings

logger = logging.getLogger(__name__)

# Cache JWKS for 1 hour (3600 seconds)
_jwks_cache: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=10, ttl=3600)


class JWKSService:
    """Service for fetching and caching JWKS from Better Auth."""

    def __init__(self, jwks_url: Optional[str] = None):
        """
        Initialize JWKS service.

        Args:
            jwks_url: URL to fetch JWKS from. Defaults to settings.JWKS_URL.
        """
        self.jwks_url = jwks_url or settings.JWKS_URL
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=10.0)
        return self._client

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def fetch_jwks(self, force_refresh: bool = False) -> dict[str, Any]:
        """
        Fetch JWKS from the configured endpoint.

        Args:
            force_refresh: If True, bypass cache and fetch fresh JWKS.

        Returns:
            JWKS response containing keys array.

        Raises:
            httpx.HTTPError: If JWKS fetch fails.
        """
        cache_key = self.jwks_url

        # Check cache first
        if not force_refresh and cache_key in _jwks_cache:
            logger.debug("Using cached JWKS")
            return _jwks_cache[cache_key]

        logger.info(f"Fetching JWKS from {self.jwks_url}")

        client = await self._get_client()

        try:
            response = await client.get(self.jwks_url)
            response.raise_for_status()
            jwks = response.json()

            # Cache the result
            _jwks_cache[cache_key] = jwks
            logger.info(f"Fetched and cached JWKS with {len(jwks.get('keys', []))} keys")

            return jwks

        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch JWKS: {e}")
            # If we have a cached version (even if expired), use it as fallback
            if cache_key in _jwks_cache:
                logger.warning("Using stale cached JWKS as fallback")
                return _jwks_cache[cache_key]
            raise

    async def get_key_by_kid(self, kid: str) -> Optional[dict[str, Any]]:
        """
        Get a specific key from JWKS by key ID.

        Args:
            kid: Key ID to find.

        Returns:
            JWK dictionary if found, None otherwise.
        """
        jwks = await self.fetch_jwks()
        keys = jwks.get("keys", [])

        for key in keys:
            if key.get("kid") == kid:
                return key

        # Key not found, try refreshing JWKS
        logger.info(f"Key {kid} not found, refreshing JWKS")
        jwks = await self.fetch_jwks(force_refresh=True)
        keys = jwks.get("keys", [])

        for key in keys:
            if key.get("kid") == kid:
                return key

        logger.warning(f"Key {kid} not found in JWKS")
        return None

    async def get_all_keys(self) -> list[dict[str, Any]]:
        """
        Get all keys from JWKS.

        Returns:
            List of JWK dictionaries.
        """
        jwks = await self.fetch_jwks()
        return jwks.get("keys", [])


# Global instance for dependency injection
jwks_service = JWKSService()
