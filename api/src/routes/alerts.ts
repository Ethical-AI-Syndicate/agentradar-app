import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { AlertType, Priority, AlertStatus } from '@prisma/client';
import { authenticateToken, optionalAuthentication } from '../middleware/auth';
import { AlertMatcher } from '../services/alertMatcher';
import { AlertRepository } from '../repositories/AlertRepository';

const router = Router();
const logger = createLogger();
const alertRepository = new AlertRepository();
const alertMatcher = new AlertMatcher();

// GET /api/alerts
router.get('/', optionalAuthentication, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      priority,
      city,
      status = AlertStatus.ACTIVE,
      search,
      minValue,
      maxValue
    } = req.query;

    const userId = req.user?.id;

    // Build filter
    const filter: any = {
      status: status as AlertStatus
    };

    if (type && Object.values(AlertType).includes(type as AlertType)) {
      filter.type = type as AlertType;
    }
    if (priority && Object.values(Priority).includes(priority as Priority)) {
      filter.priority = priority as Priority;
    }
    if (city) {
      filter.city = city as string;
    }
    if (search) {
      filter.search = search as string;
    }
    if (minValue) {
      filter.minValue = parseInt(minValue as string);
    }
    if (maxValue) {
      filter.maxValue = parseInt(maxValue as string);
    }
    if (userId) {
      filter.userId = userId;
    }

    const result = await alertRepository.findMany(
      filter,
      parseInt(page as string),
      parseInt(limit as string)
    );

    logger.info(`Retrieved ${result.data.length} alerts (page ${result.pagination.page})`);
    
    res.json({
      alerts: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    return next(error);
  }
});

// GET /api/alerts/stats  
router.get('/stats', async (req, res, next) => {
  try {
    const { userId, timeframe = '30d' } = req.query;
    
    // Calculate date range for timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Base query for time-filtered alerts
    const baseWhere = {
      createdAt: {
        gte: startDate
      },
      status: AlertStatus.ACTIVE
    };

    // Get basic alert statistics
    const [
      totalAlerts,
      alertsByType,
      alertsByPriority,
      alertsByCity
    ] = await Promise.all([
      // Total active alerts count
      prisma.alert.count({ where: baseWhere }),
      
      // Alerts by type
      prisma.alert.groupBy({
        by: ['alertType'],
        where: baseWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      
      // Alerts by priority
      prisma.alert.groupBy({
        by: ['priority'],
        where: baseWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      
      // Top cities with most alerts
      prisma.alert.groupBy({
        by: ['city'],
        where: baseWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      })
    ]);

    const stats = {
      summary: {
        totalAlerts,
        timeframe,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      },
      breakdown: {
        byType: alertsByType.map(item => ({
          type: item.alertType,
          count: item._count.id
        })),
        byPriority: alertsByPriority.map(item => ({
          priority: item.priority,
          count: item._count.id
        })),
        byCity: alertsByCity.map(item => ({
          city: item.city,
          count: item._count.id
        }))
      }
    };

    logger.info(`Generated alert statistics for timeframe: ${timeframe}`);
    
    res.json(stats);
  } catch (error) {
    logger.error('Error generating alert statistics:', error);
    return next(error);
  }
});

// GET /api/alerts/personalized - Get personalized alerts based on user preferences
router.get('/personalized', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not found in request'
      });
    }

    const { limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);

    const personalizedAlerts = await alertMatcher.getPersonalizedAlerts(
      req.user.id,
      limitNum
    );

    // Check if user has preferences set up
    const hasPreferences = await prisma.alertPreference.findUnique({
      where: { userId: req.user.id }
    });

    logger.info(`Retrieved ${personalizedAlerts.length} personalized alerts for user ${req.user.email}`);
    
    res.json({
      alerts: personalizedAlerts,
      personalized: !!hasPreferences,
      count: personalizedAlerts.length,
      message: hasPreferences 
        ? 'Alerts personalized based on your preferences'
        : 'Showing general high-priority alerts. Set up your preferences for personalized results.',
      setupPreferencesUrl: hasPreferences ? null : '/api/preferences'
    });
    
  } catch (error) {
    logger.error('Error getting personalized alerts:', error);
    return next(error);
  }
});

// GET /api/alerts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }
    
    const alert = await prisma.alert.findUnique({
      where: { id: id }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    logger.info(`Retrieved alert ${id}`);
    res.json(alert);
  } catch (error) {
    logger.error(`Error fetching alert ${req.params.id}:`, error);
    return next(error);
  }
});

// POST /api/alerts/:id/bookmark
router.post('/:id/bookmark', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    // Check if alert exists
    const alert = await prisma.alert.findUnique({
      where: { id: id }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Upsert the user alert relationship
    const userAlert = await prisma.userAlert.upsert({
      where: {
        userId_alertId: {
          userId: req.user.id,
          alertId: id
        }
      },
      update: {
        isBookmarked: true
      },
      create: {
        userId: req.user.id,
        alertId: id,
        isBookmarked: true,
        isViewed: false
      }
    });

    logger.info(`Alert ${id} bookmarked by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Alert bookmarked successfully',
      userAlert
    });
  } catch (error) {
    logger.error(`Error bookmarking alert ${req.params.id}:`, error);
    return next(error);
  }
});

// DELETE /api/alerts/:id/bookmark
router.delete('/:id/bookmark', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    // Update the user alert relationship to remove bookmark
    try {
      const userAlert = await prisma.userAlert.update({
        where: {
          userId_alertId: {
            userId: req.user.id,
            alertId: id
          }
        },
        data: {
          isBookmarked: false
        }
      });

      logger.info(`Alert ${id} unbookmarked by user ${req.user.email}`);
      
      res.json({
        success: true,
        message: 'Alert unbookmarked successfully'
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Bookmark not found' });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error unbookmarking alert ${req.params.id}:`, error);
    return next(error);
  }
});

// PUT /api/alerts/:id/viewed
router.put('/:id/viewed', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if alert exists
    const alert = await prisma.alert.findUnique({
      where: { id: id }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Upsert the user alert relationship to mark as viewed
    const userAlert = await prisma.userAlert.upsert({
      where: {
        userId_alertId: {
          userId: userId,
          alertId: id
        }
      },
      update: {
        isViewed: true,
        viewedAt: new Date()
      },
      create: {
        userId: userId,
        alertId: id,
        isBookmarked: false,
        isViewed: true,
        viewedAt: new Date()
      }
    });

    logger.info(`Alert ${id} marked as viewed by user ${userId}`);
    
    res.json({
      success: true,
      message: 'Alert marked as viewed successfully',
      userAlert
    });
  } catch (error) {
    logger.error(`Error marking alert ${req.params.id} as viewed:`, error);
    return next(error);
  }
});

export default router;