import { PrismaClient } from '../generated/prisma';

let prismaClient: PrismaClient;

beforeAll(async () => {
  // Setup test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/agentradar_test';
  
  // Initialize Prisma client for testing
  prismaClient = new PrismaClient();
  
  // Connect to test database
  await prismaClient.$connect();
});

beforeEach(async () => {
  // Clean up database before each test
  await prismaClient.userAlert.deleteMany();
  await prismaClient.alert.deleteMany();
  await prismaClient.alertPreference.deleteMany();
  await prismaClient.savedProperty.deleteMany();
  await prismaClient.activityLog.deleteMany();
  await prismaClient.user.deleteMany();
});

afterAll(async () => {
  // Cleanup after all tests
  await prismaClient.$disconnect();
});

// Export for use in tests
export { prismaClient };

// Global test utilities
export const createTestUser = async (overrides = {}) => {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  return prismaClient.user.create({
    data: {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: hashedPassword,
      phone: '+1234567890',
      subscriptionTier: 'FREE',
      ...overrides
    }
  });
};

export const createTestAlert = async (overrides = {}) => {
  return prismaClient.alert.create({
    data: {
      title: 'Test Property Alert',
      description: 'Test property description',
      address: '123 Test Street',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M1A 1A1',
      alertType: 'POWER_OF_SALE',
      source: 'ONTARIO_COURT_BULLETINS',
      status: 'ACTIVE',
      priority: 'HIGH',
      opportunityScore: 75,
      propertyType: 'detached',
      estimatedValue: 50000000, // $500,000 in cents
      bedrooms: 3,
      bathrooms: 2.5,
      latitude: 43.6532,
      longitude: -79.3832,
      ...overrides
    }
  });
};

export const createTestJWT = async (userId: string) => {
  const jwt = await import('jsonwebtoken');
  return jwt.sign(
    { userId, email: 'test@example.com' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
};