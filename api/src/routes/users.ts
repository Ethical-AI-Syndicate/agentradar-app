import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const router = Router();
const logger = createLogger();

// Authentication middleware
const authenticateUser = async (req: any, res: any, next: any) => {
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
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'User not found or account deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Please login again'
    });
  }
};

// GET /api/users/profile
router.get('/profile', authenticateUser, async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    logger.info(`Get user profile: ${user.email}`);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        licenseNumber: user.licenseNumber,
        licenseVerified: user.licenseVerified,
        brokerage: user.brokerage,
        province: user.province,
        company: user.company,
        location: user.location,
        teamSize: user.teamSize,
        monthlyDeals: user.monthlyDeals,
        primaryFocus: user.primaryFocus,
        currentChallenges: user.currentChallenges,
        techComfort: user.techComfort,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    next(error);
  }
});

// PUT /api/users/profile
router.put('/profile', authenticateUser, async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    const {
      firstName,
      lastName,
      phone,
      brokerage,
      company,
      location,
      teamSize,
      monthlyDeals,
      primaryFocus,
      currentChallenges,
      techComfort
    } = req.body;

    logger.info(`Update user profile: ${user.email}`);

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(brokerage && { brokerage }),
        ...(company && { company }),
        ...(location && { location }),
        ...(teamSize && { teamSize }),
        ...(monthlyDeals && { monthlyDeals }),
        ...(primaryFocus && { primaryFocus }),
        ...(currentChallenges && { currentChallenges }),
        ...(techComfort && { techComfort })
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PREFERENCES_UPDATED',
        details: {
          action: 'profile_updated',
          updatedFields: Object.keys(req.body),
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        brokerage: updatedUser.brokerage,
        company: updatedUser.company,
        location: updatedUser.location,
        teamSize: updatedUser.teamSize,
        monthlyDeals: updatedUser.monthlyDeals,
        primaryFocus: updatedUser.primaryFocus,
        currentChallenges: updatedUser.currentChallenges,
        techComfort: updatedUser.techComfort
      }
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    next(error);
  }
});

// GET /api/users/preferences
router.get('/preferences', authenticateUser, async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    logger.info(`Get user preferences: ${user.email}`);

    // Find existing preferences or create defaults
    let preferences = await prisma.alertPreference.findUnique({
      where: { userId: user.id }
    });

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.alertPreference.create({
        data: {
          userId: user.id,
          cities: [],
          maxDistanceKm: 50,
          propertyTypes: [],
          alertTypes: ['POWER_OF_SALE'],
          minPriority: 'LOW',
          minOpportunityScore: 0,
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          maxAlertsPerDay: 10
        }
      });
    }

    res.json({
      success: true,
      preferences: {
        id: preferences.id,
        cities: preferences.cities,
        maxDistanceKm: preferences.maxDistanceKm,
        propertyTypes: preferences.propertyTypes,
        minValue: preferences.minValue,
        maxValue: preferences.maxValue,
        minBedrooms: preferences.minBedrooms,
        maxBedrooms: preferences.maxBedrooms,
        alertTypes: preferences.alertTypes,
        minPriority: preferences.minPriority,
        minOpportunityScore: preferences.minOpportunityScore,
        emailNotifications: preferences.emailNotifications,
        smsNotifications: preferences.smsNotifications,
        pushNotifications: preferences.pushNotifications,
        maxAlertsPerDay: preferences.maxAlertsPerDay,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd
      }
    });
  } catch (error) {
    logger.error('Get user preferences error:', error);
    next(error);
  }
});

