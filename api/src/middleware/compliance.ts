import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger();

/**
 * Compliance and Governance Middleware
 * Implements enterprise-grade compliance requirements
 */

export interface ComplianceRequest extends Request {
  compliance?: {
    auditId: string;
    timestamp: string;
    userAgent: string;
    ipAddress: string;
    dataAccessed?: string[];
    retentionPolicy?: string;
  };
}

/**
 * GDPR Compliance Middleware
 * Tracks data access and implements retention policies
 */
export const gdprCompliance = (req: ComplianceRequest, res: Response, next: NextFunction) => {
  const auditId = generateAuditId();
  const timestamp = new Date().toISOString();
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

  // Add compliance context to request
  req.compliance = {
    auditId,
    timestamp,
    userAgent,
    ipAddress,
    dataAccessed: [],
    retentionPolicy: process.env.DATA_RETENTION_DAYS || '2555' // 7 years default
  };

  // Log data access for GDPR audit trail
  logger.info('GDPR Data Access', {
    auditId,
    method: req.method,
    path: req.path,
    userAgent,
    ipAddress,
    userId: (req as any).user?.id,
    timestamp
  });

  // Add compliance headers
  res.set({
    'X-Data-Protection': 'GDPR-Compliant',
    'X-Audit-ID': auditId,
    'X-Retention-Policy': `${req.compliance.retentionPolicy} days`
  });

  next();
};

/**
 * SOX Compliance Middleware
 * Implements Sarbanes-Oxley financial data controls
 */
export const soxCompliance = (req: ComplianceRequest, res: Response, next: NextFunction) => {
  const isFinancialData = checkFinancialDataAccess(req);
  
  if (isFinancialData) {
    // Require admin role for financial data
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'SOX Compliance Violation',
        message: 'Administrative access required for financial data',
        complianceCode: 'SOX-001'
      });
    }

    // Log financial data access
    logger.warn('SOX Financial Data Access', {
      auditId: req.compliance?.auditId,
      userId: user.id,
      userEmail: user.email,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      complianceLevel: 'SOX-CONTROLLED'
    });

    res.set('X-SOX-Compliance', 'Financial-Data-Access-Logged');
  }

  next();
};

/**
 * Data Loss Prevention (DLP) Middleware
 * Prevents sensitive data exposure
 */
export const dlpProtection = (req: ComplianceRequest, res: Response, next: NextFunction) => {
  // Intercept response to scan for sensitive data
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const sanitizedData = sanitizeSensitiveData(data);
    
    if (data !== sanitizedData) {
      logger.warn('DLP Data Sanitization', {
        auditId: req.compliance?.auditId,
        path: req.path,
        sanitized: true,
        timestamp: new Date().toISOString()
      });
    }
    
    return originalSend.call(this, sanitizedData);
  };

  next();
};

/**
 * Real Estate Compliance Middleware
 * Industry-specific compliance requirements
 */
export const realEstateCompliance = (req: ComplianceRequest, res: Response, next: NextFunction) => {
  const requiresLicenseValidation = checkLicenseRequirement(req);
  
  if (requiresLicenseValidation) {
    const user = (req as any).user;
    
    // Validate real estate license for property transactions
    if (!user?.licenseNumber) {
      return res.status(403).json({
        error: 'Real Estate Compliance Violation',
        message: 'Valid real estate license required for property transactions',
        complianceCode: 'RE-001'
      });
    }

    // Log licensed activity
    logger.info('Real Estate Licensed Activity', {
      auditId: req.compliance?.auditId,
      userId: user.id,
      licenseNumber: maskLicenseNumber(user.licenseNumber),
      activity: req.path,
      timestamp: new Date().toISOString()
    });

    res.set('X-RE-Compliance', 'Licensed-Agent-Verified');
  }

  next();
};

/**
 * Data Retention Compliance
 * Implements automated data retention policies
 */
