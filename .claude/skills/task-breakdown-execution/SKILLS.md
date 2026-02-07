# Task Breakdown & Execution Control

## Purpose
Translate high-level plans into atomic, ordered, and executable tasks with explicit completion criteria.

## Used by
- task-breakdown

## Overview
Task breakdown is the critical bridge between architectural planning and implementation. This skill transforms abstract plans into concrete, actionable work items that can be assigned, tracked, and validated independently. Proper task breakdown enables parallel development, accurate progress tracking, and ensures nothing is forgotten during implementation.

## Core Principles

### 1. Atomicity
- Each task is **indivisible** - represents a single unit of work
- Can be completed in one sitting (typically 2-4 hours)
- Has a clear start and end point
- Cannot be partially completed

### 2. Independence
- Tasks can be executed in any valid dependency order
- Minimal coordination required between tasks
- Each task has all information needed to complete it
- No hidden dependencies or implicit requirements

### 3. Testability
- Every task has explicit acceptance criteria
- Success/failure can be objectively determined
- Includes specific test cases where applicable
- Clear definition of "done"

### 4. Traceability
- Each task links back to specifications and plans
- Clear relationship to business requirements
- Impact and dependencies documented
- Changes can be traced through task history

## Task Anatomy

### Complete Task Structure
```markdown
## Task ID: T-001
**Priority**: HIGH | MEDIUM | LOW
**Type**: FEATURE | BUG | REFACTOR | TEST | DOCS
**Estimated Effort**: 2-4 hours
**Dependencies**: T-002, T-003

### Title
Create User Authentication API Endpoint

### Description
Implement POST /api/v1/auth/login endpoint that accepts email/password credentials, validates them against the database, and returns a JWT token on success.

### Context
- Part of User Authentication Service (spec.md#authentication)
- Enables user login functionality for web and mobile apps
- Follows security requirements in NFR-002

### Acceptance Criteria
- [ ] Endpoint responds at POST /api/v1/auth/login
- [ ] Accepts JSON body with email and password fields
- [ ] Returns 200 with JWT token for valid credentials
- [ ] Returns 401 for invalid credentials
- [ ] Returns 429 after 5 failed attempts within 15 minutes
- [ ] Passwords validated using bcrypt
- [ ] JWT tokens signed with RS256, expire after 24 hours
- [ ] All attempts logged to audit table

### Technical Specifications
**Endpoint**: POST /api/v1/auth/login

**Request Schema**:
```typescript
{
  email: string;      // RFC 5322 format
  password: string;   // 8-64 characters
  rememberMe?: boolean; // Optional, default false
}
```

**Response 200 Schema**:
```typescript
{
  token: string;      // JWT token
  expiresIn: number;  // Seconds until expiry
  user: {
    id: string;
    email: string;
    role: string;
  }
}
```

**Error Responses**:
- 400: Invalid request format
- 401: Invalid credentials
- 429: Too many attempts
- 500: Server error

### Files to Modify/Create
- `src/routes/auth.ts` (create) - Route handler
- `src/services/auth-service.ts` (create) - Business logic
- `src/models/user.ts` (modify) - Add authentication methods
- `tests/auth.test.ts` (create) - Test suite

### Test Cases
**TC-001**: Valid credentials return 200 with token
```typescript
POST /api/v1/auth/login
Body: { email: "user@test.com", password: "ValidPass123!" }
Expected: 200, { token: "jwt...", expiresIn: 86400, user: {...} }
```

**TC-002**: Invalid email format returns 400
```typescript
POST /api/v1/auth/login
Body: { email: "invalid-email", password: "ValidPass123!" }
Expected: 400, { error: "INVALID_EMAIL_FORMAT" }
```

**TC-003**: Wrong password returns 401
```typescript
POST /api/v1/auth/login
Body: { email: "user@test.com", password: "WrongPass" }
Expected: 401, { error: "INVALID_CREDENTIALS" }
```

**TC-004**: Account locked after 5 failed attempts
```typescript
// After 5 failed login attempts within 15 minutes
POST /api/v1/auth/login
Expected: 429, { error: "ACCOUNT_LOCKED", retryAfter: 900 }
```

### Implementation Notes
- Use bcrypt.compare() for password validation
- Generate JWT using jsonwebtoken library
- Store failed attempt count in Redis with 15-minute TTL
- Log all attempts to audit_logs table
- Rate limit: 10 requests per minute per IP

### Security Considerations
- Never return whether email exists (prevent enumeration)
- Hash passwords with bcrypt cost factor 12
- Sign JWTs with RS256 (not HS256)
- Validate JWT secret is loaded from environment
- Implement constant-time comparison for passwords

### Dependencies
- **Before**: T-002 (User model created), T-003 (Database schema migrated)
- **After**: T-005 (Protected routes), T-006 (Token refresh endpoint)
- **External**: bcrypt, jsonwebtoken, express-rate-limit packages

### Rollback Plan
- If deployment fails: Revert to previous version
- If bugs found: Disable endpoint via feature flag
- No database changes in this task (safe to rollback)

### Documentation Updates
- [ ] Update API documentation (swagger/openapi)
- [ ] Add endpoint to README.md
- [ ] Document error codes in docs/errors.md
- [ ] Update changelog

### Validation Checklist
- [ ] Code follows project style guide
- [ ] All test cases pass
- [ ] Security scan passes (no vulnerabilities)
- [ ] Code review approved by 2 engineers
- [ ] API documentation updated
- [ ] Manual testing completed
```

