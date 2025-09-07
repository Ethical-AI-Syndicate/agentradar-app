/**
 * Municipal Development Applications Configuration
 * Production-ready configuration with rate limiting and compliance
 */

export const MUNICIPAL_SOURCES = {
  toronto: {
    name: 'City of Toronto',
    baseUrl: 'https://www.toronto.ca',
    developmentAppsUrl: process.env.TORONTO_DEV_APPS_URL || 'https://www.toronto.ca/city-government/planning-development/application-information-centre/',
    
    // Rate limiting configuration (respectful of municipal servers)
    rateLimit: {
      requestsPerMinute: 10,
      requestsPerHour: 120,
      requestsPerDay: 1000,
      delayBetweenRequests: 6000, // 6 seconds
    },
    
    // Legal compliance settings
    compliance: {
      respectRobotsTxt: true,
      userAgent: 'AgentRadar/1.0 (+https://agentradar.app/contact)',
      maxConcurrentRequests: 2,
      honorRetryAfter: true,
      maxRetries: 3,
      backoffMultiplier: 2000
    },
    
    // Data parsing configuration
    selectors: {
      applications: '.application-item, .dev-application',
      title: '.application-title, h3, .title',
      address: '.address, .property-address',
      type: '.application-type, .app-type',
      status: '.status, .application-status',
      date: '.date, .filing-date',
      details: '.details, .description'
    },
    
    // Supported application types
    applicationTypes: {
      rezoning: 'Official Plan Amendment/Zoning By-law Amendment',
      demolition: 'Demolition Control',
      subdivision: 'Plan of Subdivision',
      variance: 'Committee of Adjustment',
      conversion: 'Site Plan Control'
    },
    
    // Business hours for respectful scraping
    businessHours: {
      start: 9, // 9 AM
      end: 17,  // 5 PM
      timezone: 'America/Toronto',
      weekendsAllowed: false
    }
  },

  mississauga: {
    name: 'City of Mississauga',
    baseUrl: 'https://www.mississauga.ca',
    developmentAppsUrl: process.env.MISSISSAUGA_DEV_APPS_URL || 'https://www.mississauga.ca/services-and-programs/planning-and-development/',
    
    rateLimit: {
      requestsPerMinute: 8,
      requestsPerHour: 100,
      requestsPerDay: 800,
      delayBetweenRequests: 8000, // 8 seconds - more conservative
    },
    
    compliance: {
      respectRobotsTxt: true,
      userAgent: 'AgentRadar/1.0 (+https://agentradar.app/contact)',
      maxConcurrentRequests: 1, // More conservative for smaller municipality
      honorRetryAfter: true,
      maxRetries: 2,
      backoffMultiplier: 3000
    },
    
    selectors: {
      applications: '.planning-application, .development-item',
      title: '.app-title, h4, .header',
      address: '.location, .address',
      type: '.category, .app-category',
      status: '.current-status, .status',
      date: '.submission-date, .date',
      details: '.summary, .description'
    },
    
    applicationTypes: {
      rezoning: 'Zoning By-law Amendment',
      demolition: 'Demolition Permit',
      subdivision: 'Draft Plan of Subdivision',
      variance: 'Minor Variance',
      conversion: 'Site Plan Application'
    },
    
    businessHours: {
      start: 9,
      end: 16,
      timezone: 'America/Toronto',
      weekendsAllowed: false
    }
  },

  brampton: {
    name: 'City of Brampton',
    baseUrl: 'https://www.brampton.ca',
    developmentAppsUrl: process.env.BRAMPTON_DEV_APPS_URL || 'https://www.brampton.ca/EN/Business/planning-development/',
    
    rateLimit: {
      requestsPerMinute: 6,
      requestsPerHour: 80,
      requestsPerDay: 600,
      delayBetweenRequests: 10000, // 10 seconds
    },
    
    compliance: {
      respectRobotsTxt: true,
      userAgent: 'AgentRadar/1.0 (+https://agentradar.app/contact)',
      maxConcurrentRequests: 1,
      honorRetryAfter: true,
      maxRetries: 2,
      backoffMultiplier: 5000
    },
    
    selectors: {
      applications: '.planning-app, .development-application',
      title: '.application-name, h3',
      address: '.property-location, .address',
      type: '.application-type, .type',
      status: '.status-indicator, .status',
      date: '.received-date, .date',
      details: '.application-details, .details'
    },
    
    applicationTypes: {
      rezoning: 'Official Plan/Zoning Amendment',
      demolition: 'Heritage Demolition',
      subdivision: 'Plan of Subdivision',
      variance: 'Committee of Adjustment',
      conversion: 'Site Plan Control'
    },
    
    businessHours: {
      start: 9,
      end: 16,
      timezone: 'America/Toronto',
      weekendsAllowed: false
    }
  },

  vaughan: {
    name: 'City of Vaughan',
    baseUrl: 'https://www.vaughan.ca',
    developmentAppsUrl: process.env.VAUGHAN_DEV_APPS_URL || 'https://www.vaughan.ca/services/planning/development-applications',
    
    rateLimit: {
      requestsPerMinute: 5,
      requestsPerHour: 60,
      requestsPerDay: 500,
      delayBetweenRequests: 12000, // 12 seconds
    },
    
    compliance: {
      respectRobotsTxt: true,
      userAgent: 'AgentRadar/1.0 (+https://agentradar.app/contact)',
      maxConcurrentRequests: 1,
      honorRetryAfter: true,
      maxRetries: 2,
      backoffMultiplier: 6000
    },
    
    selectors: {
      applications: '.dev-application, .planning-item',
      title: '.app-title, .title',
      address: '.address, .location',
      type: '.app-type, .category',
      status: '.status',
      date: '.date-submitted, .date',
      details: '.description, .summary'
    },
    
    applicationTypes: {
      rezoning: 'Zoning By-law Amendment',
      demolition: 'Demolition Application',
      subdivision: 'Draft Plan of Subdivision',
      variance: 'Minor Variance Application',
      conversion: 'Site Plan Application'
    },
    
    businessHours: {
      start: 8,
      end: 16,
      timezone: 'America/Toronto',
      weekendsAllowed: false
    }
  },

  markham: {
    name: 'City of Markham',
    baseUrl: 'https://www.markham.ca',
    developmentAppsUrl: process.env.MARKHAM_DEV_APPS_URL || 'https://www.markham.ca/wps/portal/home/business/planning-building-development/',
    
    rateLimit: {
      requestsPerMinute: 4,
      requestsPerHour: 50,
      requestsPerDay: 400,
      delayBetweenRequests: 15000, // 15 seconds - very respectful
    },
    
    compliance: {
      respectRobotsTxt: true,
      userAgent: 'AgentRadar/1.0 (+https://agentradar.app/contact)',
      maxConcurrentRequests: 1,
      honorRetryAfter: true,
      maxRetries: 2,
      backoffMultiplier: 8000
    },
    
    selectors: {
      applications: '.planning-application, .development-item',
      title: '.application-title, h4',
      address: '.property-address, .location',
      type: '.application-category, .type',
      status: '.current-status, .status',
      date: '.submission-date, .received-date',
      details: '.application-summary, .description'
    },
    
    applicationTypes: {
      rezoning: 'Official Plan/Zoning Amendment',
      demolition: 'Demolition Control',
      subdivision: 'Plan of Subdivision',
      variance: 'Minor Variance',
      conversion: 'Site Plan Control'
    },
    
    businessHours: {
      start: 8,
      end: 16,
      timezone: 'America/Toronto',
      weekendsAllowed: false
    }
  },

  oakville: {
    name: 'Town of Oakville',
    baseUrl: 'https://www.oakville.ca',
    developmentAppsUrl: process.env.OAKVILLE_DEV_APPS_URL || 'https://www.oakville.ca/business-development/planning-development/',
    
    rateLimit: {
      requestsPerMinute: 4,
      requestsPerHour: 40,
      requestsPerDay: 300,
      delayBetweenRequests: 15000, // 15 seconds
    },
    
    compliance: {
      respectRobotsTxt: true,
      userAgent: 'AgentRadar/1.0 (+https://agentradar.app/contact)',
      maxConcurrentRequests: 1,
      honorRetryAfter: true,
      maxRetries: 1, // Very conservative for smaller town
      backoffMultiplier: 10000
    },
    
    selectors: {
      applications: '.development-application, .planning-app',
      title: '.app-name, .title',
      address: '.address, .property-location',
      type: '.application-type, .category',
      status: '.status',
      date: '.date-received, .filing-date',
      details: '.summary, .details'
    },
    
    applicationTypes: {
      rezoning: 'Zoning By-law Amendment',
      demolition: 'Demolition Application',
      subdivision: 'Plan of Subdivision',
      variance: 'Minor Variance',
      conversion: 'Site Plan Control'
    },
    
    businessHours: {
      start: 8,
      end: 15,
      timezone: 'America/Toronto',
      weekendsAllowed: false
    }
  }
};

