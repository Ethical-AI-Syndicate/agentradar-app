import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { PrismaClient, AlertType, Priority, AlertStatus } from '../generated/prisma';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const logger = createLogger();
const prisma = new PrismaClient();

// POST /api/admin/alerts/batch - Batch create alerts from MCP scraping
router.post('/alerts/batch', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { alerts } = req.body;
    
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Alerts array is required and must not be empty'
      });
    }

    logger.info(`Batch creating ${alerts.length} alerts from MCP system`);
    
    const createdAlerts = [];
    const errors = [];
    
    for (const alertData of alerts) {
      try {
        // Validate required fields
        if (!alertData.title || !alertData.alertType) {
          errors.push({
            alert: alertData,
            error: 'Missing required fields: title, alertType'
          });
          continue;
        }
        
        // Create alert in database
        const alert = await prisma.alert.create({
          data: {
            alertType: alertData.alertType as AlertType,
            priority: (alertData.priority as Priority) || Priority.MEDIUM,
            title: alertData.title,
            description: alertData.description || '',
            
            // Location
            address: alertData.address || '',
            city: alertData.city || 'Toronto',
            province: alertData.province || 'ON',
            postalCode: alertData.postalCode,
            latitude: alertData.coordinates?.lat || null,
            longitude: alertData.coordinates?.lng || null,
            
            // Financial
            estimatedValue: alertData.estimatedValue || alertData.price,
            
            // Metadata
            source: (alertData.source || 'MCP_SCRAPER') as any,
            
            // Dates
            discoveredAt: new Date(),
            courtDate: alertData.eventDate ? new Date(alertData.eventDate) : null,
            
            // Status
            status: AlertStatus.ACTIVE,
            
            // Additional fields that might be in schema
            courtFileNumber: alertData.externalId || null
          }
        });
        
        createdAlerts.push(alert);
        
      } catch (alertError) {
        logger.error('Error creating individual alert:', alertError);
        errors.push({
          alert: alertData,
          error: alertError instanceof Error ? alertError.message : 'Unknown error'
        });
      }
    }
    
    logger.info(`Successfully created ${createdAlerts.length} alerts, ${errors.length} errors`);
    
    res.status(201).json({
      success: true,
      created: createdAlerts.length,
      errors: errors.length,
      alerts: createdAlerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        alertType: alert.alertType,
        priority: alert.priority
      })),
      errorDetails: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    logger.error('Batch alert creation error:', error);
    return next(error);
  }
});

// GET /api/admin/system/status - Get system health and metrics
router.get('/system/status', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
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
    
    res.json(systemStatus);
    
  } catch (error) {
    logger.error('System status error:', error);
    return next(error);
  }
});

// DELETE /api/admin/alerts/cleanup - Clean up expired alerts
router.delete('/alerts/cleanup', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { daysOld = 30, status = 'EXPIRED' } = req.query;
    
    const cutoffDate = new Date(Date.now() - (parseInt(daysOld as string) * 24 * 60 * 60 * 1000));
    
    const deletedAlerts = await prisma.alert.deleteMany({
      where: {
        OR: [
          { status: status as AlertStatus },
          { createdAt: { lt: cutoffDate } }
        ]
      }
    });
    
    logger.info(`Cleaned up ${deletedAlerts.count} expired alerts`);
    
    res.json({
      success: true,
      deletedCount: deletedAlerts.count,
      cutoffDate: cutoffDate.toISOString()
    });
    
  } catch (error) {
    logger.error('Alert cleanup error:', error);
    return next(error);
  }
});

export default router;