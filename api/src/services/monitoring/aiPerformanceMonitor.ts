/**
 * AI Performance Monitoring Service
 * Tracks real accuracy metrics, response times, and service reliability
 * Replaces mock accuracy claims with actual performance data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AIServiceMetrics {
  serviceName: string;
  operationType: string;
  responseTime: number;
  success: boolean;
  accuracy?: number;
  confidence?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  errorMessage?: string;
  timestamp: Date;
}

export interface PerformanceStats {
  serviceName: string;
  operationType: string;
  period: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  averageResponseTime: number;
  averageAccuracy?: number;
  averageConfidence?: number;
  totalTokensUsed: number;
  totalCost: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  lastUpdated: Date;
}

export interface ValidationResult {
  predicted: any;
  actual: any;
  accuracy: number;
  confidence: number;
  validatedAt: Date;
}

class AIPerformanceMonitor {
  private static instance: AIPerformanceMonitor;
  
  private validationQueue: Map<string, ValidationResult> = new Map();
  private realtimeMetrics: Map<string, AIServiceMetrics[]> = new Map();
  
  private constructor() {
    // Start periodic cleanup and aggregation
    setInterval(() => this.performCleanup(), 5 * 60 * 1000); // 5 minutes
    setInterval(() => this.aggregateMetrics(), 15 * 60 * 1000); // 15 minutes
  }
  
  public static getInstance(): AIPerformanceMonitor {
    if (!AIPerformanceMonitor.instance) {
      AIPerformanceMonitor.instance = new AIPerformanceMonitor();
    }
    return AIPerformanceMonitor.instance;
  }
  
  /**
   * Track an AI service call
   */
  async trackAICall(metrics: AIServiceMetrics): Promise<void> {
    try {
      // Store in database
      await prisma.aiServiceMetrics.create({
        data: {
          serviceName: metrics.serviceName,
          operationType: metrics.operationType,
          responseTime: metrics.responseTime,
          success: metrics.success,
          accuracy: metrics.accuracy,
          confidence: metrics.confidence,
          promptTokens: metrics.tokenUsage?.promptTokens,
          completionTokens: metrics.tokenUsage?.completionTokens,
          totalTokens: metrics.tokenUsage?.totalTokens,
          cost: metrics.cost,
          errorMessage: metrics.errorMessage,
          timestamp: metrics.timestamp
        }
      });
      
      // Store in memory for real-time monitoring
      const key = `${metrics.serviceName}-${metrics.operationType}`;
      if (!this.realtimeMetrics.has(key)) {
        this.realtimeMetrics.set(key, []);
      }
      
      const realtimeData = this.realtimeMetrics.get(key)!;
      realtimeData.push(metrics);
      
      // Keep only last 100 entries in memory
      if (realtimeData.length > 100) {
        realtimeData.shift();
      }
      
    } catch (error) {
      console.error('Failed to track AI call:', error);
    }
  }
  
  /**
   * Validate prediction accuracy against actual results
   */
  async validatePrediction(
    serviceName: string,
    operationType: string,
    requestId: string,
    predicted: any,
    actual: any
  ): Promise<void> {
    try {
      let accuracy = 0;
      let confidence = 0;
      
      // Calculate accuracy based on operation type
      switch (operationType) {
        case 'property-valuation':
          accuracy = this.calculateValuationAccuracy(predicted, actual);
          confidence = predicted.confidence || 0;
          break;
          
        case 'investment-analysis':
          accuracy = this.calculateInvestmentAccuracy(predicted, actual);
          confidence = predicted.confidence || 0;
          break;
          
        case 'market-prediction':
          accuracy = this.calculateMarketPredictionAccuracy(predicted, actual);
          confidence = predicted.confidence || 0;
          break;
          
        case 'lead-scoring':
          accuracy = this.calculateLeadScoringAccuracy(predicted, actual);
          confidence = predicted.confidence || 0;
          break;
          
        default:
          console.warn(`Unknown operation type for accuracy validation: ${operationType}`);
          return;
      }
      
      // Store validation result
      const validation: ValidationResult = {
        predicted,
        actual,
        accuracy,
        confidence,
        validatedAt: new Date()
      };
      
      this.validationQueue.set(requestId, validation);
      
      // Update the original metrics record with accuracy
      await prisma.aiServiceMetrics.updateMany({
        where: {
          serviceName,
          operationType,
          // Match by timestamp within reasonable window
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        data: {
          validatedAccuracy: accuracy,
          validatedAt: new Date()
        }
      });
      
      console.log(`📊 Accuracy validated for ${serviceName}/${operationType}: ${(accuracy * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.error('Failed to validate prediction:', error);
    }
  }
  
  /**
   * Get performance statistics for a service
   */
  async getPerformanceStats(
    serviceName: string,
    operationType: string,
    period: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<PerformanceStats> {
    try {
      const periodMs = this.getPeriodMilliseconds(period);
      const since = new Date(Date.now() - periodMs);
      
      const metrics = await prisma.aiServiceMetrics.findMany({
        where: {
          serviceName,
          operationType,
          timestamp: { gte: since }
        },
        orderBy: { timestamp: 'desc' }
      });
      
      if (metrics.length === 0) {
        return {
          serviceName,
          operationType,
          period,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          successRate: 0,
          averageResponseTime: 0,
          averageAccuracy: undefined,
          averageConfidence: undefined,
          totalTokensUsed: 0,
          totalCost: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          lastUpdated: new Date()
        };
      }
      
      const successfulRequests = metrics.filter(m => m.success).length;
      const failedRequests = metrics.length - successfulRequests;
      const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
      
      // Calculate accuracy and confidence averages
      const validatedMetrics = metrics.filter(m => m.validatedAccuracy !== null);
      const accuracyMetrics = metrics.filter(m => m.accuracy !== null);
      const confidenceMetrics = metrics.filter(m => m.confidence !== null);
      
      const averageAccuracy = validatedMetrics.length > 0 
        ? validatedMetrics.reduce((sum, m) => sum + (m.validatedAccuracy || 0), 0) / validatedMetrics.length
        : accuracyMetrics.length > 0
          ? accuracyMetrics.reduce((sum, m) => sum + (m.accuracy || 0), 0) / accuracyMetrics.length
          : undefined;
      
      return {
        serviceName,
        operationType,
        period,
        totalRequests: metrics.length,
        successfulRequests,
        failedRequests,
        successRate: successfulRequests / metrics.length,
        averageResponseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
        averageAccuracy,
        averageConfidence: confidenceMetrics.length > 0 
          ? confidenceMetrics.reduce((sum, m) => sum + (m.confidence || 0), 0) / confidenceMetrics.length
          : undefined,
        totalTokensUsed: metrics.reduce((sum, m) => sum + (m.totalTokens || 0), 0),
        totalCost: metrics.reduce((sum, m) => sum + (m.cost || 0), 0),
        p95ResponseTime: this.calculatePercentile(responseTimes, 0.95),
        p99ResponseTime: this.calculatePercentile(responseTimes, 0.99),
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error('Failed to get performance stats:', error);
      throw error;
    }
  }
  
  /**
   * Get overall system performance dashboard
   */
  async getDashboardStats(): Promise<{
    propertyValuation: PerformanceStats;
    investmentAnalysis: PerformanceStats;
    marketPrediction: PerformanceStats;
    leadScoring: PerformanceStats;
    overall: {
      totalRequests24h: number;
      averageAccuracy: number;
      systemUptime: number;
      totalCost24h: number;
    };
  }> {
    try {
      const [propertyValuation, investmentAnalysis, marketPrediction, leadScoring] = await Promise.all([
        this.getPerformanceStats('openai', 'property-valuation', '24h'),
        this.getPerformanceStats('openai', 'investment-analysis', '24h'),
        this.getPerformanceStats('openai', 'market-prediction', '24h'),
        this.getPerformanceStats('openai', 'lead-scoring', '24h')
      ]);
      
      const totalRequests24h = propertyValuation.totalRequests + 
                              investmentAnalysis.totalRequests + 
                              marketPrediction.totalRequests + 
                              leadScoring.totalRequests;
      
      const accuracyValues = [propertyValuation, investmentAnalysis, marketPrediction, leadScoring]
        .map(s => s.averageAccuracy)
        .filter((acc): acc is number => acc !== undefined);
      
      const averageAccuracy = accuracyValues.length > 0 
        ? accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length
        : 0;
      
      const totalCost24h = propertyValuation.totalCost + 
                          investmentAnalysis.totalCost + 
                          marketPrediction.totalCost + 
                          leadScoring.totalCost;
      
      return {
        propertyValuation,
        investmentAnalysis,
        marketPrediction,
        leadScoring,
        overall: {
          totalRequests24h,
          averageAccuracy,
          systemUptime: this.calculateSystemUptime(),
          totalCost24h
        }
      };
      
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      throw error;
    }
  }
  
  /**
   * Calculate property valuation accuracy
   */
  private calculateValuationAccuracy(predicted: any, actual: any): number {
    if (!predicted.estimatedValue || !actual.soldPrice) {
      return 0;
    }
    
    const error = Math.abs(predicted.estimatedValue - actual.soldPrice) / actual.soldPrice;
    return Math.max(0, 1 - error); // Convert error to accuracy (0-1)
  }
  
  /**
   * Calculate investment analysis accuracy
   */
  private calculateInvestmentAccuracy(predicted: any, actual: any): number {
    if (!predicted.capRate || !actual.actualCapRate) {
      return 0;
    }
    
    const predictedRate = parseFloat(predicted.capRate.replace('%', ''));
    const actualRate = parseFloat(actual.actualCapRate.replace('%', ''));
    
    const error = Math.abs(predictedRate - actualRate) / Math.max(actualRate, 1);
    return Math.max(0, 1 - error);
  }
  
  /**
   * Calculate market prediction accuracy
   */
  private calculateMarketPredictionAccuracy(predicted: any, actual: any): number {
    if (!predicted.priceGrowth || !actual.actualPriceGrowth) {
      return 0;
    }
    
    const error = Math.abs(predicted.priceGrowth - actual.actualPriceGrowth) / Math.max(Math.abs(actual.actualPriceGrowth), 1);
    return Math.max(0, 1 - error);
  }
  
  /**
   * Calculate lead scoring accuracy
   */
  private calculateLeadScoringAccuracy(predicted: any, actual: any): number {
    if (!predicted.score || actual.converted === undefined) {
      return 0;
    }
    
    // Score vs conversion accuracy
    const threshold = 70; // Scores above 70 should convert
    const predictedConversion = predicted.score >= threshold;
    const actualConversion = actual.converted;
    
    return predictedConversion === actualConversion ? 1 : 0;
  }
  
  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.min(index, sortedArray.length - 1)];
  }
  
  /**
   * Convert period string to milliseconds
   */
  private getPeriodMilliseconds(period: string): number {
    switch (period) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }
  
  /**
   * Calculate system uptime
   */
  private calculateSystemUptime(): number {
    // This would typically check service health over the last 24 hours
    // For now, return a basic calculation based on successful requests
    const recentMetrics = Array.from(this.realtimeMetrics.values()).flat();
    if (recentMetrics.length === 0) return 1.0;
    
    const successfulCalls = recentMetrics.filter(m => m.success).length;
    return successfulCalls / recentMetrics.length;
  }
  
  /**
   * Perform periodic cleanup of old data
   */
  private async performCleanup(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Clean up old metrics (keep last 30 days)
      await prisma.aiServiceMetrics.deleteMany({
        where: {
          timestamp: { lt: thirtyDaysAgo }
        }
      });
      
      // Clear old validation queue entries
      const validationEntries = Array.from(this.validationQueue.entries());
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      
      for (const [key, validation] of validationEntries) {
        if (validation.validatedAt.getTime() < cutoff) {
          this.validationQueue.delete(key);
        }
      }
      
    } catch (error) {
      console.error('Failed to perform cleanup:', error);
    }
  }
  
  /**
   * Aggregate metrics for reporting
   */
  private async aggregateMetrics(): Promise<void> {
    try {
      // This would create hourly/daily aggregations for faster reporting
      console.log('📈 Aggregating performance metrics...');
      
      // Implementation would create summary tables for faster dashboard queries
      // For now, just log the aggregation event
      
    } catch (error) {
      console.error('Failed to aggregate metrics:', error);
    }
  }
}

// Export singleton instance
export const aiPerformanceMonitor = AIPerformanceMonitor.getInstance();

// Export types
export { AIPerformanceMonitor };