/**
 * Global compliance and ethical scraping settings
 */
export const SCRAPING_ETHICS = {
  // Honor robots.txt for all municipalities
  respectRobotsTxt: true,
  
  // Maximum total concurrent requests across all municipalities
  globalMaxConcurrent: 3,
  
  // Global rate limiting (across all municipalities)
  globalRateLimit: {
    requestsPerMinute: 20,
    requestsPerHour: 300,
    requestsPerDay: 2000
  },
  
  // Time windows for respectful scraping
  allowedHours: {
    start: 8,  // 8 AM
    end: 18,   // 6 PM
    timezone: 'America/Toronto',
    weekendsAllowed: false,
    holidaysAllowed: false
  },
  
  // Error handling and backoff
  errorHandling: {
    maxConsecutiveErrors: 5,
    cooldownAfterErrors: 300000, // 5 minutes
    respectHttpErrorCodes: [429, 503, 502],
    logAllRequests: process.env.NODE_ENV !== 'production'
  },
  
  // Legal compliance
  legal: {
    contactEmail: 'legal@agentradar.app',
    userAgent: 'AgentRadar/1.0 (+https://agentradar.app/contact)',
    purposeStatement: 'Real estate market intelligence for licensed professionals',
    dataRetentionDays: 90,
    honorOptOut: true
  }
};

/**
 * Municipal holidays when scraping should be paused
 */
export const MUNICIPAL_HOLIDAYS_2025 = [
  '2025-01-01', // New Year's Day
  '2025-02-17', // Family Day (Ontario)
  '2025-04-18', // Good Friday
  '2025-05-19', // Victoria Day
  '2025-07-01', // Canada Day
  '2025-08-04', // Civic Holiday (Ontario)
  '2025-09-01', // Labour Day
  '2025-10-13', // Thanksgiving
  '2025-12-25', // Christmas Day
  '2025-12-26'  // Boxing Day
];

export default MUNICIPAL_SOURCES;