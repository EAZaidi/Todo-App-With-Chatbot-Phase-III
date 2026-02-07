# Context Engineering

## Purpose
Provide agents with only the relevant and scoped context required to perform their tasks, reducing hallucinations and errors.

## Used by
- project-orchestrator
- backend-engineer

## Overview
Context engineering is the art and science of curating, filtering, and presenting information to AI agents in a way that maximizes task completion accuracy while minimizing cognitive load, token usage, and error rates. Proper context engineering is the difference between an agent that produces exactly what's needed and one that hallucinates or goes off-track.

## Core Principles

### 1. Relevance Over Completeness
- Include only information directly relevant to the current task
- Filter out tangential or historical context
- Focus on "need to know" vs "nice to know"
- Quality of context matters more than quantity

### 2. Precision and Clarity
- Use specific, concrete examples over abstract descriptions
- Provide exact file paths, function names, and line numbers
- Include actual code snippets over verbal descriptions
- Be explicit about expectations and constraints

### 3. Progressive Disclosure
- Start with minimal context
- Add layers as complexity increases
- Provide context "on demand" rather than upfront
- Scale context to task complexity

### 4. Signal-to-Noise Ratio
- Maximize relevant information (signal)
- Minimize irrelevant information (noise)
- Structure context for easy parsing
- Use clear separators and headings

## Context Layers

### Layer 1: Task-Specific Context (Always Include)
```markdown
## Current Task
[Exact description from tasks.md]

## Acceptance Criteria
[Specific, measurable criteria]

## Files to Modify
- src/auth/login.ts (lines 45-67)
- src/models/user.ts (add method)

## Expected Output
[Precise description of deliverable]
```

**Purpose**: Ensures agent understands exactly what to do
**Size**: 200-500 tokens
**Update Frequency**: Every task

### Layer 2: Interface Context (Include for Integration)
```markdown
## API Contract
POST /api/v1/auth/login
Request: { email: string, password: string }
Response: { token: string, user: User }

## Data Model
interface User {
  id: string;
  email: string;
  role: UserRole;
}

## Dependencies
- UserService.findByEmail(email)
- TokenService.generate(user)
```

**Purpose**: Ensures compatibility with other components
**Size**: 300-800 tokens
**Update Frequency**: When interfaces change

### Layer 3: Business Logic Context (Include for Complex Rules)
```markdown
## Business Rules
1. Passwords must be hashed with bcrypt (cost factor 12)
2. Failed login attempts increment counter (max 5 in 15 min)
3. Account locks for 15 minutes after 5 failed attempts
4. JWT tokens expire after 24 hours

## Edge Cases
- Empty email/password: Return 400
- Non-existent email: Return 401 (don't reveal existence)
- Already locked account: Return 429 with retry time
```

**Purpose**: Ensures correct implementation of business logic
**Size**: 400-1000 tokens
**Update Frequency**: When business rules change

### Layer 4: System Context (Include for Architectural Decisions)
```markdown
## Architecture Pattern
Using Repository pattern with service layer

## Technology Choices
- FastAPI for API framework
- SQLModel for ORM
- Pydantic for validation
- Redis for rate limiting

## Performance Requirements
- Response time: < 200ms at p95
- Throughput: 1000 req/sec
- Cache hit rate: > 80%
```

**Purpose**: Ensures architectural consistency
**Size**: 500-1200 tokens
**Update Frequency**: Rarely (architectural decisions stable)

### Layer 5: Historical Context (Include Only When Necessary)
```markdown
## Previous Approaches Tried
- Approach A: JWT in cookies (rejected due to CORS issues)
- Approach B: Session-based (rejected due to scalability)
- Current: JWT in Authorization header (chosen)

## Known Issues
- Issue #123: Race condition in token refresh
- Workaround: Use distributed lock in Redis

## Migration Considerations
- Must support old tokens for 24 hours during migration
```

**Purpose**: Avoids repeating past mistakes
**Size**: 300-800 tokens
**Update Frequency**: As needed for context

## Context Scoping Strategies

### Strategy 1: Minimal Context (Token-Optimized)
**When to Use**:
- Simple, well-defined tasks
- Independent work with no integration
- Clear specifications with examples
- Agent has strong baseline knowledge

