<!--
Sync Impact Report:
===================
Version Change: 1.0.0 → 2.0.0
Rationale: MAJOR — Phase III introduces AI-powered chatbot with MCP and
OpenAI Agents SDK, redefining separation of concerns (new layers: Agent,
MCP Tools) and adding two new non-negotiable principles (VII, VIII).
Existing Principle IV redefined to accommodate new architectural layers.

Modified Principles:
- IV. Clear Separation of Concerns → expanded from 4-layer (Frontend,
  Backend, Database, Auth) to 5-layer (UI, Agent Logic, MCP Tools,
  Storage, Auth) architecture
- VI. Technology Stack Fixation → expanded with OpenAI Agents SDK,
  Official MCP SDK, and AI-specific dependencies

Added Sections:
- Principle VII: Deterministic and Auditable AI Behavior
- Principle VIII: Stateless Server with Persistent State
- Technology Stack > AI/Agent Stack (new subsection)
- Integration Requirements > MCP and Agent integration patterns

Removed Sections:
- None (all prior content preserved and extended)

Templates Status:
✅ .specify/templates/spec-template.md - Aligned (user story structure
   supports AI-interaction scenarios; no changes required)
✅ .specify/templates/plan-template.md - Aligned (Constitution Check
   section exists; new principles discoverable at plan time)
✅ .specify/templates/tasks-template.md - Aligned (task structure
   supports MCP tool and agent implementation tasks)

Follow-up TODOs:
- None (all placeholders filled)

Date: 2026-02-07
-->

# Phase III – AI-Powered Todo Chatbot Constitution

## Core Principles

### I. Spec-First Development (NON-NEGOTIABLE)

Every feature MUST originate from an explicit, approved specification
before any implementation work begins. This principle ensures all
development is intentional, traceable, and reviewable.

**Rules**:
- No implementation code may be written without a corresponding
  approved spec
- Specs MUST be completed and approved before planning begins
- Plans MUST be derived strictly from specs with no additional scope
- Tasks MUST map one-to-one with plan items
- All API endpoints and MCP tool schemas MUST be defined in specs
  before implementation

**Rationale**: Spec-first development creates an auditable trail from
requirements to implementation, enabling reviewers to trace every
feature decision and ensuring reproducibility of results.

### II. Agentic Dev Stack Compliance (NON-NEGOTIABLE)

All development MUST follow the strict workflow:
spec → plan → tasks → execution. This workflow ensures proper
decomposition, planning, and systematic execution.

**Rules**:
- Workflow phases MUST execute in order:
  spec → plan → tasks → execution
- Each phase MUST complete and be approved before the next begins
- No phase skipping or workflow shortcuts permitted
- All code MUST be generated via Claude Code agents (zero manual coding)
- Each phase output MUST be documented and version-controlled

**Rationale**: The agentic workflow ensures systematic development,
proper planning, and enables reviewers or agents to reproduce the
exact development process.

### III. Security by Design (NON-NEGOTIABLE)

Security MUST be enforced at every layer with authentication,
authorization, and data isolation as foundational requirements, not
afterthoughts.

**Rules**:
- All API endpoints MUST require valid JWT authentication
- Requests without valid JWT MUST return 401 Unauthorized
- User ID in JWT MUST match user ID in request context for
  user-scoped operations
- Each user can ONLY view or modify their own tasks (data isolation)
- Backend MUST independently verify JWTs without relying on frontend
  sessions
- Shared secrets MUST be environment-based and never hardcoded
- Authentication MUST be stateless using JWT
- MCP tools MUST enforce user isolation; every tool call MUST operate
  within the authenticated user's scope
- AI agent MUST NOT bypass authentication or authorization checks

**Rationale**: Security violations and cross-user data leakage would
be critical failures in a multi-user AI-powered todo application.
Enforcing security by design prevents these issues from the start.

### IV. Clear Separation of Concerns (NON-NEGOTIABLE)

The architecture MUST maintain distinct boundaries between UI,
Agent Logic, MCP Tools, Storage, and Authentication layers with no
cross-contamination of responsibilities.

**Rules**:
- **UI Layer**: Handles user interaction and chat interface only;
  communicates with backend via documented APIs
- **Agent Logic Layer**: Processes natural language, selects and
  invokes MCP tools; MUST NOT access storage directly
- **MCP Tools Layer**: Provides stateless, schema-defined operations;
  each tool has a single responsibility and communicates with storage
