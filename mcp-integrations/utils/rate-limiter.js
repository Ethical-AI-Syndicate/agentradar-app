/**
 * Production Rate Limiter and Municipal Compliance Manager
 * Ensures respectful scraping of municipal websites
 */

import { MUNICIPAL_SOURCES, SCRAPING_ETHICS, MUNICIPAL_HOLIDAYS_2025 } from '../config/municipal-sources.js';

export class MunicipalRateLimiter {
  constructor() {
    // Track requests per municipality
    this.municipalCounters = {};
    
    // Global request tracking
    this.globalCounters = {
      minute: { count: 0, resetTime: Date.now() + 60000 },
      hour: { count: 0, resetTime: Date.now() + 3600000 },
      day: { count: 0, resetTime: Date.now() + 86400000 }
    };
    
    // Error tracking
    this.errorCounters = {};
    
    // Initialize municipal counters
    this.initializeMunicipalCounters();
    
    // Cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
  }
  
  initializeMunicipalCounters() {
    Object.keys(MUNICIPAL_SOURCES).forEach(municipality => {
      this.municipalCounters[municipality] = {
        minute: { count: 0, resetTime: Date.now() + 60000 },
        hour: { count: 0, resetTime: Date.now() + 3600000 },
        day: { count: 0, resetTime: Date.now() + 86400000 },
        lastRequest: 0,
        consecutiveErrors: 0,
        cooldownUntil: 0
      };
      
      this.errorCounters[municipality] = {
        consecutive: 0,
        lastError: 0,
        cooldownUntil: 0
      };
    });
  }
  
  /**
   * Check if a request to a municipality is allowed
   */
  async canMakeRequest(municipality) {
    const now = Date.now();
    const source = MUNICIPAL_SOURCES[municipality];
    const counters = this.municipalCounters[municipality];
    const errors = this.errorCounters[municipality];
    
    if (!source || !counters) {
      throw new Error(`Unknown municipality: ${municipality}`);
    }
    
    // Check if currently in error cooldown
    if (errors.cooldownUntil > now) {
      const cooldownMinutes = Math.ceil((errors.cooldownUntil - now) / 60000);
      return {
        allowed: false,
        reason: 'error_cooldown',
        waitTime: errors.cooldownUntil - now,
        message: `In cooldown due to errors. Wait ${cooldownMinutes} minutes.`
      };
    }
    
    // Check business hours
    if (!this.isWithinBusinessHours(municipality)) {
      return {
        allowed: false,
        reason: 'outside_business_hours',
        message: 'Outside municipal business hours (8 AM - 6 PM Eastern, weekdays only)'
      };
    }
    
    // Check if it's a holiday
    if (this.isHoliday()) {
      return {
        allowed: false,
        reason: 'holiday',
        message: 'Municipal holiday - scraping paused'
      };
    }
    
    // Reset counters if needed
    this.resetCountersIfNeeded(municipality);
    this.resetGlobalCountersIfNeeded();
    
    // Check municipal rate limits
    const rateLimits = source.rateLimit;
    if (counters.minute.count >= rateLimits.requestsPerMinute) {
      return {
        allowed: false,
        reason: 'minute_limit_exceeded',
        waitTime: counters.minute.resetTime - now,
        message: `Municipal minute limit exceeded (${rateLimits.requestsPerMinute}/min)`
      };
    }
    
    if (counters.hour.count >= rateLimits.requestsPerHour) {
      return {
        allowed: false,
        reason: 'hour_limit_exceeded',
        waitTime: counters.hour.resetTime - now,
        message: `Municipal hour limit exceeded (${rateLimits.requestsPerHour}/hour)`
      };
    }
    
    if (counters.day.count >= rateLimits.requestsPerDay) {
      return {
        allowed: false,
        reason: 'day_limit_exceeded',
        waitTime: counters.day.resetTime - now,
        message: `Municipal daily limit exceeded (${rateLimits.requestsPerDay}/day)`
      };
    }
    
    // Check global rate limits
    const globalLimits = SCRAPING_ETHICS.globalRateLimit;
    if (this.globalCounters.minute.count >= globalLimits.requestsPerMinute) {
      return {
        allowed: false,
        reason: 'global_minute_limit',
        waitTime: this.globalCounters.minute.resetTime - now,
        message: `Global minute limit exceeded (${globalLimits.requestsPerMinute}/min)`
      };
    }
    
    if (this.globalCounters.hour.count >= globalLimits.requestsPerHour) {
      return {
        allowed: false,
        reason: 'global_hour_limit',
        waitTime: this.globalCounters.hour.resetTime - now,
        message: `Global hour limit exceeded (${globalLimits.requestsPerHour}/hour)`
      };
    }
    
    if (this.globalCounters.day.count >= globalLimits.requestsPerDay) {
      return {
        allowed: false,
        reason: 'global_day_limit',
        waitTime: this.globalCounters.day.resetTime - now,
        message: `Global daily limit exceeded (${globalLimits.requestsPerDay}/day)`
      };
    }
    
    // Check minimum delay between requests
    const timeSinceLastRequest = now - counters.lastRequest;
    const requiredDelay = rateLimits.delayBetweenRequests || 5000;
    
    if (timeSinceLastRequest < requiredDelay) {
      return {
        allowed: false,
        reason: 'delay_required',
        waitTime: requiredDelay - timeSinceLastRequest,
        message: `Must wait ${Math.ceil((requiredDelay - timeSinceLastRequest) / 1000)}s between requests`
      };
    }
    
    // All checks passed
    return {
      allowed: true,
      message: 'Request allowed'
    };
  }
  
