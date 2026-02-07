# Agent Orchestration

## Purpose
Determine when to invoke specific agents, what context to provide, and what outcomes to expect at each phase.

## Used by
- project-orchestrator

## Overview
Agent orchestration is the meta-skill of coordinating multiple specialized agents throughout the development lifecycle. It involves selecting the right agent for each task, providing appropriate context, managing handoffs between agents, and validating outputs. Effective orchestration ensures seamless workflow progression and maintains system coherence across different development phases.

## Core Principles

### 1. Agent Selection
- Match agent capabilities to task requirements
- Consider agent specialization and expertise
- Evaluate cost-benefit of agent invocation
- Optimize for parallel vs. sequential execution

### 2. Context Management
- Provide only relevant information to each agent
- Scope context to agent's specific task
- Minimize cognitive load and token usage
- Maintain context continuity across handoffs

### 3. Validation and Quality Control
- Verify agent outputs against specifications
- Ensure outputs meet acceptance criteria
- Validate consistency across agent outputs
- Detect and correct errors early

### 4. Workflow Management
- Coordinate agent execution order
- Manage dependencies between agents
- Handle agent failures gracefully
- Track progress across workflow phases

## Agent Types and Responsibilities

### 1. Specification Writer
**When to Invoke**: Beginning of project or new feature
**Input Context**: User requirements, business goals, constraints
**Expected Output**: Formal specification document (spec.md)
**Validation**: Completeness, clarity, testability

```markdown
## Invocation Criteria
- New feature request without specification
- Vague or ambiguous requirements
- Need to formalize user stories
- Multiple stakeholders with unclear expectations

## Context to Provide
- User requirements (verbatim if available)
- Business objectives and success metrics
- Technical constraints (platform, performance)
- Regulatory/compliance requirements
- Similar features for reference

## Expected Deliverables
- spec.md with:
  - Executive summary
  - Functional requirements (numbered, testable)
  - Non-functional requirements (with metrics)
  - Data models and validation rules
  - API contracts
  - Edge cases and error handling
  - Acceptance criteria

## Quality Checks
- [ ] All requirements are testable
- [ ] Acceptance criteria are specific
- [ ] Edge cases documented
- [ ] No ambiguous language
- [ ] Stakeholder approval obtained
```

### 2. Architecture Designer
**When to Invoke**: After specification approved, before implementation
**Input Context**: Approved specification, system constraints
**Expected Output**: Architectural plan (plan.md)
**Validation**: Feasibility, scalability, completeness

```markdown
## Invocation Criteria
- Specification is complete and approved
- Technical design decisions needed
- System integration planning required
- Multiple implementation approaches possible

## Context to Provide
- Complete specification document
- Existing system architecture
- Technology stack and constraints
- Non-functional requirements
- Team expertise and resources

## Expected Deliverables
- plan.md with:
  - Component breakdown
  - Interface definitions
  - Data flow diagrams
  - Technology choices with rationale
  - Integration points
  - Scalability strategy
  - Security considerations
  - Deployment plan

## Quality Checks
- [ ] Components are well-defined with clear boundaries
- [ ] Interfaces are documented
- [ ] Dependencies are explicit
- [ ] Scalability addressed
- [ ] Security considerations documented
- [ ] No single points of failure
```

### 3. Task Breakdown Agent
**When to Invoke**: After architecture approved, before coding
**Input Context**: Approved plan, team capacity
**Expected Output**: Task list (tasks.md)
**Validation**: Atomicity, completeness, dependency ordering

```markdown
## Invocation Criteria
- Architecture plan is complete and approved
- Ready to begin implementation
- Need to estimate effort and timeline
- Multiple developers will work in parallel

## Context to Provide
- Complete architecture plan
- Specification document (for reference)
- Team composition and skills
- Development standards and practices
- CI/CD pipeline capabilities

## Expected Deliverables
- tasks.md with:
  - Atomic, independent tasks
  - Dependency graph
  - Acceptance criteria per task
  - Test requirements
  - Estimated effort
  - Priority levels
  - Files to create/modify

## Quality Checks
- [ ] Each task is atomic (2-4 hours)
- [ ] No circular dependencies
- [ ] All work is accounted for
- [ ] Test tasks included
- [ ] Documentation tasks included
- [ ] Dependencies are explicit
```

