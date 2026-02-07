# Code Generation & Integration

## Purpose
Convert approved specifications and task definitions into production-ready code and integrate it correctly into the system.

## Used by
- frontend-engineer
- backend-engineer

## Overview
Code generation is the skill of transforming specifications and requirements into working, maintainable code that integrates seamlessly with existing systems. It combines understanding of requirements, architectural patterns, coding standards, and integration points to produce code that is correct, efficient, and maintainable.

## Core Principles

### 1. Specification Adherence
- Implement exactly what's specified, no more, no less
- Every line of code should trace back to a requirement
- Don't add features not in the specification
- Question ambiguities before implementing

### 2. Code Quality
- Follow project style guides and conventions
- Write self-documenting code with clear names
- Keep functions small and focused
- Minimize complexity and cognitive load

### 3. Integration Awareness
- Understand how code fits into larger system
- Respect existing patterns and conventions
- Maintain backward compatibility unless specified
- Consider impact on dependent systems

### 4. Testability
- Write code that's easy to test
- Include unit tests with implementation
- Design for dependency injection
- Avoid tight coupling and hidden dependencies

## Code Generation Process

### Phase 1: Understand Requirements (15%)
```markdown
**Pre-Implementation Checklist:**
- [ ] Read task description thoroughly
- [ ] Understand acceptance criteria
- [ ] Review API contracts and interfaces
- [ ] Identify dependencies and integration points
- [ ] Clarify any ambiguities
- [ ] Note constraints (performance, security)
```

### Phase 2: Design Approach (20%)
```markdown
**Design Considerations:**
- What pattern fits best? (MVC, Repository, Service Layer)
- How does this integrate with existing code?
- What data structures are needed?
- What edge cases must be handled?
- What can be reused vs. created new?
- How will this be tested?
```

### Phase 3: Implementation (50%)
```markdown
**Implementation Order:**
1. Data models and types
2. Core business logic
3. API/interface layer
4. Error handling
5. Validation
6. Integration points
7. Logging and monitoring

**Quality Checks During Coding:**
- [ ] Following style guide
- [ ] Naming is clear and consistent
- [ ] Functions are focused and small
- [ ] No magic numbers or strings
- [ ] Error handling comprehensive
- [ ] Edge cases covered
```

### Phase 4: Integration & Testing (15%)
```markdown
**Integration Steps:**
1. Verify interfaces match contracts
2. Test integration points
3. Run existing tests (ensure no breaks)
4. Add new tests for new functionality
5. Manual testing of key scenarios
6. Performance testing if applicable
```

## Code Quality Standards

### Naming Conventions
```typescript
// BAD: Unclear, abbreviated
function getPU(id: string) { ... }
const d = new Date();
let x = calcTot(items);

// GOOD: Clear, descriptive
function getProductsByUserId(userId: string) { ... }
const currentDate = new Date();
const totalPrice = calculateTotal(items);
```

### Function Design
```typescript
// BAD: Too many responsibilities
function processOrder(orderId: string) {
  // Validates order
  // Calculates total
  // Processes payment
  // Sends email
  // Updates inventory
  // Creates shipment
  // Logs everything
}

// GOOD: Single responsibility
function processOrder(orderId: string) {
  const order = validateOrder(orderId);
  const payment = processPayment(order);
  notifyCustomer(order, payment);
  updateInventory(order);
  return createShipment(order);
}
```

### Error Handling
```typescript
// BAD: Swallowing errors
try {
  await riskyOperation();
} catch (e) {
  console.log('Error occurred');
}

// GOOD: Proper error handling
try {
  await riskyOperation();
} catch (error) {
  logger.error('Failed to process operation', { error, context });
  throw new OperationFailedError('Unable to complete operation', { cause: error });
}
```

## Integration Patterns

### Pattern 1: API Integration
```typescript
// Define clear interface
interface UserService {
  findById(id: string): Promise<User>;
  create(data: CreateUserDTO): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User>;
}

// Implement with error handling
class UserServiceImpl implements UserService {
  async findById(id: string): Promise<User> {
    try {
      const user = await this.repository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundError(`User ${id} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError('Failed to fetch user', { cause: error });
    }
  }
}
```

### Pattern 2: Event-Based Integration
```typescript
// Publish events for loose coupling
class OrderService {
  async createOrder(data: CreateOrderDTO): Promise<Order> {
    const order = await this.repository.save(data);

    // Publish event for other services
    await this.eventBus.publish('order.created', {
      orderId: order.id,
      userId: order.userId,
      total: order.total,
      timestamp: new Date()
    });

    return order;
  }
}

// Subscribe to events
class InventoryService {
  constructor(eventBus: EventBus) {
    eventBus.subscribe('order.created', this.handleOrderCreated.bind(this));
  }

  async handleOrderCreated(event: OrderCreatedEvent) {
    await this.decrementStock(event.orderId);
  }
}
```

### Pattern 3: Dependency Injection
```typescript
// BAD: Hard-coded dependencies
class OrderController {
  async createOrder(req: Request, res: Response) {
    const service = new OrderService(); // Tight coupling
    const order = await service.create(req.body);
    res.json(order);
  }
}

