# Specification Writing

## Purpose
Create clear, unambiguous, and executable system specifications that serve as the single source of truth throughout the project lifecycle.

## Used by
- specification-writer

## Overview
Specification writing is the foundational skill that transforms vague requirements into precise, testable, and implementable documentation. A well-written specification eliminates ambiguity, provides clear acceptance criteria, and serves as a contract between stakeholders and implementers.

## Core Principles

### 1. Clarity Over Brevity
- Every statement should have exactly one interpretation
- Use precise technical language, avoid marketing speak
- Define all domain-specific terms in a glossary
- Use consistent terminology throughout the document

### 2. Testability
- Every requirement must be verifiable through testing
- Include both positive and negative test cases
- Specify measurable acceptance criteria
- Define success and failure conditions explicitly

### 3. Completeness
- Cover all functional and non-functional requirements
- Document edge cases and error scenarios
- Specify constraints and limitations
- Include data validation rules

### 4. Traceability
- Link requirements to business objectives
- Reference related specifications and dependencies
- Maintain version history and change log
- Cross-reference acceptance criteria to requirements

## Specification Structure

### 1. Executive Summary
- **What**: Brief overview of the feature/system
- **Why**: Business justification and value proposition
- **Who**: Target users and stakeholders
- **When**: Timeline and milestones
- **Impact**: Expected outcomes and success metrics

### 2. Requirements

#### Functional Requirements
```markdown
FR-001: User Authentication
- Priority: MUST HAVE
- Description: System shall authenticate users using email and password
- Acceptance Criteria:
  - Valid credentials return JWT token with 24-hour expiry
  - Invalid credentials return 401 with error message
  - Account locked after 5 failed attempts within 15 minutes
  - Passwords must meet complexity requirements (8+ chars, upper, lower, number, special)
- Dependencies: FR-002 (User Registration)
- Test Cases: TC-001, TC-002, TC-003
```

#### Non-Functional Requirements
```markdown
NFR-001: Performance
- Response time: API endpoints < 200ms at p95
- Throughput: Support 1000 concurrent users
- Database queries: < 100ms at p95

NFR-002: Security
- All data in transit encrypted with TLS 1.3
- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens signed with RS256
- OWASP Top 10 compliance verified

NFR-003: Reliability
- Uptime: 99.9% availability
- Data durability: 99.999%
- Graceful degradation when dependencies fail
```

### 3. Data Models

#### Entity Definitions
```typescript
interface User {
  id: string;              // UUID v4
  email: string;           // Valid email format, unique
  passwordHash: string;    // bcrypt hash
  role: UserRole;          // enum: 'admin' | 'user' | 'guest'
  createdAt: Date;         // ISO 8601 timestamp
  updatedAt: Date;         // ISO 8601 timestamp
  lastLoginAt: Date | null; // ISO 8601 timestamp or null
}

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}
```

#### Validation Rules
- Email: Must match RFC 5322 format
- Password: 8-64 characters, must contain uppercase, lowercase, number, special character
- Role: Must be one of predefined enum values
- Timestamps: Must be valid ISO 8601 dates

### 4. API Contracts

#### Endpoint Specification
```markdown
POST /api/v1/auth/login

Request:
{
  "email": "user@example.com",    // Required, valid email
  "password": "SecurePass123!",   // Required, string
  "rememberMe": false              // Optional, boolean, default: false
}

Response 200 OK:
{
  "token": "eyJhbGc...",           // JWT token
  "expiresIn": 86400,              // Seconds until expiry
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "role": "user"
  }
}

Response 401 Unauthorized:
{
  "error": "INVALID_CREDENTIALS",
  "message": "Email or password is incorrect",
  "code": 401
}

Response 429 Too Many Requests:
{
  "error": "ACCOUNT_LOCKED",
  "message": "Account temporarily locked due to multiple failed login attempts",
  "code": 429,
  "retryAfter": 900  // Seconds until unlock
}
```

### 5. Edge Cases and Error Handling

#### Edge Case Matrix
| Scenario | Expected Behavior | Error Code | Recovery Action |
|----------|-------------------|------------|-----------------|
| Empty email | Validation error | 400 | Display field error |
| SQL injection attempt | Sanitized, rejected | 400 | Log security event |
| Network timeout | Retry with backoff | 504 | Show retry UI |
| Database unavailable | Graceful degradation | 503 | Queue request |
| Concurrent updates | Last-write-wins | 200 | Timestamp comparison |

