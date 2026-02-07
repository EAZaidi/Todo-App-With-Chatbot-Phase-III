# Technical Clarity & Documentation

## Purpose
Ensure all artifacts—specifications, plans, code, and prompts—are clear, maintainable, and reusable across phases.

## Used by
- specification-writer
- architecture-designer
- cloud-devops-architect

## Overview
Technical clarity is the skill of communicating complex technical concepts in a clear, precise, and maintainable way. Good documentation enables teams to understand, maintain, and evolve systems efficiently without constant tribal knowledge transfer.

## Core Principles

### 1. Clarity First
- Use simple language over complex terminology
- Define technical terms when first used
- One concept per paragraph
- Active voice over passive voice
- Concrete examples over abstract descriptions

### 2. Audience Awareness
- Write for the intended reader
- Adjust technical depth appropriately
- Provide context for decisions
- Anticipate reader questions
- Include "why" not just "what"

### 3. Maintainability
- Keep documentation close to code
- Update docs when code changes
- Version control documentation
- Make docs searchable
- Date-stamp time-sensitive content

### 4. Completeness Without Redundancy
- Cover all necessary information
- Don't repeat what's obvious
- Link to authoritative sources
- Avoid duplicating information
- Focus on unique insights

## Documentation Types

### 1. API Documentation
```markdown
## POST /api/v1/users

Create a new user account.

**Authentication**: Required (JWT token)
**Rate Limit**: 10 requests/minute

### Request Body
```json
{
  "email": "user@example.com",     // Required. Valid email format.
  "password": "SecurePass123!",    // Required. 8-64 chars, mixed case, number, special.
  "name": "John Doe",              // Required. 2-100 chars.
  "role": "user"                   // Optional. Default: "user". Allowed: "user" | "admin"
}
```

### Response 201 Created
```json
{
  "id": "uuid-v4",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2024-01-09T10:30:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid input (validation errors)
- **409 Conflict**: Email already registered
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Example
```bash
curl -X POST https://api.example.com/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```
```

### 2. Architecture Documentation
```markdown
# User Authentication System

## Overview
JWT-based authentication system for web and mobile clients.

## Architecture Diagram
```
[Client] → [API Gateway] → [Auth Service] → [User DB]
                              ↓
                         [Token Cache]
```

## Components

### Auth Service
**Responsibility**: Authenticate users and issue JWT tokens
**Technology**: FastAPI, Python 3.11
**Dependencies**: User DB (PostgreSQL), Token Cache (Redis)
**Endpoints**: `/login`, `/refresh`, `/logout`

### Token Cache
**Responsibility**: Store active tokens and blacklist
**Technology**: Redis 7.0
**TTL**: 24 hours for access tokens, 7 days for refresh tokens

## Data Flow

1. User submits credentials to `/login`
2. Auth Service validates against User DB
3. If valid, generates JWT token
4. Stores token in Redis cache
5. Returns token to client
6. Client includes token in subsequent requests

## Security Considerations
- Passwords hashed with bcrypt (cost factor 12)
- JWT signed with RS256 (not HS256)
- Tokens expire after 24 hours
- Rate limiting: 10 login attempts per 15 minutes
- Account locks after 5 failed attempts

## Scaling Strategy
- Auth Service: Horizontally scalable (stateless)
- Redis: Master-replica setup for HA
- Database: Read replicas for token validation
```

### 3. Code Documentation
```typescript
/**
 * Authenticates a user and returns a JWT token.
 *
 * This function validates user credentials, checks for account locks,
 * and generates a JWT token if authentication succeeds. Failed attempts
 * are tracked and accounts are locked after 5 failures within 15 minutes.
 *
 * @param email - User's email address (must be registered)
 * @param password - User's password (plain text, will be compared with hash)
 * @returns Promise resolving to authentication result with token
 * @throws {UnauthorizedError} If credentials are invalid
 * @throws {AccountLockedError} If account is temporarily locked
 * @throws {DatabaseError} If database operation fails
 *
 * @example
 * ```typescript
 * const result = await authenticateUser('user@example.com', 'password123');
 * console.log(result.token); // JWT token
 * ```
 */
async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  // Implementation
}
```

### 4. Process Documentation
```markdown
# Deployment Process

## Pre-Deployment Checklist
- [ ] All tests pass (unit, integration, E2E)
- [ ] Code review approved by 2+ engineers
- [ ] Security scan completed (no critical issues)
- [ ] Performance benchmarks meet targets
- [ ] Database migrations tested in staging
- [ ] Rollback plan documented

## Deployment Steps

### 1. Deploy to Staging
```bash
# Pull latest code
git checkout main
git pull origin main

# Build and test
npm run build
npm test

# Deploy to staging
./deploy.sh staging
```

**Verification**:
- [ ] Staging health check passes
- [ ] Integration tests pass in staging
- [ ] Manual smoke tests completed

### 2. Deploy to Production
```bash
# Tag release
git tag v1.2.3
git push origin v1.2.3

# Deploy
./deploy.sh production

# Monitor for 15 minutes
./monitor-deployment.sh
```

**Rollback Procedure**:
If errors > 1% or p95 latency > 500ms:
```bash
./rollback.sh v1.2.2
```

## Post-Deployment
- Monitor error rates for 1 hour
- Check performance metrics
- Verify key user flows
- Update changelog
```

### 5. Troubleshooting Guide
```markdown
# Troubleshooting: Login Failures

## Symptom
Users unable to login, receiving 401 Unauthorized

## Common Causes

