import * as Sentry from "@sentry/node";

interface AICallMetrics {
  operation: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
  latency: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

interface AITraceContext {
  operation: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemMessage?: string;
  userPrompt?: string;
  inputData?: any;
}

/**
 * AI Performance Monitoring Wrapper
 * 
 * Provides comprehensive monitoring for AI operations including:
 * - Performance traces with Sentry
 * - Token usage tracking
 * - Cost monitoring
 * - Error handling and reporting
 * - Success/failure metrics
 * 
 * Usage:
 * const result = await withAIMonitoring(
 *   'property-analysis',
 *   { model: 'gpt-4-turbo', inputData: propertyData },
 *   async () => {
 *     return await openai.chat.completions.create({...});
 *   }
 * );
 */
export class AIPerformanceMonitor {
  private static instance: AIPerformanceMonitor;
  private metrics: AICallMetrics[] = [];
  private dailyTokens: number = 0;
  private dailyCost: number = 0;
  private lastResetDate: string = new Date().toDateString();

  private constructor() {
    // Reset daily counters if needed
    this.resetDailyCountersIfNeeded();
  }

  static getInstance(): AIPerformanceMonitor {
    if (!AIPerformanceMonitor.instance) {
      AIPerformanceMonitor.instance = new AIPerformanceMonitor();
    }
    return AIPerformanceMonitor.instance;
  }

  /**
   * Wrap AI operations with comprehensive monitoring
   */
  async withAIMonitoring<T>(
    operationName: string,
    context: AITraceContext,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const transaction = Sentry.startTransaction({
      name: `AI Operation: ${operationName}`,
      op: 'ai.inference',
      tags: {
        'ai.model': context.model || 'unknown',
        'ai.operation': operationName,
        'ai.temperature': context.temperature?.toString(),
        'ai.max_tokens': context.maxTokens?.toString(),
      },
      data: {
        operation: operationName,
        model: context.model,
        temperature: context.temperature,
        maxTokens: context.maxTokens,
        // Don't log full prompts in production for privacy
        systemMessageLength: context.systemMessage?.length,
        userPromptLength: context.userPrompt?.length,
        inputDataType: context.inputData ? typeof context.inputData : 'none',
      }
    });

    // Create a span for the AI call
    const span = transaction.startChild({
      op: 'ai.completion',
      description: `${context.model || 'AI'} completion for ${operationName}`,
      tags: {
        'ai.model': context.model || 'unknown',
        'ai.operation': operationName,
      }
    });

    try {
      // Execute the operation
      const result = await operation();

      // Calculate metrics
      const latency = Date.now() - startTime;
      
      // Extract token usage from common result formats
      const tokenUsage = this.extractTokenUsage(result);
      const cost = this.calculateCost(tokenUsage, context.model);

      // Update daily counters
      this.dailyTokens += tokenUsage.totalTokens || 0;
      this.dailyCost += cost;

      // Record metrics
      const metrics: AICallMetrics = {
        operation: operationName,
        model: context.model,
        promptTokens: tokenUsage.promptTokens,
        completionTokens: tokenUsage.completionTokens,
        totalTokens: tokenUsage.totalTokens,
        cost,
        latency,
        success: true,
        timestamp: new Date(),
      };

      this.recordMetrics(metrics);

      // Set span attributes
      span.setTag('ai.success', true);
      span.setTag('ai.latency_ms', latency);
      span.setData('ai.token_usage', tokenUsage);
      span.setData('ai.cost', cost);

      // Set transaction attributes
      transaction.setTag('ai.success', true);
      transaction.setTag('ai.latency_ms', latency);
      transaction.setData('ai.metrics', metrics);

      // Log performance info
      console.log(`🤖 AI Operation: ${operationName}`, {
        model: context.model,
        latency: `${latency}ms`,
        tokens: tokenUsage.totalTokens,
        cost: `$${cost.toFixed(4)}`,
        success: true
      });

      return result;

    } catch (error: any) {
      const latency = Date.now() - startTime;
      
      // Record error metrics
      const metrics: AICallMetrics = {
        operation: operationName,
        model: context.model,
        latency,
        success: false,
        error: error.message,
        timestamp: new Date(),
      };

      this.recordMetrics(metrics);

      // Set span error attributes
      span.setTag('ai.success', false);
      span.setTag('ai.latency_ms', latency);
      span.setTag('error', true);
      span.setData('ai.error', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });

      // Set transaction error attributes
      transaction.setTag('ai.success', false);
      transaction.setTag('ai.latency_ms', latency);
      transaction.setTag('error', true);

      // Report to Sentry with AI context
      Sentry.withScope((scope) => {
        scope.setTag('ai.operation', operationName);
        scope.setTag('ai.model', context.model || 'unknown');
        scope.setContext('ai_call', {
          operation: operationName,
          model: context.model,
          latency,
          error: error.message,
        });
        scope.setLevel('error');
        Sentry.captureException(error);
      });

      // Log error
      console.error(`❌ AI Operation Failed: ${operationName}`, {
        model: context.model,
        latency: `${latency}ms`,
        error: error.message,
      });

      throw error;

    } finally {
      // Finish spans
      span.finish();
      transaction.finish();
    }
  }

