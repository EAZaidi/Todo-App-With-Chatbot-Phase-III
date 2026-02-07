# Systematic Debugging & Iteration

## Purpose
Diagnose failures using a structured, repeatable process and apply minimal, safe fixes through controlled iteration.

## Used by
- backend-engineer
- frontend-engineer

## Overview
Systematic debugging is the disciplined approach to identifying, analyzing, and fixing software defects. It combines scientific method with engineering discipline to find root causes quickly and apply minimal, targeted fixes that don't introduce new issues.

## Core Principles

### 1. Scientific Method
- Form hypothesis based on evidence
- Design experiments to test hypothesis
- Observe results objectively
- Revise hypothesis based on findings
- Repeat until root cause found

### 2. Minimal Changes
- Fix only what's broken
- One change at a time
- Smallest possible fix
- No "while I'm here" changes
- Measure impact of each change

### 3. Evidence-Based
- Reproduce issue reliably
- Gather concrete evidence
- Log everything relevant
- Test hypotheses systematically
- Verify fix actually works

### 4. Root Cause Focus
- Treat symptoms temporarily
- Find underlying cause
- Fix cause, not symptoms
- Prevent recurrence
- Document learnings

## Debugging Process

### Phase 1: Reproduce (20%)
```markdown
**Goal**: Reliably reproduce the issue

**Steps**:
1. Get exact steps to reproduce
2. Identify minimum reproducible case
3. Set up consistent test environment
4. Document reproduction steps
5. Verify issue occurs consistently

**Success Criteria**:
- Can reproduce on demand
- Know exact trigger conditions
- Understand expected vs. actual behavior
```

### Phase 2: Isolate (30%)
```markdown
**Goal**: Narrow down where issue occurs

**Techniques**:
- Binary search (comment out half)
- Add logging statements
- Use debugger breakpoints
- Check recent changes (git blame/log)
- Review error logs and stack traces

**Questions**:
- Which function/module is involved?
- What inputs trigger the issue?
- What's the last working state?
- When was it last working?
- What changed since then?
```

### Phase 3: Analyze (20%)
```markdown
**Goal**: Understand root cause

**Approach**:
1. Examine suspicious code carefully
2. Trace execution path
3. Check assumptions
4. Review related code
5. Formulate hypothesis

**Root Cause Categories**:
- Logic error (wrong condition, off-by-one)
- State management (race condition, stale state)
- Integration (API mismatch, wrong parameters)
- Data (invalid/unexpected input)
- Environment (config, dependencies)
```

### Phase 4: Fix (20%)
```markdown
**Goal**: Apply minimal, safe fix

**Guidelines**:
- Fix root cause, not symptoms
- Make smallest possible change
- Add tests to prevent regression
- Review fix with team if complex
- Document fix and reasoning

**Validation**:
- Original issue no longer occurs
- Existing tests still pass
- New regression test passes
- No new issues introduced
```

### Phase 5: Verify (10%)
```markdown
**Goal**: Confirm fix works completely

**Checklist**:
- [ ] Original issue fixed
- [ ] Regression test added
- [ ] All existing tests pass
- [ ] Manual testing in relevant scenarios
- [ ] Performance not degraded
- [ ] No new warnings/errors
- [ ] Documentation updated if needed
```

## Debugging Techniques

### Technique 1: Rubber Duck Debugging
```markdown
Explain the problem out loud to someone (or a rubber duck):

1. "This function should do X"
2. "But it's actually doing Y"
3. "When I pass input Z"
4. "I expect A, but get B"

Often you'll realize the issue while explaining it.
```

### Technique 2: Binary Search
```python
# Problem: One of 10 functions is causing crash
# Don't test all 10 one-by-one

# Step 1: Comment out second half (functions 6-10)
# If crash still occurs: problem in functions 1-5
# If crash stops: problem in functions 6-10

# Step 2: Binary search the problematic half
# Continue until you find the exact function
```

### Technique 3: Add Strategic Logging
```typescript
// BAD: Log everything
console.log('Starting function');
console.log('x =', x);
console.log('y =', y);
// ... 50 more logs

// GOOD: Log key decision points
logger.debug('Processing order', { orderId, userId });
logger.debug('Order validation result', { isValid, errors });
logger.debug('Payment gateway response', { status, transactionId });
```