## Task Breakdown Process

### Phase 1: Plan Analysis (15%)

#### 1. Read Architectural Plan
```markdown
**Plan Analysis Checklist**:
- [ ] Understand overall system architecture
- [ ] Identify all components to be built
- [ ] Note dependencies between components
- [ ] Understand data models and relationships
- [ ] Review non-functional requirements
- [ ] Identify integration points
- [ ] Note security requirements
- [ ] Review performance targets
```

#### 2. Identify Work Units
```markdown
**Work Unit Categories**:

1. **Data Layer**
   - Database schema creation
   - Migration scripts
   - Data models and validators

2. **Business Logic Layer**
   - Service classes
   - Business rule implementation
   - Data transformations

3. **API Layer**
   - Route definitions
   - Request/response handlers
   - Middleware

4. **Integration Layer**
   - External API clients
   - Message queue handlers
   - Event publishers/subscribers

5. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

6. **Infrastructure**
   - Configuration files
   - Deployment scripts
   - Monitoring setup

7. **Documentation**
   - API documentation
   - User guides
   - Runbooks
```

### Phase 2: Task Creation (40%)

#### 1. Create Foundation Tasks
Start with tasks that have no dependencies:
```markdown
## Foundation Layer (No Dependencies)

T-001: Create database schema for users table
T-002: Set up authentication middleware structure
T-003: Configure JWT library and secrets
T-004: Create user model with validation rules
T-005: Set up test environment and fixtures
```

#### 2. Build on Foundation
Create tasks that depend on foundation:
```markdown
## Business Logic Layer (Depends on Foundation)

T-006: Implement user registration service
- Dependencies: T-001, T-004
- Creates users in database
- Validates email uniqueness
- Hashes passwords

T-007: Implement user login service
- Dependencies: T-001, T-004, T-003
- Validates credentials
- Generates JWT tokens
- Logs authentication attempts

T-008: Implement password reset service
- Dependencies: T-006, T-007
- Generates reset tokens
- Sends reset emails
- Validates token expiry
```

#### 3. Add API Layer
```markdown
## API Layer (Depends on Business Logic)

T-009: Create POST /api/v1/auth/register endpoint
- Dependencies: T-006
- Route handler for registration
- Input validation middleware
- Error handling

T-010: Create POST /api/v1/auth/login endpoint
- Dependencies: T-007
- Route handler for login
- Rate limiting middleware
- Session management

T-011: Create POST /api/v1/auth/reset-password endpoint
- Dependencies: T-008
- Route handler for password reset
- Token validation
- Email notification
```

#### 4. Add Testing Tasks
```markdown
## Testing Layer (Depends on Implementation)

T-012: Write unit tests for user service
- Dependencies: T-006, T-007, T-008
- Test business logic in isolation
- Mock database calls
- Cover edge cases

T-013: Write integration tests for auth endpoints
- Dependencies: T-009, T-010, T-011
- Test complete request/response cycle
- Use test database
- Validate status codes and responses

T-014: Write E2E tests for authentication flow
- Dependencies: T-009, T-010, T-011
- Test full user journey
- Browser-based testing
- Validate UI integration
```

