# Validation & Evaluation

## Purpose
Verify that outputs strictly conform to specifications, acceptance criteria, and system constraints.

## Used by
- project-orchestrator

## Overview
Validation and evaluation is the quality assurance skill that ensures all deliverables—from specifications to deployed code—meet defined requirements and standards. It involves systematic checking against acceptance criteria, testing, and verification before outputs are approved for the next phase.

## Core Principles

### 1. Objective Verification
- Use measurable, objective criteria
- No subjective judgments without clear guidelines
- Automated validation where possible
- Reproducible validation processes

### 2. Early Detection
- Validate continuously, not just at the end
- Catch issues as early as possible
- Fail fast when requirements aren't met
- Provide clear, actionable feedback

### 3. Comprehensive Coverage
- Validate functional requirements
- Validate non-functional requirements
- Check edge cases and error scenarios
- Verify integration points

### 4. Traceability
- Every validation traces back to a requirement
- Document validation results
- Track what's validated and what's not
- Maintain audit trail

## Validation Types

### 1. Specification Validation
```markdown
**Checklist:**
- [ ] All functional requirements are testable
- [ ] Non-functional requirements have metrics
- [ ] Acceptance criteria are specific and measurable
- [ ] Data models are complete with validation rules
- [ ] API contracts include all status codes
- [ ] Edge cases and errors are documented
- [ ] No ambiguous language used
- [ ] Dependencies are identified
- [ ] Constraints are explicit

**Red Flags:**
- Vague terms: "user-friendly", "fast", "scalable"
- Missing acceptance criteria
- Undefined error handling
- No edge cases mentioned
- Implicit assumptions
```

### 2. Architecture Validation
```markdown
**Checklist:**
- [ ] All components have clear responsibilities
- [ ] Interfaces are well-defined
- [ ] No circular dependencies
- [ ] Scalability strategy defined
- [ ] Security considerations addressed
- [ ] Single points of failure eliminated
- [ ] Data flow is clear
- [ ] Technology choices justified
- [ ] Performance targets specified

**Red Flags:**
- God components (do everything)
- Unclear boundaries
- Missing integration details
- No fallback strategies
- Tight coupling
```

### 3. Task Validation
```markdown
**Checklist:**
- [ ] Tasks are atomic (2-4 hours each)
- [ ] Each task has acceptance criteria
- [ ] Dependencies are explicit
- [ ] No circular dependencies
- [ ] All work from plan is covered
- [ ] Test tasks included
- [ ] Files to modify are listed
- [ ] Effort estimates provided

**Red Flags:**
- Tasks too large (> 4 hours)
- Vague task descriptions
- Missing acceptance criteria
- No test tasks
- Unclear dependencies
```

### 4. Code Validation
```markdown
**Checklist:**
- [ ] Implements all acceptance criteria
- [ ] Follows code style guide
- [ ] All tests pass
- [ ] No security vulnerabilities
- [ ] Error handling comprehensive
- [ ] Performance requirements met
- [ ] No hard-coded secrets
- [ ] Code is documented
- [ ] Backward compatible (if required)

**Red Flags:**
- Missing error handling
- No tests written
- Hard-coded values
- Security issues
- Performance problems
- Breaking changes
```

## Validation Process

### Phase 1: Preparation (10%)
```markdown
1. **Identify Validation Criteria**
   - What are we validating?
   - What are the acceptance criteria?
   - What tests need to run?
   - What metrics to check?

2. **Prepare Test Data**
   - Test cases (positive and negative)
   - Edge cases
   - Performance test scenarios
   - Security test scenarios

3. **Set Up Environment**
   - Test environment configured
   - Tools and scripts ready
   - Access to systems verified
```

### Phase 2: Execution (60%)
```markdown
1. **Run Automated Checks**
   - Unit tests
   - Integration tests
   - Linting and formatting
   - Security scans
   - Performance benchmarks

2. **Manual Validation**
   - Code review
   - Specification review
   - Architecture review
   - User acceptance testing

3. **Document Results**
   - Which criteria passed
   - Which criteria failed
   - Evidence of validation
   - Issues discovered
```