**What to Include**:
```markdown
✅ Task description
✅ Acceptance criteria
✅ Files to modify (exact paths)
✅ Expected output format
✅ One example

❌ Full specifications
❌ Architecture diagrams
❌ Related features
❌ Historical context
```

**Example**:
```markdown
## Task
Add email validation to User model

## Acceptance Criteria
- Email must match RFC 5322 format
- Validation runs on model creation
- Invalid email raises ValidationError

## File to Modify
src/models/user.py (line 15)

## Example
@validator('email')
def validate_email(cls, v):
    if not is_valid_email(v):
        raise ValueError('Invalid email format')
    return v
```

**Token Budget**: 200-500 tokens

### Strategy 2: Focused Context (Task-Centered)
**When to Use**:
- Standard feature implementation
- Moderate integration requirements
- Some business logic complexity
- Need for interface contracts

**What to Include**:
```markdown
✅ Task description with context
✅ Acceptance criteria (detailed)
✅ API contracts for integration points
✅ Data models (relevant only)
✅ Business rules (task-specific)
✅ 2-3 examples (positive and negative)

❌ Unrelated features
❌ Full architecture
❌ Historical discussions
```

**Example**:
```markdown
## Task
Implement user login endpoint with rate limiting

## Context
Part of authentication system. Integrates with UserService and TokenService.

## Acceptance Criteria
[... 8-10 specific criteria ...]

## API Contract
[... request/response schemas ...]

## Business Rules
[... 5-7 specific rules ...]

## Data Models
[... User, Token models ...]

## Integration
- Calls: UserService.authenticate()
- Returns: JWT token via TokenService

## Examples
[... 3 examples: success, failure, rate limited ...]
```

**Token Budget**: 800-1500 tokens

### Strategy 3: Comprehensive Context (Full Picture)
**When to Use**:
- Complex features with many integration points
- Architectural changes affecting multiple components
- Refactoring existing systems
- Need to understand system-wide implications

**What to Include**:
```markdown
✅ Complete task description
✅ Full specifications (feature-specific)
✅ Architecture diagrams
✅ All relevant data models
✅ Complete business rules
✅ Integration points with all dependencies
✅ Performance and security requirements
✅ Multiple examples and edge cases
✅ Known issues and workarounds

⚠️ Still filter out unrelated features
```

**Token Budget**: 2000-4000 tokens

### Strategy 4: Incremental Context (Progressive Disclosure)
**When to Use**:
- Exploratory tasks (agent needs to investigate first)
- Debugging (root cause unknown)
- Code review (need to understand before commenting)
- Uncertainty about scope

**Approach**:
```markdown
Round 1 (Minimal):
- Task description
- Initial pointers (file paths, function names)
- Let agent explore and ask questions

Round 2 (Expand):
- Provide specific context based on agent's investigation
- Add relevant specifications
- Include related code snippets

Round 3 (Deep Dive):
- Full context for identified areas
- Historical context if needed
- Architectural details for affected areas
```

**Token Budget**: Varies (500-3000 tokens total across rounds)

## Context Filtering Techniques

### Technique 1: Relevance Scoring
```python
def calculate_relevance_score(context_item, task):
    """Score context items by relevance to current task"""
    score = 0

    # Direct mention in task description
    if context_item.name in task.description:
        score += 10

    # Dependency relationship
    if context_item.id in task.dependencies:
        score += 8

    # Same component/module
    if context_item.component == task.component:
        score += 5

    # Similar keywords
    shared_keywords = set(context_item.keywords) & set(task.keywords)
    score += len(shared_keywords) * 2

    # Temporal proximity (recently modified)
    if context_item.last_modified < 7_days_ago:
        score += 3

    return score

# Filter: Include only items with score >= threshold
relevant_context = [
    item for item in all_context
    if calculate_relevance_score(item, task) >= 5
]
```