### 4. Frontend Engineer
**When to Invoke**: UI/UX implementation phase
**Input Context**: Approved tasks, design specs, API contracts
**Expected Output**: Next.js pages, components, styles
**Validation**: Functionality, responsiveness, accessibility

```markdown
## Invocation Criteria
- Backend APIs are ready or mocked
- UI/UX designs available
- Frontend tasks identified in tasks.md
- Component specifications defined

## Context to Provide
- Specific task from tasks.md
- API endpoint documentation
- Design mockups/wireframes
- Accessibility requirements
- Browser support matrix
- Existing component library

## Expected Deliverables
- React components (Server/Client)
- Next.js pages and routes
- Tailwind CSS styles
- Client-side state management
- Form validation
- Error handling
- Loading states
- Responsive layouts

## Quality Checks
- [ ] Component renders correctly
- [ ] Responsive across breakpoints
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Integrates with API correctly
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] TypeScript types defined
```

### 5. Backend Engineer
**When to Invoke**: API/service implementation phase
**Input Context**: Approved tasks, data models, API specs
**Expected Output**: FastAPI endpoints, services, models
**Validation**: Functionality, security, performance

```markdown
## Invocation Criteria
- Database schema designed
- API contracts defined
- Backend tasks identified in tasks.md
- Data models specified

## Context to Provide
- Specific task from tasks.md
- Database schema
- API specifications
- Business logic requirements
- Security requirements
- Performance targets

## Expected Deliverables
- FastAPI route handlers
- SQLModel models
- Business logic services
- Database queries (async)
- Input validation (Pydantic)
- Error handling
- Authentication/authorization
- Logging and monitoring

## Quality Checks
- [ ] Endpoint responds correctly
- [ ] Validation works as specified
- [ ] Errors handled gracefully
- [ ] Performance targets met
- [ ] Security requirements satisfied
- [ ] Database queries optimized
- [ ] Tests pass
```

### 6. Cloud DevOps Architect
**When to Invoke**: Infrastructure and deployment phase
**Input Context**: System architecture, deployment requirements
**Expected Output**: Deployment configs, CI/CD pipelines
**Validation**: Deployability, scalability, reliability

```markdown
## Invocation Criteria
- Application code is complete
- Ready for production deployment
- Infrastructure needs defined
- Scalability requirements known

## Context to Provide
- Application architecture
- Resource requirements
- Scaling requirements
- Security requirements
- Budget constraints
- Compliance requirements

## Expected Deliverables
- Dockerfile
- Kubernetes manifests
- CI/CD pipelines
- Infrastructure as code
- Monitoring configuration
- Logging setup
- Backup strategies
- Disaster recovery plan

## Quality Checks
- [ ] Container builds successfully
- [ ] Deployment scripts tested
- [ ] Auto-scaling configured
- [ ] Monitoring in place
- [ ] Logs centralized
- [ ] Backup strategy validated
- [ ] Rollback plan documented
```

## Orchestration Workflows

### Workflow 1: New Feature Development
```markdown
## Phase 1: Specification (specification-writer)
Duration: 1-2 days
Input: User requirements, stakeholder interviews
Output: spec.md
Validation: Stakeholder approval

Handoff to Phase 2:
- Approved specification document
- Clarifications documented
- Non-functional requirements confirmed

## Phase 2: Architecture Design (architecture-designer)
Duration: 1-3 days
Input: spec.md, system constraints
Output: plan.md
Validation: Technical review, feasibility check

Handoff to Phase 3:
- Approved architecture plan
- Component interfaces defined
- Technology decisions documented

## Phase 3: Task Breakdown (task-breakdown)
Duration: 0.5-1 day
Input: plan.md, team capacity
Output: tasks.md
Validation: Completeness check, effort estimation

Handoff to Phase 4:
- Prioritized task list
- Dependency graph
- Effort estimates

## Phase 4: Implementation (frontend-engineer, backend-engineer)
Duration: Varies by scope
Input: tasks.md, specifications
Output: Working code
Validation: Tests pass, code review

Parallel Tracks:
A) Frontend: UI components, pages, styles
B) Backend: APIs, services, data models

Synchronization Points:
- API contract validation
- Integration testing
- End-to-end testing

Handoff to Phase 5:
- Feature complete
- All tests passing
- Code reviewed and merged

## Phase 5: Deployment (cloud-devops-architect)
Duration: 0.5-1 day
Input: Working application
Output: Deployed system
Validation: Smoke tests, monitoring

Final Checks:
- [ ] Deployed to staging
- [ ] Integration tests pass
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Monitoring active
- [ ] Rollback plan tested
- [ ] Production deployment approved
```

