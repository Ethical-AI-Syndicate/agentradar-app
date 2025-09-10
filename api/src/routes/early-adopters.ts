import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';
import { sendEarlyAdopterConfirmationEmail } from '../services/email';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const router = Router();
const logger = createLogger();

// POST /api/early-adopters/register
router.post('/register', async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      location,
      teamSize,
      monthlyDeals,
      primaryFocus,
      currentChallenges,
      techComfort
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'company', 
      'location', 'teamSize', 'monthlyDeals', 'primaryFocus', 
      'currentChallenges', 'techComfort'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate currentChallenges is an array
    if (!Array.isArray(currentChallenges)) {
      throw new ValidationError('currentChallenges must be an array');
    }

    logger.info(`Early adopter registration for ${email}`);

    // Check if email already exists in database
    const existingToken = await prisma.earlyAdopterToken.findUnique({
      where: { email }
    });

    if (existingToken) {
      logger.info(`Early adopter already registered: ${email}`);
      res.status(409).json({
        success: false,
        error: {
          message: 'Email already registered as early adopter',
          code: 'EMAIL_ALREADY_EXISTS'
        }
      });
      return;
    }

    // Generate token and create data
    const token = `early_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
    const discountPercent = 50;
    
    // Save to database
    const earlyAdopterToken = await prisma.earlyAdopterToken.create({
      data: {
        token,
        email,
        firstName,
        lastName,
        phone,
        company,
        location,
        teamSize,
        monthlyDeals,
        primaryFocus,
        currentChallenges,
        techComfort,
        discountPercent,
        expiresAt
      }
    });
    
    logger.info(`Generated early adopter token: ${token} for ${email}`);

    // Send confirmation email
    const emailSent = await sendEarlyAdopterConfirmationEmail({
      email,
      firstName,
      lastName,
      token,
      discountPercent,
      expiresAt
    });

    if (emailSent) {
      logger.info(`Confirmation email sent to ${email}`);
    } else {
      logger.warn(`Failed to send confirmation email to ${email}`);
    }

    res.status(201).json({
      success: true,
      message: 'Early adopter registration successful!',
      token,
      discountPercent,
      expiresAt,
      emailSent,
      nextSteps: [
        'Check your email for confirmation details',
        'You will receive early access notifications',
        'Your 50% lifetime discount is secured'
      ]
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/early-adopters/redeem
router.post('/redeem', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Token and password are required'
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    logger.info(`Early adopter token redemption attempt: ${token}`);

    // Find the token
    const earlyAdopterToken = await prisma.earlyAdopterToken.findUnique({
      where: { token }
    });

    if (!earlyAdopterToken) {
      return res.status(404).json({
        success: false,
        error: 'Invalid token',
        message: 'Early adopter token not found'
      });
    }

    // Check if token is already used
    if (earlyAdopterToken.isUsed) {
      return res.status(409).json({
        success: false,
        error: 'Token already used',
        message: 'This early adopter token has already been redeemed'
      });
    }

    // Check if token is expired
    if (earlyAdopterToken.expiresAt && earlyAdopterToken.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Token expired',
        message: 'This early adopter token has expired'
      });
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: earlyAdopterToken.email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'An account with this email address already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user account with early adopter benefits
    const user = await prisma.user.create({
      data: {
        email: earlyAdopterToken.email,
        password: hashedPassword,
        firstName: earlyAdopterToken.firstName,
        lastName: earlyAdopterToken.lastName,
        phone: earlyAdopterToken.phone,
        company: earlyAdopterToken.company,
        location: earlyAdopterToken.location,
        teamSize: earlyAdopterToken.teamSize,
        monthlyDeals: earlyAdopterToken.monthlyDeals,
        primaryFocus: earlyAdopterToken.primaryFocus,
        currentChallenges: earlyAdopterToken.currentChallenges,
        techComfort: earlyAdopterToken.techComfort,
        subscriptionTier: 'SOLO_AGENT', // Grant early adopter tier
        subscriptionStatus: 'ACTIVE'
      }
    });

    // Mark token as used
    await prisma.earlyAdopterToken.update({
      where: { id: earlyAdopterToken.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        userId: user.id
      }
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const authToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        tier: user.subscriptionTier,
        earlyAdopter: true
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    logger.info(`Early adopter token redeemed successfully: ${token} -> ${user.id}`);

    res.status(201).json({
      success: true,
      message: 'Early adopter account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscriptionTier: user.subscriptionTier,
        discountApplied: true
      },
      token: authToken,
      benefits: {
        discountPercent: earlyAdopterToken.discountPercent,
        tier: 'SOLO_AGENT',
        earlyAdopterStatus: true
      }
    });

  } catch (error) {
    logger.error('Early adopter redemption error:', error);
    next(error);
  }
});

// GET /api/early-adopters/token/:token
router.get('/token/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Missing token',
        message: 'Token parameter is required'
      });
    }

    logger.info(`Early adopter token validation attempt: ${token}`);

    // Find the token
    const earlyAdopterToken = await prisma.earlyAdopterToken.findUnique({
      where: { token }
    });

    if (!earlyAdopterToken) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'Token not found',
        message: 'Early adopter token does not exist'
      });
    }

    // Check if token is expired
    const isExpired = earlyAdopterToken.expiresAt && earlyAdopterToken.expiresAt < new Date();

    res.json({
      success: true,
      valid: !earlyAdopterToken.isUsed && !isExpired,
      token: earlyAdopterToken.token,
      email: earlyAdopterToken.email,
      firstName: earlyAdopterToken.firstName,
      lastName: earlyAdopterToken.lastName,
      discountPercent: earlyAdopterToken.discountPercent,
      expiresAt: earlyAdopterToken.expiresAt,
      isUsed: earlyAdopterToken.isUsed,
      usedAt: earlyAdopterToken.usedAt,
      createdAt: earlyAdopterToken.createdAt,
      status: earlyAdopterToken.isUsed 
        ? 'used' 
        : isExpired 
        ? 'expired' 
        : 'valid'
    });

  } catch (error) {
    logger.error('Early adopter token validation error:', error);
    next(error);
  }
});

// GET /api/early-adopters/stats (admin only)
router.get('/stats', async (req, res, next) => {
  try {
    // Basic auth check - in production would use proper middleware
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Please login again'
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    logger.info(`Early adopter stats request (admin): ${user.email}`);

    // Calculate statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalTokens,
      activeTokens,
      usedTokens,
      expiredTokens,
      recentTokens,
      weeklyTokens
    ] = await Promise.all([
      prisma.earlyAdopterToken.count(),
      prisma.earlyAdopterToken.count({
        where: {
          isUsed: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } }
          ]
        }
      }),
      prisma.earlyAdopterToken.count({
        where: { isUsed: true }
      }),
      prisma.earlyAdopterToken.count({
        where: {
          isUsed: false,
          expiresAt: { lt: now }
        }
      }),
      prisma.earlyAdopterToken.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.earlyAdopterToken.count({
        where: {
          createdAt: { gte: sevenDaysAgo }
        }
      })
    ]);

    // Get conversion rate
    const conversionRate = totalTokens > 0 ? (usedTokens / totalTokens) * 100 : 0;

    // Get recent tokens with details
    const recentTokensWithDetails = await prisma.earlyAdopterToken.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        location: true,
        isUsed: true,
        usedAt: true,
        discountPercent: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      statistics: {
        total: {
          tokens: totalTokens,
          active: activeTokens,
          used: usedTokens,
          expired: expiredTokens
        },
        conversion: {
          rate: Math.round(conversionRate * 100) / 100,
          total: usedTokens,
          pending: activeTokens
        },
        timeframes: {
          last30Days: recentTokens,
          last7Days: weeklyTokens
        },
        recent: recentTokensWithDetails
      },
      generatedAt: now
    });

  } catch (error) {
    logger.error('Early adopter stats error:', error);
    next(error);
  }
});

export default router;