  /**
   * Track custom AI metrics
   */
  trackCustomMetric(
    operationName: string,
    metricName: string,
    value: number,
    tags?: Record<string, string>
  ) {
    // Send custom metric to Sentry
    Sentry.addBreadcrumb({
      category: 'ai.metric',
      message: `${operationName}: ${metricName} = ${value}`,
      level: 'info',
      data: {
        operation: operationName,
        metric: metricName,
        value,
        ...tags,
      },
    });

    console.log(`📊 AI Metric: ${operationName}.${metricName}`, {
      value,
      ...tags,
    });
  }

  /**
   * Create an AI performance span for manual tracking
   */
  createAISpan(operationName: string, context: Partial<AITraceContext>) {
    return Sentry.startTransaction({
      name: `AI Operation: ${operationName}`,
      op: 'ai.inference',
      tags: {
        'ai.model': context.model || 'unknown',
        'ai.operation': operationName,
      },
      data: context,
    });
  }

  /**
   * Get daily usage statistics
   */
  getDailyStats(): {
    totalTokens: number;
    totalCost: number;
    totalCalls: number;
    successRate: number;
    averageLatency: number;
    date: string;
  } {
    const today = new Date().toDateString();
    const todayMetrics = this.metrics.filter(
      m => m.timestamp.toDateString() === today
    );

    const totalCalls = todayMetrics.length;
    const successfulCalls = todayMetrics.filter(m => m.success).length;
    const successRate = totalCalls > 0 ? successfulCalls / totalCalls : 0;
    const averageLatency = totalCalls > 0 
      ? todayMetrics.reduce((sum, m) => sum + m.latency, 0) / totalCalls
      : 0;

    return {
      totalTokens: this.dailyTokens,
      totalCost: this.dailyCost,
      totalCalls,
      successRate,
      averageLatency,
      date: today,
    };
  }

  /**
   * Get operation-specific statistics
   */
  getOperationStats(operationName: string, hours: number = 24): {
    totalCalls: number;
    successRate: number;
    averageLatency: number;
    totalTokens: number;
    totalCost: number;
    errors: string[];
  } {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const relevantMetrics = this.metrics.filter(
      m => m.operation === operationName && m.timestamp >= since
    );

    const totalCalls = relevantMetrics.length;
    const successfulCalls = relevantMetrics.filter(m => m.success).length;
    const successRate = totalCalls > 0 ? successfulCalls / totalCalls : 0;
    const averageLatency = totalCalls > 0
      ? relevantMetrics.reduce((sum, m) => sum + m.latency, 0) / totalCalls
      : 0;
    const totalTokens = relevantMetrics.reduce((sum, m) => sum + (m.totalTokens || 0), 0);
    const totalCost = relevantMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);
    const errors = relevantMetrics
      .filter(m => !m.success && m.error)
      .map(m => m.error!)
      .filter((error, index, array) => array.indexOf(error) === index);

