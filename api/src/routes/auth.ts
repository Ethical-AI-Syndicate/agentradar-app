import { Router } from 'express';
import { PrismaClient, SubscriptionTier } from '../generated/prisma';
import { createLogger } from '../utils/logger';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password';
import { generateTokenPair, verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const logger = createLogger();
const prisma = new PrismaClient();

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: {
    error: 'Too many registration attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// POST /api/auth/register
router.post('/register', registerRateLimit, async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      company,
      location,
      teamSize,
      monthlyDeals,
      primaryFocus,
      techComfort,
      currentChallenges
    } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password, first name, and last name are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // Password validation
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password validation failed',
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
        score: passwordValidation.score
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email address already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        location: location?.trim() || null,
        teamSize: teamSize?.trim() || null,
        monthlyDeals: monthlyDeals?.trim() || null,
        primaryFocus: primaryFocus?.trim() || null,
        techComfort: techComfort?.trim() || null,
        currentChallenges: currentChallenges || [],
        subscriptionTier: SubscriptionTier.FREE,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        createdAt: true
      }
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Log registration
    logger.info(`User registered successfully: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: tokens
    });

  } catch (error) {
    logger.error('Registration error:', error);
    return next(error);
  }
});

// POST /api/auth/login
router.post('/login', authRateLimit, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        isActive: true,
        lastLogin: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscriptionTier: user.subscriptionTier
    });

    logger.info(`User logged in successfully: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: tokens
    });

  } catch (error) {
    logger.error('Login error:', error);
    return next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Missing refresh token',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    if (!decoded.type || decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Invalid refresh token'
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found or inactive'
      });
    }

    // Generate new tokens
    const tokens = generateTokenPair(user);

    logger.info(`Token refreshed successfully: ${user.email}`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });

  } catch (error: any) {
    logger.error('Token refresh error:', error);
    
    if (error?.message === 'Token expired' || error?.message === 'Invalid token') {
      return res.status(401).json({
        error: 'Token refresh failed',
        message: 'Refresh token is invalid or expired'
      });
    }

    return next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    // For stateless JWT, we just respond with success
    // In production, you might want to maintain a token blacklist
    
    logger.info(`User logged out: ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    return next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User not found in request'
      });
    }

    // Get full user profile
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        location: true,
        teamSize: true,
        monthlyDeals: true,
        primaryFocus: true,
        techComfort: true,
        currentChallenges: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error('Get user profile error:', error);
    return next(error);
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'User not found in request'
      });
    }

    const {
      firstName,
      lastName,
      phone,
      company,
      location,
      teamSize,
      monthlyDeals,
      primaryFocus,
      techComfort,
      currentChallenges
    } = req.body;

    // Update user profile
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName: firstName?.trim() || undefined,
        lastName: lastName?.trim() || undefined,
        phone: phone?.trim() || undefined,
        company: company?.trim() || undefined,
        location: location?.trim() || undefined,
        teamSize: teamSize?.trim() || undefined,
        monthlyDeals: monthlyDeals?.trim() || undefined,
        primaryFocus: primaryFocus?.trim() || undefined,
        techComfort: techComfort?.trim() || undefined,
        currentChallenges: currentChallenges || undefined,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        location: true,
        teamSize: true,
        monthlyDeals: true,
        primaryFocus: true,
        techComfort: true,
        currentChallenges: true,
        subscriptionTier: true,
        updatedAt: true
      }
    });

    logger.info(`Profile updated: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    logger.error('Profile update error:', error);
    return next(error);
  }
});

// Health check endpoint for production monitoring
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth',
    timestamp: new Date().toISOString()
  });
});

export default router;