### Workflow 2: Bug Fix
```markdown
## Phase 1: Investigation (backend/frontend engineer)
Duration: 0.5-2 hours
Input: Bug report
Output: Root cause analysis
Validation: Bug reproduced

## Phase 2: Fix Implementation (appropriate engineer)
Duration: 1-4 hours
Input: Root cause, affected code
Output: Bug fix, regression tests
Validation: Bug no longer reproducible

## Phase 3: Deployment (cloud-devops-architect if infrastructure)
Duration: 0.5-1 hour
Input: Fix merged to main
Output: Deployed fix
Validation: Smoke tests pass

Quick Path for Simple Bugs:
- Skip orchestrator for obvious fixes
- Engineer implements directly
- Code review before merge
```

### Workflow 3: Refactoring
```markdown
## Phase 1: Assessment (project-orchestrator)
Duration: 0.5-1 day
Input: Code quality metrics, technical debt
Output: Refactoring plan
Validation: Cost-benefit analysis

## Phase 2: Task Breakdown (task-breakdown)
Duration: 0.5 day
Input: Refactoring plan
Output: Incremental refactoring tasks
Validation: No breaking changes

## Phase 3: Implementation (appropriate engineers)
Duration: Varies
Input: Refactoring tasks
Output: Improved code
Validation: All tests still pass

Guidelines:
- Small, incremental changes
- Maintain backward compatibility
- Comprehensive test coverage
- Continuous integration
```

## Agent Communication Patterns

### Pattern 1: Sequential Handoff
```markdown
Agent A → Agent B → Agent C

Example: Spec Writer → Architect → Task Breakdown

Benefits:
- Clear progression
- Each agent builds on previous work
- Easy to validate at each stage

Drawbacks:
- Sequential dependencies
- Longer total time
- Blocking on slow agents

When to Use:
- Strict dependencies exist
- Output quality critical
- Sequential validation needed
```

### Pattern 2: Parallel Execution
```markdown
         Agent B
        /         \
Agent A            → Agent D
        \         /
         Agent C

Example: Frontend + Backend engineers working simultaneously

Benefits:
- Faster completion
- Better resource utilization
- Natural team structure

Drawbacks:
- Coordination overhead
- Integration challenges
- Synchronization points needed

When to Use:
- Independent work streams
- Multiple specialized agents
- Time constraints
```

### Pattern 3: Iterative Refinement
```markdown
Agent A → Review → Agent A (refine) → Review → ...

Example: Specification writer refining based on stakeholder feedback

Benefits:
- High quality output
- Stakeholder alignment
- Incremental improvement

Drawbacks:
- Multiple rounds needed
- Potential for scope creep
- Time consuming

When to Use:
- Ambiguous requirements
- Stakeholder alignment critical
- Quality over speed
```

### Pattern 4: Hub and Spoke
```markdown
        Agent B
       /
Orchestrator ← → Agent C
       \
        Agent D

Example: Orchestrator coordinating multiple specialist agents

Benefits:
- Centralized coordination
- Consistent context
- Easy progress tracking

Drawbacks:
- Orchestrator bottleneck
- Single point of failure
- Coordination overhead

When to Use:
- Complex projects
- Many specialized agents
- Need for central control
```

## Context Engineering for Agents

### Context Scoping Strategies

#### 1. Minimal Context (Token Optimization)
```markdown
Provide only:
- Current task description
- Immediate dependencies
- Relevant specifications
- Required outputs

Omit:
- Unrelated features
- Historical discussions
- Alternative approaches explored
- Full system architecture

When to Use:
- Simple, well-defined tasks
- Token budget constraints
- Independent work items
```

#### 2. Medium Context (Balanced)
```markdown
Provide:
- Current task + context
- Related specifications
- Component interfaces
- Integration points
- Success criteria

When to Use:
- Standard feature implementation
- Moderate complexity
- Some integration needed
```

#### 3. Full Context (Comprehensive)
```markdown
Provide:
- Complete specifications
- Full architecture plan
- All dependencies
- System-wide constraints
- Historical decisions

When to Use:
- Complex features
- System-wide changes
- Architectural decisions
- Refactoring efforts
```

### Context Templates