// PUT /api/users/preferences
router.put('/preferences', authenticateUser, async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    const {
      cities,
      maxDistanceKm,
      propertyTypes,
      minValue,
      maxValue,
      minBedrooms,
      maxBedrooms,
      alertTypes,
      minPriority,
      minOpportunityScore,
      emailNotifications,
      smsNotifications,
      pushNotifications,
      maxAlertsPerDay,
      quietHoursStart,
      quietHoursEnd
    } = req.body;

    logger.info(`Update user preferences: ${user.email}`);

    // Update or create preferences
    const preferences = await prisma.alertPreference.upsert({
      where: { userId: user.id },
      update: {
        ...(cities !== undefined && { cities }),
        ...(maxDistanceKm !== undefined && { maxDistanceKm }),
        ...(propertyTypes !== undefined && { propertyTypes }),
        ...(minValue !== undefined && { minValue }),
        ...(maxValue !== undefined && { maxValue }),
        ...(minBedrooms !== undefined && { minBedrooms }),
        ...(maxBedrooms !== undefined && { maxBedrooms }),
        ...(alertTypes !== undefined && { alertTypes }),
        ...(minPriority !== undefined && { minPriority }),
        ...(minOpportunityScore !== undefined && { minOpportunityScore }),
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(smsNotifications !== undefined && { smsNotifications }),
        ...(pushNotifications !== undefined && { pushNotifications }),
        ...(maxAlertsPerDay !== undefined && { maxAlertsPerDay }),
        ...(quietHoursStart !== undefined && { quietHoursStart }),
        ...(quietHoursEnd !== undefined && { quietHoursEnd })
      },
      create: {
        userId: user.id,
        cities: cities || [],
        maxDistanceKm: maxDistanceKm || 50,
        propertyTypes: propertyTypes || [],
        minValue,
        maxValue,
        minBedrooms,
        maxBedrooms,
        alertTypes: alertTypes || ['POWER_OF_SALE'],
        minPriority: minPriority || 'LOW',
        minOpportunityScore: minOpportunityScore || 0,
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
        pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
        maxAlertsPerDay: maxAlertsPerDay || 10,
        quietHoursStart,
        quietHoursEnd
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PREFERENCES_UPDATED',
        details: {
          action: 'alert_preferences_updated',
          updatedFields: Object.keys(req.body),
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        id: preferences.id,
        cities: preferences.cities,
        maxDistanceKm: preferences.maxDistanceKm,
        propertyTypes: preferences.propertyTypes,
        minValue: preferences.minValue,
        maxValue: preferences.maxValue,
        minBedrooms: preferences.minBedrooms,
        maxBedrooms: preferences.maxBedrooms,
        alertTypes: preferences.alertTypes,
        minPriority: preferences.minPriority,
        minOpportunityScore: preferences.minOpportunityScore,
        emailNotifications: preferences.emailNotifications,
        smsNotifications: preferences.smsNotifications,
        pushNotifications: preferences.pushNotifications,
        maxAlertsPerDay: preferences.maxAlertsPerDay,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd
      }
    });
  } catch (error) {
    logger.error('Update user preferences error:', error);
    next(error);
  }
});

// POST /api/users/change-password
router.post('/change-password', authenticateUser, async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Current password and new password are required'
      });
    }

    logger.info(`Change password: ${user.email}`);

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid current password',
        message: 'Current password is incorrect'
      });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: 'New password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PREFERENCES_UPDATED',
        details: {
          action: 'password_changed',
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
    logger.error('Change password error:', error);
    next(error);
  }
});

// DELETE /api/users/account  
router.delete('/account', authenticateUser, async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    logger.info(`Delete user account: ${user.email}`);

    // Log account deletion before deleting
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGOUT', // Using existing enum value
        details: {
          action: 'account_deleted',
          email: user.email,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Delete user account (cascading deletes will handle related records)
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isActive: false,
        email: `deleted_${user.id}@deleted.com`, // Anonymize email
        password: 'DELETED',
        firstName: 'DELETED',
        lastName: 'DELETED'
      }
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user account error:', error);
    next(error);
  }
});

// GET /api/users/preferences/options
router.get('/preferences/options', authenticateUser, async (req: any, res: any, next: any) => {
  try {
    logger.info('Get preference options');

    const options = {
      alertTypes: ['POWER_OF_SALE', 'ESTATE_SALE', 'DEVELOPMENT_APPLICATION', 'MUNICIPAL_PERMIT', 'PROBATE_FILING', 'TAX_SALE'],
      cities: [
        'Toronto', 'Mississauga', 'Brampton', 'Hamilton', 'Vaughan', 
        'Markham', 'Richmond Hill', 'Oakville', 'Burlington', 'Oshawa',
        'Kitchener', 'Windsor', 'London', 'St. Catharines', 'Whitby',
        'Pickering', 'Ajax', 'Milton', 'Newmarket', 'Barrie'
      ],
      priorities: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      propertyTypes: [
        'Detached', 'Semi-Detached', 'Townhouse', 'Condominium', 
        'Apartment', 'Commercial', 'Industrial', 'Land', 'Other'
      ],
      teamSizes: ['1-5', '6-10', '11-25', '26-50', '51-100', '100+'],
      monthlyDeals: ['0-2', '3-5', '6-10', '11-20', '21+'],
      primaryFocus: [
        'Residential Sales', 'Commercial Sales', 'Property Management', 
        'Real Estate Investment', 'New Construction', 'Luxury Properties'
      ],
      techComfort: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    };

    res.json({
      success: true,
      options
    });
  } catch (error) {
    logger.error('Get preference options error:', error);
    next(error);
  }
});

export default router;