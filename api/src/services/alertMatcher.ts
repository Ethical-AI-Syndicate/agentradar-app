import { PrismaClient, Alert, AlertPreference, User } from "@prisma/client"
import { createLogger } from '../utils/logger';

const logger = createLogger();
const prisma = new PrismaClient();

export interface MatchedAlert {
  alert: Alert;
  matchScore: number;
  matchReasons: string[];
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export class AlertMatcher {
  
  /**
   * Find all users who should receive a specific alert based on their preferences
   */
  async findMatchingUsers(alert: Alert): Promise<MatchedAlert[]> {
    try {
      // Get all active users with their preferences
      const usersWithPreferences = await prisma.user.findMany({
        where: { 
          isActive: true,
          alertPreferences: {
            some: {} // Has at least one preference record
          }
        },
        include: {
          alertPreferences: true
        }
      });

      const matches: MatchedAlert[] = [];

      for (const user of usersWithPreferences) {
        if (!user.alertPreferences?.[0]) continue;
        
        const preference = user.alertPreferences[0];
        const matchResult = this.evaluateMatch(alert, preference);
        
        if (matchResult.isMatch) {
          matches.push({
            alert,
            matchScore: matchResult.score,
            matchReasons: matchResult.reasons,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            }
          });
        }
      }

      // Sort by match score (highest first)
      matches.sort((a, b) => b.matchScore - a.matchScore);
      
      logger.info(`Found ${matches.length} matching users for alert ${alert.id}`);
      return matches;

    } catch (error) {
      logger.error('Error finding matching users:', error);
      throw error;
    }
  }

