/**
 * Redis Caching Layer - L1/L2/L3 Strategy
 * Production-grade multi-level caching system with Redis Cloud
 * 
 * L1: Application memory (LRU, 100MB)
 * L2: Redis distributed cache (10GB) 
 * L3: CDN edge caching (external)
 */

import Redis from 'ioredis';
const LRUCache = require('lru-cache');
import crypto from 'crypto';

export class CacheManager {
  constructor() {
    // L1 Cache: In-memory LRU cache
    this.l1Cache = new LRUCache({
      max: 1000, // Maximum 1000 items
      maxSize: 100 * 1024 * 1024, // 100MB max size
      sizeCalculation: (value) => JSON.stringify(value).length,
      ttl: 1000 * 60 * 15, // 15 minutes TTL
      allowStale: true,
      updateAgeOnGet: true,
      updateAgeOnHas: true
    });

    // L2 Cache: Redis Cloud connection
    this.l2Cache = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME || 'default',
      db: 1, // Use DB 1 for caching (DB 0 reserved for WebSocket)
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      keyPrefix: 'agentradar:cache:',
      // Connection pool settings
      maxmemoryPolicy: 'allkeys-lru',
      // Compression settings
      enableReadyCheck: true,
      keepAlive: 30000
    });

    // Cache configuration
    this.config = {
      defaultTtl: 3600, // 1 hour default TTL
      maxKeyLength: 250,
      compressionThreshold: 1024, // Compress values > 1KB
      
      // Cache key patterns
      patterns: {
        USER_DATA: 'user:{userId}',
        PROPERTY_DATA: 'property:{propertyId}',
        SEARCH_RESULTS: 'search:{hash}',
        MARKET_STATS: 'market:{region}:stats',
        ALERT_PREFERENCES: 'alerts:{userId}:preferences',
        COURT_FILINGS: 'court:{region}:{dateRange}',
        API_RESPONSE: 'api:{endpoint}:{hash}'
      },
      
      // TTL by data type (seconds)
      ttl: {
        USER_DATA: 3600, // 1 hour
        PROPERTY_DATA: 86400, // 24 hours
        SEARCH_RESULTS: 900, // 15 minutes
        MARKET_STATS: 3600, // 1 hour
        ALERT_PREFERENCES: 7200, // 2 hours
        COURT_FILINGS: 1800, // 30 minutes
        API_RESPONSE: 600 // 10 minutes
      }
    };

    // Cache statistics
    this.stats = {
      l1: { hits: 0, misses: 0, sets: 0, deletes: 0 },
      l2: { hits: 0, misses: 0, sets: 0, deletes: 0 },
      totalRequests: 0
    };

    // Initialize cache
    this.initialize();
  }

  /**
   * Initialize Redis connection and event handlers
   */
  async initialize() {
    try {
      console.log('🚀 Initializing AgentRadar Cache Manager...');

      // Connect to Redis Cloud
      await this.l2Cache.connect();
      
      // Setup Redis event handlers
      this.l2Cache.on('connect', () => {
        console.log('✅ L2 Cache (Redis Cloud) connected successfully');
      });

      this.l2Cache.on('error', (error) => {
        console.error('❌ L2 Cache error:', error);
      });

      this.l2Cache.on('close', () => {
        console.warn('⚠️ L2 Cache connection closed');
      });

      // Test Redis connection
      await this.l2Cache.ping();
      console.log('🏓 L2 Cache connection verified');

      // Setup cache warming for frequently accessed data
      this.setupCacheWarming();

      // Setup cache monitoring
      this.setupCacheMonitoring();

      console.log('✅ Cache Manager initialized successfully');
      console.log(`💾 L1 Cache: ${this.l1Cache.size} items`);

    } catch (error) {
      console.error('❌ Failed to initialize Cache Manager:', error);
      throw error;
    }
  }

  /**
   * Generate cache key with pattern validation
   */
  generateKey(pattern, variables = {}) {
    try {
      let key = this.config.patterns[pattern] || pattern;
      
      // Replace variables in pattern
      Object.entries(variables).forEach(([variable, value]) => {
        key = key.replace(`{${variable}}`, value);
      });

      // Hash long keys
      if (key.length > this.config.maxKeyLength) {
        const hash = crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
        key = `hash:${hash}`;
      }

      return key;
      
    } catch (error) {
      console.error('Error generating cache key:', error);
      return `fallback:${Date.now()}`;
    }
  }

  /**
   * Get data from cache with L1->L2 fallback
   */
  async get(pattern, variables = {}) {
    const key = this.generateKey(pattern, variables);
    this.stats.totalRequests++;

    try {
      // L1 Cache check
      const l1Value = this.l1Cache.get(key);
      if (l1Value !== undefined) {
        this.stats.l1.hits++;
        console.log(`🎯 L1 Cache hit: ${key}`);
        return l1Value;
      }
      this.stats.l1.misses++;

      // L2 Cache check
      const l2Value = await this.l2Cache.get(key);
      if (l2Value !== null) {
        this.stats.l2.hits++;
        const parsedValue = this.deserializeValue(l2Value);
        
        // Promote to L1 cache
        this.l1Cache.set(key, parsedValue);
        console.log(`🎯 L2 Cache hit (promoted to L1): ${key}`);
        return parsedValue;
      }
      this.stats.l2.misses++;

      console.log(`❌ Cache miss: ${key}`);
      return null;

    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache with TTL
   */
  async set(pattern, variables = {}, data, ttlSeconds = null) {
    const key = this.generateKey(pattern, variables);
    const ttl = ttlSeconds || this.config.ttl[pattern] || this.config.defaultTtl;

    try {
      // Set in L1 cache
      this.l1Cache.set(key, data);
      this.stats.l1.sets++;

      // Set in L2 cache with TTL
      const serializedData = this.serializeValue(data);
      await this.l2Cache.setex(key, ttl, serializedData);
      this.stats.l2.sets++;

      console.log(`💾 Cache set: ${key} (TTL: ${ttl}s)`);
      return true;

    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete data from all cache levels
   */
  async delete(pattern, variables = {}) {
    const key = this.generateKey(pattern, variables);

    try {
      // Delete from L1
      const l1Deleted = this.l1Cache.delete(key);
      if (l1Deleted) {
        this.stats.l1.deletes++;
      }

      // Delete from L2
      const l2Deleted = await this.l2Cache.del(key);
      if (l2Deleted > 0) {
        this.stats.l2.deletes++;
      }

      console.log(`🗑️ Cache delete: ${key}`);
      return l1Deleted || l2Deleted > 0;

    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys with pattern matching
   */
  async deletePattern(patternRegex) {
    try {
      // Clear L1 cache matching pattern
      let l1Cleared = 0;
      for (const key of this.l1Cache.keys()) {
        if (patternRegex.test(key)) {
          this.l1Cache.delete(key);
          l1Cleared++;
        }
      }

      // Clear L2 cache matching pattern
      const keys = await this.l2Cache.keys(patternRegex.source);
      let l2Cleared = 0;
      if (keys.length > 0) {
        l2Cleared = await this.l2Cache.del(...keys);
      }

      console.log(`🗑️ Pattern delete: ${patternRegex.source} (L1: ${l1Cleared}, L2: ${l2Cleared})`);
      return l1Cleared + l2Cleared;

    } catch (error) {
      console.error(`Cache pattern delete error:`, error);
      return 0;
    }
  }

  /**
   * Cache-aside pattern: Get with fallback function
   */
  async getOrSet(pattern, variables = {}, fallbackFn, ttlSeconds = null) {
    try {
      // Try to get from cache
      const cachedData = await this.get(pattern, variables);
      if (cachedData !== null) {
        return cachedData;
      }

      // Execute fallback function
      console.log(`🔄 Cache miss, executing fallback for pattern: ${pattern}`);
      const freshData = await fallbackFn();

      // Cache the result if not null/undefined
      if (freshData !== null && freshData !== undefined) {
        await this.set(pattern, variables, freshData, ttlSeconds);
      }

      return freshData;

    } catch (error) {
      console.error('Cache getOrSet error:', error);
      // Return fallback data even if caching fails
      try {
        return await fallbackFn();
      } catch (fallbackError) {
        console.error('Fallback function failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * High-level cache methods for common operations
   */

  // User data caching
  async getUserData(userId) {
    return this.get('USER_DATA', { userId });
  }

  async setUserData(userId, userData, ttl = null) {
    return this.set('USER_DATA', { userId }, userData, ttl);
  }

  async deleteUserData(userId) {
    return this.delete('USER_DATA', { userId });
  }

  // Property data caching
  async getPropertyData(propertyId) {
    return this.get('PROPERTY_DATA', { propertyId });
  }

  async setPropertyData(propertyId, propertyData, ttl = null) {
    return this.set('PROPERTY_DATA', { propertyId }, propertyData, ttl);
  }

  // Search results caching
  async getSearchResults(searchQuery, filters = {}) {
    const hash = this.hashObject({ query: searchQuery, filters });
    return this.get('SEARCH_RESULTS', { hash });
  }

  async setSearchResults(searchQuery, filters = {}, results, ttl = null) {
    const hash = this.hashObject({ query: searchQuery, filters });
    return this.set('SEARCH_RESULTS', { hash }, results, ttl);
  }

  // Market statistics caching
  async getMarketStats(region) {
    return this.get('MARKET_STATS', { region });
  }

  async setMarketStats(region, stats, ttl = null) {
    return this.set('MARKET_STATS', { region }, stats, ttl);
  }

  // Court filings caching
  async getCourtFilings(region, dateRange) {
    return this.get('COURT_FILINGS', { region, dateRange });
  }

  async setCourtFilings(region, dateRange, filings, ttl = null) {
    return this.set('COURT_FILINGS', { region, dateRange }, filings, ttl);
  }

  // API response caching
  async getApiResponse(endpoint, params = {}) {
    const hash = this.hashObject({ endpoint, params });
    return this.get('API_RESPONSE', { endpoint, hash });
  }

  async setApiResponse(endpoint, params = {}, response, ttl = null) {
    const hash = this.hashObject({ endpoint, params });
    return this.set('API_RESPONSE', { endpoint, hash }, response, ttl);
  }

  /**
   * Cache invalidation methods
   */

  async invalidateUserCache(userId) {
    await this.deleteUserData(userId);
    await this.delete('ALERT_PREFERENCES', { userId });
    console.log(`🗑️ Invalidated cache for user: ${userId}`);
  }

  async invalidatePropertyCache(propertyId) {
    await this.delete('PROPERTY_DATA', { propertyId });
    // Also clear related search results
    await this.deletePattern(/search:.*/);
    console.log(`🗑️ Invalidated cache for property: ${propertyId}`);
  }

  async invalidateMarketCache(region = null) {
    if (region) {
      await this.delete('MARKET_STATS', { region });
    } else {
      await this.deletePattern(/market:.*/);
    }
    console.log(`🗑️ Invalidated market cache${region ? ` for ${region}` : ''}`);
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  setupCacheWarming() {
    // Warm cache every hour
    setInterval(async () => {
      try {
        console.log('🔥 Starting cache warming...');
        
        // Warm market stats for major regions
        const majorRegions = ['gta', 'toronto', 'york', 'peel'];
        for (const region of majorRegions) {
          // This would typically call your actual data services
          // await this.warmMarketStats(region);
        }
        
        console.log('✅ Cache warming completed');
      } catch (error) {
        console.error('❌ Cache warming failed:', error);
      }
    }, 3600000); // Every hour
  }

  /**
   * Cache monitoring and metrics
   */
  setupCacheMonitoring() {
    // Log cache statistics every 5 minutes
    setInterval(() => {
      const hitRateL1 = this.stats.l1.hits / (this.stats.l1.hits + this.stats.l1.misses) * 100 || 0;
      const hitRateL2 = this.stats.l2.hits / (this.stats.l2.hits + this.stats.l2.misses) * 100 || 0;
      const overallHitRate = (this.stats.l1.hits + this.stats.l2.hits) / this.stats.totalRequests * 100 || 0;

      console.log(`📊 Cache Stats - L1 Hit Rate: ${hitRateL1.toFixed(1)}%, L2 Hit Rate: ${hitRateL2.toFixed(1)}%, Overall: ${overallHitRate.toFixed(1)}%`);
      console.log(`📊 L1 Cache: ${this.l1Cache.size} items, L2 Requests: ${this.stats.totalRequests}`);
      
      // Store metrics in Redis for monitoring dashboard
      this.l2Cache.setex('cache:metrics', 300, JSON.stringify({
        ...this.stats,
        hitRates: { l1: hitRateL1, l2: hitRateL2, overall: overallHitRate },
        l1Size: this.l1Cache.size,
        timestamp: new Date().toISOString()
      })).catch(console.error);
      
    }, 300000); // Every 5 minutes
  }

  /**
   * Utility methods
   */

  serializeValue(value) {
    try {
      const serialized = JSON.stringify(value);
      
      // Compress large values
      if (serialized.length > this.config.compressionThreshold) {
        // Would implement compression here (e.g., with zlib)
        return `compressed:${serialized}`;
      }
      
      return serialized;
    } catch (error) {
      console.error('Serialization error:', error);
      return '{}';
    }
  }

  deserializeValue(serialized) {
    try {
      // Handle compressed values
      if (serialized.startsWith('compressed:')) {
        // Would implement decompression here
        serialized = serialized.substring(11);
      }
      
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Deserialization error:', error);
      return null;
    }
  }

  hashObject(obj) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(obj))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Cache health and statistics
   */
  async getHealthStatus() {
    try {
      const l2Ping = await this.l2Cache.ping();
      const l2Info = await this.l2Cache.info('memory');
      
      return {
        status: 'healthy',
        l1Cache: {
          status: 'active',
          size: this.l1Cache.size,
          maxSize: this.l1Cache.max
        },
        l2Cache: {
          status: l2Ping === 'PONG' ? 'active' : 'inactive',
          memoryInfo: l2Info
        },
        statistics: this.stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Clear all cache levels
   */
  async clear() {
    try {
      this.l1Cache.clear();
      await this.l2Cache.flushdb();
      console.log('🗑️ All cache levels cleared');
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Shutdown cache connections
   */
  async shutdown() {
    try {
      console.log('🛑 Shutting down Cache Manager...');
      
      this.l1Cache.clear();
      await this.l2Cache.quit();
      
      console.log('✅ Cache Manager shutdown complete');
    } catch (error) {
      console.error('Cache shutdown error:', error);
    }
  }
}

// Export singleton instance
let cacheManagerInstance = null;

export function createCacheManager() {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}

export function getCacheManager() {
  return cacheManagerInstance;
}