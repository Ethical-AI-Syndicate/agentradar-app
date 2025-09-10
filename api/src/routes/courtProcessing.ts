import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';
import { createLogger } from '../utils/logger';

const router = express.Router();
const logger = createLogger();

// Court filing submission schema
const courtFilingSchema = Joi.object({
  courtName: Joi.string().trim().min(1).required(),
  caseNumber: Joi.string().trim().min(1).required(),
  filingType: Joi.string().valid('POWER_OF_SALE', 'FORECLOSURE', 'ESTATE', 'BANKRUPTCY', 'TAX_SALE').required(),
  propertyAddress: Joi.string().trim().min(1).required(),
  legalDescription: Joi.string().trim().allow('').optional(),
  filingDate: Joi.date().iso().required(),
  hearingDate: Joi.date().iso().allow(null).optional(),
  amount: Joi.number().positive().allow(null).optional(),
  status: Joi.string().valid('FILED', 'SCHEDULED', 'HEARING', 'CLOSED', 'APPEALED').required(),
  documents: Joi.array().items(Joi.object({
    name: Joi.string().trim().required(),
    type: Joi.string().trim().required(),
    url: Joi.string().uri().allow('').optional(),
    content: Joi.string().allow('').optional()
  })).optional(),
  parties: Joi.array().items(Joi.object({
    name: Joi.string().trim().required(),
    role: Joi.string().valid('PLAINTIFF', 'DEFENDANT', 'TRUSTEE', 'LAWYER').required(),
    contact: Joi.string().trim().allow('').optional()
  })).optional()
});