// GOOD: Injected dependencies
class OrderController {
  constructor(
    private orderService: OrderService,
    private logger: Logger
  ) {}

  async createOrder(req: Request, res: Response) {
    try {
      const order = await this.orderService.create(req.body);
      this.logger.info('Order created', { orderId: order.id });
      res.json(order);
    } catch (error) {
      this.logger.error('Order creation failed', { error });
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
}
```

## Technology-Specific Guidelines

### Next.js/React
```typescript
// Server Component (default)
async function ProductsPage() {
  const products = await getProducts(); // Server-side data fetch

  return (
    <div>
      <h1>Products</h1>
      <ProductList products={products} />
    </div>
  );
}

// Client Component (interactive)
'use client';

function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await addToCart(productId);
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
```

### FastAPI/Python
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from typing import List

router = APIRouter(prefix="/api/v1/users", tags=["users"])

@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new user with validation."""
    # Check if email already exists
    existing = await db.exec(
        select(User).where(User.email == user_data.email)
    )
    if existing.first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = hash_password(user_data.password)

    # Create user
    user = User(
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user
```

## Testing Strategy

### Unit Tests
```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn()
    } as any;
    service = new UserService(mockRepository);
  });

  it('should create user with hashed password', async () => {
    const userData = { email: 'test@test.com', password: 'password123' };
    mockRepository.save.mockResolvedValue({ id: '1', ...userData });

    const result = await service.create(userData);

    expect(result.id).toBe('1');
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: userData.email,
        passwordHash: expect.any(String)
      })
    );
  });

  it('should throw error if email exists', async () => {
    mockRepository.findByEmail.mockResolvedValue({ id: '1' } as User);

    await expect(
      service.create({ email: 'test@test.com', password: 'pass' })
    ).rejects.toThrow('Email already registered');
  });
});
```

### Integration Tests
```typescript
describe('POST /api/v1/users', () => {
  it('should create user and return 201', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        email: 'new@test.com',
        password: 'SecurePass123!',
        role: 'user'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('new@test.com');
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('should return 400 for duplicate email', async () => {
    // Create user first
    await createUser({ email: 'existing@test.com' });

    // Try to create duplicate
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        email: 'existing@test.com',
        password: 'password'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('already registered');
  });
});
```

## Common Patterns

### Repository Pattern
```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Filter): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

class UserRepository implements Repository<User> {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }

  async save(user: User): Promise<User> {
    if (user.id) {
      return this.update(user);
    }
    return this.create(user);
  }
}
```

### Service Layer Pattern
```typescript
class UserService {
  constructor(
    private repository: UserRepository,
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async createUser(data: CreateUserDTO): Promise<User> {
    // Validation
    this.validateUserData(data);

    // Business logic
    const hashedPassword = await this.hashPassword(data.password);
    const user = await this.repository.save({
      ...data,
      passwordHash: hashedPassword,
      createdAt: new Date()
    });

    // Side effects
    await this.emailService.sendWelcome(user.email);
    this.logger.info('User created', { userId: user.id });

    return user;
  }
}
```

## Best Practices

### DO:
✅ Read and understand full task before coding
✅ Follow existing code patterns and conventions
✅ Write self-documenting code with clear names
✅ Handle errors explicitly and appropriately
✅ Write tests alongside implementation
✅ Validate inputs at system boundaries
✅ Log important operations and errors
✅ Keep functions small and focused
✅ Use TypeScript/type hints for type safety
✅ Comment complex business logic

### DON'T:
❌ Add features not in specification
❌ Copy-paste code without understanding
❌ Ignore error handling
❌ Skip writing tests
❌ Use magic numbers or strings
❌ Create god classes/functions
❌ Ignore existing patterns
❌ Leave console.log statements
❌ Commit commented-out code
❌ Break backward compatibility without reason

## Code Review Checklist

Before submitting code:
- [ ] Implements all acceptance criteria
- [ ] Follows project style guide
- [ ] All tests pass (existing + new)
- [ ] No console.log or debug statements
- [ ] Error handling is comprehensive
- [ ] Code is self-documenting
- [ ] Performance is acceptable
- [ ] Security best practices followed
- [ ] No hard-coded secrets or config
- [ ] Documentation updated if needed

## Success Metrics

Quality code generation produces:
- ✅ Code that works correctly first time
- ✅ Zero regressions in existing functionality
- ✅ High test coverage (>80%)
- ✅ Few code review comments
- ✅ Easy to understand and maintain
- ✅ Consistent with existing codebase
- ✅ Meets performance requirements

## Related Skills
- **Specification Writing**: Understanding what to build
- **Task Breakdown**: Knowing scope and acceptance criteria
- **System Decomposition**: Understanding integration points
- **Validation & Evaluation**: Ensuring code meets requirements