#### 5. Add Cross-Cutting Tasks
```markdown
## Cross-Cutting Concerns

T-015: Add authentication logging and monitoring
- Dependencies: T-007, T-010
- Log all authentication events
- Set up metrics (success rate, latency)
- Create dashboards

T-016: Document authentication API
- Dependencies: T-009, T-010, T-011
- OpenAPI/Swagger documentation
- Code examples
- Error code reference

T-017: Security audit of authentication system
- Dependencies: T-009, T-010, T-011, T-012, T-013
- Penetration testing
- Vulnerability scanning
- Security best practices review
```

### Phase 3: Dependency Ordering (20%)

#### Dependency Analysis
```markdown
## Dependency Matrix

| Task | Depends On | Enables | Estimated | Priority |
|------|-----------|---------|-----------|----------|
| T-001 | - | T-006, T-007, T-008 | 2h | HIGH |
| T-002 | - | T-010, T-011 | 1h | HIGH |
| T-003 | - | T-007 | 1h | HIGH |
| T-004 | T-001 | T-006, T-007 | 3h | HIGH |
| T-005 | - | T-012, T-013 | 2h | MEDIUM |
| T-006 | T-001, T-004 | T-009, T-012 | 4h | HIGH |
| T-007 | T-001, T-003, T-004 | T-010, T-012 | 4h | HIGH |
| T-008 | T-006, T-007 | T-011, T-012 | 3h | MEDIUM |
| T-009 | T-006 | T-013, T-014 | 2h | HIGH |
| T-010 | T-007 | T-013, T-014 | 2h | HIGH |
| T-011 | T-008 | T-013 | 2h | MEDIUM |
| T-012 | T-006, T-007, T-008 | T-017 | 4h | HIGH |
| T-013 | T-009, T-010, T-011 | T-017 | 4h | HIGH |
| T-014 | T-009, T-010, T-011 | - | 4h | MEDIUM |
| T-015 | T-007, T-010 | - | 2h | LOW |
| T-016 | T-009, T-010, T-011 | - | 3h | MEDIUM |
| T-017 | T-012, T-013 | - | 4h | HIGH |
```

#### Execution Order (Topological Sort)
```markdown
## Recommended Execution Order

**Wave 1** (Parallel execution possible):
- T-001: Database schema
- T-002: Middleware structure
- T-003: JWT configuration
- T-005: Test environment

**Wave 2** (Depends on Wave 1):
- T-004: User model

**Wave 3** (Depends on Wave 2):
- T-006: Registration service
- T-007: Login service

**Wave 4** (Depends on Wave 3):
- T-008: Password reset service
- T-009: Registration endpoint
- T-010: Login endpoint

**Wave 5** (Depends on Wave 4):
- T-011: Password reset endpoint
- T-012: Unit tests

**Wave 6** (Depends on Wave 5):
- T-013: Integration tests
- T-015: Logging/monitoring
- T-016: Documentation

**Wave 7** (Depends on Wave 6):
- T-014: E2E tests
- T-017: Security audit
```

### Phase 4: Validation and Refinement (25%)

#### 1. Completeness Check
```markdown
**Validation Checklist**:

**Functional Coverage**:
- [ ] All features from spec have tasks
- [ ] All API endpoints covered
- [ ] All data models included
- [ ] All business rules addressed

**Technical Coverage**:
- [ ] Database migrations planned
- [ ] Tests included (unit, integration, E2E)
- [ ] Error handling covered
- [ ] Logging and monitoring planned
- [ ] Documentation tasks included

**Quality Coverage**:
- [ ] Security requirements addressed
- [ ] Performance requirements covered
- [ ] Code review process defined
- [ ] Rollback plans documented

**Operational Coverage**:
- [ ] Deployment tasks included
- [ ] Configuration management
- [ ] Monitoring and alerting
- [ ] Runbooks and documentation
```

#### 2. Task Quality Check
```markdown
**Per-Task Quality Criteria**:

- [ ] Title is clear and actionable (verb + noun)
- [ ] Description provides sufficient context
- [ ] Acceptance criteria are specific and testable
- [ ] Technical specifications are complete
- [ ] Files to modify/create are listed
- [ ] Test cases are defined with expected outcomes
- [ ] Dependencies are identified
- [ ] Estimated effort is reasonable (2-4 hours)
- [ ] Security considerations noted
- [ ] Rollback plan defined
```