// Processing queue item schema
const queueItemSchema = Joi.object({
  source: Joi.string().trim().min(1).required(),
  rawData: Joi.any().required(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').default('NORMAL'),
  retryCount: Joi.number().min(0).default(0).optional(),
  scheduledFor: Joi.date().iso().allow(null).optional()
});

// Update court filing schema (partial)
const updateCourtFilingSchema = Joi.object({
  courtName: Joi.string().trim().min(1).optional(),
  caseNumber: Joi.string().trim().min(1).optional(),
  filingType: Joi.string().valid('POWER_OF_SALE', 'FORECLOSURE', 'ESTATE', 'BANKRUPTCY', 'TAX_SALE').optional(),
  propertyAddress: Joi.string().trim().min(1).optional(),
  legalDescription: Joi.string().trim().allow('').optional(),
  filingDate: Joi.date().iso().optional(),
  hearingDate: Joi.date().iso().allow(null).optional(),
  amount: Joi.number().positive().allow(null).optional(),
  status: Joi.string().valid('FILED', 'SCHEDULED', 'HEARING', 'CLOSED', 'APPEALED').optional(),
  documents: Joi.array().items(Joi.object({
    name: Joi.string().trim().required(),
    type: Joi.string().trim().required(),
    url: Joi.string().uri().allow('').optional(),
    content: Joi.string().allow('').optional()
  })).optional(),
  parties: Joi.array().items(Joi.object({
    name: Joi.string().trim().required(),
    role: Joi.string().valid('PLAINTIFF', 'DEFENDANT', 'TRUSTEE', 'LAWYER').required(),
    contact: Joi.string().trim().allow('').optional()
  })).optional()
});

// Get court processing queue status
router.get('/queue', authenticateToken, async (req, res) => {
  try {
    const queueStatus = await getProcessingQueueStatus();
    
    res.json({
      success: true,
      data: {
        queue: queueStatus,
        summary: {
          totalItems: queueStatus.length,
          pending: queueStatus.filter(item => item.status === 'PENDING').length,
          processing: queueStatus.filter(item => item.status === 'PROCESSING').length,
          completed: queueStatus.filter(item => item.status === 'COMPLETED').length,
          failed: queueStatus.filter(item => item.status === 'FAILED').length
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve queue status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add item to processing queue
router.post('/queue', authenticateToken, validateRequest(queueItemSchema), async (req, res) => {
  try {
    const queueItem = req.body;
    const { userId } = req as any;
    
    const addedItem = await addToProcessingQueue({
      ...queueItem,
      addedBy: userId,
      addedAt: new Date().toISOString()
    });
    
    logger.info(`Court processing item added to queue by user ${userId}:`, addedItem.id);
    
    res.json({
      success: true,
      message: 'Item added to processing queue successfully',
      data: addedItem
    });
  } catch (error) {
    logger.error('Failed to add item to queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to processing queue',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Process next item in queue
router.post('/queue/process', requireAdmin, async (req, res) => {
  try {
    const result = await processNextQueueItem();
    
    if (!result) {
      return res.json({
        success: true,
        message: 'No items in queue to process'
      });
    }
    
    res.json({
      success: true,
      message: 'Queue item processed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to process queue item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process queue item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get court filings with filtering
router.get('/filings', authenticateToken, async (req, res) => {
  try {
    const {
      filingType,
      status,
      courtName,
      startDate,
      endDate,
      limit = '50',
      offset = '0'
    } = req.query as {
      filingType?: string;
      status?: string;
      courtName?: string;
      startDate?: string;
      endDate?: string;
      limit?: string;
      offset?: string;
    };
    
    const filters = {
      filingType,
      status,
      courtName,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };
    
    const filings = await getCourtFilings(filters, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: {
        filings,
        total: filings.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Failed to get court filings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve court filings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific court filing
router.get('/filings/:filingId', authenticateToken, async (req, res) => {
  try {
    const { filingId } = req.params;
    
    const filing = await getCourtFiling(filingId);
    
    if (!filing) {
      return res.status(404).json({
        success: false,
        message: 'Court filing not found'
      });
    }
    
    res.json({
      success: true,
      data: filing
    });
  } catch (error) {
    logger.error('Failed to get court filing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve court filing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new court filing
router.post('/filings', authenticateToken, validateRequest(courtFilingSchema), async (req, res) => {
  try {
    const filingData = req.body;
    const { userId } = req as any;
    
    const filing = await createCourtFiling({
      ...filingData,
      createdBy: userId,
      createdAt: new Date().toISOString()
    });
    
    logger.info(`Court filing created by user ${userId}:`, filing.id);
    
    res.status(201).json({
      success: true,
      message: 'Court filing created successfully',
      data: filing
    });
  } catch (error) {
    logger.error('Failed to create court filing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create court filing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update court filing
router.put('/filings/:filingId', authenticateToken, validateRequest(updateCourtFilingSchema), async (req, res) => {
  try {
    const { filingId } = req.params;
    const updateData = req.body;
    const { userId } = req as any;
    
    const filing = await updateCourtFiling(filingId, {
      ...updateData,
      updatedBy: userId,
      updatedAt: new Date().toISOString()
    });
    
    if (!filing) {
      return res.status(404).json({
        success: false,
        message: 'Court filing not found'
      });
    }
    
    logger.info(`Court filing updated by user ${userId}:`, filingId);
    
    res.json({
      success: true,
      message: 'Court filing updated successfully',
      data: filing
    });
  } catch (error) {
    logger.error('Failed to update court filing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update court filing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete court filing
router.delete('/filings/:filingId', requireAdmin, async (req, res) => {
  try {
    const { filingId } = req.params;
    const { userId } = req as any;
    
    const result = await deleteCourtFiling(filingId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Court filing not found'
      });
    }
    
    logger.info(`Court filing deleted by admin ${userId}:`, filingId);
    
    res.json({
      success: true,
      message: 'Court filing deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete court filing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete court filing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get processing statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const {
      timeRange = '30d',
      groupBy = 'day'
    } = req.query as {
      timeRange?: string;
      groupBy?: string;
    };
    
    const stats = await getProcessingStatistics(timeRange, groupBy);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get processing statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve processing statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Retry failed processing items
router.post('/queue/retry-failed', requireAdmin, async (req, res) => {
  try {
    const { maxRetries = 3 } = req.body;
    
    const result = await retryFailedItems(maxRetries);
    
    res.json({
      success: true,
      message: 'Failed items queued for retry',
      data: result
    });
  } catch (error) {
    logger.error('Failed to retry failed items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry failed items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear completed items from queue
router.delete('/queue/completed', requireAdmin, async (req, res) => {
  try {
    const { olderThan = '7d' } = req.query as { olderThan?: string };
    
    const result = await clearCompletedItems(olderThan);
    
    res.json({
      success: true,
      message: 'Completed items cleared from queue',
      data: result
    });
  } catch (error) {
    logger.error('Failed to clear completed items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear completed items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get processing insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const insights = await getProcessingInsights();
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error('Failed to get processing insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve processing insights',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions - In production these would integrate with real court processing systems

async function getProcessingQueueStatus() {
  // Mock queue status - in production this would query the processing queue database
  return [
    {
      id: 'queue-item-1',
      source: 'ontario-courts',
      type: 'POWER_OF_SALE',
      status: 'PENDING',
      priority: 'HIGH',
      addedAt: new Date(Date.now() - 300000).toISOString(),
      estimatedProcessingTime: '5 minutes'
    },
    {
      id: 'queue-item-2',
      source: 'estate-sales',
      type: 'ESTATE',
      status: 'PROCESSING',
      priority: 'NORMAL',
      addedAt: new Date(Date.now() - 600000).toISOString(),
      processingStarted: new Date(Date.now() - 120000).toISOString()
    }
  ];
}

async function addToProcessingQueue(item: any) {
  // Add item to processing queue
  const queueItem = {
    id: `queue-${Date.now()}`,
    ...item,
    status: 'PENDING'
  };
  
  logger.info('Item added to processing queue:', queueItem.id);
  return queueItem;
}

async function processNextQueueItem() {
  // Process the next item in the queue
  const nextItem = {
    id: 'queue-item-processed',
    status: 'COMPLETED',
    processedAt: new Date().toISOString(),
    result: 'Successfully processed court filing'
  };
  
  logger.info('Queue item processed:', nextItem.id);
  return nextItem;
}

async function getCourtFilings(filters: any, limit: number, offset: number) {
  // Mock court filings - in production this would query the court filings database
  return [
    {
      id: 'filing-1',
      caseNumber: 'CV-2024-001234',
      courtName: 'Superior Court of Justice - Toronto',
      filingType: 'POWER_OF_SALE',
      propertyAddress: '123 Main Street, Toronto, ON M5V 3A8',
      filingDate: new Date(Date.now() - 86400000 * 7).toISOString(),
      hearingDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      amount: 750000,
      status: 'SCHEDULED',
      parties: [
        { name: 'ABC Bank', role: 'PLAINTIFF' },
        { name: 'John Doe', role: 'DEFENDANT' }
      ]
    },
    {
      id: 'filing-2',
      caseNumber: 'CV-2024-001235',
      courtName: 'Superior Court of Justice - Toronto',
      filingType: 'ESTATE',
      propertyAddress: '456 Oak Avenue, Toronto, ON M4W 2K8',
      filingDate: new Date(Date.now() - 86400000 * 14).toISOString(),
      status: 'FILED',
      parties: [
        { name: 'Estate of Jane Smith', role: 'PLAINTIFF' }
      ]
    }
  ];
}

async function getCourtFiling(filingId: string) {
  // Get specific court filing
  if (filingId === 'filing-1') {
    return {
      id: 'filing-1',
      caseNumber: 'CV-2024-001234',
      courtName: 'Superior Court of Justice - Toronto',
      filingType: 'POWER_OF_SALE',
      propertyAddress: '123 Main Street, Toronto, ON M5V 3A8',
      legalDescription: 'Lot 45, Plan 1234, City of Toronto',
      filingDate: new Date(Date.now() - 86400000 * 7).toISOString(),
      hearingDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      amount: 750000,
      status: 'SCHEDULED',
      documents: [
        {
          name: 'Power of Sale Notice',
          type: 'PDF',
          url: 'https://example.com/document1.pdf'
        }
      ],
      parties: [
        { name: 'ABC Bank', role: 'PLAINTIFF', contact: 'legal@abcbank.com' },
        { name: 'John Doe', role: 'DEFENDANT' }
      ]
    };
  }
  return null;
}

async function createCourtFiling(filingData: any) {
  // Create new court filing
  const filing = {
    id: `filing-${Date.now()}`,
    ...filingData
  };
  
  logger.info('Court filing created:', filing.id);
  return filing;
}

async function updateCourtFiling(filingId: string, updateData: any) {
  // Update court filing
  if (filingId === 'filing-1') {
    const filing = {
      id: filingId,
      ...updateData
    };
    
    logger.info('Court filing updated:', filingId);
    return filing;
  }
  return null;
}

async function deleteCourtFiling(filingId: string) {
  // Delete court filing
  if (filingId === 'filing-1') {
    logger.info('Court filing deleted:', filingId);
    return true;
  }
  return false;
}

async function getProcessingStatistics(timeRange: string, groupBy: string) {
  // Get processing statistics
  return {
    totalFilings: 1247,
    processedToday: 45,
    averageProcessingTime: '3.2 minutes',
    successRate: 97.5,
    byType: {
      POWER_OF_SALE: 654,
      ESTATE: 289,
      FORECLOSURE: 187,
      BANKRUPTCY: 87,
      TAX_SALE: 30
    },
    byStatus: {
      FILED: 423,
      SCHEDULED: 287,
      HEARING: 156,
      CLOSED: 381
    },
    timeline: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      processed: Math.floor(Math.random() * 50) + 10,
      success: Math.floor(Math.random() * 45) + 8
    }))
  };
}

async function retryFailedItems(maxRetries: number) {
  // Retry failed processing items
  const result = {
    itemsQueued: 5,
    totalFailed: 8,
    skipped: 3
  };
  
  logger.info(`Retrying failed items: ${result.itemsQueued} queued`);
  return result;
}

async function clearCompletedItems(olderThan: string) {
  // Clear completed items from queue
  const result = {
    itemsCleared: 156,
    spaceFreed: '2.3 MB'
  };
  
  logger.info(`Cleared completed items: ${result.itemsCleared} items`);
  return result;
}

async function getProcessingInsights() {
  // Get processing insights and recommendations
  return {
    trends: [
      {
        type: 'POWER_OF_SALE',
        trend: 'increasing',
        change: 15.2,
        period: '30 days'
      },
      {
        type: 'ESTATE',
        trend: 'stable',
        change: 2.1,
        period: '30 days'
      }
    ],
    recommendations: [
      'Increase monitoring for power of sale filings in Toronto region',
      'Consider automated alerts for high-value estate sales',
      'Review processing queue during peak hours (9-11 AM)'
    ],
    performance: {
      averageLatency: '2.8 seconds',
      peakThroughput: '150 items/hour',
      errorRate: '2.5%',
      recommendedOptimizations: [
        'Implement parallel processing for low-priority items',
        'Add caching for frequently accessed court data'
      ]
    }
  };
}

export default router;