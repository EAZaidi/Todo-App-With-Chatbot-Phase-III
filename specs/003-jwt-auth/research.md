# Research: Authentication & Secure API Access (JWT)

**Feature Branch**: `003-jwt-auth`
**Date**: 2026-01-11
**Status**: Complete

## Research Questions Resolved

### RQ-1: Better Auth JWT Configuration

**Question**: How does Better Auth issue and configure JWT tokens?

**Findings**:
- Better Auth is a TypeScript authentication framework with a dedicated JWT plugin
- Default signing algorithm: **EdDSA with Ed25519 curve** (asymmetric)
- Also supports: ES256, RS256, PS256, ECDH-ES, ES512
- Uses **asymmetric cryptography** (public/private key pairs), NOT shared secrets
- Keys are stored in a `jwks` database table and exposed via `/api/auth/jwks` endpoint
- Private keys are encrypted using AES256 GCM by default

**Decision**: Use Better Auth's JWT plugin with EdDSA algorithm (default, most secure)

**Rationale**: EdDSA is more secure than HS256 and more performant than RS256. Better Auth's JWKS approach eliminates shared secret management.

**Alternatives Considered**:
- HS256 with shared secret: Not supported by Better Auth JWT plugin
- RS256: Supported but EdDSA offers better performance for similar security

**Sources**:
- [Better Auth JWT Plugin](https://www.better-auth.com/docs/plugins/jwt)
- [Better Auth npm package](https://www.npmjs.com/package/better-auth)

---

### RQ-2: JWT Verification in FastAPI Backend

**Question**: How should FastAPI verify JWTs issued by Better Auth?

**Findings**:
- Better Auth exposes JWKS at `/api/auth/jwks` endpoint
- FastAPI can use `python-jose` or `PyJWT[crypto]` to verify tokens
- JWKS can be fetched once and cached (keys don't change frequently)
- The `kid` (key ID) in JWT header identifies which key signed it
- For EdDSA verification, use `cryptography` package

**Decision**: FastAPI will fetch JWKS from Better Auth's endpoint and verify tokens locally

**Rationale**:
- No shared secret to manage or leak
- Backend can verify tokens without calling Better Auth on every request
- JWKS caching means minimal overhead after initial fetch

**Implementation Approach**:
```python
# Pseudocode for FastAPI JWT verification
from jose import jwt
from jose.backends import Ed25519Key

# Fetch JWKS once on startup (cache it)
jwks = fetch_from(f"{BETTER_AUTH_URL}/api/auth/jwks")

# On each request
def verify_token(token: str):
    header = jwt.get_unverified_header(token)
    key = find_key_by_kid(jwks, header["kid"])
    return jwt.decode(token, key, algorithms=["EdDSA"])
```

**Sources**:
- [FastAPI JWT Auth Guide](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [FastAPI RS256 JWT with JWKS](https://alukach.com/posts/fastapi-rs256-jwt/)

---

### RQ-3: JWT Claims and User ID Mapping

**Question**: What claims does Better Auth include in JWTs, and how to map user ID?

**Findings**:
- Standard claims: `iss` (issuer), `aud` (audience), `exp` (expiration), `sub` (subject)
- `sub` claim defaults to **user ID**
- Full user object included by default (customizable via `definePayload`)
- Expiration default: 15 minutes

**Decision**: Use `sub` claim as user ID for authorization checks

**Rationale**:
- `sub` is the standard JWT claim for subject identifier
- Matches existing API path structure `/users/{user_id}/tasks`
- No custom payload needed - default claims sufficient

**JWT Payload Example**:
```json
{
  "iss": "https://your-app.com",
  "aud": "https://your-app.com",
  "sub": "user_abc123",
  "exp": 1704067200,
  "iat": 1704063600,
  "user": {
    "id": "user_abc123",
    "email": "user@example.com"
  }
}
```

---

### RQ-4: Constitution Alignment - RS256 vs EdDSA

**Question**: Constitution specifies RS256, but Better Auth defaults to EdDSA. How to resolve?

**Findings**:
- Constitution v1.0.0 states: "JWT tokens signed with RS256 algorithm"
- Better Auth supports RS256 but defaults to EdDSA
- Both are asymmetric algorithms using JWKS

**Decision**: Request constitution amendment or configure Better Auth to use RS256

**Options**:
1. **Amend constitution** to allow EdDSA (recommended - more secure, faster)
2. **Configure Better Auth** for RS256:
   ```ts
   jwt({
     jwks: {
       keyPairConfig: {
         alg: "RS256"
       }
     }
   })
   ```

**Recommendation**: Option 2 - Configure RS256 to maintain constitution compliance without amendment process. RS256 is still secure and widely supported.

---

### RQ-5: Better Auth Database Requirements

**Question**: Does Better Auth require its own database, and how does this affect architecture?

**Findings**:
- Better Auth requires database for: users, sessions, accounts, JWKS keys
- Supports multiple database adapters (Prisma, Drizzle, raw SQL, etc.)
- Can share database with existing application
- Requires specific table schema (users, sessions, accounts, jwks)

**Decision**: Better Auth will use the same Neon PostgreSQL database as the FastAPI backend

**Rationale**:
- Single database simplifies infrastructure
- User IDs will be consistent across Better Auth and FastAPI
- Neon PostgreSQL is already provisioned

**Schema Tables Required**:
- `users` - User accounts (Better Auth managed)
- `sessions` - Session data (optional with JWT)
- `accounts` - OAuth accounts (not used in this spec)
- `jwks` - JWT signing keys

---

### RQ-6: Token Expiration and Frontend Handling

**Question**: How should the frontend handle token expiration?

**Findings**:
- Better Auth default JWT expiration: 15 minutes
- Token refresh NOT in scope per spec
- When token expires, user must re-authenticate

**Decision**:
- Set JWT expiration to 24 hours (balance security vs UX)
- Frontend detects 401 and redirects to sign-in
- No automatic token refresh

**Configuration**:
```ts
jwt({
  jwt: {
    expiresIn: 60 * 60 * 24 // 24 hours in seconds
  }
})
```

---

## Technology Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| JWT Algorithm | RS256 | Constitution compliance, asymmetric security |
| Key Management | JWKS via Better Auth | Industry standard, no shared secrets |
| User ID Claim | `sub` | JWT standard, maps to existing API |
| Token Verification | JWKS fetch + local verify | Stateless, performant |
| Database | Shared Neon PostgreSQL | Simplified infrastructure |
| Token Expiration | 24 hours | Balance security/UX, no refresh tokens |
| Frontend Library | Better Auth client | First-party support |
| Backend Library | PyJWT[crypto] | RS256 support, well-maintained |

## Dependencies Identified

### Frontend (Next.js)
- `better-auth` - Core auth framework
- `better-auth/plugins` - JWT plugin
- `better-auth/client/plugins` - Client-side JWT support

### Backend (FastAPI)
- `PyJWT[crypto]` - JWT verification with RS256 support
- `httpx` - Async HTTP client for JWKS fetch
- `cachetools` - JWKS caching

### Database
- New tables: `users`, `sessions`, `accounts`, `jwks` (Better Auth schema)
- Existing table: `tasks` (add foreign key to users)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| JWKS endpoint unavailable | Backend can't verify tokens | Cache JWKS aggressively, implement retry |
| Clock skew between services | Token validation failures | Add 30-second leeway in verification |
| Key rotation during request | Temporary verification failures | Better Auth's grace period handles this |
