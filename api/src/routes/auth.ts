import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import axios from 'axios';
import { sendPasswordResetEmail } from '../services/email';

const router = express.Router();
let prisma: PrismaClient | null = null;

const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

// RECO (Real Estate Council of Ontario) License Validation
async function validateOntarioLicense(licenseNumber: string, firstName: string, lastName: string): Promise<boolean> {
  try {
    // REAL RECO API integration - this connects to the actual Ontario license database
    const response = await axios.get(`https://www.reco.on.ca/DesktopModules/RECO.Registrant/API/Registrant/SearchRegistrants`, {
      params: {
        searchTerm: licenseNumber,
        searchType: 'RegistrationNumber'
      },
      headers: {
        'User-Agent': 'AgentRadar/1.0 (Real Estate License Verification)'
      },
      timeout: 10000
    });

    if (response.data && response.data.length > 0) {
      const registrant = response.data[0];
      // Verify the license number matches and the name matches
      const nameMatch = (
        registrant.FirstName?.toLowerCase().includes(firstName.toLowerCase()) &&
        registrant.LastName?.toLowerCase().includes(lastName.toLowerCase())
      ) || (
        registrant.Name?.toLowerCase().includes(firstName.toLowerCase()) &&
        registrant.Name?.toLowerCase().includes(lastName.toLowerCase())
      );
      
      return registrant.RegistrationNumber === licenseNumber && nameMatch;
    }
    return false;
  } catch (error) {
    console.error('RECO license validation error:', error);
    // If RECO API is down, we'll allow registration but mark as unverified
    // This ensures service availability while maintaining security
    return false;
  }
}

// Registration validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  licenseNumber: z.string().min(1, 'Ontario real estate license number is required'),
  province: z.string().default('ON'),
  brokerage: z.string().min(1, 'Brokerage name is required'),
  phone: z.string().optional()
});

// POST /api/auth/register - User registration with Ontario license validation
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validationResult.error.errors.map(err => err.message)
      });
      return;
    }

    const { email, password, firstName, lastName, licenseNumber, province, brokerage, phone } = validationResult.data;
    const db = getPrisma();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
        message: 'An account with this email address already exists'
      });
    }

    // Validate Ontario real estate license with RECO
    console.log(`Validating Ontario license ${licenseNumber} for ${firstName} ${lastName}`);
    const licenseValid = await validateOntarioLicense(licenseNumber, firstName, lastName);
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in database
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        licenseNumber,
        brokerage,
        phone,
        licenseVerified: licenseValid,
        subscriptionTier: 'FREE',
        subscriptionStatus: 'INACTIVE'
      }
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        licenseVerified: user.licenseVerified
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: {
          registrationMethod: 'email',
          licenseVerified: licenseValid,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        licenseNumber: user.licenseNumber,
        brokerage: user.brokerage,
        licenseVerified: user.licenseVerified,
        subscriptionTier: user.subscriptionTier
      },
      token,
      licenseVerification: {
        verified: licenseValid,
        message: licenseValid 
          ? 'Ontario real estate license verified with RECO' 
          : 'License verification pending - you can still use the platform with limited features'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration. Please try again.'
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    const db = getPrisma();

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: {
        alertPreferences: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials', 
        message: 'Email or password is incorrect'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        tier: user.subscriptionTier,
        licenseVerified: user.licenseVerified
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: {
          loginMethod: 'email',
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        licenseVerified: user.licenseVerified,
        brokerage: user.brokerage
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login. Please try again.'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization token is required'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const db = getPrisma();

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: {
        alertPreferences: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'Invalid token'
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        licenseNumber: user.licenseNumber,
        licenseVerified: user.licenseVerified,
        brokerage: user.brokerage,
        phone: user.phone,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Please login again'
    });
  }
});

// Token blacklist for logout (in production, use Redis)
const tokenBlacklist = new Set<string>();

// POST /api/auth/logout - User logout with token invalidation
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization token is required'
      });
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    try {
      // Verify token is valid before blacklisting
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Add token to blacklist
      tokenBlacklist.add(token);
      
      const db = getPrisma();
      
      // Log logout activity
      await db.activityLog.create({
        data: {
          userId: decoded.userId,
          action: 'USER_LOGOUT',
          details: {
            logoutMethod: 'manual',
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (jwtError) {
      // Token is invalid/expired, but we'll still return success
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    }

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'An error occurred during logout. Please try again.'
    });
  }
});

// POST /api/auth/forgot-password - Password reset request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Missing email',
        message: 'Email address is required'
      });
      return;
    }

    const db = getPrisma();

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    });

    // Always return success for security (don't reveal if email exists)
    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset email has been sent'
    });

    // Only send email if user actually exists
    if (!user) {
      return;
    }

    // Generate reset token (24 hour expiry)
    const resetToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        purpose: 'password_reset' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Log password reset request
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN', // Using existing enum value
        details: {
          action: 'password_reset_requested',
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Send password reset email
    const emailSent = await sendPasswordResetEmail({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      resetToken
    });

    if (!emailSent) {
      console.error(`Failed to send password reset email to ${email}`);
      // Still return success to not reveal if email exists, but log the error
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Password reset failed',
      message: 'An error occurred while processing your request. Please try again.'
    });
  }
});

// POST /api/auth/reset-password - Password reset completion
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Reset token and new password are required'
      });
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
      
      // Verify this is a password reset token
      if (decoded.purpose !== 'password_reset') {
        res.status(400).json({
          success: false,
          error: 'Invalid token',
          message: 'This token is not valid for password reset'
        });
        return;
      }
    } catch (jwtError) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'The password reset token is invalid or has expired'
      });
      return;
    }

    const db = getPrisma();

    // Find user
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: 'User not found',
        message: 'Invalid reset token'
      });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Log password reset completion
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN', // Using existing enum value
        details: {
          action: 'password_reset_completed',
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Password reset failed',
      message: 'An error occurred while resetting your password. Please try again.'
    });
  }
});

// Middleware to check token blacklist (add this to auth middleware)
export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

export default router;