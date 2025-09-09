import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { businessOperations } from '../services/admin/BusinessOperations';
import { createLogger } from '../utils/logger';
import { UserRole, SubscriptionTier } from '@prisma/client';
import rateLimit from 'express-rate-limit';

const router = Router();
const logger = createLogger();

// Rate limiting for business operations
const businessOpsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute for admin users
  message: {
    error: 'Too many business operations requests',
    message: 'Please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply authentication and admin requirement to all routes
router.use(authenticateToken);
router.use(requireAdmin);
router.use(businessOpsRateLimit);

// =============================================================================
// BUSINESS DASHBOARD & METRICS
// =============================================================================

/**
 * GET /api/business-operations/dashboard
 * Get comprehensive business metrics dashboard
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const metrics = await businessOperations.getBusinessMetrics();

    logger.info(`Business operations dashboard accessed by user ${req.user?.id}`);

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
      generatedBy: req.user?.email
    });

  } catch (error) {
    logger.error('Error fetching business operations dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// USER MANAGEMENT
// =============================================================================

/**
 * GET /api/business-operations/users
 * Get all users with filtering and pagination
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { 
      role, 
      subscriptionTier, 
      isActive, 
      search, 
      limit = 50, 
      offset = 0 
    } = req.query;

    const filters: any = {};
    
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      filters.role = role as UserRole;
    }
    
    if (subscriptionTier && Object.values(SubscriptionTier).includes(subscriptionTier as SubscriptionTier)) {
      filters.subscriptionTier = subscriptionTier as SubscriptionTier;
    }
    
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    
    if (search) {
      filters.search = search as string;
    }
    
    filters.limit = parseInt(limit as string);
    filters.offset = parseInt(offset as string);

    const result = await businessOperations.getUsers(filters);

    res.json({
      success: true,
      data: result.users,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: result.total > filters.offset + filters.limit
      }
    });

  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/business-operations/users
 * Create a new user
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    const userData = req.body;

    // Validate required fields
    if (!userData.name || !userData.email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    const user = await businessOperations.createUser(userData);

    logger.info(`User created: ${user.email} by admin ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });

  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/business-operations/users/:id
 * Update an existing user
 */
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { id, ...req.body };

    const user = await businessOperations.updateUser(updateData);

    logger.info(`User updated: ${user.email} by admin ${req.user?.email}`);

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });

  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/business-operations/users/:id
 * Deactivate a user (soft delete)
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await businessOperations.deleteUser(id);

    logger.info(`User deactivated: ${id} by admin ${req.user?.email}`);

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    logger.error('Error deactivating user:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to deactivate user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/business-operations/users/:id/subscription
 * Change user subscription tier
 */
router.put('/users/:id/subscription', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subscriptionTier } = req.body;

    if (!subscriptionTier || !Object.values(SubscriptionTier).includes(subscriptionTier)) {
      return res.status(400).json({
        success: false,
        message: 'Valid subscription tier is required'
      });
    }

    await businessOperations.changeUserSubscription(id, subscriptionTier, req.user!.id);

    logger.info(`User subscription changed: ${id} -> ${subscriptionTier} by admin ${req.user?.email}`);

    res.json({
      success: true,
      message: 'User subscription updated successfully'
    });

  } catch (error) {
    logger.error('Error changing user subscription:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to change user subscription',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// FINANCIAL OPERATIONS
// =============================================================================

/**
 * POST /api/business-operations/financial/operation
 * Process a financial operation (refund, charge, adjustment, etc.)
 */
router.post('/financial/operation', async (req: Request, res: Response) => {
  try {
    const operation = req.body;

    // Validate required fields
    if (!operation.type || !operation.userId || !operation.amount || !operation.currency || !operation.description) {
      return res.status(400).json({
        success: false,
        message: 'Type, userId, amount, currency, and description are required'
      });
    }

    const validTypes = ['subscription_change', 'refund', 'charge', 'credit', 'adjustment'];
    if (!validTypes.includes(operation.type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation type'
      });
    }

    const result = await businessOperations.processFinancialOperation(operation, req.user!.id);

    logger.info(`Financial operation processed: ${operation.type} for user ${operation.userId} by admin ${req.user?.email}`);

    res.json({
      success: true,
      data: result,
      message: 'Financial operation processed successfully'
    });

  } catch (error) {
    logger.error('Error processing financial operation:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to process financial operation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// TEAM MANAGEMENT
// =============================================================================

/**
 * GET /api/business-operations/teams
 * Get all teams with pagination
 */
router.get('/teams', async (req: Request, res: Response) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    if (search) {
      filters.search = search as string;
    }

    const result = await businessOperations.getTeams(filters);

    res.json({
      success: true,
      data: result.teams,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: result.total > filters.offset + filters.limit
      }
    });

  } catch (error) {
    logger.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/business-operations/teams
 * Create a new team
 */
router.post('/teams', async (req: Request, res: Response) => {
  try {
    const teamData = req.body;

    // Validate required fields
    if (!teamData.name || !teamData.permissions) {
      return res.status(400).json({
        success: false,
        message: 'Name and permissions are required'
      });
    }

    const team = await businessOperations.createTeam(teamData);

    logger.info(`Team created: ${team.name} by admin ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: team,
      message: 'Team created successfully'
    });

  } catch (error) {
    logger.error('Error creating team:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create team',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/business-operations/teams/:id
 * Update a team
 */
router.put('/teams/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { id, ...req.body };

    const team = await businessOperations.updateTeam(updateData);

    logger.info(`Team updated: ${team.name} by admin ${req.user?.email}`);

    res.json({
      success: true,
      data: team,
      message: 'Team updated successfully'
    });

  } catch (error) {
    logger.error('Error updating team:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update team',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/business-operations/teams/:id
 * Delete a team
 */
router.delete('/teams/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await businessOperations.deleteTeam(id);

    logger.info(`Team deleted: ${id} by admin ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting team:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to delete team',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/business-operations/teams/:teamId/members
 * Assign user to team
 */
router.post('/teams/:teamId/members', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { userId, role, permissions } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'UserId and role are required'
      });
    }

    const validRoles = ['ADMIN', 'MEMBER', 'VIEWER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const assignment = await businessOperations.assignUserToTeam({
      userId,
      teamId,
      role,
      permissions: permissions || []
    });

    logger.info(`User assigned to team: ${userId} -> ${teamId} as ${role} by admin ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'User assigned to team successfully'
    });

  } catch (error) {
    logger.error('Error assigning user to team:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to assign user to team',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/business-operations/teams/:teamId/members/:userId
 * Remove user from team
 */
router.delete('/teams/:teamId/members/:userId', async (req: Request, res: Response) => {
  try {
    const { teamId, userId } = req.params;

    await businessOperations.removeUserFromTeam(userId, teamId);

    logger.info(`User removed from team: ${userId} -> ${teamId} by admin ${req.user?.email}`);

    res.json({
      success: true,
      message: 'User removed from team successfully'
    });

  } catch (error) {
    logger.error('Error removing user from team:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to remove user from team',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/business-operations/health
 * Business operations system health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      service: 'business-operations',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'business-operations',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;