#### For Specification Writer
```markdown
## Task
Create specification for [feature name]

## User Requirements
[Verbatim user input or user stories]

## Business Context
- Goals: [specific business objectives]
- Success Metrics: [how we measure success]
- Constraints: [budget, timeline, resources]

## Technical Context
- Platform: [web, mobile, both]
- Tech Stack: [Next.js, FastAPI, PostgreSQL, etc.]
- Integration: [existing systems to integrate with]

## Reference Materials
- Similar Features: [links or descriptions]
- Industry Standards: [relevant standards or best practices]
- Compliance: [regulatory requirements]
```

#### For Architecture Designer
```markdown
## Task
Design architecture for [feature name]

## Specification
[Full spec.md or relevant sections]

## System Context
- Existing Architecture: [current system design]
- Technology Stack: [approved technologies]
- Constraints: [performance, scalability, budget]

## Non-Functional Requirements
- Performance: [specific targets]
- Security: [requirements and standards]
- Scalability: [expected growth]
- Reliability: [uptime requirements]

## Integration Points
[Systems this feature interacts with]
```

#### For Task Breakdown
```markdown
## Task
Break down [feature name] into implementable tasks

## Architecture Plan
[Full plan.md or relevant sections]

## Team Context
- Team Size: [number of developers]
- Skills: [frontend, backend, full-stack distribution]
- Availability: [hours per week per developer]

## Development Standards
- Task Size: [2-4 hours maximum]
- Testing Requirements: [unit, integration, E2E]
- Documentation Requirements: [API docs, README updates]

## CI/CD Capabilities
- Automated Tests: [yes/no, what types]
- Deployment: [manual/automated, environments]
```

#### For Implementation Agents
```markdown
## Task
[Specific task from tasks.md]

## Acceptance Criteria
[Exact criteria from task definition]

## Technical Specifications
- API Contract: [if applicable]
- Data Model: [if applicable]
- Business Logic: [specific rules to implement]

## Files to Modify
[Exact file paths from task]

## Testing Requirements
- Test Cases: [specific scenarios]
- Coverage Target: [percentage or specific paths]

## Context Files
[Links to or content of relevant existing files]
```

## Agent Output Validation

### Validation Checklist per Agent Type

#### Specification Writer Output
```markdown
- [ ] Executive summary is clear and concise
- [ ] All functional requirements numbered and testable
- [ ] Non-functional requirements have specific metrics
- [ ] Data models are complete with validation rules
- [ ] API contracts documented with examples
- [ ] Edge cases and error handling covered
- [ ] Acceptance criteria are measurable
- [ ] No ambiguous language ("user-friendly", "fast")
- [ ] Stakeholder approval obtained
- [ ] Version controlled and linked to task
```

#### Architecture Designer Output
```markdown
- [ ] All components identified with clear responsibilities
- [ ] Interfaces documented with inputs/outputs
- [ ] Dependencies mapped (internal and external)
- [ ] Data flow diagrams provided
- [ ] Technology choices justified
- [ ] Scalability strategy defined
- [ ] Security considerations addressed
- [ ] Performance targets specified
- [ ] Deployment strategy outlined
- [ ] Monitoring and observability planned
- [ ] No single points of failure
- [ ] Technical review approved
```

#### Task Breakdown Output
```markdown
- [ ] All tasks are atomic (2-4 hours max)
- [ ] Each task has specific acceptance criteria
- [ ] Dependencies explicitly stated
- [ ] No circular dependencies
- [ ] Test tasks included for all features
- [ ] Documentation tasks included
- [ ] Files to modify/create listed
- [ ] Effort estimates provided
- [ ] Priority levels assigned
- [ ] All work from plan is covered
- [ ] Parallel work opportunities identified
```

#### Implementation Agent Output
```markdown
- [ ] Code implements exact task requirements
- [ ] All acceptance criteria met
- [ ] Tests written and passing
- [ ] Code follows project style guide
- [ ] Security best practices applied
- [ ] Error handling comprehensive
- [ ] Logging appropriate
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] No breaking changes (or documented)
```

## Error Handling and Recovery

### Agent Failure Scenarios

#### Scenario 1: Agent Produces Incomplete Output
```markdown
Detection:
- Output missing required sections
- Acceptance criteria not met
- Validation checks fail

Response:
1. Identify specific gaps
2. Provide targeted feedback
3. Re-invoke agent with clarifications
4. Validate corrected output

Prevention:
- Clear acceptance criteria upfront
- Comprehensive context provision
- Regular validation checkpoints
```

