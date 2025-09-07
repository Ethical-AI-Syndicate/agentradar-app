import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { ValidationError } from '../middleware/errorHandler';
import { sendEarlyAdopterConfirmationEmail } from '../services/email';
// import { prisma } from '../lib/database';

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

    // TODO: Check if email already exists in database
    // const existingToken = await prisma.earlyAdopterToken.findUnique({
    //   where: { email }
    // });

    // if (existingToken) {
    //   logger.info(`Early adopter already registered: ${email}`);
    //   res.status(409).json({
    //     error: {
    //       message: 'Email already registered as early adopter',
    //       code: 'EMAIL_ALREADY_EXISTS'
    //     }
    //   });
    //   return;
    // }

    // Generate token and create data
    const token = `early_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
    const discountPercent = 50;
    
    // TODO: Save to database
    // const earlyAdopterToken = await prisma.earlyAdopterToken.create({
    //   data: {
    //     email,
    //     firstName,
    //     lastName,
    //     phone,
    //     company,
    //     location,
    //     teamSize,
    //     monthlyDeals,
    //     primaryFocus,
    //     currentChallenges,
    //     techComfort,
    //     discountPercent,
    //     expiresAt
    //   }
    // });
    
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
    // TODO: Implement early adopter token redemption
    logger.info('Early adopter token redemption attempt');
    res.status(501).json({
      message: 'Early adopter token redemption endpoint not yet implemented',
      endpoint: 'POST /api/early-adopters/redeem',
      expectedBody: {
        token: 'string',
        password: 'string'
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/early-adopters/token/:token
router.get('/token/:token', async (req, res, next) => {
  try {
    // TODO: Implement early adopter token validation
    const { token } = req.params;
    logger.info(`Early adopter token validation attempt: ${token}`);
    res.status(501).json({
      message: 'Early adopter token validation endpoint not yet implemented',
      endpoint: 'GET /api/early-adopters/token/:token'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/early-adopters/stats (admin only)
router.get('/stats', async (req, res, next) => {
  try {
    // TODO: Implement early adopter statistics
    logger.info('Early adopter stats request (admin)');
    res.status(501).json({
      message: 'Early adopter statistics endpoint not yet implemented',
      endpoint: 'GET /api/early-adopters/stats',
      note: 'Admin only endpoint'
    });
  } catch (error) {
    next(error);
  }
});

export default router;