### Phase 3: Analysis (20%)
```markdown
1. **Analyze Failures**
   - Root cause of failures
   - Impact assessment
   - Severity classification
   - Fix recommendations

2. **Assess Coverage**
   - What's validated
   - What's not validated
   - Gaps in validation
   - Additional tests needed
```

### Phase 4: Reporting (10%)
```markdown
1. **Create Report**
   - Pass/fail summary
   - Detailed findings
   - Evidence attached
   - Recommendations

2. **Communicate Results**
   - Share with stakeholders
   - Explain failures clearly
   - Provide remediation steps
   - Set expectations for fixes
```

## Validation Techniques

### Technique 1: Acceptance Criteria Testing
```markdown
For each acceptance criterion:

**Criterion**: "Login endpoint returns JWT token for valid credentials"

**Test**:
1. Send POST request with valid email/password
2. Verify response status is 200
3. Verify response contains 'token' field
4. Verify token is valid JWT format
5. Verify token can be decoded
6. Verify token contains user ID and role

**Result**: PASS / FAIL
**Evidence**: [Screenshot, test output, API response]
```

### Technique 2: Boundary Testing
```markdown
Test at boundaries of valid/invalid inputs:

**For "Password must be 8-64 characters":**
- Test with 7 characters (should fail)
- Test with 8 characters (should pass)
- Test with 64 characters (should pass)
- Test with 65 characters (should fail)
- Test with 0 characters (should fail)
- Test with special characters (varies)
- Test with unicode (varies)
```

### Technique 3: Error Path Validation
```markdown
**For each error scenario in spec:**

Error: "Account locked after 5 failed login attempts"

Test Steps:
1. Attempt login with wrong password (1st time)
2. Verify 401 response
3. Repeat 4 more times
4. Verify 6th attempt returns 429 (locked)
5. Verify retry-after header present
6. Wait for lock period
7. Verify can login again

Result: PASS / FAIL
```

### Technique 4: Integration Validation
```markdown
**For each integration point:**

Integration: Login endpoint → User Service

Validate:
- [ ] Correct method called (findByEmail)
- [ ] Correct parameters passed
- [ ] Response handled correctly
- [ ] Errors propagated appropriately
- [ ] Timeout handled
- [ ] Retry logic works
- [ ] Circuit breaker functions
```

### Technique 5: Performance Validation
```markdown
**For each performance requirement:**

Requirement: "API responds < 200ms at p95"

Test:
1. Send 1000 requests
2. Measure response times
3. Calculate percentiles
4. Compare p95 to threshold

Actual: p95 = 185ms
Target: p95 < 200ms
Result: PASS
```

## Automated Validation

### Unit Test Validation
```typescript
// Validate business logic
describe('UserService.login', () => {
  it('should return token for valid credentials', async () => {
    const result = await userService.login('user@test.com', 'password');
    expect(result).toHaveProperty('token');
    expect(result.token).toMatch(/^eyJ/); // JWT format
  });

  it('should throw for invalid credentials', async () => {
    await expect(
      userService.login('user@test.com', 'wrong')
    ).rejects.toThrow('Invalid credentials');
  });

  it('should lock account after 5 failures', async () => {
    // Try 5 times with wrong password
    for (let i = 0; i < 5; i++) {
      await userService.login('user@test.com', 'wrong').catch(() => {});
    }

    // 6th attempt should be locked
    await expect(
      userService.login('user@test.com', 'wrong')
    ).rejects.toThrow('Account locked');
  });
});
```

### Integration Test Validation
```typescript
// Validate end-to-end functionality
describe('Authentication Flow', () => {
  it('should complete full login flow', async () => {
    // Register user
    const user = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@test.com', password: 'Password123!' });

    expect(user.status).toBe(201);

    // Login
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'Password123!' });

    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty('token');

    // Access protected endpoint
    const profile = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(profile.status).toBe(200);
    expect(profile.body.email).toBe('test@test.com');
  });
});
```

### Security Validation
```bash
# Run security scans
npm audit                    # Check dependencies
bandit -r src/               # Python security scan
semgrep --config=auto src/   # SAST scanning
trivy image myapp:latest     # Container scanning

# Check for common vulnerabilities
- SQL injection attempts
- XSS attempts
- CSRF validation
- Authentication bypass
- Authorization bypass
```