### 6. User Workflows

#### Primary Flow: User Login
```
1. User enters email and password
2. System validates input format
   - If invalid: Show validation errors, STOP
3. System checks credentials against database
   - If invalid: Increment failed attempt counter
   - If locked: Return 429 with unlock time
   - If valid: Proceed to step 4
4. System generates JWT token
5. System updates lastLoginAt timestamp
6. System returns token and user data
```

#### Alternative Flows
- **Forgot Password**: Link to password reset flow
- **New User**: Link to registration flow
- **OAuth Login**: Redirect to OAuth provider

### 7. Constraints and Limitations

#### Technical Constraints
- Database: PostgreSQL 14+
- Runtime: Node.js 18+ LTS
- Memory: Max 512MB per process
- File uploads: Max 10MB per file

#### Business Constraints
- Free tier: 100 API calls per day
- Premium tier: Unlimited API calls
- Data retention: 90 days for free, unlimited for premium

#### Known Limitations
- Password reset emails may take up to 5 minutes to deliver
- Search functionality limited to exact matches (no fuzzy search)
- Mobile app not available for tablets

### 8. Dependencies

#### Internal Dependencies
- User Registration Service (FR-002)
- Email Service (for password reset)
- Rate Limiting Middleware

#### External Dependencies
- PostgreSQL database (required)
- Redis cache (optional, improves performance)
- SendGrid for emails (required)

### 9. Acceptance Criteria

#### Definition of Done
- [ ] All functional requirements implemented and tested
- [ ] All non-functional requirements met (performance, security)
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests pass
- [ ] API documentation generated and reviewed
- [ ] Security scan passes (no high/critical vulnerabilities)
- [ ] Code review approved by 2+ engineers
- [ ] QA testing completed and signed off
- [ ] Performance benchmarks meet targets
- [ ] Rollback plan documented and tested

## Specification Writing Process

### Phase 1: Discovery (20% of time)
1. **Stakeholder Interviews**
   - Interview product managers, users, engineers
   - Understand business goals and constraints
   - Identify success metrics

2. **Domain Research**
   - Review existing systems and documentation
   - Research industry standards and best practices
   - Identify similar implementations for reference

3. **Constraint Mapping**
   - Technical constraints (platform, performance, security)
   - Business constraints (budget, timeline, resources)
   - Regulatory constraints (compliance, privacy)

### Phase 2: Draft Specification (40% of time)
1. **Outline Creation**
   - Define document structure
   - List all sections and subsections
   - Allocate content to sections