### Technique 4: Debugger Breakpoints
```typescript
// Set breakpoint at suspicious location
function processPayment(order: Order) {
  const total = calculateTotal(order);
  debugger; // Pause here and inspect 'total'

  if (total <= 0) { // Suspicious condition
    throw new Error('Invalid total');
  }

  return chargeCard(total);
}
```

### Technique 5: Git Bisect
```bash
# Find which commit introduced the bug
git bisect start
git bisect bad  # Current version has bug
git bisect good v1.2.3  # This version was good

# Git will checkout commits for you to test
# Run your test
git bisect good  # If test passes
git bisect bad   # If test fails

# Git will narrow down to exact commit
```

### Technique 6: Isolation Testing
```typescript
// Isolate component to test independently
test('UserService.createUser creates user correctly', async () => {
  // Mock all dependencies
  const mockRepo = { save: jest.fn().mockResolvedValue({id: '1'}) };
  const mockEmail = { send: jest.fn() };

  // Test in isolation
  const service = new UserService(mockRepo, mockEmail);
  const result = await service.createUser(testData);

  expect(result.id).toBe('1');
  expect(mockRepo.save).toHaveBeenCalledWith(testData);
});
```

## Common Bug Patterns

### Pattern 1: Off-by-One Errors
```typescript
// BUG: Should be < length, not <= length
for (let i = 0; i <= array.length; i++) {  // ❌
  process(array[i]); // Crashes on last iteration
}

// FIX
for (let i = 0; i < array.length; i++) {  // ✅
  process(array[i]);
}
```

### Pattern 2: Race Conditions
```typescript
// BUG: Multiple async operations modify same state
async function processOrders() {
  const orders = await getOrders();
  for (const order of orders) {
    await processOrder(order); // Each modifies shared state
  }
}

// FIX: Process sequentially or use locking
async function processOrders() {
  const orders = await getOrders();
  for (const order of orders) {
    await withLock(`order-${order.id}`, async () => {
      await processOrder(order);
    });
  }
}
```

### Pattern 3: Null/Undefined Errors
```typescript
// BUG: Assuming user exists
function getUserEmail(userId: string) {
  const user = findUser(userId);
  return user.email; // ❌ Crashes if user is null
}

// FIX: Handle null case
function getUserEmail(userId: string): string | null {
  const user = findUser(userId);
  return user?.email ?? null; // ✅ Safe navigation
}
```

### Pattern 4: Async/Await Mistakes
```typescript
// BUG: Forgot to await
async function saveUser(user: User) {
  validateUser(user); // Missing await
  return repository.save(user);
}

// FIX: Await async operations
async function saveUser(user: User) {
  await validateUser(user); // ✅ Wait for validation
  return repository.save(user);
}
```

### Pattern 5: State Mutation
```typescript
// BUG: Mutating shared state
function addItem(cart: Cart, item: Item) {
  cart.items.push(item); // ❌ Mutates original
  return cart;
}

// FIX: Immutable update
function addItem(cart: Cart, item: Item): Cart {
  return {
    ...cart,
    items: [...cart.items, item] // ✅ Creates new array
  };
}
```

## Iteration Strategies

### Strategy 1: Test-Driven Fix
```typescript
// 1. Write failing test that reproduces bug
test('should handle negative quantities', () => {
  expect(() => addToCart(product, -1))
    .toThrow('Quantity must be positive');
});

// 2. Fix the code
function addToCart(product: Product, quantity: number) {
  if (quantity <= 0) {
    throw new Error('Quantity must be positive');
  }
  // ... rest of code
}

// 3. Verify test passes
// ✅ Test now passes
```

### Strategy 2: Incremental Fixes
```typescript
// Problem: Complex function with multiple bugs
// Don't fix everything at once

// Iteration 1: Fix null handling
function process(data: Data | null) {
  if (!data) return null; // First fix
  // ... rest has other bugs
}

// Iteration 2: Fix validation
function process(data: Data | null) {
  if (!data) return null;
  if (!isValid(data)) throw new Error(); // Second fix
  // ... rest has other bugs
}

// Continue until all issues fixed
```

