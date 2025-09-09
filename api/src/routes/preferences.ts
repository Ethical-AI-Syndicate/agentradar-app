import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { PrismaClient, AlertType, Priority } from "@prisma/client"
import { authenticateToken } from '../middleware/auth';

const router = Router();
const logger = createLogger();
const prisma = new PrismaClient();

// GET /api/preferences - Get user's alert preferences
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not found in request'
      });
    }

    let preferences = await prisma.alertPreference.findUnique({
      where: { userId: req.user.id }
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.alertPreference.create({
        data: {
          userId: req.user.id,
          cities: ['Toronto', 'Mississauga', 'Brampton'],
          maxDistanceKm: 50,
          propertyTypes: ['detached', 'semi-detached', 'townhouse', 'condo'],
          alertTypes: [AlertType.POWER_OF_SALE, AlertType.ESTATE_SALE, AlertType.TAX_SALE],
          minPriority: Priority.MEDIUM,
          minOpportunityScore: 30,
          emailNotifications: true,
          pushNotifications: true,
          maxAlertsPerDay: 10
        }
      });

      logger.info(`Created default preferences for user ${req.user.email}`);
    }

    res.json({
      success: true,
      preferences
    });

  } catch (error) {
    logger.error('Error getting user preferences:', error);
    return next(error);
  }
});

// PUT /api/preferences - Update user's alert preferences
router.put('/', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not found in request'
      });
    }

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

    // Validate input values
    if (maxDistanceKm && (maxDistanceKm < 1 || maxDistanceKm > 500)) {
      return res.status(400).json({
        error: 'Invalid distance',
        message: 'Distance must be between 1 and 500 km'
      });
    }

    if (minValue && maxValue && minValue > maxValue) {
      return res.status(400).json({
        error: 'Invalid value range',
        message: 'Minimum value cannot be greater than maximum value'
      });
    }

    if (minOpportunityScore && (minOpportunityScore < 0 || minOpportunityScore > 100)) {
      return res.status(400).json({
        error: 'Invalid opportunity score',
        message: 'Opportunity score must be between 0 and 100'
      });
    }

    if (maxAlertsPerDay && (maxAlertsPerDay < 1 || maxAlertsPerDay > 100)) {
      return res.status(400).json({
        error: 'Invalid alerts limit',
        message: 'Maximum alerts per day must be between 1 and 100'
      });
    }

    // Validate alert types
    if (alertTypes && Array.isArray(alertTypes)) {
      const validAlertTypes = Object.values(AlertType);
      const invalidTypes = alertTypes.filter(type => !validAlertTypes.includes(type as AlertType));
      if (invalidTypes.length > 0) {
        return res.status(400).json({
          error: 'Invalid alert types',
          message: `Invalid alert types: ${invalidTypes.join(', ')}`,
          validTypes: validAlertTypes
        });
      }
    }

    // Validate priority
    if (minPriority && !Object.values(Priority).includes(minPriority as Priority)) {
      return res.status(400).json({
        error: 'Invalid priority',
        message: 'Invalid minimum priority level',
        validPriorities: Object.values(Priority)
      });
    }

    // Update or create preferences
    const preferences = await prisma.alertPreference.upsert({
      where: { userId: req.user.id },
      update: {
        ...(cities !== undefined && { cities }),
        ...(maxDistanceKm !== undefined && { maxDistanceKm }),
        ...(propertyTypes !== undefined && { propertyTypes }),
        ...(minValue !== undefined && { minValue }),
        ...(maxValue !== undefined && { maxValue }),
        ...(minBedrooms !== undefined && { minBedrooms }),
        ...(maxBedrooms !== undefined && { maxBedrooms }),
        ...(alertTypes !== undefined && { alertTypes: alertTypes as AlertType[] }),
        ...(minPriority !== undefined && { minPriority: minPriority as Priority }),
        ...(minOpportunityScore !== undefined && { minOpportunityScore }),
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(smsNotifications !== undefined && { smsNotifications }),
        ...(pushNotifications !== undefined && { pushNotifications }),
        ...(maxAlertsPerDay !== undefined && { maxAlertsPerDay }),
        ...(quietHoursStart !== undefined && { quietHoursStart }),
        ...(quietHoursEnd !== undefined && { quietHoursEnd })
      },
      create: {
        userId: req.user.id,
        cities: cities || ['Toronto'],
        maxDistanceKm: maxDistanceKm || 50,
        propertyTypes: propertyTypes || [],
        minValue,
        maxValue,
        minBedrooms,
        maxBedrooms,
        alertTypes: (alertTypes as AlertType[]) || [AlertType.POWER_OF_SALE],
        minPriority: (minPriority as Priority) || Priority.MEDIUM,
        minOpportunityScore: minOpportunityScore || 0,
        emailNotifications: emailNotifications !== false,
        smsNotifications: smsNotifications || false,
        pushNotifications: pushNotifications !== false,
        maxAlertsPerDay: maxAlertsPerDay || 10,
        quietHoursStart,
        quietHoursEnd
      }
    });

    logger.info(`Updated preferences for user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences
    });

  } catch (error) {
    logger.error('Error updating user preferences:', error);
    return next(error);
  }
});

// DELETE /api/preferences - Reset preferences to default
router.delete('/', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not found in request'
      });
    }

    // Delete existing preferences
    await prisma.alertPreference.deleteMany({
      where: { userId: req.user.id }
    });

    // Create default preferences
    const defaultPreferences = await prisma.alertPreference.create({
      data: {
        userId: req.user.id,
        cities: ['Toronto', 'Mississauga', 'Brampton'],
        maxDistanceKm: 50,
        propertyTypes: ['detached', 'semi-detached', 'townhouse', 'condo'],
        alertTypes: [AlertType.POWER_OF_SALE, AlertType.ESTATE_SALE, AlertType.TAX_SALE],
        minPriority: Priority.MEDIUM,
        minOpportunityScore: 30,
        emailNotifications: true,
        pushNotifications: true,
        maxAlertsPerDay: 10
      }
    });

    logger.info(`Reset preferences to default for user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Preferences reset to default successfully',
      preferences: defaultPreferences
    });

  } catch (error) {
    logger.error('Error resetting user preferences:', error);
    return next(error);
  }
});

