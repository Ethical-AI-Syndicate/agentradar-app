import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { AlertType, Priority, AlertStatus, UserRole, SubscriptionTier } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { prisma } from '../lib/database';

const router = Router();
const logger = createLogger();

// GET /system/status - Simple system status
router.get('/system/status', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const [totalAlerts, activeAlerts, userCount] = await Promise.all([
      prisma.alert.count(),
      prisma.alert.count({ where: { status: AlertStatus.ACTIVE } }),
      prisma.user.count({ where: { isActive: true } })
    ]);
    
    res.json({
      timestamp: new Date().toISOString(),
      database: { connected: true },
      alerts: { total: totalAlerts, active: activeAlerts },
      users: { active: userCount },
      api: { uptime: process.uptime() }
    });
  } catch (error) {
    logger.error('System status error:', error);
    return next(error);
  }
});

// GET /users - Simple user listing
router.get('/users', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          subscriptionTier: true,
          isActive: true,
          createdAt: true
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Admin users list error:', error);
    return next(error);
  }
});

export default router;