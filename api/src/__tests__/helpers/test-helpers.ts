/**
 * Test Helpers and Utilities for AgentRadar API
 * 
 * Provides reusable utilities for creating test data, mocking services,
 * and running common test scenarios.
 */

import { PrismaClient, SubscriptionTier, UserRole, AlertType, AlertStatus, Priority } from "@prisma/client"
import * as jsonwebtoken from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import request from 'supertest';
import { Express } from 'express';

// Re-export commonly used test utilities
export * from '../setup/global-teardown';

// Test data interfaces
export interface TestUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  phone?: string;
  role?: 'USER' | 'ADMIN';
  subscriptionTier?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface TestAlert {
  id?: string;
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  alertType?: string;
  source?: string;
  status?: string;
  priority?: string;
  opportunityScore?: number;
  propertyType?: string;
  estimatedValue?: number;
  bedrooms?: number;
  bathrooms?: number;
  latitude?: number;
  longitude?: number;
}

export interface TestApiConfig {
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresSubscriptionTier?: string;
  validationTests?: ValidationTest[];
  businessLogicTests?: BusinessLogicTest[];
}

export interface ValidationTest {
  description: string;
  payload: any;
  expectedStatus: number;
  expectedError?: string;
}

export interface BusinessLogicTest {
  description: string;
  setup?: () => Promise<any>;
  payload: any;
  expectedStatus: number;
  expectedResult?: any;
  cleanup?: () => Promise<void>;
}