// GET /api/preferences/options - Get available preference options
router.get('/options', authenticateToken, async (req, res, next) => {
  try {
    const options = {
      alertTypes: Object.values(AlertType).map(type => ({
        value: type,
        label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        description: getAlertTypeDescription(type)
      })),
      priorities: Object.values(Priority).map(priority => ({
        value: priority,
        label: priority.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        order: getPriorityOrder(priority)
      })).sort((a, b) => a.order - b.order),
      propertyTypes: [
        { value: 'detached', label: 'Detached House' },
        { value: 'semi-detached', label: 'Semi-Detached House' },
        { value: 'townhouse', label: 'Townhouse' },
        { value: 'condo', label: 'Condominium' },
        { value: 'commercial', label: 'Commercial Property' },
        { value: 'land', label: 'Vacant Land' },
        { value: 'mixed-use', label: 'Mixed-Use Property' }
      ],
      cities: [
        { value: 'Toronto', label: 'Toronto' },
        { value: 'Mississauga', label: 'Mississauga' },
        { value: 'Brampton', label: 'Brampton' },
        { value: 'Markham', label: 'Markham' },
        { value: 'Vaughan', label: 'Vaughan' },
        { value: 'Richmond Hill', label: 'Richmond Hill' },
        { value: 'Oakville', label: 'Oakville' },
        { value: 'Burlington', label: 'Burlington' },
        { value: 'Whitby', label: 'Whitby' },
        { value: 'Oshawa', label: 'Oshawa' }
      ]
    };

    res.json({
      success: true,
      options
    });

  } catch (error) {
    logger.error('Error getting preference options:', error);
    return next(error);
  }
});

function getAlertTypeDescription(alertType: AlertType): string {
  switch (alertType) {
    case AlertType.POWER_OF_SALE:
      return 'Properties in foreclosure, power of sale, or financial distress';
    case AlertType.ESTATE_SALE:
      return 'Properties being sold through estate or probate proceedings';
    case AlertType.TAX_SALE:
      return 'Properties being sold for unpaid taxes';
    case AlertType.PROBATE_FILING:
      return 'Properties in active probate proceedings';
    case AlertType.DEVELOPMENT_APPLICATION:
      return 'Properties with development or redevelopment potential';
    case AlertType.MUNICIPAL_PERMIT:
      return 'Municipal permits and planning applications';
    default:
      return 'Property opportunity alert';
  }
}

function getPriorityOrder(priority: Priority): number {
  switch (priority) {
    case Priority.URGENT:
      return 4;
    case Priority.HIGH:
      return 3;
    case Priority.MEDIUM:
      return 2;
    case Priority.LOW:
      return 1;
    default:
      return 0;
  }
}

export default router;