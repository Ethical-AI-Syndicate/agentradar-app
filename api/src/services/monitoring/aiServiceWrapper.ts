/**
 * AI Service Wrapper with Performance Monitoring
 * Automatically tracks metrics for all AI service calls
 * Provides consistent error handling and retry logic
 */

import { aiPerformanceMonitor, AIServiceMetrics } from './aiPerformanceMonitor';
import { v4 as uuidv4 } from 'uuid';

export interface AICallOptions {
  serviceName: string;
  operationType: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  trackAccuracy?: boolean;
}

export interface AICallResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId: string;
  responseTime: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  confidence?: number;
  accuracy?: number;
}

/**
 * Wrapper for AI service calls with automatic performance monitoring
 */
export class AIServiceWrapper {
  private static instance: AIServiceWrapper;
  
  private constructor() {}
  
  public static getInstance(): AIServiceWrapper {
    if (!AIServiceWrapper.instance) {
      AIServiceWrapper.instance = new AIServiceWrapper();
    }
    return AIServiceWrapper.instance;
  }
  
  /**
   * Execute an AI service call with monitoring
   */
  async executeAICall<T>(
    callFunction: () => Promise<T>,
    options: AICallOptions
  ): Promise<AICallResult<T>> {
    const requestId = uuidv4();
    const startTime = Date.now();
    let responseTime = 0;
    let success = false;
    let error: string | undefined;
    let data: T | undefined;
    let tokenUsage: any;
    let cost: number | undefined;
    let confidence: number | undefined;
    let accuracy: number | undefined;
    
    try {
      // Execute the AI call with timeout
      const result = await this.executeWithTimeout(
        callFunction,
        options.timeout || 30000
      );
      
      success = true;
      data = result;
      responseTime = Date.now() - startTime;
      
      // Extract metadata from AI response if available
      if (result && typeof result === 'object') {
        const resultObj = result as any;
        
        // OpenAI response structure
        if (resultObj.usage) {
          tokenUsage = {
            promptTokens: resultObj.usage.prompt_tokens,
            completionTokens: resultObj.usage.completion_tokens,
            totalTokens: resultObj.usage.total_tokens
          };
          
          // Calculate cost based on OpenAI pricing
          cost = this.calculateOpenAICost(tokenUsage, options.operationType);
        }
        
        // Extract confidence/accuracy from custom response
        if (resultObj.confidence !== undefined) {
          confidence = resultObj.confidence;
        }
        if (resultObj.accuracy !== undefined) {
          accuracy = resultObj.accuracy;
        }
      }
      
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      responseTime = Date.now() - startTime;
      
      // Implement retry logic for transient errors
      if (this.shouldRetry(err) && (options.retryAttempts || 0) > 0) {
        await this.delay(options.retryDelay || 1000);
        return this.executeAICall(callFunction, {
          ...options,
          retryAttempts: (options.retryAttempts || 0) - 1
        });
      }
    }
    
    // Track metrics
    const metrics: AIServiceMetrics = {
      serviceName: options.serviceName,
      operationType: options.operationType,
      responseTime,
      success,
      accuracy,
      confidence,
      tokenUsage,
      cost,
      errorMessage: error,
      timestamp: new Date()
    };
    
    try {
      await aiPerformanceMonitor.trackAICall(metrics);
    } catch (trackingError) {
      console.error('Failed to track AI metrics:', trackingError);
      // Don't fail the main call due to tracking errors
    }
    
    return {
      success,
      data,
      error,
      requestId,
      responseTime,
      tokenUsage,
      cost,
      confidence,
      accuracy
    };
  }
  
  /**
   * Validate a prediction against actual results
   */
  async validatePrediction(
    requestId: string,
    serviceName: string,
    operationType: string,
    predicted: any,
    actual: any
  ): Promise<void> {
    try {
      await aiPerformanceMonitor.validatePrediction(
        serviceName,
        operationType,
        requestId,
        predicted,
        actual
      );
    } catch (error) {
      console.error('Failed to validate prediction:', error);
    }
  }
  
  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`AI call timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      
      fn()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
  
  /**
   * Calculate OpenAI cost based on token usage
   */
  private calculateOpenAICost(
    tokenUsage: any,
    operationType: string
  ): number {
    if (!tokenUsage) return 0;
    
    // OpenAI GPT-4 pricing (as of 2024)
    // These rates should be moved to environment variables
    const rates = {
      'gpt-4': {
        promptTokens: 0.03 / 1000,    // $0.03 per 1K tokens
        completionTokens: 0.06 / 1000 // $0.06 per 1K tokens
      },
      'gpt-3.5-turbo': {
        promptTokens: 0.0015 / 1000,   // $0.0015 per 1K tokens
        completionTokens: 0.002 / 1000 // $0.002 per 1K tokens
      }
    };
    
    // Default to GPT-4 rates
    const rate = rates['gpt-4'];
    
    const promptCost = (tokenUsage.promptTokens || 0) * rate.promptTokens;
    const completionCost = (tokenUsage.completionTokens || 0) * rate.completionTokens;
    
    return promptCost + completionCost;
  }
  
  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: any): boolean {
    if (!error) return false;
    
    const retryableErrors = [
      'rate_limit_exceeded',
      'timeout',
      'network_error',
      'server_error',
      '429',
      '500',
      '502',
      '503',
      '504'
    ];
    
    const errorMessage = (error.message || '').toLowerCase();
    const errorCode = error.status || error.code;
    
    return retryableErrors.some(retryable => 
      errorMessage.includes(retryable) || 
      errorCode === retryable ||
      String(errorCode) === retryable
    );
  }
  
  /**
   * Delay execution for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const aiServiceWrapper = AIServiceWrapper.getInstance();

// Export types and utilities
export { AIServiceWrapper };