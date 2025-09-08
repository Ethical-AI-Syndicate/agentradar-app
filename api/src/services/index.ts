// Service Initialization
// Initializes and starts all background services

import { createLogger } from '../utils/logger';
import { createCacheManager } from './cache/cacheManager.js';

const logger = createLogger();
let cacheManager: any = null;

/**
 * Initialize all services
 */
export async function initializeServices(): Promise<void> {
  try {
    logger.info('Initializing AgentRadar services...');
    
    // Initialize cache manager
    try {
      cacheManager = createCacheManager();
      await cacheManager.initialize();
      logger.info('✅ Cache Manager (Redis Cloud L1/L2/L3) initialized');
    } catch (cacheError) {
      logger.error('❌ Failed to initialize Cache Manager:', cacheError);
      // Continue without cache - non-blocking
    }
    
    // Court processing services temporarily disabled
    logger.info('Court processing services are temporarily disabled');
    logger.info('All services initialized successfully');

  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
}

/**
 * Shutdown all services gracefully
 */
export async function shutdownServices(): Promise<void> {
  try {
    logger.info('Shutting down AgentRadar services...');
    
    // Shutdown cache manager
    if (cacheManager) {
      try {
        await cacheManager.shutdown();
        logger.info('✅ Cache Manager shutdown complete');
      } catch (cacheError) {
        logger.error('❌ Cache Manager shutdown error:', cacheError);
      }
    }
    
    logger.info('All services shut down successfully');

  } catch (error) {
    logger.error('Error during service shutdown:', error);
    throw error;
  }
}

/**
 * Get orchestrator instance (for health checks)
 */
export function getOrchestrator(): null {
  return null;
}