  /**
   * Get personalized alerts for a specific user based on their preferences
   */
  async getPersonalizedAlerts(userId: string, limit: number = 20): Promise<Alert[]> {
    try {
      const userWithPreferences = await prisma.user.findUnique({
        where: { id: userId },
        include: { alertPreferences: true }
      });

      if (!userWithPreferences?.alertPreferences?.[0]) {
        // Return general high-priority alerts if no preferences set
        return prisma.alert.findMany({
          where: {
            status: 'ACTIVE',
            priority: 'HIGH'
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          take: limit
        });
      }

      const preference = userWithPreferences.alertPreferences[0];
      const whereClause = this.buildAlertQuery(preference);

      const alerts = await prisma.alert.findMany({
        where: whereClause,
        orderBy: [
          { opportunityScore: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      logger.info(`Retrieved ${alerts.length} personalized alerts for user ${userId}`);
      return alerts;

    } catch (error) {
      logger.error('Error getting personalized alerts:', error);
      throw error;
    }
  }

  /**
   * Evaluate if an alert matches a user's preferences
   */
  private evaluateMatch(alert: Alert, preference: AlertPreference): {
    isMatch: boolean;
    score: number;
    reasons: string[];
  } {
    let score = 0;
    const reasons: string[] = [];

    // Alert type match (required)
    if (!preference.alertTypes.includes(alert.alertType)) {
      return { isMatch: false, score: 0, reasons: ['Alert type not in preferences'] };
    }
    
    score += 20;
    reasons.push(`Matches preferred alert type: ${alert.alertType}`);

    // Priority match (required)
    const priorityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 };
    if (priorityOrder[alert.priority] < priorityOrder[preference.minPriority]) {
      return { isMatch: false, score: 0, reasons: ['Priority too low'] };
    }
    
    score += 15;
    reasons.push(`Meets minimum priority: ${alert.priority}`);

    // Opportunity score match (required)
    if (alert.opportunityScore < preference.minOpportunityScore) {
      return { isMatch: false, score: 0, reasons: ['Opportunity score too low'] };
    }
    
    score += 15;
    reasons.push(`Opportunity score ${alert.opportunityScore} meets minimum ${preference.minOpportunityScore}`);

    // Geographic match
    const isInPreferredCity = preference.cities.some(city => 
      alert.city.toLowerCase().includes(city.toLowerCase())
    );
    
    if (isInPreferredCity) {
      score += 25;
      reasons.push(`Located in preferred city: ${alert.city}`);
    } else {
      score += 5; // Still possible if within distance range
      reasons.push(`Outside preferred cities but within consideration`);
    }

    // Value range match
    if (preference.minValue && alert.estimatedValue && alert.estimatedValue < preference.minValue) {
      score -= 10;
      reasons.push(`Below minimum value preference`);
    } else if (preference.maxValue && alert.estimatedValue && alert.estimatedValue > preference.maxValue) {
      score -= 10;
      reasons.push(`Above maximum value preference`);
    } else if (alert.estimatedValue && preference.minValue && preference.maxValue) {
      score += 10;
      reasons.push(`Within preferred value range`);
    }

    // Property type match
    if (preference.propertyTypes.length > 0 && alert.propertyType) {
      const matchesPropertyType = preference.propertyTypes.some(type =>
        alert.propertyType?.toLowerCase().includes(type.toLowerCase())
      );
      
      if (matchesPropertyType) {
        score += 15;
        reasons.push(`Matches preferred property type: ${alert.propertyType}`);
      } else {
        score -= 5;
        reasons.push(`Different property type: ${alert.propertyType}`);
      }
    }

    // Bedroom match
    if (preference.minBedrooms && alert.bedrooms && alert.bedrooms < preference.minBedrooms) {
      score -= 5;
      reasons.push(`Below minimum bedroom requirement`);
    } else if (preference.maxBedrooms && alert.bedrooms && alert.bedrooms > preference.maxBedrooms) {
      score -= 5;
      reasons.push(`Above maximum bedroom preference`);
    } else if (alert.bedrooms && preference.minBedrooms && preference.maxBedrooms) {
      score += 5;
      reasons.push(`Within preferred bedroom range`);
    }

    // High opportunity score bonus
    if (alert.opportunityScore >= 80) {
      score += 10;
      reasons.push(`Exceptional opportunity score: ${alert.opportunityScore}`);
    } else if (alert.opportunityScore >= 60) {
      score += 5;
      reasons.push(`Good opportunity score: ${alert.opportunityScore}`);
    }

    // Ensure minimum viable match score
    const isMatch = score >= 50; // Minimum 50 points to be considered a match

    return {
      isMatch,
      score,
      reasons
    };
  }

  /**
   * Build database query based on user preferences
   */
  private buildAlertQuery(preference: AlertPreference): any {
    const where: any = {
      status: 'ACTIVE',
      alertType: { in: preference.alertTypes },
      priority: this.getPriorityFilter(preference.minPriority),
      opportunityScore: { gte: preference.minOpportunityScore }
    };

    // Geographic filter
    if (preference.cities.length > 0) {
      where.OR = preference.cities.map(city => ({
        city: { contains: city, mode: 'insensitive' }
      }));
    }

    // Value range filter
    if (preference.minValue || preference.maxValue) {
      where.estimatedValue = {};
      if (preference.minValue) {
        where.estimatedValue.gte = preference.minValue;
      }
      if (preference.maxValue) {
        where.estimatedValue.lte = preference.maxValue;
      }
    }

    // Property type filter
    if (preference.propertyTypes.length > 0) {
      where.propertyType = {
        in: preference.propertyTypes
      };
    }

    // Bedroom filter
    if (preference.minBedrooms || preference.maxBedrooms) {
      where.bedrooms = {};
      if (preference.minBedrooms) {
        where.bedrooms.gte = preference.minBedrooms;
      }
      if (preference.maxBedrooms) {
        where.bedrooms.lte = preference.maxBedrooms;
      }
    }

    return where;
  }

  private getPriorityFilter(minPriority: string) {
    switch (minPriority) {
      case 'URGENT':
        return { in: ['URGENT'] };
      case 'HIGH':
        return { in: ['HIGH', 'URGENT'] };
      case 'MEDIUM':
        return { in: ['MEDIUM', 'HIGH', 'URGENT'] };
      case 'LOW':
        return { in: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] };
      default:
        return { in: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] };
    }
  }

  /**
   * Check if user has reached their daily alert limit
   */
  async hasReachedDailyLimit(userId: string): Promise<boolean> {
    try {
      const preference = await prisma.alertPreference.findUnique({
        where: { userId }
      });

      if (!preference) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const alertsToday = await prisma.userAlert.count({
        where: {
          userId,
          isNotified: true,
          notifiedAt: { gte: today }
        }
      });

      return alertsToday >= preference.maxAlertsPerDay;

    } catch (error) {
      logger.error('Error checking daily limit:', error);
      return false;
    }
  }

  /**
   * Check if current time is within user's quiet hours
   */
  isInQuietHours(preference: AlertPreference): boolean {
    if (!preference.quietHoursStart || !preference.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes(); // e.g., 14:30 = 1430

    const startTime = this.parseTimeString(preference.quietHoursStart);
    const endTime = this.parseTimeString(preference.quietHoursEnd);

    if (startTime > endTime) {
      // Quiet hours cross midnight (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      // Quiet hours within same day
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  private parseTimeString(timeString: string): number {
    try {
      const parts = timeString.split(':');
      if (parts.length !== 2) {
        logger.warn(`Invalid time string format: ${timeString}`);
        return 0;
      }
      
      const hours = parseInt(parts[0] || '0', 10);
      const minutes = parseInt(parts[1] || '0', 10);
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        logger.warn(`Invalid time values in: ${timeString}`);
        return 0;
      }
      
      return hours * 100 + minutes;
    } catch (error) {
      logger.warn(`Error parsing time string: ${timeString}`, error);
      return 0;
    }
  }
}