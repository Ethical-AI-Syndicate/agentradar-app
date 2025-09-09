/**
 * Cache Management API Routes
 * Admin endpoints for cache control and monitoring
 */

import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getCacheManager } from '../services/cache/cacheManager.js';
import { 
  getCacheHealthStatus, 
  invalidateUserCache, 
  invalidatePropertyCache, 
  invalidateMarketCache,
  warmUserCache,
  warmPopularData
} from '../middleware/cache.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * Get cache status and statistics
 * GET /api/cache/status
 */
router.get('/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const health = await getCacheHealthStatus();
    res.json({
      success: true,
      cache: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cache status',
      details: error.message
    });
  }
});

/**
 * Clear all cache
 * POST /api/cache/clear
 */
router.post('/clear', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cacheManager = getCacheManager();
    
    if (!cacheManager) {
      return res.status(503).json({
        error: 'Cache manager not available'
      });
    }

    const cleared = await cacheManager.clear();
    
    res.json({
      success: cleared,
      message: cleared ? 'All cache levels cleared successfully' : 'Failed to clear cache',
      clearedBy: req.user.email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear cache',
      details: error.message
    });
  }
});

/**
 * Get specific cached data
 * GET /api/cache/data/:pattern
 */
router.get('/data/:pattern', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cacheManager = getCacheManager();
    const { pattern } = req.params;
    const variables = req.query;

    if (!cacheManager) {
      return res.status(503).json({
        error: 'Cache manager not available'
      });
    }

    const data = await cacheManager.get(pattern, variables);
    
    res.json({
      success: true,
      pattern,
      variables,
      data,
      found: data !== null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cached data',
      details: error.message
    });
  }
});

/**
 * Invalidate user cache
 * DELETE /api/cache/user/:userId
 */
router.delete('/user/:userId', 
  authenticateToken, 
  requireAdmin, 
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      await invalidateUserCache(userId);
      
      res.json({
        success: true,
        message: `Cache invalidated for user ${userId}`,
        invalidatedBy: req.user.email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to invalidate user cache',
        details: error.message
      });
    }
  }
);

/**
 * Invalidate property cache
 * DELETE /api/cache/property/:propertyId
 */
router.delete('/property/:propertyId', 
  authenticateToken, 
  requireAdmin, 
  async (req, res) => {
    try {
      const { propertyId } = req.params;
      
      await invalidatePropertyCache(propertyId);
      
      res.json({
        success: true,
        message: `Cache invalidated for property ${propertyId}`,
        invalidatedBy: req.user.email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to invalidate property cache',
        details: error.message
      });
    }
  }
);

/**
 * Invalidate market cache
 * DELETE /api/cache/market/:region?
 */
router.delete('/market/:region?', 
  authenticateToken, 
  requireAdmin, 
  async (req, res) => {
    try {
      const { region } = req.params;
      
      await invalidateMarketCache(region);
      
      res.json({
        success: true,
        message: region 
          ? `Market cache invalidated for ${region}` 
          : 'All market cache invalidated',
        invalidatedBy: req.user.email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to invalidate market cache',
        details: error.message
      });
    }
  }
);

/**
 * Invalidate cache by pattern
 * DELETE /api/cache/pattern
 */
router.delete('/pattern',
  authenticateToken,
  requireAdmin,
  [
    body('pattern').notEmpty().withMessage('Pattern is required')
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

      const cacheManager = getCacheManager();
      const { pattern } = req.body;

      if (!cacheManager) {
        return res.status(503).json({
          error: 'Cache manager not available'
        });
      }

      const regex = new RegExp(pattern);
      const deletedCount = await cacheManager.deletePattern(regex);
      
      res.json({
        success: true,
        message: `Cache invalidated for pattern: ${pattern}`,
        deletedCount,
        invalidatedBy: req.user.email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to invalidate cache pattern',
        details: error.message
      });
    }
  }
);

/**
 * Warm user cache
 * POST /api/cache/warm/user/:userId
 */
router.post('/warm/user/:userId', 
  authenticateToken, 
  requireAdmin, 
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      await warmUserCache(userId);
      
      res.json({
        success: true,
        message: `Cache warmed for user ${userId}`,
        warmedBy: req.user.email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to warm user cache',
        details: error.message
      });
    }
  }
);

/**
 * Warm popular data cache
 * POST /api/cache/warm/popular
 */
router.post('/warm/popular', 
  authenticateToken, 
  requireAdmin, 
  async (req, res) => {
    try {
      await warmPopularData();
      
      res.json({
        success: true,
        message: 'Popular data cache warmed successfully',
        warmedBy: req.user.email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to warm popular cache',
        details: error.message
      });
    }
  }
);

/**
 * Set cache data manually
 * POST /api/cache/data/:pattern
 */
router.post('/data/:pattern',
  authenticateToken,
  requireAdmin,
  [
    body('data').notEmpty().withMessage('Data is required'),
    body('ttl').optional().isInt({ min: 1 }).withMessage('TTL must be positive integer')
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

      const cacheManager = getCacheManager();
      const { pattern } = req.params;
      const { data, ttl } = req.body;
      const variables = req.query;

      if (!cacheManager) {
        return res.status(503).json({
          error: 'Cache manager not available'
        });
      }

      const success = await cacheManager.set(pattern, variables, data, ttl);
      
      res.json({
        success,
        message: success ? 'Data cached successfully' : 'Failed to cache data',
        pattern,
        variables,
        ttl,
        setBy: req.user.email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to set cache data',
        details: error.message
      });
    }
  }
);

/**
 * Get cache metrics for monitoring dashboard
 * GET /api/cache/metrics
 */
router.get('/metrics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cacheManager = getCacheManager();
    
    if (!cacheManager) {
      return res.status(503).json({
        error: 'Cache manager not available'
      });
    }

    // Get metrics from Redis
    const metricsData = await cacheManager.l2Cache.get('cache:metrics');
    const metrics = metricsData ? JSON.parse(metricsData) : null;
    
    const health = await cacheManager.getHealthStatus();
    
    res.json({
      success: true,
      metrics,
      health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cache metrics',
      details: error.message
    });
  }
});

/**
 * Test cache performance
 * POST /api/cache/test
 */
router.post('/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cacheManager = getCacheManager();
    
    if (!cacheManager) {
      return res.status(503).json({
        error: 'Cache manager not available'
      });
    }

    const testKey = `test:${Date.now()}`;
    const testData = { message: 'Cache performance test', timestamp: new Date().toISOString() };
    
    // Measure set performance
    const setStart = Date.now();
    await cacheManager.set('API_RESPONSE', { endpoint: testKey }, testData, 60);
    const setTime = Date.now() - setStart;
    
    // Measure get performance
    const getStart = Date.now();
    const retrievedData = await cacheManager.get('API_RESPONSE', { endpoint: testKey });
    const getTime = Date.now() - getStart;
    
    // Cleanup
    await cacheManager.delete('API_RESPONSE', { endpoint: testKey });
    
    res.json({
      success: true,
      performance: {
        setTime: `${setTime}ms`,
        getTime: `${getTime}ms`,
        dataMatch: JSON.stringify(testData) === JSON.stringify(retrievedData)
      },
      testedBy: req.user.email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Cache performance test failed',
      details: error.message
    });
  }
});

export default router;