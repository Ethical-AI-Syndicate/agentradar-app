// Service Initialization
// Initializes and starts all background services

import { createLogger } from '../utils/logger';

const logger = createLogger();

/**
 * Initialize all services
 */
export async function initializeServices(): Promise<void> {
  try {
    logger.info('Initializing AgentRadar services...');
    
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