2. **Requirement Elicitation**
   - Write user stories
   - Convert stories to functional requirements
   - Define acceptance criteria for each requirement
   - Prioritize using MoSCoW (Must, Should, Could, Won't)

3. **Data Modeling**
   - Design entity relationships
   - Define validation rules
   - Specify data types and constraints

4. **API Design**
   - Define endpoints and methods
   - Specify request/response formats
   - Document error codes and messages

5. **Edge Case Analysis**
   - Brainstorm failure scenarios
   - Define error handling strategies
   - Document recovery procedures

### Phase 3: Review and Refinement (30% of time)
1. **Internal Review**
   - Technical review by engineers
   - Business review by product team
   - Security review by security team

2. **Stakeholder Validation**
   - Present specification to stakeholders
   - Gather feedback and clarifications
   - Address concerns and gaps

3. **Refinement**
   - Incorporate feedback
   - Resolve ambiguities
   - Add missing details

### Phase 4: Finalization (10% of time)
1. **Quality Check**
   - Verify all sections are complete
   - Check for internal consistency
   - Validate cross-references

2. **Approval**
   - Obtain sign-off from stakeholders
   - Version and publish specification
   - Communicate to implementation team

## Best Practices

### DO:
✅ Use active voice ("System shall authenticate user")
✅ Be specific with numbers (not "fast" but "< 200ms")
✅ Include examples for complex requirements
✅ Use diagrams and visuals where helpful
✅ Version control specifications in Git
✅ Link to external standards and RFCs
✅ Write for your audience (adjust technical depth)
✅ Use consistent formatting and terminology
✅ Include a glossary for domain terms
✅ Specify both what the system does AND doesn't do

### DON'T:
❌ Use vague terms ("user-friendly", "intuitive", "fast")
❌ Specify implementation details (let architects/engineers decide)
❌ Mix requirements with design decisions
❌ Assume knowledge ("obviously", "clearly")
❌ Use marketing language or buzzwords
❌ Leave acceptance criteria ambiguous
❌ Forget edge cases and error scenarios
❌ Copy-paste without customization
❌ Skip stakeholder review
❌ Write specs that can't be tested

## Common Pitfalls

### 1. Specification Too Vague
**Problem**: "System should be fast and secure"
**Solution**: "API endpoints must respond within 200ms at p95. All data encrypted with TLS 1.3."

### 2. Over-Specification
**Problem**: Specifying exact algorithms, data structures, or implementation
**Solution**: Focus on "what" not "how". Let engineers choose implementation.

### 3. Missing Edge Cases
**Problem**: Only specifying happy path
**Solution**: Use edge case matrix to systematically identify failure scenarios

### 4. Untestable Requirements
**Problem**: "System should be intuitive"
**Solution**: "New users complete first task within 2 minutes without documentation"

### 5. Scope Creep
**Problem**: Adding "nice to have" features during specification
**Solution**: Use MoSCoW prioritization, defer non-essential features

## Templates and Checklists

### Specification Completeness Checklist
- [ ] Executive summary with clear purpose
- [ ] All functional requirements listed with IDs
- [ ] Non-functional requirements specified with metrics
- [ ] Data models defined with validation rules
- [ ] API contracts documented with examples
- [ ] Edge cases and error handling covered
- [ ] User workflows documented
- [ ] Dependencies identified (internal and external)
- [ ] Constraints and limitations listed
- [ ] Acceptance criteria defined
- [ ] Glossary of terms included
- [ ] Diagrams and visuals added where helpful
- [ ] References to standards and external docs
- [ ] Version history maintained
- [ ] Stakeholder approval obtained

### Quality Criteria
A good specification is:
1. **Unambiguous**: Only one interpretation possible
2. **Complete**: Covers all aspects of the feature
3. **Consistent**: No contradictions or conflicts
4. **Verifiable**: Can be tested objectively
5. **Traceable**: Requirements linked to business goals
6. **Feasible**: Can be implemented with available resources
7. **Maintainable**: Easy to update as requirements evolve

## Examples

### Good Requirement Example
```markdown
FR-042: Password Reset Email
Priority: MUST HAVE
Description: When a user requests a password reset, the system shall send a time-limited reset link to their registered email address.

Acceptance Criteria:
- Reset link expires after 1 hour
- Link contains cryptographically secure token (32 bytes, base64url encoded)
- Email includes user's name and timestamp of request
- Link can only be used once (consumed after password change)
- System logs all reset requests for audit

Error Handling:
- If email address not found: Return generic success message (prevent enumeration)
- If email service unavailable: Retry 3 times with exponential backoff, then return 503
- If user has active reset link: Invalidate old link and send new one

Test Cases:
- TC-042-01: Valid reset request generates email with valid link
- TC-042-02: Expired link returns error and prompts new request
- TC-042-03: Used link returns error and prompts new request
- TC-042-04: Non-existent email returns success (security)
```

### Bad Requirement Example
```markdown
FR-042: Password Reset
The system should allow users to reset their forgotten passwords easily through email. The process should be secure and user-friendly.
```

**Problems with bad example:**
- Vague terms: "easily", "secure", "user-friendly"
- No acceptance criteria
- No error handling
- Not testable
- Missing details: expiry time, security token, email content

## Tools and Resources

### Documentation Tools
- **Markdown**: Standard format for technical specs
- **Mermaid**: Diagrams and flowcharts
- **OpenAPI/Swagger**: API specification
- **JSON Schema**: Data validation specs

### Validation Tools
- **Spell checkers**: Grammarly, LanguageTool
- **Linters**: markdownlint, vale (prose linter)
- **Diff tools**: Compare versions and track changes

### Collaboration Tools
- **Git**: Version control for specifications
- **Pull Requests**: Review and approval workflow
- **Issue Trackers**: Link specs to implementation tasks

## Success Metrics

A well-written specification results in:
- Minimal clarification questions during implementation
- Fewer bugs related to misunderstood requirements
- Faster implementation (clear requirements = less guessing)
- Higher stakeholder satisfaction
- Easier maintenance and evolution
- Reduced rework and technical debt

## Related Skills
- **System Decomposition**: Breaking specifications into components
- **Task Breakdown**: Converting specs into executable tasks
- **Technical Documentation**: Writing clear technical content
- **Validation**: Testing against specifications
