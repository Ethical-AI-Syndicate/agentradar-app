/**
 * Cache Middleware for API Response Caching
 * Automatic caching of API responses with intelligent cache keys
 */

import { getCacheManager } from '../services/cache/cacheManager.js';
import crypto from 'crypto';

/**
 * Generate cache key from request
 */
function generateRequestCacheKey(req) {
  const keyData = {
    method: req.method,
    path: req.route?.path || req.path,
    query: req.query,
    params: req.params,
    userId: req.user?.id || 'anonymous'
  };

  // Remove sensitive data from cache key
  const sanitized = { ...keyData };
  if (sanitized.query) {
    delete sanitized.query.password;
    delete sanitized.query.token;
    delete sanitized.query.secret;
  }

  const keyString = JSON.stringify(sanitized);
  return crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16);
}

/**
 * Determine if response should be cached
 */
function shouldCacheResponse(req, res) {
  // Only cache successful responses
  if (res.statusCode !== 200) return false;

  // Don't cache if response has errors
  if (res.locals.hasErrors) return false;

  // Don't cache POST, PUT, DELETE requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) return false;

  // Don't cache if user is admin (they need real-time data)
  if (req.user?.role === 'ADMIN') return false;

  // Don't cache if response contains sensitive data
  const sensitiveHeaders = ['set-cookie', 'authorization'];
  if (sensitiveHeaders.some(header => res.getHeaders()[header])) return false;

  return true;
}

/**
 * Get cache TTL based on endpoint
 */
function getCacheTTL(req) {
  const path = req.route?.path || req.path;

  // Cache TTL rules by endpoint pattern
  const ttlRules = {
    '/api/alerts': 300,           // 5 minutes - alerts change frequently
    '/api/properties': 1800,      // 30 minutes - property data is more stable
    '/api/users/me': 900,         // 15 minutes - user data changes occasionally
    '/api/preferences': 3600,     // 1 hour - preferences change rarely
    '/api/admin/stats': 300,      // 5 minutes - admin stats need to be fresh
    '/api/market': 1800,          // 30 minutes - market data
    '/api/competitive': 3600,     // 1 hour - competitive analysis
    '/api/leads': 600,            // 10 minutes - lead data
  };

  // Find matching rule
  for (const [pattern, ttl] of Object.entries(ttlRules)) {
    if (path.startsWith(pattern)) {
      return ttl;
    }
  }

  return 600; // Default 10 minutes
}

/**
 * Cache middleware factory
 * @param {Object} options - Caching options
 * @param {number} options.ttl - Time to live in seconds
 * @param {boolean} options.varyByUser - Include user ID in cache key
 * @param {Array} options.varyByHeaders - Headers to include in cache key
 * @param {Function} options.keyGenerator - Custom key generator function
 */
export function cacheMiddleware(options = {}) {
  return async (req, res, next) => {
    const cacheManager = getCacheManager();
    
    if (!cacheManager) {
      // Cache not available, proceed without caching
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = options.keyGenerator 
        ? options.keyGenerator(req) 
        : generateRequestCacheKey(req);

      // Try to get cached response
      const cachedResponse = await cacheManager.getApiResponse(
        req.route?.path || req.path,
        { key: cacheKey }
      );

      if (cachedResponse) {
        // Return cached response
        console.log(`🎯 Cache hit for ${req.method} ${req.path}`);
        res.set(cachedResponse.headers || {});
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.status(cachedResponse.status || 200).json(cachedResponse.data);
      }

      // Cache miss - intercept response to cache it
      console.log(`❌ Cache miss for ${req.method} ${req.path}`);
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function(data) {
        try {
          // Check if we should cache this response
          if (shouldCacheResponse(req, res)) {
            const responseData = {
              data,
              status: res.statusCode,
              headers: {
                'content-type': res.getHeader('content-type'),
                'x-cache': 'HIT' // Future requests will be cache hits
              }
            };

            const ttl = options.ttl || getCacheTTL(req);
            
            // Cache the response asynchronously
            cacheManager.setApiResponse(
              req.route?.path || req.path,
              { key: cacheKey },
              responseData,
              ttl
            ).catch(error => {
              console.error('Failed to cache response:', error);
            });

            console.log(`💾 Cached response for ${req.method} ${req.path} (TTL: ${ttl}s)`);
          }

          // Call original json method
          return originalJson.call(this, data);
        } catch (error) {
          console.error('Cache middleware error:', error);
          return originalJson.call(this, data);
        }
      };

      next();

    } catch (error) {
      console.error('Cache middleware error:', error);
      // Proceed without caching on error
      next();
    }
  };
}

