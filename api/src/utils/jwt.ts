import * as jwt from 'jsonwebtoken';
import { createLogger } from './logger';

const logger = createLogger();

// ✅ SECURITY ENHANCEMENT: Mandatory JWT secret validation
// Addresses Medium Severity security issue from Phase 1 assessment
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}

// Ensure JWT_SECRET is typed as string, not string | undefined
const JWT_SECRET_VALIDATED = JWT_SECRET as string;

if (JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
  throw new Error('JWT_SECRET must be changed from default value for security');
}

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long for security');
}

// Validate JWT secret entropy for production security
if (process.env.NODE_ENV === 'production') {
  const hasLowerCase = /[a-z]/.test(JWT_SECRET);
  const hasUpperCase = /[A-Z]/.test(JWT_SECRET);
  const hasNumbers = /\d/.test(JWT_SECRET);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(JWT_SECRET);
  
  if (!(hasLowerCase && hasUpperCase && hasNumbers && hasSymbols)) {
    throw new Error('JWT_SECRET must contain uppercase, lowercase, numbers, and symbols for production security');
  }
}

// JWT configuration with validated secret
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export interface JwtPayload {
  userId: string;
  email: string;
  subscriptionTier: string;
  type?: string;
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    subscriptionTier: string;
  };
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, JWT_SECRET_VALIDATED, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'agentradar-api',
      audience: 'agentradar-web'
    });
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  try {
    const refreshPayload = { ...payload, type: 'refresh' };
    return jwt.sign(refreshPayload, JWT_SECRET_VALIDATED, { 
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'agentradar-api',
      audience: 'agentradar-web'
    });
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: string;
}): TokenResponse {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    subscriptionTier: user.subscriptionTier
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscriptionTier: user.subscriptionTier
    }
  };
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET_VALIDATED, {
      issuer: 'agentradar-api',
      audience: 'agentradar-web'
    });
    
    if (typeof decoded === 'string') {
      throw new Error('Invalid token format');
    }
    
    return decoded as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      logger.error('Error verifying token:', error);
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1] || null;
}

/**
 * Check if token is expired (without verifying signature)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

/**
 * Decode token without verification (for debugging/logging)
 */
export function decodeTokenUnsafe(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding token:', error);
    return null;
  }
}