import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { AlertType, Priority, AlertStatus } from '@prisma/client';
import { authenticateToken, optionalAuthentication } from '../middleware/auth';
import { prisma } from '../lib/database';

const router = Router();
const logger = createLogger();

// GET /api/alerts
router.get('/', optionalAuthentication, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      priority,
      city,
      status = AlertStatus.ACTIVE
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {
      status: status as AlertStatus
    };

    if (type && Object.values(AlertType).includes(type as AlertType)) {
      where.alertType = type as AlertType;
    }
    if (priority && Object.values(Priority).includes(priority as Priority)) {
      where.priority = priority as Priority;
    }
    if (city) {
      where.city = { contains: city as string, mode: 'insensitive' };
    }

    // Get alerts with pagination
    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.alert.count({ where })
    ]);

    logger.info(`Retrieved ${alerts.length} alerts (page ${pageNum})`);
    
    res.json({
      alerts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    return next(error);
  }
});

// GET /api/alerts/stats  
router.get('/stats', async (req, res, next) => {
  try {
    const [
      total,
      active,
      highPriority,
      recent
    ] = await Promise.all([
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
      })
    ]);

    res.json({
      total,
      active,
      highPriority,
      recentCount: recent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching alert stats:', error);
    return next(error);
  }
});

// GET /api/alerts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const alert = await prisma.alert.findUnique({
      where: { id }
    });

    if (!alert) {
      return res.status(404).json({
        error: 'Alert not found',
        message: 'Alert with this ID does not exist'
      });
    }

    res.json(alert);
  } catch (error) {
    logger.error('Error fetching alert:', error);
    return next(error);
  }
});

export default router;