### Performance Validation
```bash
# Load testing
wrk -t12 -c400 -d30s http://localhost:8000/api/v1/login

# Results must show:
# Latency p50 < 100ms
# Latency p95 < 200ms
# Latency p99 < 500ms
# Error rate < 1%
```

## Validation Reporting

### Report Template
```markdown
# Validation Report: {Feature Name}

**Date**: 2024-01-09
**Validator**: {Name}
**Phase**: {Spec/Plan/Implementation/Deployment}

## Summary
- Total Criteria: 25
- Passed: 22 (88%)
- Failed: 3 (12%)
- Blocked: 0

**Overall Status**: ⚠️ CONDITIONAL PASS (minor issues)

## Detailed Results

### Functional Requirements (18/20 passed)

#### ✅ FR-001: User Login
- Acceptance Criteria: All 5 passed
- Tests: 12/12 passed
- Evidence: Test report attached

#### ❌ FR-002: Password Reset
- Acceptance Criteria: 3/5 passed
- Failed:
  - Email template incorrect
  - Token expiry not working
- Tests: 8/10 passed (2 failing)
- Evidence: Test report, screenshots

### Non-Functional Requirements (4/5 passed)

#### ✅ NFR-001: Performance
- Target: < 200ms p95
- Actual: 185ms p95
- Status: PASS

#### ❌ NFR-002: Security
- OWASP scan found 2 medium issues
- SQL injection test failed
- Status: FAIL (blocker)

## Issues Found

### Critical (0)
None

### High (1)
**H-001: SQL Injection Vulnerability**
- Location: UserService.findByEmail()
- Impact: Data breach risk
- Recommendation: Use parameterized queries
- Priority: Fix immediately

### Medium (2)
**M-001: Email Template Incorrect**
- Location: PasswordResetService
- Impact: User confusion
- Recommendation: Update template per spec

**M-002: Token Expiry Not Working**
- Location: TokenService
- Impact: Security concern
- Recommendation: Implement TTL check

## Recommendations

1. **Must Fix Before Deploy:**
   - H-001: SQL injection (CRITICAL)

2. **Should Fix:**
   - M-001: Email template
   - M-002: Token expiry

3. **Next Steps:**
   - Fix critical issue H-001
   - Rerun security validation
   - Fix medium issues
   - Revalidate all failed criteria

## Approval Status

- [ ] Approved for next phase
- [x] Conditional approval (fix H-001 first)
- [ ] Rejected (too many issues)

**Approver**: __________
**Date**: __________
```

## Best Practices

### DO:
✅ Validate against written criteria, not assumptions
✅ Use automated validation where possible
✅ Test happy path AND error paths
✅ Document all validation results
✅ Provide clear, actionable feedback
✅ Validate early and often
✅ Check edge cases and boundaries
✅ Verify non-functional requirements
✅ Run security and performance scans
✅ Get stakeholder sign-off

### DON'T:
❌ Skip validation to save time
❌ Use subjective criteria
❌ Only test happy path
❌ Ignore non-functional requirements
❌ Assume code works without testing
❌ Skip security validation
❌ Validate in production
❌ Approve with known critical issues
❌ Forget to document results
❌ Move to next phase without approval

## Common Issues

### Issue 1: Incomplete Acceptance Criteria
**Problem**: Criteria too vague to validate
**Solution**: Ask for clarification, add specific metrics

### Issue 2: Missing Test Coverage
**Problem**: No tests for edge cases
**Solution**: Add tests for all acceptance criteria

### Issue 3: False Positives
**Problem**: Tests pass but feature doesn't work
**Solution**: Review test quality, add integration tests

### Issue 4: Performance Degradation
**Problem**: Meets functional req but too slow
**Solution**: Performance testing early, optimization

## Success Metrics

Effective validation results in:
- ✅ High confidence in quality
- ✅ Issues found before production
- ✅ Clear pass/fail decisions
- ✅ Minimal rework needed
- ✅ Stakeholder trust
- ✅ Reduced production bugs
- ✅ Faster approval cycles

## Related Skills
- **Specification Writing**: Defines what to validate
- **Task Breakdown**: Provides acceptance criteria
- **Code Generation**: Produces outputs to validate
- **Agent Orchestration**: Uses validation to control flow
