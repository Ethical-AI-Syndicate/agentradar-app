// Service Initialization
// Initializes and starts all background services

import { logger } from '../utils/logger';
import CourtProcessingOrchestrator from './courtProcessingOrchestrator';

let orchestrator: CourtProcessingOrchestrator | null = null;

/**
 * Initialize all services
 */
export async function initializeServices(): Promise<void> {
  try {
    logger.info('Initializing AgentRadar services...');

    // Initialize court processing orchestrator
    if (process.env.NODE_ENV !== 'test') {
      orchestrator = new CourtProcessingOrchestrator();
      await orchestrator.start();
      logger.info('Court Processing Orchestrator started');
    } else {
      logger.info('Skipping service initialization in test environment');
    }

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

    if (orchestrator) {
      await orchestrator.stop();
      logger.info('Court Processing Orchestrator stopped');
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
export function getOrchestrator(): CourtProcessingOrchestrator | null {
  return orchestrator;
}