#### Scenario 2: Agent Misunderstands Requirements
```markdown
Detection:
- Output doesn't match specifications
- Wrong technology chosen
- Misaligned with user needs

Response:
1. Stop downstream work immediately
2. Analyze root cause (unclear spec? missing context?)
3. Clarify requirements
4. Re-invoke agent from appropriate phase
5. Validate understanding before proceeding

Prevention:
- Explicit acceptance criteria
- Examples and counter-examples
- Validation after each phase
```

#### Scenario 3: Agent Output Conflicts
```markdown
Detection:
- Frontend/backend misalignment
- Inconsistent data models
- API contract mismatch

Response:
1. Identify conflict source
2. Determine authoritative source (usually spec)
3. Update conflicting output
4. Re-validate integration points
5. Synchronize agents

Prevention:
- Clear interface contracts upfront
- Regular synchronization points
- API-first development
```

#### Scenario 4: Agent Timeout or Unavailable
```markdown
Detection:
- Agent doesn't respond within timeout
- Agent returns error status
- Context limits exceeded

Response:
1. Assess criticality (blocking or non-blocking)
2. If blocking: reduce context size, retry
3. If still failing: escalate to user for manual intervention
4. Document issue for post-mortem

Prevention:
- Monitor agent response times
- Implement context reduction strategies
- Have fallback plans
```

## Orchestration Best Practices

### DO:
✅ Provide clear, specific instructions to each agent
✅ Validate outputs before proceeding to next phase
✅ Scope context appropriately for each agent
✅ Document handoff points and expectations
✅ Track progress across all agents
✅ Handle errors gracefully with recovery plans
✅ Maintain consistency across agent outputs
✅ Use parallel execution when possible
✅ Keep audit trail of all agent invocations
✅ Learn from failures to improve orchestration

### DON'T:
❌ Invoke agents without clear acceptance criteria
❌ Skip validation between phases
❌ Provide too much irrelevant context
❌ Allow agents to proceed with incomplete inputs
❌ Ignore inconsistencies between agent outputs
❌ Over-orchestrate simple tasks (use direct implementation)
❌ Create dependencies where parallel work is possible
❌ Lose context between handoffs
❌ Forget to validate final integrated system
❌ Repeat failed approaches without adjustments

## Orchestration Metrics

### Success Metrics
```markdown
**Efficiency:**
- Time from spec to deployment
- Agent utilization (parallel vs. sequential)
- Rework rate (how often do agents need to redo work)

**Quality:**
- First-time validation pass rate
- Number of iterations per phase
- Bug rate in production
- Technical debt introduced

**Coordination:**
- Handoff success rate (smooth transitions)
- Integration issues found
- Synchronization overhead

**Outcomes:**
- Stakeholder satisfaction
- Requirements met percentage
- On-time delivery rate
```

## Tools and Automation

### Orchestration Automation
```typescript
// Example orchestration controller

interface OrchestrationPlan {
  phases: Phase[];
  agents: AgentConfig[];
  validation: ValidationRule[];
}

class ProjectOrchestrator {
  async executeWorkflow(plan: OrchestrationPlan) {
    for (const phase of plan.phases) {
      // Invoke appropriate agents
      const results = await this.executePhase(phase);

      // Validate outputs
      const validation = await this.validate(results, phase.rules);

      if (!validation.passed) {
        // Handle failure
        await this.handleFailure(phase, validation.errors);
      }

      // Prepare context for next phase
      const nextContext = this.prepareHandoff(results);
    }
  }

  private async executePhase(phase: Phase): Promise<AgentOutput[]> {
    // Parallel execution where possible
    const tasks = phase.agents.map(agent =>
      this.invokeAgent(agent, phase.context)
    );

    return Promise.all(tasks);
  }
}
```

## Success Indicators

A well-orchestrated project shows:
- ✅ Clear progression through phases
- ✅ Minimal rework between phases
- ✅ High first-time validation pass rate
- ✅ Smooth handoffs with no information loss
- ✅ Parallel work where appropriate
- ✅ Consistent outputs across agents
- ✅ Stakeholder satisfaction
- ✅ On-time delivery

## Related Skills
- **Context Engineering**: Providing right context to agents
- **Validation & Evaluation**: Checking agent outputs
- **System Decomposition**: Understanding system for agent assignment
- **Task Breakdown**: Creating agent work items