// Database helper class
export class TestDatabaseHelper {
  private static instance: TestDatabaseHelper;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL! }
      }
    });
  }

  static getInstance(): TestDatabaseHelper {
    if (!TestDatabaseHelper.instance) {
      TestDatabaseHelper.instance = new TestDatabaseHelper();
    }
    return TestDatabaseHelper.instance;
  }

  async createUser(overrides: Partial<TestUser> = {}): Promise<any> {
    const defaultUser = {
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      password: await bcryptjs.hash('password123', 10),
      phone: '+1234567890',
      role: UserRole.USER,
      subscriptionTier: SubscriptionTier.FREE,
      isActive: true,
      emailVerified: true,
      ...overrides
    };

    return this.prisma.user.create({
      data: defaultUser
    });
  }

  async createAlert(overrides: Partial<TestAlert> = {}): Promise<any> {
    const defaultAlert = {
      title: `Test Alert ${Date.now()}`,
      description: 'Test property description for automated testing',
      address: '123 Test Street',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M1A 1A1',
      alertType: AlertType.POWER_OF_SALE,
      source: 'ONTARIO_COURT_BULLETINS',
      status: AlertStatus.ACTIVE,
      priority: Priority.HIGH,
      opportunityScore: 75,
      propertyType: 'detached',
      estimatedValue: 50000000, // $500,000 in cents
      bedrooms: 3,
      bathrooms: 2.5,
      latitude: 43.6532,
      longitude: -79.3832,
      ...overrides
    };

    return this.prisma.alert.create({
      data: defaultAlert
    });
  }

  async createAlertPreference(userId: string, overrides: any = {}): Promise<any> {
    const defaultPreferences = {
      userId,
      preferredCities: ['Toronto', 'Vancouver'],
      maxDistanceKm: 50,
      alertTypes: ['POWER_OF_SALE', 'ESTATE_SALE'],
      minOpportunityScore: 60,
      maxOpportunityScore: 100,
      propertyTypes: ['detached', 'semi-detached'],
      minBedrooms: 2,
      maxBedrooms: 5,
      minValue: 30000000, // $300,000 in cents
      maxValue: 100000000, // $1,000,000 in cents
      enableEmailAlerts: true,
      enableSmsAlerts: false,
      enablePushAlerts: true,
      dailyAlertLimit: 10,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      ...overrides
    };

    return this.prisma.alertPreference.create({
      data: defaultPreferences
    });
  }

  async createUserAlert(userId: string, alertId: string, overrides: any = {}): Promise<any> {
    const defaultUserAlert = {
      userId,
      alertId,
      isBookmarked: false,
      isViewed: false,
      matchScore: 75,
      ...overrides
    };

    return this.prisma.userAlert.create({
      data: defaultUserAlert
    });
  }

  async createAdminAction(adminId: string, overrides: any = {}): Promise<any> {
    const defaultAction = {
      adminId,
      action: 'TEST_ACTION',
      targetType: 'USER',
      targetId: 'test-target',
      details: { test: true },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      ...overrides
    };

    return this.prisma.adminAction.create({
      data: defaultAction
    });
  }

  async cleanupUser(userId: string): Promise<void> {
    await this.prisma.userAlert.deleteMany({ where: { userId } });
    await this.prisma.alertPreference.deleteMany({ where: { userId } });
    await this.prisma.savedProperty.deleteMany({ where: { userId } });
    await this.prisma.activityLog.deleteMany({ where: { userId } });
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async cleanupAlert(alertId: string): Promise<void> {
    await this.prisma.userAlert.deleteMany({ where: { alertId } });
    await this.prisma.alert.delete({ where: { id: alertId } });
  }

  async cleanupAll(): Promise<void> {
    const tables = [
      'UserAlert', 'SavedProperty', 'ActivityLog', 'SupportTicket',
      'AdminAction', 'SystemSetting', 'Alert', 'AlertPreference', 'User'
    ];

    for (const table of tables) {
      await this.prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
    }
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}

// JWT helper functions
export class JWTHelper {
  static async createToken(payload: any, options?: jsonwebtoken.SignOptions): Promise<string> {
    return jsonwebtoken.sign(
      payload,
      process.env.JWT_SECRET!,
      {
        expiresIn: '1h',
        ...options
      }
    );
  }

  static async createUserToken(userId: string, email: string, role: string = 'USER'): Promise<string> {
    return this.createToken({
      userId,
      email,
      role
    });
  }

  static async createAdminToken(adminId: string, email: string): Promise<string> {
    return this.createToken({
      userId: adminId,
      email,
      role: 'ADMIN'
    });
  }

  static async createExpiredToken(payload: any): Promise<string> {
    return this.createToken(payload, { expiresIn: '-1h' });
  }

  static verifyToken(token: string): any {
    return jsonwebtoken.verify(token, process.env.JWT_SECRET!);
  }

  static decodeToken(token: string): any {
    return jsonwebtoken.decode(token);
  }
}

// API testing helper class
export class ApiTestHelper {
  private app: Express;
  private db: TestDatabaseHelper;

  constructor(app: Express) {
    this.app = app;
    this.db = TestDatabaseHelper.getInstance();
  }

  // Standard API test patterns
  async testAuthentication(endpoint: string, method: 'get' | 'post' | 'put' | 'delete' = 'get'): Promise<void> {
    const response = await request(this.app)[method](endpoint);
    expect(response.status).toBe(401);
    expect(response.body).toMatchApiErrorFormat();
    expect(response.body.error).toContain('Authentication');
  }

  async testAuthorization(
    endpoint: string,
    userToken: string,
    method: 'get' | 'post' | 'put' | 'delete' = 'get',
    payload?: any
  ): Promise<void> {
    const req = request(this.app)[method](endpoint)
      .set('Authorization', `Bearer ${userToken}`);
    
    if (payload) {
      req.send(payload);
    }

    const response = await req;
    expect(response.status).toBe(403);
    expect(response.body).toMatchApiErrorFormat();
    expect(response.body.error).toContain('permission');
  }

  async testInvalidToken(endpoint: string, method: 'get' | 'post' | 'put' | 'delete' = 'get'): Promise<void> {
    const response = await request(this.app)[method](endpoint)
      .set('Authorization', 'Bearer invalid-token');
    
    expect(response.status).toBe(401);
    expect(response.body).toMatchApiErrorFormat();
  }

  async testExpiredToken(endpoint: string, method: 'get' | 'post' | 'put' | 'delete' = 'get'): Promise<void> {
    const expiredToken = await JWTHelper.createExpiredToken({ userId: 'test', email: 'test@example.com' });
    
    const response = await request(this.app)[method](endpoint)
      .set('Authorization', `Bearer ${expiredToken}`);
    
    expect(response.status).toBe(401);
    expect(response.body).toMatchApiErrorFormat();
  }

  async testValidationError(
    endpoint: string,
    method: 'post' | 'put',
    invalidPayload: any,
    expectedError: string
  ): Promise<void> {
    const user = await this.db.createUser();
    const token = await JWTHelper.createUserToken(user.id, user.email);

    const response = await request(this.app)[method](endpoint)
      .set('Authorization', `Bearer ${token}`)
      .send(invalidPayload);

    expect(response.status).toBe(400);
    expect(response.body).toMatchApiErrorFormat();
    expect(response.body.error).toContain(expectedError);

    await this.db.cleanupUser(user.id);
  }

  async testRateLimit(endpoint: string, maxRequests: number = 5): Promise<void> {
    const user = await this.db.createUser();
    const token = await JWTHelper.createUserToken(user.id, user.email);

    // Make requests up to the limit
    const requests = Array(maxRequests + 1).fill(null).map(() =>
      request(this.app)
        .get(endpoint)
        .set('Authorization', `Bearer ${token}`)
    );

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    await this.db.cleanupUser(user.id);
  }

  // Pagination testing
  async testPagination(endpoint: string, expectedItemCount: number): Promise<void> {
    const user = await this.db.createUser();
    const token = await JWTHelper.createUserToken(user.id, user.email);

    // Test default pagination
    const response = await request(this.app)
      .get(endpoint)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveValidPagination();

    // Test custom pagination
    const customResponse = await request(this.app)
      .get(`${endpoint}?page=1&limit=5`)
      .set('Authorization', `Bearer ${token}`);

    expect(customResponse.status).toBe(200);
    expect(customResponse.body).toHaveValidPagination();
    expect(customResponse.body.pagination.limit).toBe(5);

    await this.db.cleanupUser(user.id);
  }
}

// Mock factory for external services
export class MockFactory {
  static createMockSendGridResponse(success: boolean = true) {
    return success 
      ? [{ statusCode: 202, body: '', headers: {} }]
      : Promise.reject(new Error('SendGrid API error'));
  }

  static createMockRedisClient() {
    const mockData = new Map();
    
    return {
      get: jest.fn(async (key: string) => mockData.get(key) || null),
      set: jest.fn(async (key: string, value: string, options?: any) => {
        mockData.set(key, value);
        return 'OK';
      }),
      del: jest.fn(async (key: string) => mockData.delete(key)),
      exists: jest.fn(async (key: string) => mockData.has(key) ? 1 : 0),
      expire: jest.fn(async (key: string, seconds: number) => 1),
      flushall: jest.fn(async () => {
        mockData.clear();
        return 'OK';
      }),
      connect: jest.fn(async () => {}),
      disconnect: jest.fn(async () => {}),
      ping: jest.fn(async () => 'PONG')
    };
  }

  static createMockStripeCustomer(overrides: any = {}) {
    return {
      id: `cus_${Date.now()}`,
      email: 'test@example.com',
      created: Math.floor(Date.now() / 1000),
      subscriptions: {
        data: []
      },
      ...overrides
    };
  }

  static createMockPrismaTransaction() {
    const operations: any[] = [];
    
    return {
      operations,
      $transaction: jest.fn(async (ops: any[]) => {
        operations.push(...ops);
        return ops.map(op => ({ success: true, data: {} }));
      })
    };
  }
}

// Performance testing utilities
export class PerformanceHelper {
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    return { result, duration };
  }

  static async measureMemoryUsage<T>(fn: () => Promise<T>): Promise<{ result: T; memoryDelta: number }> {
    const initialMemory = process.memoryUsage().heapUsed;
    const result = await fn();
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDelta = finalMemory - initialMemory;
    
    return { result, memoryDelta };
  }

  static createConcurrentRequests<T>(operation: () => Promise<T>, count: number): Promise<T[]> {
    return Promise.all(Array(count).fill(null).map(() => operation()));
  }

  static async waitForCondition(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    return false;
  }
}