#### 3. Dependency Validation
```markdown
**Dependency Checks**:

- [ ] No circular dependencies exist
- [ ] All dependencies are explicit
- [ ] Critical path is identified
- [ ] Parallel work opportunities maximized
- [ ] Blocking tasks prioritized appropriately
```

## Task Sizing Guidelines

### Small Tasks (1-2 hours)
```markdown
Examples:
- Add a single validation rule
- Create a simple utility function
- Update documentation for one endpoint
- Fix a specific bug
- Add a single test case

Characteristics:
- One file modification
- No external dependencies
- Clear, focused scope
- Quick to review and test
```

### Medium Tasks (3-4 hours)
```markdown
Examples:
- Implement a CRUD endpoint
- Create a service class with business logic
- Write comprehensive test suite for a module
- Integrate with an external API
- Implement a data migration

Characteristics:
- 2-3 file modifications
- May have internal dependencies
- Requires thoughtful design
- Moderate testing required
```

### Large Tasks (Too Large - Split!)
```markdown
If task takes > 4 hours, split it:

❌ BAD: "Implement user management system" (16 hours)

✅ GOOD: Split into smaller tasks:
- T-001: Create user database schema (2h)
- T-002: Implement user service (3h)
- T-003: Create user API endpoints (4h)
- T-004: Add user validation and error handling (3h)
- T-005: Write user tests (4h)
```

## Task Templates

### Feature Task Template
```markdown
## Task ID: T-XXX
**Priority**: HIGH
**Type**: FEATURE
**Estimated Effort**: X hours
**Dependencies**: T-YYY, T-ZZZ

### Title
[Action Verb] [Feature Name]

### Description
[2-3 sentences explaining what needs to be built and why]

### Context
- Links to spec: spec.md#section
- Related business requirement
- User story or use case

### Acceptance Criteria
- [ ] Specific, measurable criterion 1
- [ ] Specific, measurable criterion 2
- [ ] Specific, measurable criterion 3

### Technical Specifications
[API contracts, data models, algorithms, etc.]

### Files to Modify/Create
- path/to/file1 (create/modify)
- path/to/file2 (create/modify)

### Test Cases
[Specific test scenarios with expected outcomes]

### Implementation Notes
[Helpful hints, libraries to use, patterns to follow]

### Dependencies
- **Before**: [Tasks that must complete first]
- **After**: [Tasks that depend on this]
- **External**: [Packages, services needed]

### Validation Checklist
- [ ] Code review approved
- [ ] Tests pass
- [ ] Documentation updated
```

### Bug Fix Task Template
```markdown
## Task ID: T-XXX
**Priority**: CRITICAL | HIGH | MEDIUM | LOW
**Type**: BUG
**Estimated Effort**: X hours
**Dependencies**: None (typically)

### Title
Fix [Specific Bug Description]

### Bug Description
**Observed Behavior**: [What is happening]
**Expected Behavior**: [What should happen]
**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

### Root Cause Analysis
[Investigation findings, why the bug occurred]

### Proposed Fix
[Description of the solution]

### Files to Modify
- path/to/file (specific line numbers if known)

### Test Cases
**Regression Test**:
- [ ] Bug no longer occurs with fix
- [ ] Original functionality still works
- [ ] No new bugs introduced

### Validation Checklist
- [ ] Bug reproduced before fix
- [ ] Bug no longer reproducible after fix
- [ ] Regression tests added
- [ ] Related code reviewed for similar issues
```

### Test Task Template
```markdown
## Task ID: T-XXX
**Priority**: HIGH
**Type**: TEST
**Estimated Effort**: X hours
**Dependencies**: T-YYY (implementation)

### Title
Write [Test Type] Tests for [Feature]

### Description
Create comprehensive test coverage for [feature], including happy path, edge cases, and error scenarios.

### Test Coverage Requirements
- [ ] Happy path scenarios covered
- [ ] Edge cases identified and tested
- [ ] Error conditions tested
- [ ] Integration points validated
- [ ] Code coverage ≥ 80%

### Test Cases
**TC-001**: [Happy path test]
**TC-002**: [Edge case test]
**TC-003**: [Error condition test]

### Files to Create
- tests/unit/feature-name.test.ts
- tests/integration/feature-name.test.ts

### Testing Tools
[Jest, Mocha, Cypress, etc.]

### Mocking Strategy
[What to mock, what to test against real services]
```

