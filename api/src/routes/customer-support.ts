import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin, optionalAuthentication } from '../middleware/auth';
import { customerSupportSystem } from '../services/admin/CustomerSupportSystem';
import { createLogger } from '../utils/logger';
import rateLimit from 'express-rate-limit';

const router = Router();
const logger = createLogger();

// Rate limiting for support endpoints
const supportRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many support requests',
    message: 'Please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const publicSupportRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 ticket creations per hour from unauthenticated users
  message: {
    error: 'Too many support requests',
    message: 'Please wait before submitting another ticket'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.use(supportRateLimit);

/**
 * POST /api/customer-support/tickets
 * Create a new support ticket (public endpoint with optional authentication)
 */
router.post('/tickets', publicSupportRateLimit, optionalAuthentication, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      priority = 'MEDIUM',
      customerEmail,
      source = 'api',
      metadata
    } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    if (!customerEmail && !req.user) {
      return res.status(400).json({
        success: false,
        message: 'Customer email is required for unauthenticated requests'
      });
    }

    const ticketData = {
      title,
      description,
      category,
      priority,
      customerId: req.user?.id,
      customerEmail: customerEmail || req.user?.email,
      source,
      metadata
    };

    const ticket = await customerSupportSystem.createTicket(ticketData, req.user?.id);

    logger.info(`Support ticket created: ${ticket.id} for ${customerEmail || req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber || ticket.id.slice(-8),
        status: ticket.status,
        priority: ticket.priority,
        estimatedResponse: ticket.slaDeadline,
        supportEmail: 'support@agentradar.com'
      }
    });

  } catch (error) {
    logger.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/customer-support/tickets
 * Get support tickets (admin only or user's own tickets)
 */
router.get('/tickets', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      status,
      priority,
      category,
      assignedToId,
      customerId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo
    } = req.query;

    // Non-admin users can only see their own tickets
    const isAdmin = req.user?.role === 'ADMIN';
    const effectiveCustomerId = isAdmin ? (customerId as string) : req.user?.id;

    const filter: any = {};

    if (status) {
      filter.status = Array.isArray(status) ? status : [status];
    }

    if (priority) {
      filter.priority = Array.isArray(priority) ? priority : [priority];
    }

    if (category) {
      filter.category = Array.isArray(category) ? category : [category];
    }

    if (assignedToId && isAdmin) {
      filter.assignedToId = assignedToId as string;
    }

    if (effectiveCustomerId) {
      filter.customerId = effectiveCustomerId;
    }

    if (search) {
      filter.search = search as string;
    }

    if (dateFrom && dateTo) {
      filter.dateRange = {
        from: new Date(dateFrom as string),
        to: new Date(dateTo as string)
      };
    }

    const result = await customerSupportSystem.getTickets(
      filter,
      parseInt(page as string),
      parseInt(limit as string),
      sortBy as string,
      sortOrder as 'asc' | 'desc'
    );

    res.json({
      success: true,
      data: {
        tickets: result.tickets,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: result.pages
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/customer-support/tickets/:ticketId
 * Get ticket details
 */
router.get('/tickets/:ticketId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    const ticket = await customerSupportSystem.getTicketDetails(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check permissions - users can only see their own tickets unless admin
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isAdmin && ticket.customerId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    logger.error(`Error fetching ticket details ${req.params.ticketId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/customer-support/tickets/:ticketId
 * Update ticket (admin only)
 */
router.put('/tickets/:ticketId', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const updateData = req.body;
    const adminUserId = req.user?.id;

    const updatedTicket = await customerSupportSystem.updateTicket(
      ticketId,
      updateData,
      adminUserId!
    );

    logger.info(`Ticket ${ticketId} updated by admin ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: updatedTicket
    });

  } catch (error) {
    logger.error(`Error updating ticket ${req.params.ticketId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/customer-support/tickets/:ticketId/responses
 * Add response to ticket
 */
router.post('/tickets/:ticketId/responses', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { content, isInternal = false, attachments = [] } = req.body;
    const authorId = req.user?.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Response content is required'
      });
    }

    // Check if user can respond to this ticket
    const ticket = await customerSupportSystem.getTicketDetails(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const isAdmin = req.user?.role === 'ADMIN';
    if (!isAdmin && ticket.customerId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only admins can add internal responses
    if (isInternal && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can add internal responses'
      });
    }

    const response = await customerSupportSystem.addTicketResponse(
      ticketId,
      content,
      authorId!,
      isInternal,
      attachments
    );

    logger.info(`Response added to ticket ${ticketId} by user ${req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'Response added successfully',
      data: response
    });

  } catch (error) {
    logger.error(`Error adding response to ticket ${req.params.ticketId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/customer-support/tickets/:ticketId/escalate
 * Escalate ticket (admin only)
 */
router.post('/tickets/:ticketId/escalate', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { reason } = req.body;
    const escalatedBy = req.user?.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Escalation reason is required'
      });
    }

    const escalatedTicket = await customerSupportSystem.escalateTicket(
      ticketId,
      escalatedBy!,
      reason
    );

    logger.warn(`Ticket ${ticketId} escalated by admin ${req.user?.email}: ${reason}`);

    res.json({
      success: true,
      message: 'Ticket escalated successfully',
      data: escalatedTicket
    });

  } catch (error) {
    logger.error(`Error escalating ticket ${req.params.ticketId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to escalate ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/customer-support/dashboard
 * Get support dashboard metrics (admin only)
 */
router.get('/dashboard', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;

    let dateRange;
    if (dateFrom && dateTo) {
      dateRange = {
        from: new Date(dateFrom as string),
        to: new Date(dateTo as string)
      };
    }

    const metrics = await customerSupportSystem.getDashboardMetrics(dateRange);

    res.json({
      success: true,
      data: metrics,
      dateRange,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching support dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/customer-support/agents/performance
 * Get agent performance metrics (admin only)
 */
router.get('/agents/performance', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;

    let dateRange;
    if (dateFrom && dateTo) {
      dateRange = {
        from: new Date(dateFrom as string),
        to: new Date(dateTo as string)
      };
    }

    const performance = await customerSupportSystem.getAgentPerformance(dateRange);

    res.json({
      success: true,
      data: performance,
      dateRange,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching agent performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/customer-support/knowledge-base
 * Get knowledge base articles (public endpoint)
 */
router.get('/knowledge-base', async (req: Request, res: Response) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const result = await customerSupportSystem.getKnowledgeBase(
      category as string,
      search as string,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: {
        articles: result.articles,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching knowledge base:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch knowledge base',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/customer-support/canned-responses
 * Get canned responses (admin only)
 */
router.get('/canned-responses', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const responses = await customerSupportSystem.getCannedResponses(category as string);

    res.json({
      success: true,
      data: responses
    });

  } catch (error) {
    logger.error('Error fetching canned responses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch canned responses',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/customer-support/categories
 * Get available ticket categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = [
      {
        id: 'billing',
        name: 'Billing & Payments',
        description: 'Subscription, payment, and billing issues'
      },
      {
        id: 'technical',
        name: 'Technical Support',
        description: 'Platform issues, bugs, and technical problems'
      },
      {
        id: 'sales',
        name: 'Sales & Pricing',
        description: 'Questions about plans, pricing, and sales'
      },
      {
        id: 'feature_request',
        name: 'Feature Request',
        description: 'Suggestions for new features or improvements'
      },
      {
        id: 'bug_report',
        name: 'Bug Report',
        description: 'Report software bugs or errors'
      },
      {
        id: 'account',
        name: 'Account Management',
        description: 'Account settings, profile, and access issues'
      },
      {
        id: 'data_quality',
        name: 'Data Quality',
        description: 'Issues with data accuracy or completeness'
      },
      {
        id: 'integration',
        name: 'Integrations',
        description: 'API, webhook, and third-party integration support'
      }
    ];

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    logger.error('Error fetching ticket categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/customer-support/priorities
 * Get available ticket priorities
 */
router.get('/priorities', async (req: Request, res: Response) => {
  try {
    const priorities = [
      {
        id: 'LOW',
        name: 'Low',
        description: 'General questions, minor issues',
        sla: '72 hours',
        color: '#52c41a'
      },
      {
        id: 'MEDIUM',
        name: 'Medium',
        description: 'Standard issues affecting usage',
        sla: '24 hours',
        color: '#faad14'
      },
      {
        id: 'HIGH',
        name: 'High',
        description: 'Important issues blocking key features',
        sla: '8 hours',
        color: '#fa8c16'
      },
      {
        id: 'CRITICAL',
        name: 'Critical',
        description: 'System down, data loss, security issues',
        sla: '2 hours',
        color: '#ff4d4f'
      }
    ];

    res.json({
      success: true,
      data: priorities
    });

  } catch (error) {
    logger.error('Error fetching ticket priorities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch priorities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/customer-support/health
 * Support system health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check if we can create a simple query
    const ticketCount = await customerSupportSystem.getTickets({}, 1, 1);
    
    res.json({
      success: true,
      service: 'customer-support',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: {
        totalTickets: ticketCount.total,
        systemUptime: process.uptime()
      }
    });

  } catch (error) {
    logger.error('Customer support health check failed:', error);
    res.status(503).json({
      success: false,
      service: 'customer-support',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;