    return {
      totalCalls,
      successRate,
      averageLatency,
      totalTokens,
      totalCost,
      errors,
    };
  }

  /**
   * Send daily summary to Sentry
   */
  sendDailySummary() {
    const stats = this.getDailyStats();
    
    // Send as a custom event to Sentry
    Sentry.addBreadcrumb({
      category: 'ai.daily_summary',
      message: `Daily AI Usage Summary: ${stats.totalCalls} calls, $${stats.totalCost.toFixed(2)} cost`,
      level: 'info',
      data: stats,
    });

    // Log for visibility
    console.log('📈 Daily AI Usage Summary:', stats);

    // Alert if costs are high
    if (stats.totalCost > 50) {
      Sentry.withScope((scope) => {
        scope.setTag('alert.type', 'high_ai_cost');
        scope.setLevel('warning');
        scope.setContext('ai_usage', stats);
        Sentry.captureMessage(`High daily AI cost: $${stats.totalCost.toFixed(2)}`, 'warning');
      });
    }

    // Alert if success rate is low
    if (stats.successRate < 0.9 && stats.totalCalls > 10) {
      Sentry.withScope((scope) => {
        scope.setTag('alert.type', 'low_success_rate');
        scope.setLevel('warning');
        scope.setContext('ai_usage', stats);
        Sentry.captureMessage(`Low AI success rate: ${(stats.successRate * 100).toFixed(1)}%`, 'warning');
      });
    }
  }

  private extractTokenUsage(result: any): {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  } {
    // Handle OpenAI response format
    if (result && result.usage) {
      return {
        promptTokens: result.usage.prompt_tokens,
        completionTokens: result.usage.completion_tokens,
        totalTokens: result.usage.total_tokens,
      };
    }

    // Handle other formats or no usage info
    return {};
  }

  private calculateCost(
    tokenUsage: { promptTokens?: number; completionTokens?: number; totalTokens?: number },
    model?: string
  ): number {
    if (!tokenUsage.totalTokens && !tokenUsage.promptTokens && !tokenUsage.completionTokens) {
      return 0;
    }

    // Pricing per 1K tokens (as of 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-vision-preview': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-3.5-turbo-instruct': { input: 0.0015, output: 0.002 },
    };

    const modelKey = model || 'gpt-4o-mini';
    const rates = pricing[modelKey] || pricing['gpt-4o-mini'];

    if (tokenUsage.promptTokens && tokenUsage.completionTokens) {
      // Calculate exact cost based on input/output tokens
      const inputCost = (tokenUsage.promptTokens / 1000) * rates.input;
      const outputCost = (tokenUsage.completionTokens / 1000) * rates.output;
      return inputCost + outputCost;
    } else if (tokenUsage.totalTokens) {
      // Estimate cost using average rate
      const avgRate = (rates.input + rates.output) / 2;
      return (tokenUsage.totalTokens / 1000) * avgRate;
    }

    return 0;
  }

  private recordMetrics(metrics: AICallMetrics) {
    this.metrics.push(metrics);

    // Keep only recent metrics (last 24 hours)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= dayAgo);
  }

  private resetDailyCountersIfNeeded() {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.dailyTokens = 0;
      this.dailyCost = 0;
      this.lastResetDate = today;
      
      // Send previous day's summary if we have data
      if (this.metrics.length > 0) {
        this.sendDailySummary();
      }
    }
  }
}

// Global instance
export const aiMonitor = AIPerformanceMonitor.getInstance();

/**
 * Convenience function for wrapping AI operations
 */
export const withAIMonitoring = <T>(
  operationName: string,
  context: AITraceContext,
  operation: () => Promise<T>
): Promise<T> => {
  return aiMonitor.withAIMonitoring(operationName, context, operation);
};

/**
 * Convenience function for tracking custom AI metrics
 */
export const trackAIMetric = (
  operationName: string,
  metricName: string,
  value: number,
  tags?: Record<string, string>
) => {
  aiMonitor.trackCustomMetric(operationName, metricName, value, tags);
};