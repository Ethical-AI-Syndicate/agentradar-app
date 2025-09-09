/**
 * Comprehensive Input Validation Middleware
 * Addresses Phase 1 Security Assessment findings
 * Implements enterprise-grade input sanitization and validation
 */

import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
// Note: DOMPurify removed as dependency was cleaned up

function sanitizeString(input: string): string {
  return input.replace(/<script[^>]*>.*?<\/script>/gi, '')
              .replace(/<[^>]*>/g, '')
              .trim();
}
import { AlertType, Priority, UserRole, SubscriptionTier } from '@prisma/client';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// User registration validation
export const registerValidationSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s\-']+$/)
    .required()
    .messages({
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes',
      'string.min': 'First name is required',
      'string.max': 'First name must not exceed 50 characters'
    }),
  
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s\-']+$/)
    .required()
    .messages({
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
      'string.min': 'Last name is required',
      'string.max': 'Last name must not exceed 50 characters'
    }),
  
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(100)
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must not exceed 100 characters'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters'
    }),
  
  company: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .optional(),
  
  phone: Joi.string()
    .trim()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
});

// Login validation
export const loginValidationSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(100)
    .lowercase()
    .required(),
  
  password: Joi.string()
    .min(1)
    .max(128)
    .required()
});

// Alert creation validation
export const alertValidationSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .custom((value, helpers) => {
      // XSS prevention
      const sanitized = sanitizeString(value);
      if (sanitized !== value) {
        return helpers.error('any.invalid');
      }
      return sanitized;
    })
    .messages({
      'any.invalid': 'Title contains invalid characters or potential security threats',
      'string.max': 'Title must not exceed 255 characters'
    }),
  
  alertType: Joi.string()
    .valid(...Object.values(AlertType))
    .required()
    .messages({
      'any.only': `Alert type must be one of: ${Object.values(AlertType).join(', ')}`
    }),
  
  priority: Joi.string()
    .valid(...Object.values(Priority))
    .optional()
    .messages({
      'any.only': `Priority must be one of: ${Object.values(Priority).join(', ')}`
    }),
  
  description: Joi.string()
    .trim()
    .max(2000)
    .allow('')
    .optional()
    .custom((value, helpers) => {
      if (!value) return value;
      const sanitized = sanitizeString(value);
      if (sanitized !== value) {
        return helpers.error('any.invalid');
      }
      return sanitized;
    }),
  
  estimatedValue: Joi.number()
    .min(0)
    .max(999999999)
    .optional()
    .messages({
      'number.min': 'Estimated value cannot be negative',
      'number.max': 'Estimated value exceeds maximum allowed value'
    }),
  
  city: Joi.string()
    .trim()
    .max(100)
    .optional()
    .custom((value, helpers) => {
      if (!value) return value;
      // Only allow letters, spaces, hyphens, and apostrophes for city names
      if (!/^[a-zA-Z\s\-']+$/.test(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
  
  address: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .custom((value, helpers) => {
      if (!value) return value;
      const sanitized = sanitizeString(value);
      if (sanitized !== value) {
        return helpers.error('any.invalid');
      }
      return sanitized;
    }),
  
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .optional(),
  
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .optional(),
  
  opportunityScore: Joi.number()
    .min(0)
    .max(100)
    .optional()
});

// User preferences validation
export const preferencesValidationSchema = Joi.object({
  alertTypes: Joi.array()
    .items(Joi.string().valid(...Object.values(AlertType)))
    .min(1)
    .max(10)
    .unique()
    .optional(),
  
  cities: Joi.array()
    .items(Joi.string().trim().max(100).pattern(/^[a-zA-Z\s\-']+$/))
    .max(20)
    .unique()
    .optional(),
  
  minPriority: Joi.string()
    .valid(...Object.values(Priority))
    .optional(),
  
  maxDistance: Joi.number()
    .min(1)
    .max(500)
    .optional(),
  
  minOpportunityScore: Joi.number()
    .min(0)
    .max(100)
    .optional(),
  
  minEstimatedValue: Joi.number()
    .min(0)
    .max(999999999)
    .optional(),
  
  maxEstimatedValue: Joi.number()
    .min(0)
    .max(999999999)
    .optional(),
  
  bedrooms: Joi.array()
    .items(Joi.number().min(0).max(20))
    .max(10)
    .unique()
    .optional(),
  
  bathrooms: Joi.array()
    .items(Joi.number().min(0).max(20))
    .max(10)
    .unique()
    .optional(),
  
  propertyTypes: Joi.array()
    .items(Joi.string().trim().max(50).pattern(/^[a-zA-Z\s\-']+$/))
    .max(20)
    .unique()
    .optional(),
  
  emailNotifications: Joi.boolean().optional(),
  smsNotifications: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
  
  dailyAlertLimit: Joi.number()
    .min(1)
    .max(100)
    .optional(),
  
  quietHoursStart: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'Quiet hours start time must be in HH:MM format'
    }),
  
  quietHoursEnd: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'Quiet hours end time must be in HH:MM format'
    }),
});

// Admin user management validation
export const adminUserValidationSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s\-']+$/)
    .optional(),
  
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s\-']+$/)
    .optional(),
  
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(100)
    .lowercase()
    .optional(),
  
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional(),
  
  subscriptionTier: Joi.string()
    .valid(...Object.values(SubscriptionTier))
    .optional(),
  
  isActive: Joi.boolean().optional(),
});

// Support ticket validation
export const supportTicketValidationSchema = Joi.object({
  subject: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .custom((value, helpers) => {
      const sanitized = sanitizeString(value);
      if (sanitized !== value) {
        return helpers.error('any.invalid');
      }
      return sanitized;
    }),
  
  message: Joi.string()
    .trim()
    .min(10)
    .max(5000)
    .required()
    .custom((value, helpers) => {
      const sanitized = sanitizeString(value);
      if (sanitized !== value) {
        return helpers.error('any.invalid');
      }
      return sanitized;
    }),
  
  priority: Joi.string()
    .valid(...Object.values(Priority))
    .optional(),
  
  category: Joi.string()
    .valid('TECHNICAL', 'BILLING', 'GENERAL', 'FEATURE_REQUEST', 'BUG_REPORT')
    .required()
});

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Generic validation middleware factory
 */
export function validateRequest(schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[source];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown properties
      convert: true, // Convert values to correct types
    });
    
    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    // Replace the original data with validated/sanitized data
    req[source] = value;
    next();
  };
}

