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
    
    let decoded: { id: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
    } catch {
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

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      totalAlerts,
      activeAlerts,
      highPriorityAlerts,
      newAlertsToday,
      subscriptionBreakdown,
      userGrowthData
    ] = await Promise.all([
      // User metrics
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ 
        where: { 
          isActive: true,
          lastLogin: { gte: sevenDaysAgo }
        }
      }),
      prisma.user.count({ 
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      
      // Alert metrics
      prisma.alert.count(),
      prisma.alert.count({ where: { status: AlertStatus.ACTIVE } }),
      prisma.alert.count({ 
        where: { 
          priority: Priority.HIGH,
          status: AlertStatus.ACTIVE 
        }
      }),
      prisma.alert.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      
      // Subscription breakdown
      prisma.user.groupBy({
        by: ['subscriptionTier'],
        _count: { subscriptionTier: true },
        where: { isActive: true }
      }),
      
      // User growth data (last 30 days)
      prisma.user.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        where: { createdAt: { gte: thirtyDaysAgo } }
      }).then(data => {
        // Group by day for chart data
        const dailyData = new Map();
        data.forEach(item => {
          const day = item.createdAt.toISOString().split('T')[0];
          dailyData.set(day, (dailyData.get(day) || 0) + item._count.id);
        });
        return Array.from(dailyData.entries()).map(([date, count]) => ({
          date,
          users: count
        }));
      })
    ]);

    const analytics = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        growthRate: totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(1) : 0
      },
      alerts: {
        total: totalAlerts,
        active: activeAlerts,
        highPriority: highPriorityAlerts,
        newToday: newAlertsToday
      },
      support: {
        totalTickets: 0,
        openTickets: 0,
        avgResolutionHours: 0,
        responseRate: '0'
      },
      subscriptions: subscriptionBreakdown.map(item => ({
        tier: item.subscriptionTier,
        count: item._count.subscriptionTier
      })),
      userGrowth: userGrowthData
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}