## Best Practices

### DO:
✅ Start with database/model tasks (foundation)
✅ Group related tasks together
✅ Use consistent task ID numbering
✅ Include rollback plans for risky changes
✅ Specify exact files to modify
✅ Write acceptance criteria before implementation
✅ Link tasks to requirements/specs
✅ Size tasks appropriately (2-4 hours)
✅ Identify dependencies explicitly
✅ Include test tasks for all features

### DON'T:
❌ Create vague tasks ("improve performance")
❌ Make tasks too large (> 4 hours)
❌ Forget about testing tasks
❌ Skip documentation tasks
❌ Create circular dependencies
❌ Omit error handling from scope
❌ Forget about rollback plans
❌ Mix multiple concerns in one task
❌ Leave acceptance criteria ambiguous
❌ Skip security considerations

## Common Patterns

### Pattern 1: Database-First Development
```markdown
1. Create schema (T-001)
2. Create models (T-002)
3. Create migrations (T-003)
4. Create services (T-004)
5. Create API endpoints (T-005)
6. Add tests (T-006)
```

### Pattern 2: Test-Driven Development
```markdown
1. Write failing test (T-001)
2. Implement minimal code to pass (T-002)
3. Refactor (T-003)
4. Add more test cases (T-004)
```

### Pattern 3: Vertical Slice
```markdown
For each feature:
1. Database + model (T-001)
2. Service logic (T-002)
3. API endpoint (T-003)
4. Tests (T-004)
5. Documentation (T-005)

Then move to next feature
```

### Pattern 4: Horizontal Layer
```markdown
Complete one layer across all features:
1. All database schemas (T-001 to T-005)
2. All models (T-006 to T-010)
3. All services (T-011 to T-015)
4. All endpoints (T-016 to T-020)
5. All tests (T-021 to T-025)
```

## Task Tracking

### Task States
```markdown
**States**:
- 📋 TODO: Not started
- 🚧 IN PROGRESS: Currently being worked on
- 🔍 IN REVIEW: Completed, awaiting code review
- ✅ DONE: Completed and merged
- ❌ BLOCKED: Cannot proceed (dependency/issue)
- ⏸️ ON HOLD: Deliberately paused

**State Transitions**:
TODO → IN PROGRESS → IN REVIEW → DONE
       ↓            ↓
   BLOCKED      ON HOLD
       ↓            ↓
   TODO/IN PROGRESS
```

### Progress Tracking
```markdown
## Progress Report

**Overall Progress**: 12/20 tasks completed (60%)

**By Priority**:
- HIGH: 8/10 completed (80%)
- MEDIUM: 3/7 completed (43%)
- LOW: 1/3 completed (33%)

**By Type**:
- FEATURE: 7/10 completed (70%)
- TEST: 3/6 completed (50%)
- DOCS: 2/4 completed (50%)

**Current Status**:
- IN PROGRESS: T-011, T-013
- BLOCKED: T-015 (waiting for API key)
- NEXT UP: T-012, T-014
```

## Tools and Automation

### Task Management Tools
- **Jira**: Enterprise task tracking
- **GitHub Issues**: Simple, integrated with code
- **Linear**: Modern, fast task management
- **Notion**: Flexible, database-driven
- **Trello**: Kanban-style boards

### Automation
```bash
# Generate task file from template
./scripts/create-task.sh --title "Implement login endpoint" --type feature

# Update task status
./scripts/update-task.sh T-011 --status in-progress

# Generate progress report
./scripts/task-report.sh

# Check dependencies
./scripts/check-dependencies.sh T-015
```

## Success Metrics

A good task breakdown:
- ✅ All work is accounted for (nothing forgotten)
- ✅ Tasks can be worked on in parallel
- ✅ Each task is independently testable
- ✅ Progress is easy to track
- ✅ Estimates are accurate (within 20%)
- ✅ No last-minute surprises
- ✅ Clear ownership and accountability
- ✅ Easy to onboard new developers

## Related Skills
- **System Decomposition**: Creates the plan that tasks implement
- **Specification Writing**: Provides requirements that tasks fulfill
- **Code Generation**: Implements the tasks
- **Validation**: Verifies task completion