### Technique 2: Dependency Pruning
```markdown
## Example: Login Endpoint Task

Full Dependency Tree:
- LoginEndpoint
  ├── UserService
  │   ├── UserRepository
  │   │   └── Database
  │   ├── PasswordHasher
  │   └── AuditLogger
  ├── TokenService
  │   ├── JWTGenerator
  │   └── TokenRepository
  └── RateLimiter
      └── RedisCache

Pruned Context (1-level deep):
- LoginEndpoint (task itself)
  ├── UserService (direct dependency)
  ├── TokenService (direct dependency)
  └── RateLimiter (direct dependency)

Include:
- Interfaces of UserService, TokenService, RateLimiter
- Not implementation details of nested dependencies
```

### Technique 3: Temporal Filtering
```markdown
## Context Freshness Rules

Always Include (Critical):
- Current task specification
- Active API contracts
- Latest data models
- Current business rules

Include if Recent (< 7 days):
- Related tasks completed
- Recent bug fixes in area
- Recent architectural changes

Exclude if Stale (> 30 days):
- Old implementation approaches
- Deprecated patterns
- Resolved issues
- Historical discussions

Exception:
- Include old context if explicitly referenced
- Include if pattern is still in use
```

### Technique 4: Semantic Chunking
```markdown
## Break Large Context into Semantic Units

Instead of:
"Here's the entire 5000-line spec document..."

Do:
1. Identify relevant sections
2. Extract semantic chunks
3. Provide only those chunks

Example:
Task: Implement password reset
Relevant Chunks:
- Section 4.2: Password Reset Flow
- Section 5.3: Email Template Requirements
- Section 7.1: Security Requirements for Tokens
- Section 9.2: Error Handling for Password Reset

Irrelevant (Excluded):
- Section 1-3: User registration
- Section 4.1: Login flow
- Section 6: Dashboard features
```

## Context Structuring

### Structure 1: Inverted Pyramid
```markdown
Most Important First → Least Important Last

## 1. TASK (Critical - Always Read)
[Exact task description and acceptance criteria]

## 2. CONSTRAINTS (Critical - Always Read)
[Must-follow rules and requirements]

## 3. INTERFACES (Important - Usually Read)
[API contracts, data models for integration]

## 4. EXAMPLES (Important - Usually Read)
[Code examples showing expected patterns]

## 5. CONTEXT (Reference - Read if Needed)
[Background information, business context]

## 6. REFERENCES (Optional - Read if Needed)
[Links to full specs, related docs]
```

**Benefits**:
- Agent gets critical info first
- Can stop reading when sufficient
- Graceful degradation if context truncated

### Structure 2: Separation of Concerns
```markdown
## WHAT (Functional Requirements)
- What the feature does
- What outputs are expected
- What behaviors are required

## HOW (Technical Specifications)
- How to implement
- What patterns to use
- What technologies to use

## WHY (Business Context)
- Why this feature exists
- Why specific approaches chosen
- Why certain tradeoffs made

## WHEN (Conditional Logic)
- When to use specific approaches
- When to handle errors
- When to log/monitor
```

**Benefits**:
- Clear mental model
- Easy to reference specific aspects
- Reduces cognitive load

### Structure 3: Layered Details
```markdown
## Level 1: Summary (50 tokens)
[One-paragraph overview of task and context]

## Level 2: Key Points (200 tokens)
- Bullet points of essential information
- Critical constraints and requirements
- Must-have outcomes

## Level 3: Detailed Specifications (800 tokens)
[Detailed requirements, API contracts, examples]

## Level 4: Comprehensive Context (2000+ tokens)
[Full specifications, architecture, edge cases]

Agent reads only as deep as needed
```

### Structure 4: Question-Driven
```markdown
## What am I building?
[Task description]

## Why am I building it?
[Business context and value]

## Who will use it?
[User personas and use cases]

## How should it work?
[Technical specifications]

## What could go wrong?
[Edge cases and error scenarios]

## How do I know it's done?
[Acceptance criteria and test cases]
```

**Benefits**:
- Natural flow of information
- Matches agent's mental model
- Easy to validate understanding

## Context Anti-Patterns

### Anti-Pattern 1: Context Dumping
```markdown
❌ BAD: "Here's everything about our system..."
[Dumps entire architecture, all specs, all code]

Problem:
- Overwhelming cognitive load
- High noise-to-signal ratio
- Expensive token usage
- Agent gets confused or hallucinates

✅ GOOD: Targeted context
[Provides only task-relevant information]
- Current task description
- Relevant interfaces
- Specific business rules
- Targeted examples
```

