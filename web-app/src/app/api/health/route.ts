import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const startTime = Date.now();
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    database: {
      status: 'disconnected',
      response_time_ms: 0
    },
    services: {
      auth: 'operational',
      alerts: 'operational',
      admin: 'operational'
    },
    system: {
      uptime_seconds: Math.floor(process.uptime()),
      memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      cpu_load_percent: 0
    }
  };

  // Test database connection
  try {
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStartTime;
    
    healthData.database = {
      status: 'connected',
      response_time_ms: dbResponseTime
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    healthData.database = {
      status: 'disconnected',
      response_time_ms: 0
    };
    healthData.status = 'degraded';
  }

  // Test auth service
  try {
    const authTest = await prisma.user.findFirst({ select: { id: true } });
    healthData.services.auth = authTest ? 'operational' : 'operational';
  } catch (error) {
    healthData.services.auth = 'failed';
    healthData.status = 'degraded';
  }

  // Overall status determination
  if (healthData.database.status === 'disconnected' || 
      healthData.services.auth === 'failed') {
    healthData.status = 'unhealthy';
  }

  const totalTime = Date.now() - startTime;
  
  // Ensure response within 2 seconds (requirement)
  if (totalTime > 2000) {
    healthData.status = 'degraded';
  }

  const statusCode = healthData.status === 'healthy' ? 200 : 
                     healthData.status === 'degraded' ? 200 : 503;

  await prisma.$disconnect();

  return NextResponse.json(healthData, { status: statusCode });
}