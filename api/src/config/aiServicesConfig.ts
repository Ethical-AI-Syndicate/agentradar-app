/**
 * AI Services and Real Estate Data Providers Configuration
 * Centralized configuration management for all external service integrations
 */

import { config } from 'dotenv';

// Load environment variables
config();

export interface AIServiceConfig {
  openai: {
    apiKey: string;
    orgId?: string;
    dailyBudget: number;
    rateLimitRpm: number;
    defaultModel: string;
    premiumModel: string;
    maxRetries: number;
    baseRetryDelay: number;
    requestTimeout: number;
  };
  anthropic: {
    apiKey: string;
    model: string;
    enabled: boolean;
  };
  performance: {
    maxRetries: number;
    baseRetryDelay: number;
    requestTimeout: number;
    rateLimitWindow: number;
  };
}

export interface RealEstateDataConfig {
  googleMaps: {
    apiKey: string;
    placesApiKey: string;
    enabled: boolean;
  };
  propertyApis: {
    zillow: { apiKey: string; enabled: boolean };
    realtor: { apiKey: string; enabled: boolean };
    redfin: { apiKey: string; enabled: boolean };
  };
  rentalApis: {
    rentspree: { apiKey: string; enabled: boolean };
    rentalsCom: { apiKey: string; enabled: boolean };
    padmap: { apiKey: string; enabled: boolean };
  };
  marketIntelligence: {
    corelogic: { apiKey: string; enabled: boolean };
    attomData: { apiKey: string; enabled: boolean };
    rentometer: { apiKey: string; enabled: boolean };
  };
  demographics: {
    walkScore: { apiKey: string; enabled: boolean };
    census: { apiKey: string; enabled: boolean };
    statsCanada: { apiKey: string; enabled: boolean };
  };
  assessment: {
    mpac: { apiKey: string; enabled: boolean };
    bcaaa: { apiKey: string; enabled: boolean };
  };
  legal: {
    firstAmerican: { apiKey: string; enabled: boolean };
    stewartTitle: { apiKey: string; enabled: boolean };
  };
  propertyHistory: {
    propstream: { apiKey: string; enabled: boolean };
    dataTree: { apiKey: string; enabled: boolean };
  };
  mls: {
    repliers: {
      apiKey: string;
      endpoint: string;
      region: string;
      rateLimit: number;
      enabled: boolean;
    };
    treb: {
      apiKey: string;
      secret: string;
      enabled: boolean;
    };
    realtorCa: {
      apiKey: string;
      enabled: boolean;
    };
    crmls: {
      username: string;
      password: string;
      enabled: boolean;
    };
  };
}

class AIServicesConfiguration {
  private static instance: AIServicesConfiguration;
  
  private aiConfig: AIServiceConfig;
  private realEstateConfig: RealEstateDataConfig;
  
  private constructor() {
    this.aiConfig = this.loadAIConfig();
    this.realEstateConfig = this.loadRealEstateConfig();
    this.validateConfiguration();
  }
  
  public static getInstance(): AIServicesConfiguration {
    if (!AIServicesConfiguration.instance) {
      AIServicesConfiguration.instance = new AIServicesConfiguration();
    }
    return AIServicesConfiguration.instance;
  }
  
  private loadAIConfig(): AIServiceConfig {
    return {
      openai: {
        apiKey: this.requireEnv('OPENAI_API_KEY'),
        orgId: process.env.OPENAI_ORG_ID,
        dailyBudget: parseInt(process.env.OPENAI_DAILY_BUDGET || '100'),
        rateLimitRpm: parseInt(process.env.OPENAI_RATE_LIMIT_RPM || '60'),
        defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
        premiumModel: process.env.OPENAI_PREMIUM_MODEL || 'gpt-4-turbo-preview',
        maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
        baseRetryDelay: parseInt(process.env.AI_BASE_RETRY_DELAY || '1000'),
        requestTimeout: parseInt(process.env.AI_REQUEST_TIMEOUT || '30000')
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet',
        enabled: !!process.env.ANTHROPIC_API_KEY
      },
      performance: {
        maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
        baseRetryDelay: parseInt(process.env.AI_BASE_RETRY_DELAY || '1000'),
        requestTimeout: parseInt(process.env.AI_REQUEST_TIMEOUT || '30000'),
        rateLimitWindow: parseInt(process.env.AI_RATE_LIMIT_WINDOW || '60000')
      }
    };
  }
  