  /**
   * Record a successful request
   */
  recordRequest(municipality) {
    const now = Date.now();
    const counters = this.municipalCounters[municipality];
    const errors = this.errorCounters[municipality];
    
    if (counters) {
      // Increment municipal counters
      counters.minute.count++;
      counters.hour.count++;
      counters.day.count++;
      counters.lastRequest = now;
      
      // Reset error counter on success
      errors.consecutive = 0;
      errors.cooldownUntil = 0;
    }
    
    // Increment global counters
    this.globalCounters.minute.count++;
    this.globalCounters.hour.count++;
    this.globalCounters.day.count++;
    
    console.log(`✓ Request recorded for ${municipality} (${counters?.minute.count}/min, ${counters?.hour.count}/hour, ${counters?.day.count}/day)`);
  }
  
  /**
   * Record an error and implement exponential backoff
   */
  recordError(municipality, error) {
    const now = Date.now();
    const errors = this.errorCounters[municipality];
    const source = MUNICIPAL_SOURCES[municipality];
    
    if (errors && source) {
      errors.consecutive++;
      errors.lastError = now;
      
      // Implement exponential backoff
      const backoffTime = Math.min(
        source.compliance.backoffMultiplier * Math.pow(2, errors.consecutive - 1),
        1800000 // Max 30 minutes
      );
      
      errors.cooldownUntil = now + backoffTime;
      
      console.error(`⚠️ Error recorded for ${municipality} (${errors.consecutive} consecutive). Cooldown: ${Math.ceil(backoffTime / 60000)}min`);
      
      // If too many consecutive errors, implement longer cooldown
      if (errors.consecutive >= SCRAPING_ETHICS.errorHandling.maxConsecutiveErrors) {
        errors.cooldownUntil = now + SCRAPING_ETHICS.errorHandling.cooldownAfterErrors;
        console.error(`🚫 Too many errors for ${municipality}. Extended cooldown: ${SCRAPING_ETHICS.errorHandling.cooldownAfterErrors / 60000}min`);
      }
    }
  }
  