/**
 * Specialized cache middleware for different data types
 */

// Cache for user-specific data
export const cacheUserData = cacheMiddleware({
  ttl: 900, // 15 minutes
  varyByUser: true
});

// Cache for property listings
export const cachePropertyData = cacheMiddleware({
  ttl: 1800, // 30 minutes
  varyByUser: false
});

// Cache for search results
export const cacheSearchResults = cacheMiddleware({
  ttl: 600, // 10 minutes
  varyByUser: true,
  keyGenerator: (req) => {
    const keyData = {
      query: req.query,
      params: req.params,
      userId: req.user?.id
    };
    return crypto.createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex').substring(0, 16);
  }
});

// Cache for market statistics
export const cacheMarketData = cacheMiddleware({
  ttl: 1800, // 30 minutes
  varyByUser: false
});

// Cache for admin statistics (shorter TTL for freshness)
export const cacheAdminStats = cacheMiddleware({
  ttl: 300, // 5 minutes
  varyByUser: false
});

/**
 * Cache invalidation middleware
 */
export function cacheInvalidationMiddleware(patterns) {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    res.json = async function(data) {
      try {
        // Only invalidate on successful operations
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cacheManager = getCacheManager();
          
          if (cacheManager && patterns) {
            for (const pattern of patterns) {
              if (typeof pattern === 'string') {
                await cacheManager.deletePattern(new RegExp(pattern));
              } else if (pattern instanceof RegExp) {
                await cacheManager.deletePattern(pattern);
              }
            }
            console.log(`🗑️ Cache invalidated for patterns: ${patterns}`);
          }
        }

        return originalJson.call(this, data);
      } catch (error) {
        console.error('Cache invalidation error:', error);
        return originalJson.call(this, data);
      }
    };

    next();
  };
}

/**
 * Manual cache control functions
 */
export async function invalidateUserCache(userId) {
  const cacheManager = getCacheManager();
  if (cacheManager) {
    await cacheManager.invalidateUserCache(userId);
  }
}

export async function invalidatePropertyCache(propertyId) {
  const cacheManager = getCacheManager();
  if (cacheManager) {
    await cacheManager.invalidatePropertyCache(propertyId);
  }
}

export async function invalidateMarketCache(region = null) {
  const cacheManager = getCacheManager();
  if (cacheManager) {
    await cacheManager.invalidateMarketCache(region);
  }
}

/**
 * Cache warming functions
 */
export async function warmUserCache(userId) {
  try {
    const cacheManager = getCacheManager();
    if (!cacheManager) return;

    // This would typically call your actual services to warm the cache
    console.log(`🔥 Warming cache for user: ${userId}`);
    
    // Example: Warm user preferences
    // const preferences = await getUserPreferences(userId);
    // await cacheManager.setUserData(userId, preferences);
    
  } catch (error) {
    console.error(`Failed to warm cache for user ${userId}:`, error);
  }
}

export async function warmPopularData() {
  try {
    const cacheManager = getCacheManager();
    if (!cacheManager) return;

    console.log('🔥 Warming popular data cache...');
    
    // Warm market data for major regions
    const majorRegions = ['gta', 'toronto', 'york', 'peel'];
    for (const region of majorRegions) {
      // This would call your market data service
      // const marketData = await getMarketStats(region);
      // await cacheManager.setMarketStats(region, marketData);
    }
    
    console.log('✅ Popular data cache warmed');
  } catch (error) {
    console.error('Failed to warm popular data cache:', error);
  }
}

/**
 * Cache health check endpoint data
 */
export async function getCacheHealthStatus() {
  try {
    const cacheManager = getCacheManager();
    if (!cacheManager) {
      return { status: 'unavailable' };
    }

    return await cacheManager.getHealthStatus();
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}