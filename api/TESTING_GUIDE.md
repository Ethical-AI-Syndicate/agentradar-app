# AgentRadar API Testing Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Test-First Development](#test-first-development)
- [Testing Patterns](#testing-patterns)
- [Test Categories](#test-categories)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+ (optional, will fallback to memory)
- Docker (optional, for isolated testing)

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup test environment:
   ```bash
   cp .env.test .env.local
   # Edit .env.local with your test database credentials
   ```

3. Setup test database:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. Run tests:
   ```bash
   npm test                    # Run all tests
   npm run test:coverage       # Run with coverage
   npm run test:watch          # Watch mode
   ```

### Test Scripts

| Script | Description | Use Case |
|--------|-------------|----------|
| `npm test` | Run all tests | Quick development |
| `npm run test:coverage` | Full coverage report | Quality gates |
| `npm run test:unit` | Unit tests only | Component testing |
| `npm run test:integration` | Integration tests | API testing |
| `npm run test:security` | Security tests | Vulnerability testing |
| `npm run test:performance` | Performance tests | Load testing |
| `npm run test:ci` | CI-optimized tests | Pipeline execution |
| `npm run test:changed` | Only changed files | Pre-commit hooks |

## Test-First Development

### TDD Cycle

Follow the Red-Green-Refactor cycle:

```typescript
// 1. RED - Write failing test
describe('User Registration', () => {
  it('should create user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'ValidPassword123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.user).toMatchUserSchema();
    expect(response.body.token).toBeValidJWT();
  });
});

// 2. GREEN - Implement minimum code to pass
// 3. REFACTOR - Improve code quality
```

### Feature Development Workflow

1. **Write Test First**: Start with failing test that describes desired behavior
2. **Implement Feature**: Write minimum code to make test pass
3. **Refactor**: Improve code quality while keeping tests green
4. **Add Edge Cases**: Test error conditions and boundary cases
5. **Security Testing**: Add security-focused tests
6. **Performance Testing**: Add performance benchmarks

## Testing Patterns

### Test Structure

Use the Arrange-Act-Assert (AAA) pattern:

```typescript
describe('Alert Matching Service', () => {
  it('should match alerts based on user preferences', async () => {
    // Arrange
    const user = await testDb.createUser();
    const preferences = await testDb.createAlertPreference(user.id, {
      preferredCities: ['Toronto'],
      minOpportunityScore: 70
    });
    const matchingAlert = await testDb.createAlert({
      city: 'Toronto',
      opportunityScore: 80
    });
    const nonMatchingAlert = await testDb.createAlert({
      city: 'Vancouver',
      opportunityScore: 60
    });

    // Act
    const matches = await alertMatcher.findMatchingUsers(matchingAlert.id);

    // Assert
    expect(matches).toHaveLength(1);
    expect(matches[0].userId).toBe(user.id);

    // Cleanup
    await testDb.cleanupUser(user.id);
    await testDb.cleanupAlert(matchingAlert.id);
    await testDb.cleanupAlert(nonMatchingAlert.id);
  });
});
```

### Using Test Helpers

Leverage built-in helpers for common operations:

```typescript
import { testDb, jwt, apiHelper } from './__tests__/helpers/test-helpers';

describe('Protected Route', () => {
  it('should require authentication', async () => {
    await apiHelper.testAuthentication('/api/protected-route');
  });

  it('should require admin role', async () => {
    const user = await testDb.createUser({ role: 'USER' });
    const token = await jwt.createUserToken(user.id, user.email, 'USER');
    
    await apiHelper.testAuthorization('/api/admin/users', token);
    
    await testDb.cleanupUser(user.id);
  });
});
```

### Custom Matchers

Use domain-specific matchers for better readability:

```typescript
expect(response.body.user).toMatchUserSchema();
expect(response.body.alert).toMatchAlertSchema();
expect(response.body).toHaveValidPagination();
expect(response.body.token).toBeValidJWT();
expect(response.body.error).toMatchApiErrorFormat();
```

## Test Categories

### Unit Tests (`src/__tests__/unit/`)

Test individual components in isolation:

```typescript
// services/alertMatcher.unit.test.ts
import { AlertMatcher } from '../../services/alertMatcher';
import { mockFactory } from '../helpers/test-helpers';

describe('AlertMatcher Service - Unit', () => {
  let alertMatcher: AlertMatcher;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = mockFactory.createMockPrismaTransaction();
    alertMatcher = new AlertMatcher(mockPrisma);
  });

  it('should calculate match score correctly', () => {
    const user = { preferredCities: ['Toronto'] };
    const alert = { city: 'Toronto', opportunityScore: 85 };
    
    const score = alertMatcher.calculateMatchScore(user, alert);
    
    expect(score).toBeGreaterThan(75);
  });
});
```

**Characteristics:**
- Fast execution (< 50ms per test)
- No external dependencies
- Mock all I/O operations
- Focus on business logic

### Integration Tests (`src/__tests__/integration/`)

Test API endpoints with real database:

```typescript
// integration/alerts/alerts-api.integration.test.ts
import request from 'supertest';
import app from '../../../index';
import { testDb, jwt } from '../../helpers/test-helpers';

describe('Alerts API - Integration', () => {
  it('should create alert with valid data', async () => {
    const admin = await testDb.createUser({ role: 'ADMIN' });
    const token = await jwt.createAdminToken(admin.id, admin.email);

    const alertData = {
      title: 'Test Property Alert',
      description: 'Integration test alert',
      address: '123 Test Street',
      city: 'Toronto',
      province: 'ON',
      alertType: 'POWER_OF_SALE',
      priority: 'HIGH',
      opportunityScore: 85
    };

    const response = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${token}`)
      .send(alertData)
      .expect(201);

    expect(response.body.alert).toMatchAlertSchema();
    expect(response.body.alert.title).toBe(alertData.title);

    await testDb.cleanupUser(admin.id);
  });
});
```

**Characteristics:**
- Real database connections
- Full HTTP request/response cycle
- Test API contracts
- Verify data persistence

### Security Tests (`src/__tests__/security/`)

Test for security vulnerabilities:

```typescript
// security/authentication/jwt-security.security.test.ts
import { SecurityTestSuite } from '../security-test-suite';
import app from '../../../index';