// Test data generators
export class TestDataGenerator {
  static generateRandomEmail(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
  }

  static generateRandomPhone(): string {
    return `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  }

  static generateRandomAddress(): string {
    const streetNumbers = [123, 456, 789, 101, 202, 303];
    const streetNames = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Cedar Ln'];
    
    return `${streetNumbers[Math.floor(Math.random() * streetNumbers.length)]} ${streetNames[Math.floor(Math.random() * streetNames.length)]}`;
  }

  static generateRandomCity(): string {
    const cities = ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Mississauga', 'Winnipeg'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  static generateRandomCoordinates(centerLat: number = 43.6532, centerLng: number = -79.3832, radiusKm: number = 50): { latitude: number; longitude: number } {
    // Simple random point generation within radius
    const radiusDegrees = radiusKm / 111; // Approximate conversion
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusDegrees;
    
    return {
      latitude: centerLat + distance * Math.cos(angle),
      longitude: centerLng + distance * Math.sin(angle)
    };
  }

  static generateBulkAlerts(count: number, overrides: Partial<TestAlert> = {}): Partial<TestAlert>[] {
    return Array(count).fill(null).map((_, index) => ({
      title: `Bulk Test Alert ${index + 1}`,
      description: `Automated bulk test alert #${index + 1}`,
      address: this.generateRandomAddress(),
      city: this.generateRandomCity(),
      ...this.generateRandomCoordinates(),
      opportunityScore: Math.floor(Math.random() * 40) + 60, // 60-100
      estimatedValue: Math.floor(Math.random() * 50000000) + 25000000, // $250k - $750k
      ...overrides
    }));
  }

  static generateBulkUsers(count: number, overrides: Partial<TestUser> = {}): Partial<TestUser>[] {
    return Array(count).fill(null).map((_, index) => ({
      email: this.generateRandomEmail(),
      firstName: `TestUser${index + 1}`,
      lastName: 'Generated',
      phone: this.generateRandomPhone(),
      ...overrides
    }));
  }
}

// Export singleton instances
export const testDb = TestDatabaseHelper.getInstance();
export const jwt = JWTHelper;
export const mockFactory = MockFactory;
export const perfHelper = PerformanceHelper;
export const dataGenerator = TestDataGenerator;

// Common test utilities
export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const expectAsync = async (fn: () => Promise<any>): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    throw error;
  }
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await sleep(delay);
    }
  }
  throw new Error('All retry attempts failed');
};