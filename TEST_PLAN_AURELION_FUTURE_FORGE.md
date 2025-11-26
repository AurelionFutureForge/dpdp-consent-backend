# Test Plan & Test Cases
## DPDP Consent Management System

**Version:** 1.0
**Last Updated:** November 26, 2025
**Author:** Engineering Team

---

## Table of Contents
1. [Test Strategy Overview](#test-strategy-overview)
2. [Test Scope](#test-scope)
3. [Test Environment](#test-environment)
4. [Unit Test Cases](#unit-test-cases)
5. [Integration Test Cases](#integration-test-cases)
6. [Functional Test Cases](#functional-test-cases)
7. [API Test Cases](#api-test-cases)
8. [Security Test Cases](#security-test-cases)
9. [Performance Test Cases](#performance-test-cases)
10. [Test Automation](#test-automation)

---

## Test Strategy Overview

### Objectives
- Ensure compliance with DPDP (Digital Personal Data Protection) Act
- Validate consent lifecycle management
- Verify data integrity and security
- Confirm API functionality and error handling
- Validate user authentication and authorization

### Testing Levels
1. **Unit Testing** - Individual functions and methods (Jest)
2. **Integration Testing** - Database operations and service interactions
3. **Functional Testing** - Complete feature workflows
4. **API Testing** - RESTful endpoint validation (Supertest)
5. **Security Testing** - Authentication, authorization, data protection
6. **Performance Testing** - Load testing and response times

### Test Metrics
- Code Coverage: Target **85%+**
- Pass Rate: Minimum **95%**
- Critical Bug Density: **0** before production
- API Response Time: **< 500ms** for 95th percentile

---

## Test Scope

### In Scope
✅ Authentication module (Login, OTP verification)
✅ Consent management (CRUD operations)
✅ Purpose management (Categories and purposes)
✅ Data fiduciary operations
✅ Consent renewal and withdrawal
✅ Audit logging
✅ Notification services
✅ Webhook integration
✅ API rate limiting
✅ Database transactions

### Out of Scope
❌ Frontend UI testing (separate test plan)
❌ Third-party service testing
❌ Infrastructure testing
❌ Browser compatibility testing

---

## Test Environment

### Development Environment
- **Runtime:** Node.js 18.x or higher
- **Database:** PostgreSQL 15+
- **ORM:** Prisma 6.16.2
- **Test Framework:** Jest 29.7.0
- **API Testing:** Supertest 7.1.0

### Test Database
- Separate PostgreSQL instance for testing
- Automated migration and seeding
- Cleanup after each test suite

### Environment Variables (Test)
```bash
NODE_ENV=test
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/dpdp_test
ACCESS_TOKEN_SECRET=test_access_secret_key_minimum_32_chars
REFRESH_TOKEN_SECRET=test_refresh_secret_key_minimum_32_chars
PORT=8002
RESEND_API_KEY=test_resend_key
ALLOWED_ORIGINS=http://localhost:3000
```

---

## Unit Test Cases

### 1. Authentication Service Tests

#### Test Suite: `auth.service.test.ts`

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| AUTH-UT-001 | Generate OTP for valid email | Valid email | 6-digit OTP generated | High |
| AUTH-UT-002 | Verify valid OTP | Valid OTP + Email | JWT tokens returned | High |
| AUTH-UT-003 | Verify expired OTP | Expired OTP | Error: "OTP expired" | High |
| AUTH-UT-004 | Verify invalid OTP | Wrong OTP | Error: "Invalid OTP" | High |
| AUTH-UT-005 | Generate JWT access token | User payload | Valid JWT token | High |
| AUTH-UT-006 | Generate JWT refresh token | User payload | Valid refresh token | High |
| AUTH-UT-007 | Validate JWT token | Valid token | Decoded payload | Medium |
| AUTH-UT-008 | Validate expired JWT | Expired token | Error: "Token expired" | High |

**Sample Test Implementation:**

```typescript
// tests/unit/auth.service.test.ts
import { generateOTP, verifyOTP } from '@/modules/auth/services/auth.service';
import prisma from '@/prisma/client/prismaClient';

describe('Auth Service - OTP Generation', () => {
  beforeEach(async () => {
    await prisma.oTP.deleteMany({});
    await prisma.user.deleteMany({});
  });

  test('AUTH-UT-001: Should generate 6-digit OTP', async () => {
    const email = 'test@example.com';
    const result = await generateOTP(email);

    expect(result.success).toBe(true);
    expect(result.data.otp_code).toHaveLength(6);
    expect(result.data.otp_code).toMatch(/^\d{6}$/);
  });

  test('AUTH-UT-003: Should reject expired OTP', async () => {
    const email = 'test@example.com';

    // Create expired OTP
    const user = await prisma.user.create({
      data: { email, name: 'Test User', role: 'SYSTEM_ADMIN' }
    });

    const expiredOTP = await prisma.oTP.create({
      data: {
        user_id: user.user_id,
        email,
        otp_code: '123456',
        expires_at: new Date(Date.now() - 10 * 60 * 1000) // 10 min ago
      }
    });

    await expect(verifyOTP(email, '123456')).rejects.toThrow('OTP expired');
  });
});
```

---

### 2. Consent Service Tests

#### Test Suite: `consent.service.test.ts`

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| CON-UT-001 | Create consent artifact | Valid consent data | Consent created with ACTIVE status | High |
| CON-UT-002 | Withdraw consent | Valid artifact_id | Status changed to WITHDRAWN | High |
| CON-UT-003 | Renew consent | Valid renewal request | Expires_at extended | High |
| CON-UT-004 | Get user consents | Valid user_id | List of consents | High |
| CON-UT-005 | Validate active consent | Active artifact_id | is_valid = true | High |
| CON-UT-006 | Validate expired consent | Expired artifact_id | is_valid = false | High |
| CON-UT-007 | Create consent with invalid purpose | Non-existent purpose_id | Error: "Purpose not found" | High |
| CON-UT-008 | Bulk consent creation | Multiple purposes | All consents created | Medium |

**Sample Test Implementation:**

```typescript
// tests/unit/consent.service.test.ts
import { createConsent, withdrawConsent } from '@/modules/consent/services/consent.service';
import prisma from '@/prisma/client/prismaClient';

describe('Consent Service - Creation & Withdrawal', () => {
  let fiduciaryId: string;
  let principalId: string;
  let purposeId: string;
  let purposeVersionId: string;

  beforeEach(async () => {
    // Setup test data
    const fiduciary = await prisma.dataFiduciary.create({
      data: {
        name: 'Test Company',
        legal_name: 'Test Company Ltd',
        contact_email: 'contact@test.com',
        api_key: 'test_api_key_123',
        api_secret: 'hashed_secret'
      }
    });
    fiduciaryId = fiduciary.data_fiduciary_id;

    const principal = await prisma.dataPrincipal.create({
      data: {
        external_id: 'user_123',
        email: 'user@example.com'
      }
    });
    principalId = principal.data_principal_id;

    const purpose = await prisma.purpose.create({
      data: {
        data_fiduciary_id: fiduciaryId,
        title: 'Marketing Communications',
        data_fields: ['email', 'name'],
        processing_activities: ['email_marketing']
      }
    });
    purposeId = purpose.purpose_id;

    const version = await prisma.purposeVersion.create({
      data: {
        purpose_id: purposeId,
        title: 'Marketing Communications',
        version_number: 1
      }
    });
    purposeVersionId = version.purpose_version_id;
  });

  test('CON-UT-001: Should create consent artifact', async () => {
    const result = await createConsent({
      data_fiduciary_id: fiduciaryId,
      external_user_id: 'user_123',
      purpose_ids: [purposeId],
      consent_text: 'I agree to marketing communications'
    });

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('ACTIVE');
    expect(result.data.consent_artifact_id).toBeDefined();
  });

  test('CON-UT-002: Should withdraw consent', async () => {
    // Create consent first
    const consent = await prisma.consentArtifact.create({
      data: {
        data_fiduciary_id: fiduciaryId,
        data_principal_id: principalId,
        purpose_id: purposeId,
        purpose_version_id: purposeVersionId,
        status: 'ACTIVE',
        granted_at: new Date()
      }
    });

    const result = await withdrawConsent({
      consent_artifact_id: consent.consent_artifact_id,
      reason: 'User requested withdrawal'
    });

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('WITHDRAWN');
    expect(result.data.withdrawn_at).toBeDefined();
  });
});
```

---

### 3. Purpose Service Tests

#### Test Suite: `purpose.service.test.ts`

| Test ID | Test Case | Input | Expected Output | Priority |
|---------|-----------|-------|-----------------|----------|
| PUR-UT-001 | Create purpose | Valid purpose data | Purpose created | High |
| PUR-UT-002 | Update purpose | Valid updates | Purpose updated | Medium |
| PUR-UT-003 | Create purpose category | Valid category data | Category created | High |
| PUR-UT-004 | Get purposes by category | Valid category_id | Filtered purposes | Medium |
| PUR-UT-005 | Create purpose version | New version data | Version number incremented | Medium |

---

## Integration Test Cases

### Database Integration Tests

| Test ID | Test Case | Description | Priority |
|---------|-----------|-------------|----------|
| INT-DB-001 | Prisma connection | Verify database connectivity | High |
| INT-DB-002 | Transaction rollback | Test failed transaction rollback | High |
| INT-DB-003 | Cascade deletion | Verify soft delete behavior | High |
| INT-DB-004 | Foreign key constraints | Test referential integrity | Medium |

**Sample Test:**

```typescript
// tests/integration/database.test.ts
describe('Database Integration', () => {
  test('INT-DB-002: Should rollback on failed transaction', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.dataPrincipal.create({
          data: { external_id: 'test_user', email: 'test@example.com' }
        });

        // Force error
        throw new Error('Simulated error');
      })
    ).rejects.toThrow();

    // Verify rollback
    const user = await prisma.dataPrincipal.findUnique({
      where: { external_id: 'test_user' }
    });
    expect(user).toBeNull();
  });
});
```

---

## Functional Test Cases

### Consent Lifecycle Tests

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| FUNC-001 | Complete consent flow | 1. User logs in<br>2. Views purposes<br>3. Grants consent<br>4. Validates consent | Consent active and valid | Critical |
| FUNC-002 | Consent withdrawal flow | 1. Grant consent<br>2. Withdraw consent<br>3. Verify status | Status = WITHDRAWN | Critical |
| FUNC-003 | Consent renewal | 1. Create expiring consent<br>2. Initiate renewal<br>3. Verify extension | expires_at extended | High |
| FUNC-004 | Expired consent handling | 1. Create consent<br>2. Wait for expiry<br>3. Validate | is_valid = false | High |

---

## API Test Cases

### Authentication Endpoints

| Test ID | Endpoint | Method | Request Body | Expected Response | Status Code | Priority |
|---------|----------|--------|--------------|-------------------|-------------|----------|
| API-AUTH-001 | `/api/v1/auth/login` | POST | `{ "email": "user@test.com" }` | `{ "success": true, "message": "OTP sent" }` | 200 | High |
| API-AUTH-002 | `/api/v1/auth/verify-otp` | POST | `{ "email": "...", "otp": "123456" }` | `{ "success": true, "data": { "access_token": "..." } }` | 200 | High |
| API-AUTH-003 | `/api/v1/auth/login` | POST | `{ "email": "invalid" }` | `{ "success": false, "error": "Invalid email" }` | 400 | Medium |

**Sample API Test:**

```typescript
// tests/api/auth.api.test.ts
import request from 'supertest';
import createApp from '@/app';

describe('Auth API Endpoints', () => {
  let app: Express;

  beforeAll(async () => {
    const { app: testApp } = await createApp();
    app = testApp;
  });

  test('API-AUTH-001: Should send OTP on valid login', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('OTP sent');
  });

  test('API-AUTH-003: Should reject invalid email', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'invalid-email' })
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});
```

### Consent Management Endpoints

| Test ID | Endpoint | Method | Auth | Request Body | Expected Status | Priority |
|---------|----------|--------|------|--------------|-----------------|----------|
| API-CON-001 | `/api/v1/consent/create` | POST | Required | Valid consent data | 201 | Critical |
| API-CON-002 | `/api/v1/consent/withdraw` | POST | Required | `{ "artifact_id": "..." }` | 200 | Critical |
| API-CON-003 | `/api/v1/consent/user` | GET | Required | Query params | 200 | High |
| API-CON-004 | `/api/v1/consent/validate` | POST | API Key | `{ "artifact_id": "..." }` | 200 | Critical |
| API-CON-005 | `/api/v1/consent/renew` | POST | Required | Renewal request | 200 | High |

---

## Security Test Cases

### Authentication & Authorization

| Test ID | Test Case | Description | Priority |
|---------|-----------|-------------|----------|
| SEC-001 | JWT token validation | Verify token signature and expiry | Critical |
| SEC-002 | API key authentication | Test fiduciary API key validation | Critical |
| SEC-003 | Rate limiting | Verify rate limit enforcement | High |
| SEC-004 | SQL injection prevention | Test with malicious input | Critical |
| SEC-005 | XSS prevention | Test script injection in fields | High |
| SEC-006 | CORS policy | Verify allowed origins | Medium |

**Sample Security Test:**

```typescript
// tests/security/auth.security.test.ts
describe('Security Tests', () => {
  test('SEC-001: Should reject invalid JWT token', async () => {
    const response = await request(app)
      .get('/api/v1/consent/user')
      .set('Authorization', 'Bearer invalid_token_123')
      .expect(401);

    expect(response.body.error).toContain('Invalid token');
  });

  test('SEC-003: Should enforce rate limiting', async () => {
    const requests = [];

    // Send 101 requests (assuming limit is 100)
    for (let i = 0; i < 101; i++) {
      requests.push(
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'test@example.com' })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

---

## Performance Test Cases

| Test ID | Test Case | Load | Expected Response Time | Success Rate |
|---------|-----------|------|------------------------|--------------|
| PERF-001 | Consent creation | 100 req/sec | < 500ms (95th percentile) | > 99% |
| PERF-002 | Consent validation | 500 req/sec | < 200ms (95th percentile) | > 99.9% |
| PERF-003 | User consents retrieval | 200 req/sec | < 300ms | > 99% |
| PERF-004 | Database query optimization | N/A | < 100ms per query | 100% |

---

## Test Automation

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

### Test Setup File

```typescript
// tests/setup.ts
import prisma from '@/prisma/client/prismaClient';

beforeAll(async () => {
  // Run migrations
  // await execSync('npx prisma migrate deploy');
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clear test data
  const tables = ['ConsentArtifact', 'Purpose', 'DataPrincipal', 'DataFiduciary'];

  for (const table of tables) {
    await prisma[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany({});
  }
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- auth.service.test.ts

# Run in watch mode
npm test -- --watch

# Run verbose
npm run test:verbose
```

---

## Test Reporting

### Coverage Report Format
- HTML report: `coverage/lcov-report/index.html`
- JSON summary: `coverage/coverage-summary.json`
- Console output with metrics

### Continuous Integration
Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests
- Merge to main branch
- Scheduled nightly builds

---

## Defect Management

### Severity Levels
- **Critical:** System crash, data loss, security breach
- **High:** Core functionality broken
- **Medium:** Feature partially working
- **Low:** UI/UX issues, minor bugs

### Bug Report Template
```markdown
**Bug ID:** BUG-XXX
**Title:** [Brief description]
**Severity:** Critical/High/Medium/Low
**Steps to Reproduce:**
1. Step 1
2. Step 2

**Expected Result:** [What should happen]
**Actual Result:** [What actually happens]
**Environment:** Development/Staging/Production
**Logs:** [Error logs if any]
```

---

## Appendix

### Test Data Requirements
- See `SAMPLE_TEST_DATA.md` for detailed test data
- Automated seed scripts in `prisma/seed.ts`

### References
- DPDP Act Compliance Guidelines
- API Documentation: `/api-docs`
- Swagger Spec: `src/config/swagger/swagger-dpdp.yaml`

---

**End of Test Plan**