describe('JWT Security Tests', () => {
  const securitySuite = new SecurityTestSuite(app);

  describe('/api/auth endpoints', () => {
    securitySuite.testJWTSecurity('/api/auth/me');
    securitySuite.testRateLimiting('/api/auth/login', 5);
    securitySuite.testPasswordSecurity();
  });

  describe('/api/alerts endpoints', () => {
    securitySuite.testSQLInjectionPrevention('/api/alerts', ['title', 'description']);
    securitySuite.testXSSPrevention('/api/alerts', ['title', 'description']);
    securitySuite.testCSRFProtection('/api/alerts');
  });
});
```

**Characteristics:**
- Injection attack testing
- Authentication bypass attempts
- Input validation testing
- Rate limiting verification

### Performance Tests (`src/__tests__/performance/`)

Test system performance and scalability:

```typescript
// performance/load/api-load.performance.test.ts
import { PerformanceTestSuite } from '../performance-test-suite';
import app from '../../../index';

describe('API Performance Tests', () => {
  const perfSuite = new PerformanceTestSuite(app, {
    apiResponseTime: 200, // ms
    concurrentUsers: 500,
    requestsPerSecond: 100
  });

  describe('Critical endpoints', () => {
    perfSuite.testApiResponseTimes([
      '/api/alerts',
      '/api/auth/me',
      '/api/preferences'
    ]);

    perfSuite.testLoadCapacity('/api/alerts');
    perfSuite.testMemoryUsage('/api/alerts');
  });

  describe('Database performance', () => {
    perfSuite.testDatabasePerformance();
    perfSuite.testAlertMatchingPerformance();
  });
});
```

**Characteristics:**
- Load and stress testing
- Memory usage monitoring
- Performance regression detection
- Database query optimization

## Best Practices

### Test Organization

1. **Group Related Tests**: Use `describe` blocks to organize related tests
2. **Descriptive Names**: Use clear, behavior-focused test names
3. **Single Responsibility**: Each test should verify one specific behavior
4. **Setup and Teardown**: Always clean up test data

### Data Management

```typescript
describe('User Management', () => {
  let testUser: any;

  beforeEach(async () => {
    // Setup test data before each test
    testUser = await testDb.createUser();
  });

  afterEach(async () => {
    // Cleanup after each test
    if (testUser) {
      await testDb.cleanupUser(testUser.id);
    }
  });

  // Tests here have clean state
});
```

### Async Testing

```typescript
// Good - Proper async/await usage
it('should handle async operations', async () => {
  const result = await someAsyncOperation();
  expect(result).toBeDefined();
});