/**
 * SQL Injection prevention middleware
 */
export function preventSqlInjection(req: Request, res: Response, next: NextFunction) {
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/i,
    /((\s|%20)*(or|and)(\s|%20)+[\w'"=]+(\s|%20)*=(\s|%20)*[\w'"]+)/i,
    /((union(.*?)select)|(select(.*?)union))/i,
    /(exec(\s|\+)+(s|x)p\w+)/i,
  ];
  
  function checkForSqlInjection(obj: any, path: string = ''): string | null {
    if (typeof obj === 'string') {
      for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(obj)) {
          return path || 'string value';
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = path ? `${path}.${key}` : key;
        const result = checkForSqlInjection(value, newPath);
        if (result) return result;
      }
    }
    return null;
  }
  
  // Check body, query, and params for SQL injection attempts
  const sources = ['body', 'query', 'params'] as const;
  for (const source of sources) {
    const suspiciousField = checkForSqlInjection(req[source]);
    if (suspiciousField) {
      return res.status(400).json({
        success: false,
        error: 'Potentially malicious input detected',
        field: suspiciousField
      });
    }
  }
  
  next();
}

/**
 * XSS prevention middleware
 */
export function preventXSS(req: Request, res: Response, next: NextFunction) {
  function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  }
  
  // Sanitize body, query, and params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  
  next();
}

/**
 * Rate limiting validation
 */
export function validateRateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        requests.delete(key);
      }
    }
    
    const clientRequests = requests.get(clientId);
    
    if (!clientRequests) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
    } else if (clientRequests.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((clientRequests.resetTime - now) / 1000)
      });
    } else {
      clientRequests.count++;
      next();
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sanitize filename for file uploads
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 100); // Limit length
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate pagination parameters
 */
export const paginationValidationSchema = Joi.object({
  page: Joi.number().min(1).max(1000).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sortBy: Joi.string().max(50).optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

/**
 * Export all validation schemas for use in routes
 */
export const validationSchemas = {
  register: registerValidationSchema,
  login: loginValidationSchema,
  alert: alertValidationSchema,
  preferences: preferencesValidationSchema,
  adminUser: adminUserValidationSchema,
  supportTicket: supportTicketValidationSchema,
  pagination: paginationValidationSchema,
};

export default validateRequest;