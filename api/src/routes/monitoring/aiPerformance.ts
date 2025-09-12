/**
 * AI Performance Monitoring API Routes
 * Exposes performance metrics and dashboard data
 * ADMIN ONLY endpoints for system monitoring
 */

import express from 'express';
import { aiPerformanceMonitor } from '../../services/monitoring/aiPerformanceMonitor';
import { requireAuth, requireAdmin } from '../../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);
router.use(requireAdmin); // AI performance data is admin-only

/**
 * GET /api/monitoring/ai-performance/dashboard
 * Get overall system performance dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboardStats = await aiPerformanceMonitor.getDashboardStats();
    
    res.json({
      success: true,
      data: dashboardStats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get AI performance dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance dashboard'
    });
  }
});

/**
 * GET /api/monitoring/ai-performance/service/:serviceName/:operationType
 * Get performance stats for a specific service and operation
 */
router.get('/service/:serviceName/:operationType', async (req, res) => {
  try {
    const { serviceName, operationType } = req.params;
    const { period = '24h' } = req.query;
    
    // Validate period
    const validPeriods = ['1h', '24h', '7d', '30d'];
    if (!validPeriods.includes(period as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be one of: 1h, 24h, 7d, 30d'
      });
    }
    
    const stats = await aiPerformanceMonitor.getPerformanceStats(
      serviceName,
      operationType,
      period as '1h' | '24h' | '7d' | '30d'
    );
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get service performance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve service performance stats'
    });
  }
});

/**
 * GET /api/monitoring/ai-performance/accuracy-trends
 * Get accuracy trends over time for all services
 */
router.get('/accuracy-trends', async (req, res) => {
  try {
    const { period = '7d', serviceName, operationType } = req.query;
    
    // This would need to be implemented in aiPerformanceMonitor
    // For now, return a basic response
    const trends = {
      propertyValuation: {
        dates: [],
        accuracy: [],
        confidence: []
      },
      investmentAnalysis: {
        dates: [],
        accuracy: [],
        confidence: []
      },
      marketPrediction: {
        dates: [],
        accuracy: [],
        confidence: []
      },
      leadScoring: {
        dates: [],
        accuracy: [],
        confidence: []
      }
    };
    
    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get accuracy trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve accuracy trends'
    });
  }
});

/**
 * GET /api/monitoring/ai-performance/costs
 * Get AI service cost breakdown
 */
router.get('/costs', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Get cost data for all services
    const [propertyValuation, investmentAnalysis, marketPrediction, leadScoring] = await Promise.all([
      aiPerformanceMonitor.getPerformanceStats('openai', 'property-valuation', period as any),
      aiPerformanceMonitor.getPerformanceStats('openai', 'investment-analysis', period as any),
      aiPerformanceMonitor.getPerformanceStats('openai', 'market-prediction', period as any),
      aiPerformanceMonitor.getPerformanceStats('openai', 'lead-scoring', period as any)
    ]);
    
    const costBreakdown = {
      totalCost: propertyValuation.totalCost + investmentAnalysis.totalCost + 
                 marketPrediction.totalCost + leadScoring.totalCost,
      breakdown: {
        propertyValuation: {
          cost: propertyValuation.totalCost,
          tokens: propertyValuation.totalTokensUsed,
          requests: propertyValuation.totalRequests,
          costPerRequest: propertyValuation.totalRequests > 0 
            ? propertyValuation.totalCost / propertyValuation.totalRequests 
            : 0
        },
        investmentAnalysis: {
          cost: investmentAnalysis.totalCost,
          tokens: investmentAnalysis.totalTokensUsed,
          requests: investmentAnalysis.totalRequests,
          costPerRequest: investmentAnalysis.totalRequests > 0 
            ? investmentAnalysis.totalCost / investmentAnalysis.totalRequests 
            : 0
        },
        marketPrediction: {
          cost: marketPrediction.totalCost,
          tokens: marketPrediction.totalTokensUsed,
          requests: marketPrediction.totalRequests,
          costPerRequest: marketPrediction.totalRequests > 0 
            ? marketPrediction.totalCost / marketPrediction.totalRequests 
            : 0
        },
        leadScoring: {
          cost: leadScoring.totalCost,
          tokens: leadScoring.totalTokensUsed,
          requests: leadScoring.totalRequests,
          costPerRequest: leadScoring.totalRequests > 0 
            ? leadScoring.totalCost / leadScoring.totalRequests 
            : 0
        }
      },
      period,
      projectedMonthlyCost: calculateMonthlyProjection(period as string, [
        propertyValuation, investmentAnalysis, marketPrediction, leadScoring
      ])
    };
    
    res.json({
      success: true,
      data: costBreakdown,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get AI costs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve AI costs'
    });
  }
});

/**
 * GET /api/monitoring/ai-performance/health
 * Get overall system health metrics
 */
