import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const startTime = Date.now();
  
  const detailedHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: 'disconnected',
      response_time_ms: 0,
      connection_pool: {
        active: 0,
        idle: 0,
        waiting: 0
      },
      tables_accessible: []
    },
    services: {
      auth: { status: 'unknown', last_check: null },
      alerts: { status: 'unknown', last_check: null },
      admin: { status: 'unknown', last_check: null },
      email: { status: 'unknown', provider: process.env.EMAIL_PROVIDER || 'none' }
    },
    system: {
      uptime_seconds: Math.floor(process.uptime()),
      memory: {
        heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external_mb: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss_mb: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      cpu_load_percent: 0,
      node_version: process.version,
      platform: process.platform
    },
    dependencies: {
      next: 'unknown',
      prisma: 'unknown',
      jwt: 'unknown'
    },
    checks_performed: []
  };

  const checks = [];

  // Database connectivity check
  try {
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const dbResponseTime = Date.now() - dbStartTime;
    
    detailedHealth.database.status = 'connected';
    detailedHealth.database.response_time_ms = dbResponseTime;
    checks.push({ name: 'database_connection', status: 'passed', duration_ms: dbResponseTime });

    // Test table access
    try {
      await prisma.user.findFirst({ select: { id: true } });
      detailedHealth.database.tables_accessible.push('users');
      checks.push({ name: 'users_table_access', status: 'passed', duration_ms: Date.now() - dbStartTime });
    } catch (e) {
      checks.push({ name: 'users_table_access', status: 'failed', error: 'Table not accessible' });
    }

  } catch (error) {
    detailedHealth.database.status = 'disconnected';
    detailedHealth.status = 'unhealthy';
    checks.push({ 
      name: 'database_connection', 
      status: 'failed', 
      error: error instanceof Error ? error.message : 'Unknown database error'
    });
  }

  // Auth service check
  try {
    const authStartTime = Date.now();
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length > 10) {
      detailedHealth.services.auth = {
        status: 'operational',
        last_check: new Date().toISOString()
      };
      checks.push({ name: 'auth_service', status: 'passed', duration_ms: Date.now() - authStartTime });
    } else {
      detailedHealth.services.auth = {
        status: 'failed',
        last_check: new Date().toISOString()
      };
      detailedHealth.status = 'degraded';
      checks.push({ name: 'auth_service', status: 'failed', error: 'JWT_SECRET not configured' });
    }
  } catch (error) {
    detailedHealth.services.auth = {
      status: 'failed',
      last_check: new Date().toISOString()
    };
    checks.push({ name: 'auth_service', status: 'failed', error: 'Auth check failed' });
  }

  // Email service check
  const emailProvider = process.env.SENDGRID_API_KEY ? 'sendgrid' : 
                       process.env.MAILGUN_API_KEY ? 'mailgun' : 'none';
  detailedHealth.services.email = {
    status: emailProvider !== 'none' ? 'configured' : 'not_configured',
    provider: emailProvider
  };

  // Version information
  try {
    const packageJson = require('../../../../../package.json');
    detailedHealth.dependencies.next = packageJson.dependencies.next || 'unknown';
    detailedHealth.dependencies.prisma = packageJson.dependencies['@prisma/client'] || 'unknown';
    detailedHealth.dependencies.jwt = packageJson.dependencies.jsonwebtoken || 'unknown';
  } catch (e) {
    // Package.json not accessible
  }

  detailedHealth.checks_performed = checks;
  
  const totalTime = Date.now() - startTime;
  
  // Overall health determination
  const failedChecks = checks.filter(c => c.status === 'failed').length;
  if (failedChecks > 0) {
    detailedHealth.status = failedChecks > 1 ? 'unhealthy' : 'degraded';
  }

  const statusCode = detailedHealth.status === 'healthy' ? 200 : 
                     detailedHealth.status === 'degraded' ? 200 : 503;

  await prisma.$disconnect();

  return NextResponse.json(detailedHealth, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}