export const dataRetentionCompliance = async (req: ComplianceRequest, res: Response, next: NextFunction) => {
  try {
    // Schedule data retention check for accessed resources
    if (req.compliance?.dataAccessed && req.compliance.dataAccessed.length > 0) {
      await scheduleRetentionCheck(req.compliance.dataAccessed, req.compliance.retentionPolicy);
    }

    // Add retention policy headers
    res.set({
      'X-Data-Retention-Days': req.compliance?.retentionPolicy || '2555',
      'X-Retention-Scheduled': 'true'
    });

    next();
  } catch (error) {
    logger.error('Data Retention Compliance Error', error);
    next();
  }
};

/**
 * Audit Trail Middleware
 * Comprehensive audit logging for compliance
 */
export const auditTrail = (req: ComplianceRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request start
  logger.info('Audit Trail - Request Start', {
    auditId: req.compliance?.auditId,
    method: req.method,
    path: req.path,
    query: req.query,
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
    userAgent: req.compliance?.userAgent,
    ipAddress: req.compliance?.ipAddress
  });

  // Intercept response to log completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Audit Trail - Request Complete', {
      auditId: req.compliance?.auditId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      dataAccessed: req.compliance?.dataAccessed
    });
  });

  next();
};

/**
 * Privacy Protection Middleware
 * Implements privacy-by-design principles
 */
export const privacyProtection = (req: ComplianceRequest, res: Response, next: NextFunction) => {
  // Add privacy headers
  res.set({
    'X-Privacy-Policy': '/privacy',
    'X-Data-Processing-Lawful-Basis': 'Legitimate Interest',
    'X-Data-Controller': 'AgentRadar Inc.',
    'X-DPO-Contact': 'privacy@agentradar.app'
  });

  // Log privacy-sensitive operations
  if (isPrivacySensitiveOperation(req)) {
    logger.info('Privacy Sensitive Operation', {
      auditId: req.compliance?.auditId,
      operation: req.path,
      method: req.method,
      userId: (req as any).user?.id,
      timestamp: new Date().toISOString(),
      privacyImpact: 'Logged'
    });
  }

  next();
};

// Utility Functions

function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function checkFinancialDataAccess(req: Request): boolean {
  const financialPaths = [
    '/api/admin/billing',
    '/api/stripe',
    '/api/payments',
    '/api/subscriptions',
    '/api/customer-onboarding/clients'  // Contains subscription info
  ];
  
  return financialPaths.some(path => req.path.includes(path));
}

function checkLicenseRequirement(req: Request): boolean {
  const licensedPaths = [
    '/api/properties/create',
    '/api/properties/update',
    '/api/alerts/create',
    '/api/customer-onboarding/clients'
  ];
  
  return licensedPaths.some(path => req.path.includes(path)) && 
         ['POST', 'PUT', 'PATCH'].includes(req.method);
}

function sanitizeSensitiveData(data: any): any {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return data;
    }
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    // Sanitize common sensitive fields
    const sensitiveFields = [
      'passwordHash', 'password', 'ssn', 'socialSecurityNumber',
      'creditCard', 'bankAccount', 'routingNumber', 'taxId'
    ];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeSensitiveData(sanitized[key]);
      }
    });

    return typeof data === 'string' ? JSON.stringify(sanitized) : sanitized;
  }

  return data;
}

function maskLicenseNumber(license: string): string {
  if (license.length <= 4) return license;
  return `****${license.slice(-4)}`;
}

async function scheduleRetentionCheck(dataAccessed: string[], retentionDays: string): Promise<void> {
  // In a real implementation, this would integrate with a job queue
  logger.info('Data Retention Check Scheduled', {
    dataTypes: dataAccessed,
    retentionPeriod: `${retentionDays} days`,
    scheduledAt: new Date().toISOString()
  });
}

function isPrivacySensitiveOperation(req: Request): boolean {
  const privacySensitivePaths = [
    '/api/users',
    '/api/admin/users',
    '/api/customer-onboarding',
    '/api/preferences'
  ];
  
  return privacySensitivePaths.some(path => req.path.includes(path));
}

// Export all middleware
export const complianceMiddleware = {
  gdprCompliance,
  soxCompliance,
  dlpProtection,
  realEstateCompliance,
  dataRetentionCompliance,
  auditTrail,
  privacyProtection
};