- **Storage Layer**: Neon PostgreSQL is the sole source of truth; all
  state persisted here
- **Authentication Layer**: Isolated auth service (Better Auth);
  enforces JWT validation at the API boundary
- No direct database access from UI or Agent layers
- Data models are defined once and shared via documented contracts
- API and MCP tool contracts MUST be documented before implementation

**Rationale**: Clear separation enables independent development,
testing, and modification of each layer without cascading changes or
hidden dependencies. The AI agent layer is explicitly isolated from
storage to ensure all data access flows through auditable MCP tools.

### V. Reproducibility and Traceability

Every development decision and implementation MUST be traceable from
specs through execution, enabling external reviewers to reproduce
results using only specs and documented prompts.

**Rules**:
- All API and MCP tool behavior MUST exactly match written specs
- Architectural decisions MUST be documented with rationale and
  tradeoffs
- Prompt History Records (PHRs) MUST be created for all significant
  development sessions
- Architecture Decision Records (ADRs) MUST document significant
  technical choices
- All implementation steps MUST be auditable through version control
- Reviewers MUST be able to reproduce results using documented specs
  and prompts
- AI agent tool invocations MUST be traceable in database records

**Rationale**: Reviewers and future maintainers need to understand
why decisions were made and verify that implementation matches
specifications exactly. AI behavior traceability is critical for
debugging and auditing agent actions.

### VI. Technology Stack Fixation (NON-NEGOTIABLE)

The technology stack MUST remain fixed throughout the project to
ensure consistency, compatibility, and successful integration.

**Rules**:
- Frontend: Next.js 16+ (React Server Components, App Router)
- Backend: FastAPI (Python)
- ORM: SQLModel
- Database: Neon Serverless PostgreSQL
- Authentication: Better Auth with JWT
- AI Agent: OpenAI Agents SDK
- Tool Protocol: Official MCP SDK (Model Context Protocol)
- NO technology substitutions permitted without constitutional
  amendment
- All dependencies MUST be compatible with the fixed stack

**Rationale**: Mixed or inconsistent technologies lead to integration
issues, security vulnerabilities, and maintenance complexity. A fixed
stack ensures all components work together seamlessly.

### VII. Deterministic and Auditable AI Behavior (NON-NEGOTIABLE)

AI agent behavior MUST be deterministic, explainable, and constrained
by explicit tool contracts. The agent MUST NOT perform actions outside
its defined tool capabilities.

**Rules**:
- All agent actions MUST be explainable via MCP tool calls; the agent
  MUST NOT produce side effects outside defined tools
- MCP tools MUST define explicit input/output schemas; the agent MUST
  conform to these schemas on every invocation
- AI behavior MUST strictly follow defined tool schemas and rules;
  no free-form database operations or unschematized actions permitted
- Tool invocations MUST be logged with input parameters, output
  results, and user context for auditability
- The agent MUST NOT fabricate data; all responses MUST be derived
  from tool call results or clearly stated as generated text
- Conversation context MUST be persisted to enable session resumption
  after server restart

**Rationale**: Without explicit constraints, AI agents can produce
unpredictable, unauditable behavior. Deterministic tool contracts
ensure every agent action is traceable, reproducible, and bounded.

### VIII. Stateless Server with Persistent State (NON-NEGOTIABLE)

The backend server MUST remain stateless across requests. All
application state MUST be persisted in Neon PostgreSQL.

**Rules**:
- Backend MUST NOT store any request-scoped or session state in
  memory between requests
- All state (todos, conversations, user data) MUST be persisted in
  Neon PostgreSQL
- MCP tools MUST be stateless; each tool call receives all required
  context via parameters and retrieves additional state from the
  database
- Conversation history MUST be stored in the database, not in
  server memory
- Server restart MUST NOT cause data loss or session corruption
- Horizontal scaling MUST be possible without shared server state

**Rationale**: Stateless architecture enables horizontal scaling,
fault tolerance, and predictable behavior. Persistent database state
ensures conversations and todos survive server restarts and can be
served by any instance.

## Technology Stack

### Mandated Technologies

**Frontend Stack**:
- Framework: Next.js 16+ with App Router
- Component Model: React Server Components + Client Components
- Styling: Tailwind CSS
- Type Safety: TypeScript

**Backend Stack**:
- Framework: FastAPI (Python 3.11+)
- ORM: SQLModel (combines SQLAlchemy + Pydantic)
- Database: Neon Serverless PostgreSQL
- Authentication: Better Auth with JWT (RS256)
- API Documentation: OpenAPI/Swagger (auto-generated by FastAPI)