  private loadRealEstateConfig(): RealEstateDataConfig {
    return {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        placesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
        enabled: !!process.env.GOOGLE_MAPS_API_KEY
      },
      propertyApis: {
        zillow: {
          apiKey: process.env.ZILLOW_API_KEY || '',
          enabled: !!process.env.ZILLOW_API_KEY
        },
        realtor: {
          apiKey: process.env.REALTOR_API_KEY || '',
          enabled: !!process.env.REALTOR_API_KEY
        },
        redfin: {
          apiKey: process.env.REDFIN_API_KEY || '',
          enabled: !!process.env.REDFIN_API_KEY
        }
      },
      rentalApis: {
        rentspree: {
          apiKey: process.env.RENTSPREE_API_KEY || '',
          enabled: !!process.env.RENTSPREE_API_KEY
        },
        rentalsCom: {
          apiKey: process.env.RENTALS_COM_API_KEY || '',
          enabled: !!process.env.RENTALS_COM_API_KEY
        },
        padmap: {
          apiKey: process.env.PADMAP_API_KEY || '',
          enabled: !!process.env.PADMAP_API_KEY
        }
      },
      marketIntelligence: {
        corelogic: {
          apiKey: process.env.CORELOGIC_API_KEY || '',
          enabled: !!process.env.CORELOGIC_API_KEY
        },
        attomData: {
          apiKey: process.env.ATTOM_DATA_API_KEY || '',
          enabled: !!process.env.ATTOM_DATA_API_KEY
        },
        rentometer: {
          apiKey: process.env.RENTOMETER_API_KEY || '',
          enabled: !!process.env.RENTOMETER_API_KEY
        }
      },
      demographics: {
        walkScore: {
          apiKey: process.env.WALK_SCORE_API_KEY || '',
          enabled: !!process.env.WALK_SCORE_API_KEY
        },
        census: {
          apiKey: process.env.CENSUS_API_KEY || '',
          enabled: !!process.env.CENSUS_API_KEY
        },
        statsCanada: {
          apiKey: process.env.STATS_CANADA_API_KEY || '',
          enabled: !!process.env.STATS_CANADA_API_KEY
        }
      },
      assessment: {
        mpac: {
          apiKey: process.env.MPAC_API_KEY || '',
          enabled: !!process.env.MPAC_API_KEY
        },
        bcaaa: {
          apiKey: process.env.BCAAA_API_KEY || '',
          enabled: !!process.env.BCAAA_API_KEY
        }
      },
      legal: {
        firstAmerican: {
          apiKey: process.env.FIRST_AMERICAN_API_KEY || '',
          enabled: !!process.env.FIRST_AMERICAN_API_KEY
        },
        stewartTitle: {
          apiKey: process.env.STEWART_TITLE_API_KEY || '',
          enabled: !!process.env.STEWART_TITLE_API_KEY
        }
      },
      propertyHistory: {
        propstream: {
          apiKey: process.env.PROPSTREAM_API_KEY || '',
          enabled: !!process.env.PROPSTREAM_API_KEY
        },
        dataTree: {
          apiKey: process.env.DATA_TREE_API_KEY || '',
          enabled: !!process.env.DATA_TREE_API_KEY
        }
      },
      mls: {
        repliers: {
          apiKey: process.env.REPLIERS_API_KEY || '',
          endpoint: process.env.REPLIERS_ENDPOINT || 'https://api.repliers.ca/v1',
          region: process.env.REPLIERS_REGION || 'GTA',
          rateLimit: parseInt(process.env.REPLIERS_RATE_LIMIT || '100'),
          enabled: !!process.env.REPLIERS_API_KEY
        },
        treb: {
          apiKey: process.env.TREB_API_KEY || '',
          secret: process.env.TREB_SECRET || '',
          enabled: process.env.TREB_ENABLED === 'true'
        },
        realtorCa: {
          apiKey: process.env.REALTOR_CA_API_KEY || '',
          enabled: process.env.REALTOR_CA_ENABLED === 'true'
        },
        crmls: {
          username: process.env.CRMLS_USERNAME || '',
          password: process.env.CRMLS_PASSWORD || '',
          enabled: process.env.CRMLS_ENABLED === 'true'
        }
      }
    };
  }
  
  private validateConfiguration(): void {
    const errors: string[] = [];
    
    // Validate critical AI services
    if (!this.aiConfig.openai.apiKey) {
      errors.push('OPENAI_API_KEY is required for AI services');
    }
    
    // Validate at least one data source is available
    const hasPropertyDataSource = this.hasAnyPropertyDataSource();
    const hasRentalDataSource = this.hasAnyRentalDataSource();
    const hasMapService = this.realEstateConfig.googleMaps.enabled;
    
    if (!hasPropertyDataSource) {
      console.warn('⚠️  No property data sources configured. Property analysis may be limited.');
    }
    
    if (!hasRentalDataSource) {
      console.warn('⚠️  No rental data sources configured. Investment analysis may be limited.');
    }
    
    if (!hasMapService) {
      console.warn('⚠️  Google Maps API not configured. Address validation may be limited.');
    }
    
    if (errors.length > 0) {
      throw new Error(`Configuration errors:\n${errors.join('\n')}`);
    }
    
    console.log('✅ AI Services configuration validated successfully');
    this.logServiceStatus();
  }
  
  private requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }
  
  private hasAnyPropertyDataSource(): boolean {
    return Object.values(this.realEstateConfig.propertyApis).some(api => api.enabled) ||
           Object.values(this.realEstateConfig.mls).some(mls => mls.enabled);
  }
  
  private hasAnyRentalDataSource(): boolean {
    return Object.values(this.realEstateConfig.rentalApis).some(api => api.enabled);
  }
  
  private logServiceStatus(): void {
    const enabledServices: string[] = [];
    const disabledServices: string[] = [];
    
    // Check AI services
    enabledServices.push('OpenAI GPT-4');
    if (this.aiConfig.anthropic.enabled) enabledServices.push('Anthropic Claude');
    
    // Check data services
    if (this.realEstateConfig.googleMaps.enabled) enabledServices.push('Google Maps');
    if (this.realEstateConfig.propertyApis.zillow.enabled) enabledServices.push('Zillow');
    if (this.realEstateConfig.mls.repliers.enabled) enabledServices.push('Repliers MLS');
    if (this.realEstateConfig.demographics.walkScore.enabled) enabledServices.push('Walk Score');
    
    // Count disabled services
    const totalPropertyServices = Object.keys(this.realEstateConfig.propertyApis).length;
    const enabledPropertyServices = Object.values(this.realEstateConfig.propertyApis).filter(api => api.enabled).length;
    const disabledPropertyServices = totalPropertyServices - enabledPropertyServices;
    
    if (disabledPropertyServices > 0) {
      disabledServices.push(`${disabledPropertyServices} Property APIs`);
    }
    
    console.log(`🟢 Enabled services: ${enabledServices.join(', ')}`);
    if (disabledServices.length > 0) {
      console.log(`🟡 Disabled services: ${disabledServices.join(', ')}`);
    }
  }
  
  // Public getters
  public get ai(): AIServiceConfig {
    return this.aiConfig;
  }
  
  public get realEstate(): RealEstateDataConfig {
    return this.realEstateConfig;
  }
  
  // Service availability checks
  public isOpenAIAvailable(): boolean {
    return !!this.aiConfig.openai.apiKey;
  }
  
  public isAnthropicAvailable(): boolean {
    return this.aiConfig.anthropic.enabled;
  }
  
  public isGoogleMapsAvailable(): boolean {
    return this.realEstateConfig.googleMaps.enabled;
  }
  
  public getAvailablePropertyAPIs(): string[] {
    const apis: string[] = [];
    
    Object.entries(this.realEstateConfig.propertyApis).forEach(([name, config]) => {
      if (config.enabled) apis.push(name);
    });
    
    Object.entries(this.realEstateConfig.mls).forEach(([name, config]) => {
      if (config.enabled) apis.push(`${name}-mls`);
    });
    
    return apis;
  }
  
  public getAvailableRentalAPIs(): string[] {
    return Object.entries(this.realEstateConfig.rentalApis)
      .filter(([_, config]) => config.enabled)
      .map(([name, _]) => name);
  }
  
  // Configuration updates (for admin panel)
  public updateOpenAIBudget(newBudget: number): void {
    this.aiConfig.openai.dailyBudget = newBudget;
    console.log(`📊 OpenAI daily budget updated to $${newBudget}`);
  }
  
  public updateRateLimit(service: string, newLimit: number): void {
    if (service === 'openai') {
      this.aiConfig.openai.rateLimitRpm = newLimit;
      console.log(`⚡ OpenAI rate limit updated to ${newLimit} RPM`);
    }
  }
}

// Export singleton instance
export const aiServicesConfig = AIServicesConfiguration.getInstance();

// Export configuration types for use in other services
export { AIServicesConfiguration };

// Utility function for services to check configuration
export function requireAIService(serviceName: string): void {
  switch (serviceName.toLowerCase()) {
    case 'openai':
      if (!aiServicesConfig.isOpenAIAvailable()) {
        throw new Error('OpenAI service is not configured. Please set OPENAI_API_KEY.');
      }
      break;
    case 'anthropic':
      if (!aiServicesConfig.isAnthropicAvailable()) {
        throw new Error('Anthropic service is not configured. Please set ANTHROPIC_API_KEY.');
      }
      break;
    case 'googlemaps':
      if (!aiServicesConfig.isGoogleMapsAvailable()) {
        throw new Error('Google Maps service is not configured. Please set GOOGLE_MAPS_API_KEY.');
      }
      break;
    default:
      console.warn(`Unknown service name: ${serviceName}`);
  }
}