### 1. Account Locked
**Check**: Redis cache for lock key
```bash
redis-cli GET "account_lock:user@example.com"
```

**Solution**: Wait 15 minutes or manually unlock
```bash
redis-cli DEL "account_lock:user@example.com"
```

### 2. Database Connection Failed
**Check**: Database connectivity
```bash
psql -h db.example.com -U app_user -d app_db
```

**Solution**: Verify connection pool not exhausted
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'app_db';
```

### 3. Token Service Down
**Check**: Service health
```bash
curl https://api.example.com/health
```

**Solution**: Restart service or scale up instances
```bash
kubectl scale deployment auth-service --replicas=3
```

## Escalation Path
If issue persists > 15 minutes:
1. Alert on-call engineer
2. Create incident in PagerDuty
3. Notify #incidents Slack channel
```

## Documentation Best Practices

### Writing Style Guide

#### DO:
✅ Use active voice: "The system validates..." not "The validation is performed..."
✅ Be specific: "< 200ms" not "fast"
✅ Use examples: Show concrete code/commands
✅ Define acronyms: "JWT (JSON Web Token)"
✅ Use headings and structure
✅ Keep paragraphs short (3-5 sentences)
✅ Use bullet points for lists
✅ Include diagrams for complex flows
✅ Date-stamp documentation
✅ Link to related docs

#### DON'T:
❌ Use jargon without explanation
❌ Write long paragraphs
❌ Assume prior knowledge
❌ Leave outdated information
❌ Duplicate content across docs
❌ Write "TODO" without date/owner
❌ Use vague terms ("should", "might")
❌ Skip examples
❌ Forget to version docs
❌ Leave broken links

### Code Comment Guidelines

```typescript
// BAD: Obvious comment
let total = 0; // Initialize total to 0

// BAD: Redundant comment
// Get user by ID
function getUserById(id: string) { ... }

// GOOD: Explain "why", not "what"
// Use exponential backoff to avoid overwhelming the API
// after transient failures (max 3 retries)
const retryStrategy = new ExponentialBackoff(3);

// GOOD: Explain complex business logic
// Credit card charges are processed immediately, but
// bank transfers take 3-5 business days to complete.
// We mark the order as "pending" until confirmed.
if (paymentMethod === 'credit_card') {
  order.status = 'confirmed';
} else if (paymentMethod === 'bank_transfer') {
  order.status = 'pending';
}
```

### README Template
```markdown
# Project Name

Brief description (1-2 sentences) of what this project does.

## Features
- Feature 1: Brief description
- Feature 2: Brief description
- Feature 3: Brief description

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7.0+

## Installation

```bash
# Clone repository
git clone https://github.com/org/project.git
cd project

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migrate

# Start development server
npm run dev
```

## Configuration

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT signing

## Usage

### Starting the Server
```bash
npm start
```

Server runs on http://localhost:3000

### Running Tests
```bash
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
```

## API Documentation

See [API.md](./docs/API.md) for full API documentation.

Quick example:
```bash
curl http://localhost:3000/api/v1/users
```

## Architecture

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system architecture.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) file

## Support

- Documentation: https://docs.example.com
- Issues: https://github.com/org/project/issues
- Email: support@example.com
```

## Documentation Maintenance

### Keep Documentation Fresh
```markdown
**Documentation Health Checklist** (quarterly):
- [ ] All code examples still work
- [ ] Screenshots are current
- [ ] Links are not broken
- [ ] API documentation matches actual API
- [ ] Version numbers are current
- [ ] Contact information is correct
- [ ] Deprecated features removed
- [ ] New features documented
```

### Documentation Metrics
- **Coverage**: % of public APIs documented
- **Freshness**: Days since last update
- **Accuracy**: % of examples that work
- **Completeness**: % of required sections filled
- **Feedback**: User satisfaction score

## Common Documentation Patterns

### Decision Records (ADR)
```markdown
# ADR-001: Use PostgreSQL for Primary Database

**Date**: 2024-01-09
**Status**: Accepted
**Context**: Need to choose database for user data

## Decision
Use PostgreSQL 14+ as primary database

## Rationale
- ACID compliance for transactions
- Strong consistency guarantees
- Rich query capabilities (JSON, full-text search)
- Excellent tooling and ecosystem
- Team has PostgreSQL expertise

## Alternatives Considered
- **MongoDB**: Better for unstructured data, but we need ACID
- **MySQL**: Similar to PostgreSQL, but weaker JSON support

## Consequences
- Positive: Data integrity, powerful queries
- Negative: More complex to scale than NoSQL
- Mitigation: Use read replicas for scaling

## References
- https://postgresql.org/docs/14/
```

### Changelog Pattern
```markdown
# Changelog

## [1.2.0] - 2024-01-09

### Added
- User profile avatars
- Email notification preferences
- Two-factor authentication

### Changed
- Improved login page UX
- Updated password requirements (min 12 chars)

### Fixed
- Fixed race condition in order processing
- Resolved memory leak in WebSocket handler

### Security
- Patched SQL injection vulnerability (CVE-2024-1234)
```

## Success Metrics

Good technical documentation results in:
- ✅ Faster onboarding for new team members
- ✅ Reduced support questions
- ✅ Fewer bugs from misunderstanding
- ✅ Easier maintenance and updates
- ✅ Better knowledge sharing
- ✅ Reduced tribal knowledge dependency
- ✅ Higher team productivity

## Related Skills
- **Specification Writing**: Creating clear requirements
- **System Decomposition**: Documenting architecture
- **Code Generation**: Writing self-documenting code
- **Validation**: Documenting test strategies
