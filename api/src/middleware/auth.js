/**
 * Authentication middleware converted to JavaScript ESM
 * Provides JWT authentication and authorization functions
 */

import { PrismaClient } from "@prisma/client";
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();
const prisma = new PrismaClient();

/**
 * Middleware to authenticate JWT tokens
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided'
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        subscriptionTier: true,
        isActive: true
      }
    });

    if (!user) {
      res.status(401).json({ 
        error: 'Authentication failed',
        message: 'User not found'
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ 
        error: 'Authentication failed',
        message: 'User account is inactive'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    
    logger.info(`User authenticated: ${user.email}`);
    next();
    
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.message === 'Token expired') {
      res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }
    
    if (error.message === 'Invalid token') {
      res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
      return;
    }
    
    res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Invalid or malformed token'
    });
  }
}

/**
 * Optional authentication middleware - sets user if token is valid, but doesn't require it
 */
export async function optionalAuthentication(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      next();
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        subscriptionTier: true,
        isActive: true
      }
    });

    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
    
  } catch (error) {
    // For optional auth, we don't return errors, just continue without user
    logger.debug('Optional authentication failed:', error);
    next();
  }
}

/**
 * Middleware to require specific subscription tiers
 */
export function requireSubscriptionTier(...allowedTiers) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'User not authenticated'
      });
      return;
    }

    if (!allowedTiers.includes(req.user.subscriptionTier)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This feature requires one of: ${allowedTiers.join(', ')}`,
        currentTier: req.user.subscriptionTier,
        requiredTiers: allowedTiers
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require admin access
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'User not authenticated'
    });
    return;
  }

  // Check for admin role or WHITE_LABEL subscription (legacy admin)
  if (req.user.role !== 'ADMIN' && req.user.subscriptionTier !== 'WHITE_LABEL') {
    res.status(403).json({ 
      error: 'Insufficient permissions',
      message: 'Admin access required'
    });
    return;
  }

  next();
}

/**
 * Middleware to validate user owns the resource
 */
export function validateResourceOwnership(resourceUserIdField = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'User not authenticated'
      });
      return;
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      res.status(400).json({ 
        error: 'Invalid request',
        message: `${resourceUserIdField} is required`
      });
      return;
    }

    if (resourceUserId !== req.user.id) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You can only access your own resources'
      });
      return;
    }

    next();
  };
}