### Anti-Pattern 2: Vague References
```markdown
❌ BAD: "Follow the authentication pattern we discussed"

Problems:
- Which discussion?
- Which pattern?
- What if agent doesn't remember?

✅ GOOD: Explicit examples
"Use this authentication pattern:
```typescript
async function authenticate(email: string, password: string) {
  const user = await userService.findByEmail(email);
  if (!user) throw new UnauthorizedError();

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError();

  return tokenService.generate(user);
}
```
"
```

### Anti-Pattern 3: Implicit Assumptions
```markdown
❌ BAD: "Implement the login endpoint"

Assumptions (not stated):
- How to handle failures?
- What about rate limiting?
- Which authentication method?
- What response format?

✅ GOOD: Explicit everything
"Implement the login endpoint:
- Method: POST
- Path: /api/v1/auth/login
- Request: { email: string, password: string }
- Response 200: { token: string, user: User }
- Response 401: { error: string, code: number }
- Rate limit: 10 requests/minute per IP
- Authentication: bcrypt password comparison
- Token: JWT with 24-hour expiry
"
```

### Anti-Pattern 4: Stale Context
```markdown
❌ BAD: Including outdated information
"Use the SessionAuth class (deprecated 6 months ago)"

Problem:
- Agent implements obsolete patterns
- Conflicts with current architecture
- Technical debt accumulation

✅ GOOD: Fresh, validated context
"Use the JWTAuth class (current standard):
- Location: src/auth/jwt-auth.ts
- Last updated: 2024-01-05
- Status: Active, recommended
"
```

### Anti-Pattern 5: Missing Constraints
```markdown
❌ BAD: "Add a caching layer"

Missing:
- Performance requirements?
- Cache invalidation strategy?
- Memory limits?
- TTL values?

✅ GOOD: Complete constraints
"Add a caching layer:
- Technology: Redis
- TTL: 5 minutes for user data
- Max memory: 512MB
- Eviction policy: LRU
- Invalidation: On user update/delete
- Cache keys: user:{id}
"
```

## Context Validation

### Validation Checklist
```markdown
Before providing context to agent:

**Relevance Check:**
- [ ] Every piece of context relates to current task
- [ ] No unrelated features or components included
- [ ] Focus maintained on task objectives

**Completeness Check:**
- [ ] All necessary interfaces defined
- [ ] All constraints specified
- [ ] All acceptance criteria included
- [ ] Edge cases covered

**Clarity Check:**
- [ ] No ambiguous terms
- [ ] Examples provided for complex concepts
- [ ] Explicit rather than implicit requirements
- [ ] Concrete rather than abstract descriptions

**Accuracy Check:**
- [ ] All code examples are current
- [ ] APIs and interfaces are up-to-date
- [ ] Business rules reflect latest decisions
- [ ] No deprecated patterns included

**Efficiency Check:**
- [ ] No redundant information
- [ ] Token budget respected
- [ ] Structured for quick parsing
- [ ] Critical info presented first
```

## Context Templates

### Template 1: Simple Feature Implementation
```markdown
# Task: {Feature Name}

## Description
{1-2 sentence description}

## Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

## Files to Modify
- {path/to/file1.ts} (add function {name})
- {path/to/file2.ts} (update interface {name})

## API Contract (if applicable)
{Method} {Path}
Request: {schema}
Response: {schema}

## Example Implementation
```{language}
{code example}
```

## Testing
- Test case 1: {description}
- Test case 2: {description}
```

**Token Budget**: ~400 tokens

