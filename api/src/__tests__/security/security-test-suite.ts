/**
 * Comprehensive Security Test Suite for AgentRadar API
 * 
 * Tests for authentication, authorization, input validation, injection attacks,
 * rate limiting, and other security vulnerabilities.
 */

import request from 'supertest';
import { Express } from 'express';
import { testDb, jwt, ApiTestHelper, sleep } from '../helpers/test-helpers';

export class SecurityTestSuite {
  private app: Express;
  private apiHelper: ApiTestHelper;

  constructor(app: Express) {
    this.app = app;
    this.apiHelper = new ApiTestHelper(app);
  }

  // JWT Security Tests
  async testJWTSecurity(endpoint: string): Promise<void> {
    describe('JWT Security', () => {
      it('should reject requests without authorization header', async () => {
        const response = await request(this.app).get(endpoint);
        expect(response.status).toBe(401);
        expect(response.body).toMatchApiErrorFormat();
      });

      it('should reject malformed authorization headers', async () => {
        const malformedHeaders = [
          'Invalid token',
          'Bearer',
          'Bearer ',
          'Basic token123',
          'token123'
        ];

        for (const header of malformedHeaders) {
          const response = await request(this.app)
            .get(endpoint)
            .set('Authorization', header);
          
          expect(response.status).toBe(401);
          expect(response.body).toMatchApiErrorFormat();
        }
      });

      it('should reject expired tokens', async () => {
        const expiredToken = await jwt.createExpiredToken({
          userId: 'test-user',
          email: 'test@example.com'
        });

        const response = await request(this.app)
          .get(endpoint)
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('expired');
      });

      it('should reject tampered tokens', async () => {
        const user = await testDb.createUser();
        const validToken = await jwt.createUserToken(user.id, user.email);
        
        // Tamper with different parts of the JWT
        const tamperedTokens = [
          validToken.slice(0, -5) + 'xxxxx', // Tamper signature
          'xxxxx' + validToken.slice(5),      // Tamper header
          validToken.slice(0, validToken.indexOf('.')) + '.xxxxx.' + validToken.split('.')[2] // Tamper payload
        ];

        for (const tamperedToken of tamperedTokens) {
          const response = await request(this.app)
            .get(endpoint)
            .set('Authorization', `Bearer ${tamperedToken}`);
          
          expect(response.status).toBe(401);
          expect(response.body).toMatchApiErrorFormat();
        }

        await testDb.cleanupUser(user.id);
      });

      it('should validate token signature with correct secret', async () => {
        const user = await testDb.createUser();
        const token = await jwt.createUserToken(user.id, user.email);

        // Verify token is valid with correct secret
        const decoded = jwt.verifyToken(token);
        expect(decoded.userId).toBe(user.id);

        await testDb.cleanupUser(user.id);
      });

      it('should include necessary claims in token', async () => {
        const user = await testDb.createUser();
        const token = await jwt.createUserToken(user.id, user.email, user.role);

        const decoded = jwt.decodeToken(token);
        expect(decoded).toMatchObject({
          userId: user.id,
          email: user.email,
          role: user.role,
          exp: expect.any(Number),
          iat: expect.any(Number)
        });

        await testDb.cleanupUser(user.id);
      });
    });
  }