**AI/Agent Stack**:
- Agent Framework: OpenAI Agents SDK
- Tool Protocol: Official MCP SDK (Model Context Protocol)
- Agent-to-Tool Communication: MCP stdio/SSE transport
- Conversation Persistence: Neon PostgreSQL (database-backed)

**Development Tools**:
- Code Generation: Claude Code (all code must be AI-generated)
- Version Control: Git
- Documentation: Markdown (specs, plans, tasks, ADRs, PHRs)

### Integration Requirements

- Frontend communicates with backend ONLY via documented APIs
- Backend connects to Neon PostgreSQL via connection string
- JWT tokens signed with RS256 algorithm
- Environment variables for all secrets and configuration
- CORS properly configured for frontend-backend communication
- AI agent invokes MCP tools via the Official MCP SDK; tools are
  registered with explicit schemas
- MCP tools communicate with Neon PostgreSQL for all state operations
- Agent receives user messages via backend API; responses streamed
  back to frontend
- Conversation history loaded from database on each request to
  maintain context without server-side state

## Development Workflow

### Phase Gate Requirements

**Gate 1: Spec Approval**
- All functional requirements documented
- API and MCP tool contracts fully specified
- Success criteria defined and measurable
- Edge cases identified
- User stories with acceptance scenarios complete

**Gate 2: Plan Approval**
- Architecture designed per spec requirements
- Component responsibilities clearly defined (UI, Agent, MCP, Storage)
- API endpoint and MCP tool contracts documented
- Database schema designed (including conversation storage)
- Technology choices justified

**Gate 3: Task Approval**
- All tasks map to plan items
- Dependencies clearly identified
- Acceptance criteria for each task
- Estimated complexity documented
- Parallel execution opportunities identified

**Gate 4: Implementation Complete**
- All tasks executed via Claude Code
- API and MCP tool behavior matches specs exactly
- Authentication and authorization enforced on every operation
- User data properly isolated
- AI agent correctly invokes MCP tools for all task operations
- Conversations resume correctly after server restart
- All actions traceable in database records

### Code Generation Requirements

- ALL code MUST be generated by Claude Code agents
- NO manual coding permitted at any stage
- API endpoints MUST follow defined URL structure and HTTP methods
- MCP tools MUST conform to registered schemas
- After authentication enabled, all endpoints MUST require valid JWT
- Backend MUST independently verify JWTs
- Agent MUST use MCP tools for all data operations

### Documentation Requirements

- **Prompt History Records (PHRs)**: Created for all significant
  development sessions
- **Architecture Decision Records (ADRs)**: Created for all
  architecturally significant decisions
- **API Documentation**: All endpoints documented with request/response
  schemas
- **MCP Tool Documentation**: All tools documented with input/output
  schemas and behavior contracts
- **Setup Documentation**: Project MUST be runnable using documented
  setup steps

## Governance

### Amendment Procedure

1. Proposed amendment documented with rationale and impact analysis
2. All affected templates and documents identified
3. Version number incremented per semantic versioning:
   - **MAJOR**: Backward-incompatible changes, principle removals,
     or redefinitions
   - **MINOR**: New principles added or material expansions
   - **PATCH**: Clarifications, wording fixes, non-semantic
     refinements
4. All dependent artifacts updated for consistency
5. Amendment approved and constitution updated
6. Changes propagated to all affected documents

### Compliance and Review

- All development work MUST verify compliance with this constitution
- Spec, plan, and task reviews MUST check constitutional alignment
- Any complexity or constraint violations MUST be explicitly justified
- Constitution supersedes all other practices and guidelines
- Reviewers MUST be able to trace features from spec to implementation
- AI agent behavior MUST be auditable against MCP tool contracts

### Success Criteria

The project is considered successful when:
- Users can manage todos via natural language through the AI chatbot
- AI correctly invokes MCP tools for all task operations (create,
  read, update, delete, list)
- Conversations resume correctly after server restart
- Unauthorized access is rejected at every layer
- Cross-user data leakage is impossible
- All agent actions are traceable in database records
- MCP tools are stateless and database-backed
- Backend remains stateless across requests
- JWT-based authentication via Better Auth is enforced on every
  operation
- The full spec → plan → task → execution workflow is auditable

**Version**: 2.0.0 | **Ratified**: 2026-01-09 | **Last Amended**: 2026-02-07