// Bad - Missing await
it('should handle async operations', () => {
  const result = someAsyncOperation(); // Returns Promise!
  expect(result).toBeDefined(); // Will fail
});
```

### Error Testing

```typescript
it('should handle database errors gracefully', async () => {
  // Mock database error
  jest.spyOn(testDb.getPrismaClient().user, 'create')
    .mockRejectedValueOnce(new Error('Database connection failed'));

  const response = await request(app)
    .post('/api/auth/register')
    .send(validUserData)
    .expect(500);

  expect(response.body).toMatchApiErrorFormat();
  expect(response.body.error).toContain('server error');
});
```

### Performance Testing

```typescript
it('should respond within performance threshold', async () => {
  const { result, duration } = await perfHelper.measureExecutionTime(async () => {
    return request(app).get('/api/alerts');
  });

  expect(duration).toBeLessThan(200); // 200ms threshold
  expect(result.status).toBe(200);
});
```

## CI/CD Integration

### GitHub Actions Workflow

The test pipeline runs automatically on:
- Push to main/develop branches
- Pull requests to main/develop
- Manual workflow dispatch

### Quality Gates

Tests must pass these thresholds:
- **Coverage**: ≥95% line coverage, ≥90% branch coverage
- **Performance**: API responses <200ms (95th percentile)
- **Security**: Zero high/critical vulnerabilities
- **Error Rate**: <0.1% in performance tests

### Pipeline Stages

1. **Pre-flight**: Check what changed
2. **Code Quality**: Linting, type checking, security audit
3. **Unit Tests**: Fast, isolated tests
4. **Integration Tests**: API and database tests
5. **Security Tests**: Vulnerability scanning
6. **Performance Tests**: Load and stress tests
7. **E2E Tests**: Full user workflows
8. **Quality Gate**: Final validation
9. **Deployment Prep**: Build artifacts if all pass

### Local Development

Use pre-commit hooks to catch issues early:

```bash
# Install hooks
npm install husky --save-dev
npx husky install

# Pre-commit hook runs:
npm run pre-commit  # lint + type-check + changed tests

# Pre-push hook runs:
npm run pre-push    # full CI test suite
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database is running
pg_isready -h localhost -p 5432

# Reset test database
dropdb agentradar_test
createdb agentradar_test
npx prisma migrate deploy
```

#### Memory Issues
```bash
# Increase Node memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm test

# Check for memory leaks
npm test -- --detectLeaks
```

#### Performance Test Failures
```bash
# Run with increased timeouts
npm run test:performance -- --testTimeout=600000

# Check system resources
htop  # CPU and memory usage
iotop # Disk I/O
```

#### Coverage Issues
```bash
# Check coverage by file
npm run test:coverage -- --verbose

# Run specific test file
npm run test:coverage -- auth.test.ts

# Collect coverage for specific paths
npm run test:coverage -- --collectCoverageFrom="src/routes/**"
```

### Debug Mode

```bash
# Debug specific test
npm run test:debug -- --testNamePattern="should register user"

# Debug with VSCode
# Add to .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--testTimeout=0"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Test Data Issues

```bash
# Clear test database
npm run db:reset-test

# Recreate test data
npm run db:seed-test

# Check test isolation
npm test -- --verbose --no-cache
```

## Writing Your First Test

Follow this template for new features:

```typescript
// src/__tests__/integration/my-feature/my-feature.integration.test.ts
import request from 'supertest';
import app from '../../../index';
import { testDb, jwt, apiHelper } from '../../helpers/test-helpers';

describe('My Feature API', () => {
  describe('POST /api/my-feature', () => {
    it('should create feature with valid data', async () => {
      // Arrange
      const user = await testDb.createUser();
      const token = await jwt.createUserToken(user.id, user.email);
      const featureData = {
        name: 'Test Feature',
        description: 'Test description'
      };

      // Act
      const response = await request(app)
        .post('/api/my-feature')
        .set('Authorization', `Bearer ${token}`)
        .send(featureData)
        .expect(201);

      // Assert
      expect(response.body.feature).toBeDefined();
      expect(response.body.feature.name).toBe(featureData.name);

      // Cleanup
      await testDb.cleanupUser(user.id);
    });

    it('should require authentication', async () => {
      await apiHelper.testAuthentication('/api/my-feature', 'post');
    });

    it('should validate input', async () => {
      await apiHelper.testValidationError('/api/my-feature', 'post', {}, 'name');
    });
  });
});
```

## Next Steps

1. **Read the Strategy**: Review the comprehensive [TEST_STRATEGY.md](./TEST_STRATEGY.md)
2. **Explore Examples**: Check existing test files for patterns
3. **Run Tests**: Execute the test suite locally
4. **Write Tests**: Create tests for new features using TDD
5. **Monitor Quality**: Use coverage reports and quality gates

Remember: **Good tests are your safety net for confident code changes!**