### Template 2: Complex Integration Task
```markdown
# Task: {Feature Name}

## Overview
{2-3 sentence description with business context}

## Integration Points
### Service A
- Interface: {interface definition}
- Usage: {how to call}
- Error handling: {what errors to expect}

### Service B
- Interface: {interface definition}
- Usage: {how to call}
- Error handling: {what errors to expect}

## Business Rules
1. {Rule with specific parameters}
2. {Rule with specific parameters}
3. {Rule with specific parameters}

## Data Flow
```
{Input} → {Processing Step 1} → {Processing Step 2} → {Output}
```

## Acceptance Criteria
- [ ] {Criterion 1 with metrics}
- [ ] {Criterion 2 with metrics}
- [ ] {Criterion 3 with metrics}

## Error Scenarios
| Scenario | Expected Behavior | Error Code |
|----------|-------------------|------------|
| {Scenario 1} | {Behavior} | {Code} |
| {Scenario 2} | {Behavior} | {Code} |

## Examples
### Happy Path
```{language}
{code}
```

### Error Case
```{language}
{code}
```

## Performance Requirements
- Latency: {target}
- Throughput: {target}
- Resource usage: {limits}
```

**Token Budget**: ~1200 tokens

### Template 3: Debugging Task
```markdown
# Debug: {Issue Description}

## Problem
{What's broken}

## Expected Behavior
{What should happen}

## Actual Behavior
{What is happening}

## Steps to Reproduce
1. {Step 1}
2. {Step 2}
3. {Step 3}

## Relevant Code
```{language}
// File: {path}
// Lines: {start}-{end}
{code snippet}
```

## Recent Changes
- {Change 1 with date}
- {Change 2 with date}

## Investigation Hints
- Check: {hint 1}
- Look at: {hint 2}
- Consider: {hint 3}

## Constraints
- Must not break: {constraint 1}
- Must maintain: {constraint 2}
```

**Token Budget**: ~600 tokens

## Best Practices

### DO:
✅ Provide concrete examples over abstract descriptions
✅ Use exact file paths and line numbers
✅ Include code snippets for expected patterns
✅ Specify explicit acceptance criteria
✅ Structure context with clear headings
✅ Put most important information first
✅ Filter out unrelated features
✅ Update context as requirements change
✅ Validate context before providing
✅ Monitor token usage and optimize

### DON'T:
❌ Dump entire codebases or specs
❌ Include outdated or deprecated information
❌ Use vague references ("that pattern we discussed")
❌ Make implicit assumptions
❌ Provide context without structure
❌ Include every detail about the system
❌ Forget to update context when things change
❌ Skip validation of context accuracy
❌ Ignore token budget constraints
❌ Overwhelm agent with irrelevant information

## Tools and Techniques

### Context Analysis Tools
```python
# Analyze context quality
def analyze_context_quality(context: str, task: str) -> ContextQuality:
    return {
        'relevance_score': calculate_relevance(context, task),
        'clarity_score': measure_clarity(context),
        'completeness_score': check_completeness(context, task),
        'token_count': count_tokens(context),
        'noise_level': calculate_noise_ratio(context, task),
        'recommendations': generate_recommendations(context)
    }

# Optimize context
def optimize_context(context: str, max_tokens: int) -> str:
    # Prioritize by relevance
    chunks = split_into_semantic_chunks(context)
    scored = [(chunk, score_relevance(chunk)) for chunk in chunks]
    sorted_chunks = sorted(scored, key=lambda x: x[1], reverse=True)

    # Include highest-scoring chunks within token budget
    optimized = []
    total_tokens = 0
    for chunk, score in sorted_chunks:
        chunk_tokens = count_tokens(chunk)
        if total_tokens + chunk_tokens <= max_tokens:
            optimized.append(chunk)
            total_tokens += chunk_tokens
        else:
            break

    return '\n\n'.join(optimized)
```

## Success Metrics

Good context engineering results in:
- ✅ High first-attempt success rate (agent completes task correctly first time)
- ✅ Low clarification question rate (agent has all needed info)
- ✅ Minimal hallucinations (agent doesn't invent information)
- ✅ Efficient token usage (no wasted context)
- ✅ Fast task completion (agent doesn't waste time parsing irrelevant info)
- ✅ High stakeholder satisfaction (output meets expectations)
- ✅ Low rework rate (minimal corrections needed)

## Related Skills
- **Agent Orchestration**: Determining what context each agent needs
- **Specification Writing**: Creating clear source material for context
- **Task Breakdown**: Defining scope that determines context needs
- **System Decomposition**: Understanding system to extract relevant context
