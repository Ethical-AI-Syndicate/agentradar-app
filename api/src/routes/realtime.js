/**
 * Real-Time WebSocket API Routes
 * Provides REST endpoints for triggering real-time notifications
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { getRealtimeService } from '../services/realtime/realtimeService.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * Get WebSocket server status and statistics
 * GET /api/realtime/status
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const realtimeService = getRealtimeService();
    
    if (!realtimeService) {
      return res.status(503).json({
        error: 'Real-time service not available'
      });
    }

    const stats = realtimeService.getStats();
    const healthCheck = await realtimeService.healthCheck();

    res.json({
      success: true,
      status: stats,
      health: healthCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get real-time status',
      details: error.message
    });
  }
});

/**
 * Send test alert to specific user
 * POST /api/realtime/test-alert
 */
router.post('/test-alert', 
  authenticate,
  requireAdmin,
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('type').optional().isIn(['test', 'system', 'property', 'market']).withMessage('Invalid alert type')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const realtimeService = getRealtimeService();
      
      if (!realtimeService) {
        return res.status(503).json({
          error: 'Real-time service not available'
        });
      }

      const { userId, message, type = 'test', metadata = {} } = req.body;

      await realtimeService.sendUserAlert(userId, {
        id: `test-${Date.now()}`,
        type,
        title: 'Test Alert',
        message,
        priority: 'medium',
        metadata: {
          ...metadata,
          sender: req.user.email,
          isTest: true
        }
      });

      res.json({
        success: true,
        message: 'Test alert sent successfully',
        target: userId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to send test alert',
        details: error.message
      });
    }
  }
);

/**
 * Broadcast system notification to all users
 * POST /api/realtime/broadcast
 */
router.post('/broadcast',
  authenticate,
  requireAdmin,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('severity').optional().isIn(['info', 'warning', 'error']).withMessage('Invalid severity level')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const realtimeService = getRealtimeService();
      
      if (!realtimeService) {
        return res.status(503).json({
          error: 'Real-time service not available'
        });
      }

      const { title, message, severity = 'info', targetUsers = 'all' } = req.body;

      await realtimeService.sendSystemNotification({
        type: 'admin_broadcast',
        title,
        message,
        severity,
        targetUsers,
        sender: req.user.email
      });

      res.json({
        success: true,
        message: 'System notification broadcast successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to broadcast notification',
        details: error.message
      });
    }
  }
);

/**
 * Trigger market update broadcast
 * POST /api/realtime/market-update
 */
router.post('/market-update',
  authenticate,
  requireAdmin,
  [
    body('region').notEmpty().withMessage('Region is required'),
    body('update.type').notEmpty().withMessage('Update type is required'),
    body('update.message').notEmpty().withMessage('Update message is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const realtimeService = getRealtimeService();
      
      if (!realtimeService) {
        return res.status(503).json({
          error: 'Real-time service not available'
        });
      }

      const { region, update } = req.body;

      await realtimeService.broadcastMarketUpdate(region, {
        ...update,
        sender: req.user.email,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Market update broadcast successfully',
        region,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to broadcast market update',
        details: error.message
      });
    }
  }
);

/**
 * Trigger property change notification
 * POST /api/realtime/property-change
 */
router.post('/property-change',
  authenticate,
  [
    body('propertyId').notEmpty().withMessage('Property ID is required'),
    body('changes.type').notEmpty().withMessage('Change type is required'),
    body('interestedUsers').optional().isArray().withMessage('Interested users must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const realtimeService = getRealtimeService();
      
      if (!realtimeService) {
        return res.status(503).json({
          error: 'Real-time service not available'
        });
      }

      const { propertyId, changes, interestedUsers = [] } = req.body;

      await realtimeService.notifyPropertyChange(propertyId, {
        ...changes,
        updatedBy: req.user.email,
        timestamp: new Date().toISOString()
      }, interestedUsers);

      res.json({
        success: true,
        message: 'Property change notification sent successfully',
        propertyId,
        notifiedUsers: interestedUsers.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to send property change notification',
        details: error.message
      });
    }
  }
);

/**
 * Get connected users (admin only)
 * GET /api/realtime/connected-users
 */
router.get('/connected-users', 
  authenticate, 
  requireAdmin, 
  async (req, res) => {
    try {
      const realtimeService = getRealtimeService();
      
      if (!realtimeService) {
        return res.status(503).json({
          error: 'Real-time service not available'
        });
      }

      const stats = realtimeService.getStats();
      
      res.json({
        success: true,
        connectedUsers: stats.websocket?.connected_users || 0,
        activeSockets: stats.websocket?.active_sockets || 0,
        redisStatus: stats.redis?.status || 'unknown',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to get connected users',
        details: error.message
      });
    }
  }
);

/**
 * Process new listing for real-time matching
 * POST /api/realtime/process-listing
 */
router.post('/process-listing',
  authenticate,
  [
    body('listing.id').notEmpty().withMessage('Listing ID is required'),
    body('listing.address').notEmpty().withMessage('Listing address is required'),
    body('listing.type').notEmpty().withMessage('Listing type is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const realtimeService = getRealtimeService();
      
      if (!realtimeService) {
        return res.status(503).json({
          error: 'Real-time service not available'
        });
      }

      const { listing } = req.body;

      await realtimeService.processNewListing({
        ...listing,
        processedBy: req.user.email,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Listing processed for real-time matching',
        listingId: listing.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to process listing',
        details: error.message
      });
    }
  }
);

export default router;