router.get('/health', async (req, res) => {
  try {
    const dashboardStats = await aiPerformanceMonitor.getDashboardStats();
    
    // Calculate health score based on multiple factors
    const healthScore = calculateHealthScore(dashboardStats);
    
    const healthMetrics = {
      score: healthScore.score,
      status: healthScore.status,
      uptime: dashboardStats.overall.systemUptime,
      totalRequests24h: dashboardStats.overall.totalRequests24h,
      averageAccuracy: dashboardStats.overall.averageAccuracy,
      totalCost24h: dashboardStats.overall.totalCost24h,
      services: {
        propertyValuation: {
          successRate: dashboardStats.propertyValuation.successRate,
          avgResponseTime: dashboardStats.propertyValuation.averageResponseTime,
          accuracy: dashboardStats.propertyValuation.averageAccuracy
        },
        investmentAnalysis: {
          successRate: dashboardStats.investmentAnalysis.successRate,
          avgResponseTime: dashboardStats.investmentAnalysis.averageResponseTime,
          accuracy: dashboardStats.investmentAnalysis.averageAccuracy
        },
        marketPrediction: {
          successRate: dashboardStats.marketPrediction.successRate,
          avgResponseTime: dashboardStats.marketPrediction.averageResponseTime,
          accuracy: dashboardStats.marketPrediction.averageAccuracy
        },
        leadScoring: {
          successRate: dashboardStats.leadScoring.successRate,
          avgResponseTime: dashboardStats.leadScoring.averageResponseTime,
          accuracy: dashboardStats.leadScoring.averageAccuracy
        }
      },
      alerts: generateHealthAlerts(dashboardStats)
    };
    
    res.json({
      success: true,
      data: healthMetrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to get system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system health'
    });
  }
});

/**
 * POST /api/monitoring/ai-performance/validate
 * Validate a prediction against actual results
 */
router.post('/validate', async (req, res) => {
  try {
    const { requestId, serviceName, operationType, predicted, actual } = req.body;
    
    if (!requestId || !serviceName || !operationType || !predicted || !actual) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: requestId, serviceName, operationType, predicted, actual'
      });
    }
    
    await aiPerformanceMonitor.validatePrediction(
      serviceName,
      operationType,
      requestId,
      predicted,
      actual
    );
    
    res.json({
      success: true,
      message: 'Prediction validation submitted successfully'
    });
    
  } catch (error) {
    console.error('Failed to validate prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate prediction'
    });
  }
});

// Helper functions

/**
 * Calculate projected monthly cost based on current usage
 */
function calculateMonthlyProjection(period: string, stats: any[]): number {
  const totalCost = stats.reduce((sum, stat) => sum + stat.totalCost, 0);
  
  switch (period) {
    case '1h':
      return totalCost * 24 * 30; // Hour -> Month
    case '24h':
      return totalCost * 30; // Day -> Month
    case '7d':
      return (totalCost / 7) * 30; // Week -> Month
    case '30d':
      return totalCost; // Already monthly
    default:
      return totalCost;
  }
}

/**
 * Calculate overall system health score
 */
function calculateHealthScore(dashboardStats: any): { score: number; status: string } {
  const services = [dashboardStats.propertyValuation, dashboardStats.investmentAnalysis, 
                   dashboardStats.marketPrediction, dashboardStats.leadScoring];
  
  let totalScore = 0;
  let serviceCount = 0;
  
  for (const service of services) {
    if (service.totalRequests > 0) {
      serviceCount++;
      
      // Success rate (40% weight)
      const successScore = service.successRate * 40;
      
      // Response time (30% weight) - assume good if under 2000ms
      const responseScore = Math.max(0, (2000 - service.averageResponseTime) / 2000) * 30;
      
      // Accuracy (30% weight)
      const accuracyScore = (service.averageAccuracy || 0.8) * 30;
      
      totalScore += successScore + responseScore + accuracyScore;
    }
  }
  
  const averageScore = serviceCount > 0 ? totalScore / serviceCount : 0;
  
  let status = 'Unknown';
  if (averageScore >= 90) status = 'Excellent';
  else if (averageScore >= 80) status = 'Good';
  else if (averageScore >= 70) status = 'Fair';
  else if (averageScore >= 60) status = 'Poor';
  else status = 'Critical';
  
  return { score: Math.round(averageScore), status };
}

/**
 * Generate health alerts based on dashboard stats
 */
function generateHealthAlerts(dashboardStats: any): string[] {
  const alerts: string[] = [];
  
  const services = [
    { name: 'Property Valuation', data: dashboardStats.propertyValuation },
    { name: 'Investment Analysis', data: dashboardStats.investmentAnalysis },
    { name: 'Market Prediction', data: dashboardStats.marketPrediction },
    { name: 'Lead Scoring', data: dashboardStats.leadScoring }
  ];
  
  for (const service of services) {
    // Check success rate
    if (service.data.successRate < 0.95) {
      alerts.push(`${service.name} success rate is ${(service.data.successRate * 100).toFixed(1)}%`);
    }
    
    // Check response time
    if (service.data.averageResponseTime > 3000) {
      alerts.push(`${service.name} response time is ${service.data.averageResponseTime}ms`);
    }
    
    // Check accuracy
    if (service.data.averageAccuracy && service.data.averageAccuracy < 0.8) {
      alerts.push(`${service.name} accuracy is ${(service.data.averageAccuracy * 100).toFixed(1)}%`);
    }
  }
  
  // Check overall cost
  if (dashboardStats.overall.totalCost24h > 100) {
    alerts.push(`Daily AI costs are $${dashboardStats.overall.totalCost24h.toFixed(2)}`);
  }
  
  return alerts;
}

export default router;