  // SQL Injection Tests
  async testSQLInjectionPrevention(endpoint: string, inputFields: string[]): Promise<void> {
    describe('SQL Injection Prevention', () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'; --",
        "1' UNION SELECT * FROM users--",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "1' OR 1=1#",
        "' OR '1'='1' /*",
        "1'; EXEC xp_cmdshell('dir'); --",
        "' UNION SELECT username, password FROM users--",
        "1' AND 1=0 UNION SELECT NULL, username, password FROM users--"
      ];

      for (const field of inputFields) {
        for (const payload of sqlInjectionPayloads) {
          it(`should prevent SQL injection in ${field}: ${payload}`, async () => {
            const user = await testDb.createUser();
            const token = await jwt.createUserToken(user.id, user.email);

            const testPayload = { [field]: payload };

            const response = await request(this.app)
              .post(endpoint)
              .set('Authorization', `Bearer ${token}`)
              .send(testPayload);

            // Should be validation error, not a successful query
            expect(response.status).toBeOneOf([400, 422]);
            expect(response.body).toMatchApiErrorFormat();

            await testDb.cleanupUser(user.id);
          });
        }
      }

      it('should use parameterized queries', async () => {
        // This test ensures that the database queries are parameterized
        // by checking that special SQL characters are handled safely
        const user = await testDb.createUser();
        const token = await jwt.createUserToken(user.id, user.email);

        const safeButSpecialChars = [
          "O'Connor",
          "Test & Company",
          "Quote \"Test\" Name",
          "Backslash\\Test",
          "Percent%Test"
        ];

        for (const testValue of safeButSpecialChars) {
          const response = await request(this.app)
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: testValue, description: 'Test description' });

          // These should be processed normally (200/201) or validation error (400)
          // but never cause database errors (500)
          expect(response.status).not.toBe(500);
        }

        await testDb.cleanupUser(user.id);
      });
    });
  }

  // XSS Prevention Tests
  async testXSSPrevention(endpoint: string, inputFields: string[]): Promise<void> {
    describe('XSS Prevention', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<body onload="alert(1)">',
        '<div onclick="alert(1)">Click me</div>',
        '<input onfocus="alert(1)" autofocus>',
        '"><script>alert(1)</script>',
        '\'-alert(1)-\'',
        '<scr<script>ipt>alert(1)</scr</script>ipt>'
      ];

      for (const field of inputFields) {
        for (const payload of xssPayloads) {
          it(`should sanitize XSS payload in ${field}: ${payload}`, async () => {
            const user = await testDb.createUser();
            const token = await jwt.createUserToken(user.id, user.email);

            const testPayload = { [field]: payload };

            const response = await request(this.app)
              .post(endpoint)
              .set('Authorization', `Bearer ${token}`)
              .send(testPayload);

            if (response.status === 200 || response.status === 201) {
              // If creation succeeded, verify the data is sanitized
              expect(response.body).toBeDefined();
              
              // The response should not contain the raw XSS payload
              const responseStr = JSON.stringify(response.body);
              expect(responseStr).not.toContain('<script>');
              expect(responseStr).not.toContain('javascript:');
              expect(responseStr).not.toContain('onerror=');
              expect(responseStr).not.toContain('onload=');
            } else {
              // Should be validation error
              expect(response.status).toBe(400);
              expect(response.body).toMatchApiErrorFormat();
            }

            await testDb.cleanupUser(user.id);
          });
        }
      }

      it('should set proper content security policy headers', async () => {
        const response = await request(this.app).get('/api/health');
        
        expect(response).toHaveSecureHeaders();
      });
    });
  }

  // CSRF Protection Tests
  async testCSRFProtection(endpoint: string): Promise<void> {
    describe('CSRF Protection', () => {
      it('should validate request origin for state-changing operations', async () => {
        const user = await testDb.createUser();
        const token = await jwt.createUserToken(user.id, user.email);

        const maliciousOrigins = [
          'https://evil-site.com',
          'http://localhost:3000',
          'https://agentradar.fake',
          'null'
        ];

        for (const origin of maliciousOrigins) {
          const response = await request(this.app)
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('Origin', origin)
            .send({ test: 'data' });

          // Should reject requests from untrusted origins
          expect(response.status).toBeOneOf([403, 400]);
          expect(response.body).toMatchApiErrorFormat();
        }

        await testDb.cleanupUser(user.id);
      });

      it('should accept requests from trusted origins', async () => {
        const user = await testDb.createUser();
        const token = await jwt.createUserToken(user.id, user.email);

        const trustedOrigins = [
          'https://agentradar.app',
          'https://app.agentradar.com',
          process.env.FRONTEND_URL
        ].filter(Boolean);

        for (const origin of trustedOrigins) {
          const response = await request(this.app)
            .post(endpoint)
            .set('Authorization', `Bearer ${token}`)
            .set('Origin', origin)
            .send({ title: 'Test', description: 'Test' });

          // Should not be rejected due to origin (may still have validation errors)
          expect(response.status).not.toBe(403);
        }

        await testDb.cleanupUser(user.id);
      });
    });
  }

  // Rate Limiting Tests
  async testRateLimiting(endpoint: string, maxRequests: number = 100, windowMs: number = 900000): Promise<void> {
    describe('Rate Limiting', () => {
      it('should rate limit requests per IP', async () => {
        // Make requests up to the limit
        const requests = Array(maxRequests + 10).fill(null).map(() =>
          request(this.app).get(endpoint)
        );

        const responses = await Promise.all(requests);
        const rateLimitedResponses = responses.filter(r => r.status === 429);

        expect(rateLimitedResponses.length).toBeGreaterThan(0);
        
        const rateLimitedResponse = rateLimitedResponses[0];
        expect(rateLimitedResponse.body).toMatchApiErrorFormat();
        expect(rateLimitedResponse.body.error).toContain('Too many requests');
      });

      it('should include rate limit headers', async () => {
        const response = await request(this.app).get(endpoint);

        expect(response.headers).toHaveProperty('x-ratelimit-limit');
        expect(response.headers).toHaveProperty('x-ratelimit-remaining');
        expect(response.headers).toHaveProperty('x-ratelimit-reset');
      });

      it('should reset rate limit after window expires', async () => {
        // This test would require manipulating time or waiting
        // For now, we'll just verify the headers indicate a reset time
        const response = await request(this.app).get(endpoint);
        
        const resetTime = parseInt(response.headers['x-ratelimit-reset']);
        expect(resetTime).toBeGreaterThan(Date.now() / 1000);
      });

      it('should have different rate limits for different endpoints', async () => {
        const authEndpoint = '/api/auth/login';
        const regularEndpoint = '/api/alerts';

        const authResponse = await request(this.app).post(authEndpoint).send({});
        const regularResponse = await request(this.app).get(regularEndpoint);

        // Auth endpoints should have stricter limits
        const authLimit = parseInt(authResponse.headers['x-ratelimit-limit']);
        const regularLimit = parseInt(regularResponse.headers['x-ratelimit-limit']);

        if (authLimit && regularLimit) {
          expect(authLimit).toBeLessThanOrEqual(regularLimit);
        }
      });
    });
  }

  // Authorization Tests
  async testAuthorization(endpoint: string, requiredRole: string = 'ADMIN'): Promise<void> {
    describe('Authorization', () => {
      it('should require proper role for access', async () => {
        const user = await testDb.createUser({ role: 'USER' });
        const token = await jwt.createUserToken(user.id, user.email, 'USER');

        const response = await request(this.app)
          .get(endpoint)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
        expect(response.body).toMatchApiErrorFormat();
        expect(response.body.error).toContain('permission');

        await testDb.cleanupUser(user.id);
      });

      it('should allow access with correct role', async () => {
        const admin = await testDb.createUser({ role: requiredRole });
        const token = await jwt.createUserToken(admin.id, admin.email, requiredRole);

        const response = await request(this.app)
          .get(endpoint)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).not.toBe(403);

        await testDb.cleanupUser(admin.id);
      });

      it('should validate user account status', async () => {
        const inactiveUser = await testDb.createUser({ 
          role: requiredRole,
          isActive: false 
        });
        const token = await jwt.createUserToken(inactiveUser.id, inactiveUser.email, requiredRole);

        const response = await request(this.app)
          .get(endpoint)
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toContain('account');

        await testDb.cleanupUser(inactiveUser.id);
      });
    });
  }

  // Input Validation Tests
  async testInputValidation(endpoint: string, validationRules: ValidationRule[]): Promise<void> {
    describe('Input Validation', () => {
      for (const rule of validationRules) {
        describe(`${rule.field} validation`, () => {
          it(`should require ${rule.field}`, async () => {
            const user = await testDb.createUser();
            const token = await jwt.createUserToken(user.id, user.email);

            const payload = { ...rule.validPayload };
            delete payload[rule.field];

            const response = await request(this.app)
              .post(endpoint)
              .set('Authorization', `Bearer ${token}`)
              .send(payload);

            expect(response.status).toBe(400);
            expect(response.body).toMatchApiErrorFormat();
            expect(response.body.error).toContain(rule.field);

            await testDb.cleanupUser(user.id);
          });

          if (rule.minLength) {
            it(`should validate ${rule.field} minimum length`, async () => {
              const user = await testDb.createUser();
              const token = await jwt.createUserToken(user.id, user.email);

              const payload = {
                ...rule.validPayload,
                [rule.field]: 'x'.repeat(rule.minLength - 1)
              };

              const response = await request(this.app)
                .post(endpoint)
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

              expect(response.status).toBe(400);
              expect(response.body).toMatchApiErrorFormat();

              await testDb.cleanupUser(user.id);
            });
          }

          if (rule.maxLength) {
            it(`should validate ${rule.field} maximum length`, async () => {
              const user = await testDb.createUser();
              const token = await jwt.createUserToken(user.id, user.email);

              const payload = {
                ...rule.validPayload,
                [rule.field]: 'x'.repeat(rule.maxLength + 1)
              };

              const response = await request(this.app)
                .post(endpoint)
                .set('Authorization', `Bearer ${token}`)
                .send(payload);

              expect(response.status).toBe(400);
              expect(response.body).toMatchApiErrorFormat();

              await testDb.cleanupUser(user.id);
            });
          }

          if (rule.pattern) {
            it(`should validate ${rule.field} format`, async () => {
              const user = await testDb.createUser();
              const token = await jwt.createUserToken(user.id, user.email);

              const invalidValues = rule.invalidValues || [];
              
              for (const invalidValue of invalidValues) {
                const payload = {
                  ...rule.validPayload,
                  [rule.field]: invalidValue
                };

                const response = await request(this.app)
                  .post(endpoint)
                  .set('Authorization', `Bearer ${token}`)
                  .send(payload);

                expect(response.status).toBe(400);
                expect(response.body).toMatchApiErrorFormat();
              }

              await testDb.cleanupUser(user.id);
            });
          }
        });
      }
    });
  }

  // Security Headers Tests
  async testSecurityHeaders(endpoint: string = '/api/health'): Promise<void> {
    describe('Security Headers', () => {
      it('should set security headers', async () => {
        const response = await request(this.app).get(endpoint);

        // Helmet security headers
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['x-xss-protection']).toBe('1; mode=block');
        
        // Content Security Policy
        expect(response.headers['content-security-policy']).toBeDefined();
        
        // Strict Transport Security (for HTTPS)
        if (process.env.NODE_ENV === 'production') {
          expect(response.headers['strict-transport-security']).toBeDefined();
        }
      });

      it('should not expose server information', async () => {
        const response = await request(this.app).get(endpoint);

        expect(response.headers['server']).toBeUndefined();
        expect(response.headers['x-powered-by']).toBeUndefined();
      });

      it('should set appropriate CORS headers', async () => {
        const response = await request(this.app)
          .options(endpoint)
          .set('Origin', 'https://agentradar.app');

        expect(response.headers['access-control-allow-origin']).toBeDefined();
        expect(response.headers['access-control-allow-methods']).toBeDefined();
        expect(response.headers['access-control-allow-headers']).toBeDefined();
      });
    });
  }

  // Password Security Tests (for auth endpoints)
  async testPasswordSecurity(): Promise<void> {
    describe('Password Security', () => {
      it('should hash passwords before storage', async () => {
        const plainPassword = 'testPassword123';
        const response = await request(this.app)
          .post('/api/auth/register')
          .send({
            email: 'password-test@example.com',
            password: plainPassword,
            firstName: 'Test',
            lastName: 'User',
            phone: '+1234567890'
          });

        expect(response.status).toBe(201);

        // Verify password is not stored in plain text
        const user = await testDb.getPrismaClient().user.findUnique({
          where: { email: 'password-test@example.com' }
        });

        expect(user?.password).not.toBe(plainPassword);
        expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern

        if (user) {
          await testDb.cleanupUser(user.id);
        }
      });

      it('should enforce password complexity requirements', async () => {
        const weakPasswords = [
          '123',
          'password',
          '12345678',
          'qwerty',
          'abc123'
        ];

        for (const weakPassword of weakPasswords) {
          const response = await request(this.app)
            .post('/api/auth/register')
            .send({
              email: `weak-${Date.now()}@example.com`,
              password: weakPassword,
              firstName: 'Test',
              lastName: 'User',
              phone: '+1234567890'
            });

          expect(response.status).toBe(400);
          expect(response.body.error).toContain('password');
        }
      });

      it('should not include password in API responses', async () => {
        const response = await request(this.app)
          .post('/api/auth/register')
          .send({
            email: `no-password-${Date.now()}@example.com`,
            password: 'ValidPassword123!',
            firstName: 'Test',
            lastName: 'User',
            phone: '+1234567890'
          });

        expect(response.status).toBe(201);
        expect(response.body.user).toBeDefined();
        expect(response.body.user.password).toBeUndefined();

        if (response.body.user?.id) {
          await testDb.cleanupUser(response.body.user.id);
        }
      });
    });
  }
}

// Validation rule interface
export interface ValidationRule {
  field: string;
  validPayload: any;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  invalidValues?: any[];
}

// Helper function to create validation rules
export function createValidationRule(
  field: string,
  validPayload: any,
  options: Partial<ValidationRule> = {}
): ValidationRule {
  return {
    field,
    validPayload,
    ...options
  };
}

// Common validation rules
export const commonValidationRules = {
  email: createValidationRule('email', { email: 'test@example.com' }, {
    invalidValues: ['invalid-email', '@example.com', 'test@', 'test.com']
  }),
  
  password: createValidationRule('password', { password: 'ValidPassword123!' }, {
    minLength: 8,
    invalidValues: ['weak', '123456', 'password']
  }),
  
  phone: createValidationRule('phone', { phone: '+1234567890' }, {
    invalidValues: ['123', 'invalid-phone', '123-456-7890']
  }),
  
  title: createValidationRule('title', { title: 'Valid Title' }, {
    minLength: 1,
    maxLength: 255
  }),
  
  description: createValidationRule('description', { description: 'Valid description' }, {
    minLength: 1,
    maxLength: 1000
  })
};

export default SecurityTestSuite;