### Strategy 3: Feature Flag Fixes
```typescript
// Deploy fix behind feature flag
function processPayment(order: Order) {
  if (featureFlags.isEnabled('new-payment-logic')) {
    return newPaymentProcess(order); // New fix
  }
  return oldPaymentProcess(order); // Existing logic
}

// Gradually roll out, monitor for issues
// Remove flag once confident
```

## Debugging Tools

### Console/Terminal
```bash
# Logs with context
DEBUG=app:* npm start  # Enable debug logs
tail -f logs/app.log | grep ERROR  # Watch errors

# Process monitoring
htop  # CPU/memory usage
lsof -i :3000  # What's using port 3000
```

### Browser DevTools
```javascript
// Console
console.table(users);  // Formatted table
console.trace();       // Stack trace
console.time('query'); // Start timer
console.timeEnd('query'); // End timer

// Debugger
debugger; // Pause execution

// Network tab
- Check failed requests
- Inspect headers
- View request/response
```

### IDE Debuggers
```typescript
// VS Code / IntelliJ
// - Set breakpoints
// - Step through code
// - Inspect variables
// - Watch expressions
// - Call stack navigation
```

### Database Queries
```sql
-- Check actual data
SELECT * FROM users WHERE id = 'xyz';

-- Check query performance
EXPLAIN ANALYZE SELECT ...;

-- Check locks
SELECT * FROM pg_locks;
```

## Best Practices

### DO:
✅ Reproduce issue reliably first
✅ Make one change at a time
✅ Add regression tests
✅ Keep changes minimal
✅ Document root cause and fix
✅ Use version control (commit often)
✅ Ask for help when stuck
✅ Take breaks when frustrated
✅ Learn from each bug
✅ Share learnings with team

### DON'T:
❌ Guess and check randomly
❌ Make multiple changes at once
❌ Skip writing regression tests
❌ Refactor while debugging
❌ Debug in production
❌ Ignore error messages
❌ Assume you know the cause
❌ Give up too quickly
❌ Debug when tired
❌ Keep bugs to yourself

## Common Pitfalls

### Pitfall 1: Confirmation Bias
**Problem**: Only looking for evidence that confirms your hypothesis
**Solution**: Actively try to disprove your hypothesis

### Pitfall 2: Scope Creep
**Problem**: "While I'm here, let me also fix..."
**Solution**: Fix only the current issue, create new tasks for others

### Pitfall 3: Incomplete Testing
**Problem**: Fix works in one case but breaks others
**Solution**: Test multiple scenarios, add comprehensive tests

### Pitfall 4: Treating Symptoms
**Problem**: Fixing what you see, not root cause
**Solution**: Ask "why" 5 times to get to root cause

## Documentation Template

```markdown
# Bug Fix: {Title}

## Issue
**Reported**: 2024-01-09
**Reporter**: John Doe
**Severity**: High

### Description
{What was broken}

### Steps to Reproduce
1. {Step 1}
2. {Step 2}
3. {Expected vs. Actual}

## Investigation

### Reproduction
- Environment: Production
- Frequency: 100% reproducible
- Affected Users: All users on v2.1.0

### Root Cause
{Detailed explanation of underlying cause}

File: `src/services/user-service.ts:45`
Cause: Async validation not awaited before save

## Fix

### Changes Made
- Added `await` to validation call
- Added regression test

### Files Modified
- `src/services/user-service.ts` (line 45)
- `tests/user-service.test.ts` (added TC-042)

### Testing
- [x] Original issue fixed
- [x] Regression test added
- [x] All existing tests pass
- [x] Manual testing completed

## Prevention
- Add ESLint rule for missing await
- Update code review checklist
- Document async/await guidelines
```

## Success Metrics

Effective debugging results in:
- ✅ Quick root cause identification
- ✅ Minimal, targeted fixes
- ✅ No new issues introduced
- ✅ Regression tests added
- ✅ Team learns from bugs
- ✅ Similar bugs prevented
- ✅ Reduced debugging time over time

## Related Skills
- **Code Generation**: Writing bug-free code initially
- **Validation**: Catching bugs before production
- **Testing**: Preventing bugs through comprehensive tests
- **Technical Documentation**: Recording fixes and learnings
