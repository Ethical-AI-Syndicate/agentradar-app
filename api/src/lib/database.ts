import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

export const prisma = globalThis.__prisma || new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
}

export async function healthCheck(): Promise<{ status: string; timestamp: Date }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date()
    };
  }
}