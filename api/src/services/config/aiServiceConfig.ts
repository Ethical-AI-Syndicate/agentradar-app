/**
 * AI Service Configuration Manager
 * Centralized configuration for all AI services and external APIs
 * Handles environment variables, rate limits, and service settings
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  project?: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
    tokensPerMinute: number;
  };
}

export interface AnthropicConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
    tokensPerMinute: number;
  };
}

export interface RealEstateDataConfig {
  mlsApi: {
    enabled: boolean;
    apiKey?: string;
    baseURL?: string;
    rateLimits: {
      requestsPerHour: number;
      requestsPerDay: number;
    };
  };
  zillowApi: {
    enabled: boolean;
    apiKey?: string;
    baseURL?: string;
    rateLimits: {
      requestsPerHour: number;
      requestsPerDay: number;
    };
  };
  realtorApi: {
    enabled: boolean;
    apiKey?: string;
    baseURL?: string;
    rateLimits: {
      requestsPerHour: number;
      requestsPerDay: number;
    };
  };
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsRetentionDays: number;
  alertThresholds: {
    successRate: number;
    responseTime: number;
    accuracy: number;
    dailyCostLimit: number;
  };
  notificationChannels: {
    email?: string[];
    slack?: {
      webhookUrl: string;
      channel: string;
    };
    discord?: {
      webhookUrl: string;
    };
  };
}

export interface AIServiceConfig {
  openai: OpenAIConfig;
  anthropic: AnthropicConfig;
  realEstateData: RealEstateDataConfig;
  monitoring: MonitoringConfig;
  features: {
    propertyValuation: boolean;
    investmentAnalysis: boolean;
    marketPrediction: boolean;
    leadScoring: boolean;
    chatbot: boolean;
  };
  cost: {
    budgetLimits: {
      dailyLimit: number;
      monthlyLimit: number;
    };
    priceTracking: boolean;
    costOptimization: boolean;
  };
}

class AIServiceConfigManager {
  private static instance: AIServiceConfigManager;
  private config: AIServiceConfig;
  
  private constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }
  
  public static getInstance(): AIServiceConfigManager {
    if (!AIServiceConfigManager.instance) {
      AIServiceConfigManager.instance = new AIServiceConfigManager();
    }
    return AIServiceConfigManager.instance;
  }
  
  /**
   * Get the complete configuration
   */
  public getConfig(): AIServiceConfig {
    return this.config;
  }
  
  /**
   * Get OpenAI configuration
   */
  public getOpenAIConfig(): OpenAIConfig {
    return this.config.openai;
  }
  
  /**
   * Get Anthropic configuration
   */
  public getAnthropicConfig(): AnthropicConfig {
    return this.config.anthropic;
  }
  
  /**
   * Get real estate data providers configuration
   */
  public getRealEstateDataConfig(): RealEstateDataConfig {
    return this.config.realEstateData;
  }
  
  /**
   * Get monitoring configuration
   */
  public getMonitoringConfig(): MonitoringConfig {
    return this.config.monitoring;
  }
  
  /**
   * Check if a specific AI feature is enabled
   */
  public isFeatureEnabled(feature: keyof AIServiceConfig['features']): boolean {
    return this.config.features[feature];
  }
  
  /**
   * Get cost configuration
   */
  public getCostConfig() {
    return this.config.cost;
  }
  
  /**
   * Update configuration dynamically (for admin operations)
   */
  public updateConfig(updates: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfiguration();
    console.log('🔧 AI service configuration updated');
  }
  
  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): AIServiceConfig {
    return {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseURL: process.env.OPENAI_BASE_URL,
        organization: process.env.OPENAI_ORGANIZATION,
        project: process.env.OPENAI_PROJECT,
        defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
        retryAttempts: parseInt(process.env.OPENAI_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.OPENAI_RETRY_DELAY || '1000'),
        rateLimits: {
          requestsPerMinute: parseInt(process.env.OPENAI_RPM || '60'),
          requestsPerDay: parseInt(process.env.OPENAI_RPD || '10000'),
          tokensPerMinute: parseInt(process.env.OPENAI_TPM || '40000')
        }
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        baseURL: process.env.ANTHROPIC_BASE_URL,
        defaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet-20240229',
        maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
        timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '30000'),
        retryAttempts: parseInt(process.env.ANTHROPIC_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.ANTHROPIC_RETRY_DELAY || '1000'),
        rateLimits: {
          requestsPerMinute: parseInt(process.env.ANTHROPIC_RPM || '50'),
          requestsPerDay: parseInt(process.env.ANTHROPIC_RPD || '5000'),
          tokensPerMinute: parseInt(process.env.ANTHROPIC_TPM || '40000')
        }
      },
      realEstateData: {
        mlsApi: {
          enabled: process.env.MLS_API_ENABLED === 'true',
          apiKey: process.env.MLS_API_KEY,
          baseURL: process.env.MLS_API_BASE_URL,
          rateLimits: {
            requestsPerHour: parseInt(process.env.MLS_API_RPH || '100'),
            requestsPerDay: parseInt(process.env.MLS_API_RPD || '1000')
          }
        },
        zillowApi: {
          enabled: process.env.ZILLOW_API_ENABLED === 'true',
          apiKey: process.env.ZILLOW_API_KEY,
          baseURL: process.env.ZILLOW_API_BASE_URL || 'https://api.zillow.com',
          rateLimits: {
            requestsPerHour: parseInt(process.env.ZILLOW_API_RPH || '500'),
            requestsPerDay: parseInt(process.env.ZILLOW_API_RPD || '5000')
          }
        },
        realtorApi: {
          enabled: process.env.REALTOR_API_ENABLED === 'true',
          apiKey: process.env.REALTOR_API_KEY,
          baseURL: process.env.REALTOR_API_BASE_URL,
          rateLimits: {
            requestsPerHour: parseInt(process.env.REALTOR_API_RPH || '1000'),
            requestsPerDay: parseInt(process.env.REALTOR_API_RPD || '10000')
          }
        }
      },
      monitoring: {
        enabled: process.env.AI_MONITORING_ENABLED !== 'false',
        metricsRetentionDays: parseInt(process.env.METRICS_RETENTION_DAYS || '90'),
        alertThresholds: {
          successRate: parseFloat(process.env.ALERT_SUCCESS_RATE_THRESHOLD || '0.95'),
          responseTime: parseInt(process.env.ALERT_RESPONSE_TIME_THRESHOLD || '3000'),
          accuracy: parseFloat(process.env.ALERT_ACCURACY_THRESHOLD || '0.80'),
          dailyCostLimit: parseFloat(process.env.ALERT_DAILY_COST_LIMIT || '100')
        },
        notificationChannels: {
          email: process.env.ALERT_EMAIL_RECIPIENTS?.split(','),
          slack: process.env.ALERT_SLACK_WEBHOOK_URL ? {
            webhookUrl: process.env.ALERT_SLACK_WEBHOOK_URL,
            channel: process.env.ALERT_SLACK_CHANNEL || '#alerts'
          } : undefined,
          discord: process.env.ALERT_DISCORD_WEBHOOK_URL ? {
            webhookUrl: process.env.ALERT_DISCORD_WEBHOOK_URL
          } : undefined
        }
      },
      features: {
        propertyValuation: process.env.FEATURE_PROPERTY_VALUATION !== 'false',
        investmentAnalysis: process.env.FEATURE_INVESTMENT_ANALYSIS !== 'false',
        marketPrediction: process.env.FEATURE_MARKET_PREDICTION !== 'false',
        leadScoring: process.env.FEATURE_LEAD_SCORING !== 'false',
        chatbot: process.env.FEATURE_CHATBOT !== 'false'
      },
      cost: {
        budgetLimits: {
          dailyLimit: parseFloat(process.env.AI_DAILY_BUDGET_LIMIT || '100'),
          monthlyLimit: parseFloat(process.env.AI_MONTHLY_BUDGET_LIMIT || '2000')
        },
        priceTracking: process.env.AI_PRICE_TRACKING !== 'false',
        costOptimization: process.env.AI_COST_OPTIMIZATION !== 'false'
      }
    };
  }
  
  /**
   * Validate the loaded configuration
   */
  private validateConfiguration(): void {
    const errors: string[] = [];
    
    // Validate OpenAI configuration
    if (!this.config.openai.apiKey && this.requiresOpenAI()) {
      errors.push('OPENAI_API_KEY is required but not provided');
    }
    
    // Validate Anthropic configuration  
    if (!this.config.anthropic.apiKey && this.requiresAnthropic()) {
      errors.push('ANTHROPIC_API_KEY is required but not provided');
    }
    
    // Validate real estate data APIs
    if (this.config.realEstateData.mlsApi.enabled && !this.config.realEstateData.mlsApi.apiKey) {
      console.warn('⚠️ MLS API is enabled but no API key provided - using mock data');
    }
    
    if (this.config.realEstateData.zillowApi.enabled && !this.config.realEstateData.zillowApi.apiKey) {
      console.warn('⚠️ Zillow API is enabled but no API key provided - using mock data');
    }
    
    // Validate budget limits
    if (this.config.cost.budgetLimits.dailyLimit <= 0) {
      errors.push('Daily budget limit must be greater than 0');
    }
    
    if (this.config.cost.budgetLimits.monthlyLimit <= 0) {
      errors.push('Monthly budget limit must be greater than 0');
    }
    
    if (this.config.cost.budgetLimits.dailyLimit * 30 > this.config.cost.budgetLimits.monthlyLimit) {
      console.warn('⚠️ Daily budget limit * 30 exceeds monthly limit');
    }
    
    // Log errors and warnings
    if (errors.length > 0) {
      console.error('❌ Configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Invalid AI service configuration');
    }
    
    console.log('✅ AI service configuration validated successfully');
    
    // Log active features
    const activeFeatures = Object.entries(this.config.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature);
    
    if (activeFeatures.length > 0) {
      console.log(`🚀 Active AI features: ${activeFeatures.join(', ')}`);
    }
  }
  
  /**
   * Check if any features require OpenAI
   */
  private requiresOpenAI(): boolean {
    return Object.values(this.config.features).some(enabled => enabled);
  }
  
  /**
   * Check if any features require Anthropic
   */
  private requiresAnthropic(): boolean {
    // Currently using OpenAI for all features, but this could change
    return false;
  }
  
  /**
   * Get environment-specific configuration status
   */
  public getConfigurationStatus() {
    return {
      environment: process.env.NODE_ENV || 'development',
      aiServices: {
        openai: {
          configured: !!this.config.openai.apiKey,
          model: this.config.openai.defaultModel,
          rateLimits: this.config.openai.rateLimits
        },
        anthropic: {
          configured: !!this.config.anthropic.apiKey,
          model: this.config.anthropic.defaultModel,
          rateLimits: this.config.anthropic.rateLimits
        }
      },
      dataProviders: {
        mls: {
          enabled: this.config.realEstateData.mlsApi.enabled,
          configured: !!this.config.realEstateData.mlsApi.apiKey
        },
        zillow: {
          enabled: this.config.realEstateData.zillowApi.enabled,
          configured: !!this.config.realEstateData.zillowApi.apiKey
        },
        realtor: {
          enabled: this.config.realEstateData.realtorApi.enabled,
          configured: !!this.config.realEstateData.realtorApi.apiKey
        }
      },
      features: this.config.features,
      monitoring: {
        enabled: this.config.monitoring.enabled,
        alertsConfigured: !!(
          this.config.monitoring.notificationChannels.email ||
          this.config.monitoring.notificationChannels.slack ||
          this.config.monitoring.notificationChannels.discord
        )
      },
      budgets: this.config.cost.budgetLimits
    };
  }
}

// Export singleton instance
export const aiServiceConfig = AIServiceConfigManager.getInstance();

// Export types and manager class
export { AIServiceConfigManager };