  /**
   * Check if current time is within business hours for municipality
   */
  isWithinBusinessHours(municipality) {
    const source = MUNICIPAL_SOURCES[municipality];
    const globalEthics = SCRAPING_ETHICS.allowedHours;
    
    // Use municipal hours if specified, otherwise global
    const hours = source.businessHours || globalEthics;
    
    const now = new Date();
    const torontoTime = new Date(now.toLocaleString("en-US", {timeZone: hours.timezone || "America/Toronto"}));
    
    const currentHour = torontoTime.getHours();
    const currentDay = torontoTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Check if weekend (if not allowed)
    if (!hours.weekendsAllowed && (currentDay === 0 || currentDay === 6)) {
      return false;
    }
    
    // Check if within business hours
    return currentHour >= hours.start && currentHour < hours.end;
  }
  
  /**
   * Check if today is a municipal holiday
   */
  isHoliday() {
    const today = new Date().toISOString().split('T')[0];
    return MUNICIPAL_HOLIDAYS_2025.includes(today);
  }
  
  /**
   * Reset counters when time windows expire
   */
  resetCountersIfNeeded(municipality) {
    const now = Date.now();
    const counters = this.municipalCounters[municipality];
    
    if (counters) {
      if (now >= counters.minute.resetTime) {
        counters.minute.count = 0;
        counters.minute.resetTime = now + 60000;
      }
      
      if (now >= counters.hour.resetTime) {
        counters.hour.count = 0;
        counters.hour.resetTime = now + 3600000;
      }
      
      if (now >= counters.day.resetTime) {
        counters.day.count = 0;
        counters.day.resetTime = now + 86400000;
      }
    }
  }
  
  /**
   * Reset global counters when time windows expire
   */
  resetGlobalCountersIfNeeded() {
    const now = Date.now();
    
    if (now >= this.globalCounters.minute.resetTime) {
      this.globalCounters.minute.count = 0;
      this.globalCounters.minute.resetTime = now + 60000;
    }
    
    if (now >= this.globalCounters.hour.resetTime) {
      this.globalCounters.hour.count = 0;
      this.globalCounters.hour.resetTime = now + 3600000;
    }
    
    if (now >= this.globalCounters.day.resetTime) {
      this.globalCounters.day.count = 0;
      this.globalCounters.day.resetTime = now + 86400000;
    }
  }
  
  /**
   * Get current status for all municipalities
   */
  getStatus() {
    const status = {
      global: {
        minute: this.globalCounters.minute.count,
        hour: this.globalCounters.hour.count,
        day: this.globalCounters.day.count,
        withinBusinessHours: this.isWithinBusinessHours('toronto'), // Use Toronto as reference
        isHoliday: this.isHoliday()
      },
      municipalities: {}
    };
    
    Object.keys(MUNICIPAL_SOURCES).forEach(municipality => {
      const counters = this.municipalCounters[municipality];
      const errors = this.errorCounters[municipality];
      const source = MUNICIPAL_SOURCES[municipality];
      
      status.municipalities[municipality] = {
        name: source.name,
        requests: {
          minute: counters.minute.count,
          hour: counters.hour.count,
          day: counters.day.count
        },
        limits: {
          minute: source.rateLimit.requestsPerMinute,
          hour: source.rateLimit.requestsPerHour,
          day: source.rateLimit.requestsPerDay
        },
        errors: {
          consecutive: errors.consecutive,
          inCooldown: errors.cooldownUntil > Date.now(),
          cooldownMinutes: Math.max(0, Math.ceil((errors.cooldownUntil - Date.now()) / 60000))
        },
        withinBusinessHours: this.isWithinBusinessHours(municipality),
        lastRequest: new Date(counters.lastRequest).toISOString()
      };
    });
    
    return status;
  }
  
  /**
   * Cleanup old data
   */
  cleanup() {
    const now = Date.now();
    
    // Reset old error cooldowns
    Object.keys(this.errorCounters).forEach(municipality => {
      const errors = this.errorCounters[municipality];
      if (errors.cooldownUntil < now - 3600000) { // Clear old cooldowns after 1 hour
        errors.consecutive = 0;
        errors.cooldownUntil = 0;
      }
    });
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const rateLimiter = new MunicipalRateLimiter();