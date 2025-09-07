import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AlertStatus, Priority } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check admin role
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const [
      totalAlerts,
      activeAlerts,
      highPriorityAlerts,
      todayAlerts,
      userCount
    ] = await Promise.all([
      prisma.alert.count(),
      prisma.alert.count({ where: { status: AlertStatus.ACTIVE } }),
      prisma.alert.count({ where: { priority: Priority.HIGH, status: AlertStatus.ACTIVE } }),
      prisma.alert.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.user.count({ where: { isActive: true } })
    ]);
    
    const systemStatus = {
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        alerts: {
          total: totalAlerts,
          active: activeAlerts,
          highPriority: highPriorityAlerts,
          todayCreated: todayAlerts
        },
        users: {
          active: userCount
        }
      },
      api: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    };
    
    return NextResponse.json(systemStatus);

  } catch (error) {
    console.error('System status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}