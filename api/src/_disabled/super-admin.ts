import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { superAdminDashboard } from '../services/admin/SuperAdminDashboard';
import { createLogger } from '../utils/logger';
import rateLimit from 'express-rate-limit';

const router = Router();
const logger = createLogger();

// Rate limiting for admin dashboard
const adminRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute for admin users
  message: {
    error: 'Too many admin requests',
    message: 'Please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply authentication and admin requirement to all routes
router.use(authenticateToken);
router.use(requireAdmin);
router.use(adminRateLimit);

/**
 * GET /api/super-admin/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [
      businessHealth,
      operationalMetrics,
      supportMetrics,
      alerts,
      quickActions
    ] = await Promise.all([
      superAdminDashboard.getBusinessHealthMetrics(),
      superAdminDashboard.getOperationalMetrics(),
      superAdminDashboard.getSupportMetrics(),
      superAdminDashboard.getActiveAlerts(),
      superAdminDashboard.getQuickActions()
    ]);

    logger.info(`Super admin dashboard accessed by user ${req.user?.id}`);

    res.json({
      success: true,
      data: {
        businessHealth,
        operational: operationalMetrics,
        support: supportMetrics,
        alerts,
        quickActions,
        timestamp: new Date().toISOString(),
        generatedBy: req.user?.email
      }
    });

  } catch (error) {
    logger.error('Error fetching super admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/super-admin/business-health
 * Get detailed business health metrics
 */
router.get('/business-health', async (req: Request, res: Response) => {
  try {
    const metrics = await superAdminDashboard.getBusinessHealthMetrics();

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching business health metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business health metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/super-admin/operational-metrics
 * Get real-time operational metrics
 */
router.get('/operational-metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await superAdminDashboard.getOperationalMetrics();

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
      cacheInfo: {
        ttl: 30, // 30 second cache
        nextRefresh: new Date(Date.now() + 30000).toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching operational metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch operational metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/super-admin/support-metrics
 * Get support system metrics
 */
router.get('/support-metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await superAdminDashboard.getSupportMetrics();

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching support metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/super-admin/alerts
 * Get active system alerts
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const alerts = await superAdminDashboard.getActiveAlerts();

    res.json({
      success: true,
      data: {
        alerts,
        totalCount: alerts.length,
        severityCounts: {
          critical: alerts.filter(a => a.severity === 1).length,
          high: alerts.filter(a => a.severity === 2).length,
          medium: alerts.filter(a => a.severity === 3).length,
          low: alerts.filter(a => a.severity === 4).length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/super-admin/quick-actions
 * Get available quick actions
 */
router.get('/quick-actions', async (req: Request, res: Response) => {
  try {
    const actions = await superAdminDashboard.getQuickActions();

    res.json({
      success: true,
      data: {
        actions,
        categories: {
          emergency: actions.filter(a => a.category === 'emergency'),
          business: actions.filter(a => a.category === 'business')
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching quick actions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick actions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/super-admin/quick-action/:actionId
 * Execute a quick action
 */
router.post('/quick-action/:actionId', async (req: Request, res: Response) => {
  try {
    const { actionId } = req.params;
    const { parameters, confirmation } = req.body;
    const adminUserId = req.user?.id;

    if (!actionId) {
      return res.status(400).json({
        success: false,
        message: 'Action ID is required'
      });
    }

    // Get available actions to validate
    const availableActions = await superAdminDashboard.getQuickActions();
    const action = availableActions.find(a => a.id === actionId);

    if (!action) {
      return res.status(404).json({
        success: false,
        message: 'Action not found'
      });
    }

    if (!action.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Action is currently disabled'
      });
    }

    if (action.confirmationRequired && !confirmation) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required for this action',
        confirmationRequired: true,
        actionDetails: {
          title: action.title,
          description: action.description,
          category: action.category
        }
      });
    }

    logger.warn(`Executing quick action: ${actionId} by admin: ${req.user?.email}`);

    const result = await superAdminDashboard.executeQuickAction(
      actionId,
      parameters,
      adminUserId
    );

    if (result.success) {
      logger.info(`Quick action ${actionId} executed successfully by ${req.user?.email}`);
    } else {
      logger.error(`Quick action ${actionId} failed for ${req.user?.email}: ${result.message}`);
    }

    res.json({
      success: result.success,
      message: result.message,
      details: result.details,
      executedAt: new Date().toISOString(),
      executedBy: req.user?.email
    });

  } catch (error) {
    logger.error(`Error executing quick action ${req.params.actionId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute action',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/super-admin/system-status
 * Get overall system status
 */
router.get('/system-status', async (req: Request, res: Response) => {
  try {
    const [operational, alerts] = await Promise.all([
      superAdminDashboard.getOperationalMetrics(),
      superAdminDashboard.getActiveAlerts()
    ]);

    const criticalAlerts = alerts.filter(a => a.severity === 1 || a.severity === 2);
    
    // Determine overall system status
    let status: 'operational' | 'degraded' | 'outage' = 'operational';
    let statusMessage = 'All systems operational';

    if (criticalAlerts.length > 0) {
      const hasSeverity1 = criticalAlerts.some(a => a.severity === 1);
      status = hasSeverity1 ? 'outage' : 'degraded';
      statusMessage = hasSeverity1 
        ? 'System experiencing critical issues'
        : 'System experiencing performance degradation';
    }

    // Check key operational metrics
    const healthChecks = {
      api: operational.errorRates.api < 1.0, // Less than 1% error rate
      database: operational.responseTimes.database < 100, // Less than 100ms
      ai_processing: operational.aiCosts.utilization < 95, // Less than 95% budget
      server_load: operational.serverLoad.cpu < 90 // Less than 90% CPU
    };

    const healthyServices = Object.values(healthChecks).filter(Boolean).length;
    const totalServices = Object.keys(healthChecks).length;
    const healthPercentage = (healthyServices / totalServices) * 100;

    if (healthPercentage < 75) {
      status = 'degraded';
      statusMessage = 'Some services experiencing issues';
    }

    res.json({
      success: true,
      data: {
        status,
        statusMessage,
        healthPercentage: Math.round(healthPercentage),
        uptime: process.uptime(),
        alerts: {
          total: alerts.length,
          critical: criticalAlerts.length,
          recent: alerts.slice(0, 5)
        },
        services: healthChecks,
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching system status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/super-admin/alert/:alertId/resolve
 * Mark an alert as resolved
 */
router.post('/alert/:alertId/resolve', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { resolution, notes } = req.body;

    // This would update the alert in your monitoring system
    // For now, we'll just log the action
    logger.info(`Alert ${alertId} resolved by ${req.user?.email}`, {
      resolution,
      notes,
      resolvedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Alert marked as resolved',
      alertId,
      resolvedBy: req.user?.email,
      resolvedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Error resolving alert ${req.params.alertId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/super-admin/health
 * Admin dashboard health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      service: 'super-admin-dashboard',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime()
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'super-admin-dashboard',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;