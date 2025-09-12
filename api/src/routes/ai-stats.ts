import { Router } from 'express';
import { aiMonitor } from '../lib/aiPerformanceMonitor';

const router = Router();

/**
 * GET /api/ai-stats/daily
 * Get daily AI usage statistics
 */
router.get('/daily', async (req, res) => {
  try {
    const stats = aiMonitor.getDailyStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        costFormatted: `$${stats.totalCost.toFixed(4)}`,
        successRateFormatted: `${(stats.successRate * 100).toFixed(1)}%`,
        averageLatencyFormatted: `${stats.averageLatency.toFixed(0)}ms`,
      }
    });
  } catch (error) {
    console.error('Error fetching daily AI stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily AI statistics'
    });
  }
});

/**
 * GET /api/ai-stats/operation/:operationName
 * Get statistics for a specific AI operation
 */
router.get('/operation/:operationName', async (req, res) => {
  try {
    const { operationName } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;
    
    const stats = aiMonitor.getOperationStats(operationName, hours);
    
    res.json({
      success: true,
      data: {
        operation: operationName,
        timeframe: `${hours} hours`,
        ...stats,
        totalCostFormatted: `$${stats.totalCost.toFixed(4)}`,
        successRateFormatted: `${(stats.successRate * 100).toFixed(1)}%`,
        averageLatencyFormatted: `${stats.averageLatency.toFixed(0)}ms`,
      }
    });
  } catch (error) {
    console.error('Error fetching operation AI stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch operation AI statistics'
    });
  }
});

/**
 * GET /api/ai-stats/operations
 * Get list of all AI operations with basic stats
 */
router.get('/operations', async (req, res) => {
  try {
    const operations = [
      'property-analysis',
      'document-extraction', 
      'lead-analysis',
      'market-report',
      'general-completion',
      'property-valuation',
      'property-report',
      'cma-generation',
      'market-prediction',
      'lead-generation'
    ];

    const operationStats = operations.map(operation => {
      const stats = aiMonitor.getOperationStats(operation, 24);
      return {
        operation,
        ...stats,
        totalCostFormatted: `$${stats.totalCost.toFixed(4)}`,
        successRateFormatted: `${(stats.successRate * 100).toFixed(1)}%`,
        averageLatencyFormatted: `${stats.averageLatency.toFixed(0)}ms`,
      };
    }).filter(stats => stats.totalCalls > 0); // Only show operations with calls

    res.json({
      success: true,
      data: operationStats
    });
  } catch (error) {
    console.error('Error fetching operations AI stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch operations AI statistics'
    });
  }
});

/**
 * POST /api/ai-stats/summary
 * Manually trigger daily summary (for testing)
 */
router.post('/summary', async (req, res) => {
  try {
    aiMonitor.sendDailySummary();
    
    res.json({
      success: true,
      message: 'Daily summary sent successfully'
    });
  } catch (error) {
    console.error('Error sending daily summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send daily summary'
    });
  }
});

export default router;