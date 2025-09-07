import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { PrismaClient, AlertType, Priority, AlertStatus, UserRole, SubscriptionTier, SupportTicketStatus, SupportTicketPriority } from '../generated/prisma';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import bcrypt from 'bcryptjs';

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

// =======================
// USER MANAGEMENT ROUTES
// =======================

// GET /api/admin/users - Get all users with filtering
router.get('/users', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      role,
      subscriptionTier,
      isActive,
      search
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    // Build where clause
    const where: any = {};
    if (role) where.role = role;
    if (subscriptionTier) where.subscriptionTier = subscriptionTier;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          subscriptionTier: true,
          isActive: true,
          company: true,
          location: true,
          createdAt: true,
          lastLogin: true,
          stripeCustomerId: true,
          subscriptionStatus: true,
          _count: {
            select: {
              userAlerts: true,
              supportTickets: true
            }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
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

// GET /api/admin/users/:id - Get user details
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: id as string },
      include: {
        alertPreferences: true,
        _count: {
          select: {
            userAlerts: true,
            supportTickets: true,
            savedProperties: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with this ID does not exist'
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);

  } catch (error) {
    logger.error('Admin user details error:', error);
    return next(error);
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      role,
      subscriptionTier,
      isActive,
      company,
      location
    } = req.body;

    // Validate role and subscription tier
    if (role && !Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be one of: ' + Object.values(UserRole).join(', ')
      });
    }

    if (subscriptionTier && !Object.values(SubscriptionTier).includes(subscriptionTier)) {
      return res.status(400).json({
        error: 'Invalid subscription tier',
        message: 'Subscription tier must be one of: ' + Object.values(SubscriptionTier).join(', ')
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: id as string },
      data: {
        firstName,
        lastName,
        email,
        role,
        subscriptionTier,
        isActive,
        company,
        location
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        subscriptionTier: true,
        isActive: true,
        company: true,
        location: true,
        updatedAt: true
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: req.user!.id,
        action: 'update_user',
        targetType: 'user',
        targetId: id || null,
        description: `Updated user ${updatedUser.email}`,
        metadata: req.body
      }
    });

    res.json(updatedUser);

  } catch (error) {
    logger.error('Admin user update error:', error);
    return next(error);
  }
});

// POST /api/admin/users - Create new user
router.post('/users', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role = UserRole.USER,
      subscriptionTier = SubscriptionTier.FREE,
      company,
      location
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'firstName, lastName, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        subscriptionTier,
        company,
        location
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        subscriptionTier: true,
        isActive: true,
        company: true,
        location: true,
        createdAt: true
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: req.user!.id,
        action: 'create_user',
        targetType: 'user',
        targetId: newUser.id,
        description: `Created new user ${newUser.email}`,
        metadata: { role, subscriptionTier }
      }
    });

    res.status(201).json(newUser);

  } catch (error) {
    logger.error('Admin user creation error:', error);
    return next(error);
  }
});

// =======================
// SUPPORT TICKET ROUTES
// =======================

// GET /api/admin/support/tickets - Get all support tickets
router.get('/support/tickets', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      priority,
      assignedToId,
      category
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (category) where.category = category;

    const [tickets, totalCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              subscriptionTier: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: { messages: true }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.supportTicket.count({ where })
    ]);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit as string))
      }
    });

  } catch (error) {
    logger.error('Admin support tickets error:', error);
    return next(error);
  }
});

// PUT /api/admin/support/tickets/:id - Update support ticket
router.put('/support/tickets/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      assignedToId,
      resolution
    } = req.body;

    const updateData: any = {
      status,
      priority,
      assignedToId
    };

    // If resolving ticket
    if (status === SupportTicketStatus.RESOLVED && resolution) {
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user!.id;
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: id as string },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        assignedTo: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: req.user!.id,
        action: 'update_support_ticket',
        targetType: 'ticket',
        targetId: id || null,
        description: `Updated support ticket #${id}`,
        metadata: req.body
      }
    });

    res.json(updatedTicket);

  } catch (error) {
    logger.error('Admin support ticket update error:', error);
    return next(error);
  }
});

// =======================
// ANALYTICS ROUTES
// =======================

// GET /api/admin/analytics/dashboard - Get dashboard analytics
router.get('/analytics/dashboard', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
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
      totalTickets,
      openTickets,
      avgResolutionTime,
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
      
      // Support metrics
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ 
        where: { status: SupportTicketStatus.OPEN }
      }),
      
      // Calculate average resolution time - simplified for now
      Promise.resolve(24), // 24 hours average
      
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
        totalTickets,
        openTickets,
        avgResolutionHours: avgResolutionTime || 0,
        responseRate: totalTickets > 0 ? (((totalTickets - openTickets) / totalTickets) * 100).toFixed(1) : 0
      },
      subscriptions: subscriptionBreakdown.map(item => ({
        tier: item.subscriptionTier,
        count: item._count.subscriptionTier
      })),
      userGrowth: userGrowthData
    };

    res.json(analytics);

  } catch (error) {
    logger.error('Admin analytics error:', error);
    return next(error);
  }
});

// =======================
// SYSTEM SETTINGS ROUTES
// =======================

// GET /api/admin/settings - Get all system settings
router.get('/settings', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    // Group by category
    const groupedSettings = settings.reduce((acc, setting) => {
      const category = setting.category || 'general';
      if (!acc[category]) acc[category] = [];
      acc[category].push(setting);
      return acc;
    }, {} as Record<string, typeof settings>);

    res.json(groupedSettings);

  } catch (error) {
    logger.error('Admin settings error:', error);
    return next(error);
  }
});

// PUT /api/admin/settings/:id - Update system setting
router.put('/settings/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { value } = req.body;

    const updatedSetting = await prisma.systemSetting.update({
      where: { id: id as string },
      data: { value }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: req.user!.id,
        action: 'update_system_setting',
        targetType: 'setting',
        targetId: id || null,
        description: `Updated system setting ${updatedSetting.key} to ${value}`,
        metadata: { key: updatedSetting.key, value }
      }
    });

    res.json(updatedSetting);

  } catch (error) {
    logger.error('Admin setting update error:', error);
    return next(error);
  }
});

export default router;