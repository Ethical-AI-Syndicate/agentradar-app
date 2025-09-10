import { Request, Response, NextFunction } from 'express';
import { PrismaClient, SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { createLogger } from '../utils/logger';

const prisma = new PrismaClient();
const logger = createLogger();

// Usage limits by subscription tier
const USAGE_LIMITS = {
  [SubscriptionTier.FREE]: {
    court_filings: { daily: 5, monthly: 20 },
    estate_sales: { daily: 3, monthly: 10 },
    property_analysis: { daily: 2, monthly: 5 },
    api_calls: { daily: 50, monthly: 200 },
    alerts: { active: 2 }
  },
  [SubscriptionTier.SOLO_AGENT]: {
    court_filings: { daily: 25, monthly: 500 },
    estate_sales: { daily: 20, monthly: 400 },
    property_analysis: { daily: 15, monthly: 200 },
    api_calls: { daily: 500, monthly: 10000 },
    alerts: { active: 10 }
  },
  [SubscriptionTier.PROFESSIONAL]: {
    court_filings: { daily: 100, monthly: 2000 },
    estate_sales: { daily: 75, monthly: 1500 },
    property_analysis: { daily: 50, monthly: 1000 },
    api_calls: { daily: 2000, monthly: 50000 },
    alerts: { active: 50 }
  },
  [SubscriptionTier.TEAM_ENTERPRISE]: {
    court_filings: { daily: -1, monthly: -1 }, // Unlimited
    estate_sales: { daily: -1, monthly: -1 },
    property_analysis: { daily: -1, monthly: -1 },
    api_calls: { daily: -1, monthly: -1 },
    alerts: { active: -1 }
  },
  [SubscriptionTier.WHITE_LABEL]: {
    court_filings: { daily: -1, monthly: -1 }, // Unlimited
    estate_sales: { daily: -1, monthly: -1 },
    property_analysis: { daily: -1, monthly: -1 },
    api_calls: { daily: -1, monthly: -1 },
    alerts: { active: -1 }
  }
};

// Extend Request type to include usage data
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      usageData?: {
        feature: string;
        daily: number;
        monthly: number;
        limits: { daily: number; monthly: number };
      };
    }
  }
}

/**
 * Middleware to check usage limits for specific features
 */
export function checkUsageLimit(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.startTime = Date.now(); // Track request start time
      
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User authentication is required to access this feature'
        });
      }

      const { id: userId, subscriptionTier } = req.user;

      // For now, assume active subscription for non-FREE tiers
      // This will be enhanced when full billing system is integrated

      // Get usage limits for user's tier
      const limits = USAGE_LIMITS[subscriptionTier];
      const featureLimits = limits[feature as keyof typeof limits];

      if (!featureLimits) {
        return res.status(403).json({
          error: 'Feature not available',
          message: `The ${feature} feature is not available in your subscription tier`,
          upgradeRequired: true
        });
      }

      // Check current usage
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [dailyUsage, monthlyUsage] = await Promise.all([
        prisma.usageRecord.aggregate({
          where: {
            userId,
            service: feature,
            createdAt: { gte: startOfDay }
          },
          _sum: { count: true }
        }),
        prisma.usageRecord.aggregate({
          where: {
            userId,
            service: feature,
            createdAt: { gte: startOfMonth }
          },
          _sum: { count: true }
        })
      ]);

      const dailyCount = dailyUsage._sum.count || 0;
      const monthlyCount = monthlyUsage._sum.count || 0;

      // Store usage data in request for potential use in response
      req.usageData = {
        feature,
        daily: dailyCount,
        monthly: monthlyCount,
        limits: featureLimits as { daily: number; monthly: number }
      };

      // Check daily limit (-1 means unlimited)
      if (featureLimits.daily !== -1 && dailyCount >= featureLimits.daily) {
        return res.status(429).json({
          error: 'Daily limit exceeded',
          message: `You have reached your daily limit of ${featureLimits.daily} requests for ${feature}`,
          usage: {
            current: dailyCount,
            limit: featureLimits.daily,
            period: 'daily',
            resetTime: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
          },
          upgradeRequired: subscriptionTier === SubscriptionTier.FREE
        });
      }

      // Check monthly limit (-1 means unlimited)
      if (featureLimits.monthly !== -1 && monthlyCount >= featureLimits.monthly) {
        return res.status(429).json({
          error: 'Monthly limit exceeded',
          message: `You have reached your monthly limit of ${featureLimits.monthly} requests for ${feature}`,
          usage: {
            current: monthlyCount,
            limit: featureLimits.monthly,
            period: 'monthly',
            resetTime: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1)
          },
          upgradeRequired: subscriptionTier === SubscriptionTier.FREE
        });
      }

      // Log usage check
      logger.debug(`Usage check passed for user ${userId}, feature ${feature}: daily=${dailyCount}/${featureLimits.daily}, monthly=${monthlyCount}/${featureLimits.monthly}`);

      next();

    } catch (error) {
      logger.error('Usage limit check failed:', error);
      return res.status(500).json({
        error: 'Usage limit check failed',
        message: 'Unable to verify usage limits. Please try again.'
      });
    }
  };
}

/**
 * Middleware to record successful API usage
 */
export function recordUsage(feature: string, resultCount: number = 1) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user?.id) {
        await prisma.usageRecord.create({
          data: {
            userId: req.user.id,
            service: feature,
            count: 1,
            metadata: {
              resultCount,
              responseTime: req.startTime ? Date.now() - req.startTime : null
            }
          }
        });

        logger.debug(`Recorded usage: user=${req.user.id}, feature=${feature}, results=${resultCount}`);
      }
    } catch (error) {
      logger.error('Failed to record usage:', error);
      // Don't fail the request if usage recording fails
    }

    next();
  };
}

/**
 * Get current usage statistics for a user
 */
export async function getUserUsage(userId: string, feature?: string) {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const whereClause: any = {
      userId,
      timestamp: { gte: startOfMonth }
    };

    if (feature) {
      whereClause.feature = feature;
    }

    const [dailyUsage, monthlyUsage, user] = await Promise.all([
      prisma.usageRecord.aggregate({
        where: {
          ...whereClause,
          createdAt: { gte: startOfDay }
        },
        _sum: { count: true },
        _count: { id: true }
      }),
      prisma.usageRecord.aggregate({
        where: whereClause,
        _sum: { count: true },
        _count: { id: true }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true, subscriptionStatus: true }
      })
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    const limits = USAGE_LIMITS[user.subscriptionTier];
    const featureLimits = feature ? limits[feature as keyof typeof limits] : null;

    return {
      daily: {
        requests: dailyUsage._sum.count || 0,
        calls: dailyUsage._count.id || 0
      },
      monthly: {
        requests: monthlyUsage._sum.count || 0,
        calls: monthlyUsage._count.id || 0
      },
      limits: featureLimits,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: 'active' // Simplified for now
    };

  } catch (error) {
    logger.error('Failed to get user usage:', error);
    throw error;
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, subscriptionStatus: true }
    });

    if (!user) {
      return false;
    }

    // Check if subscription is active (except for FREE tier)
    // For now, assume active status if not FREE tier
    if (user.subscriptionTier === SubscriptionTier.FREE) {
      // FREE tier always has limited access
    }

    // Check if feature is available in user's tier
    const limits = USAGE_LIMITS[user.subscriptionTier];
    return feature in limits;

  } catch (error) {
    logger.error('Failed to check feature access:', error);
    return false;
  }
}

/**
 * Get subscription upgrade recommendations based on usage
 */
export async function getUpgradeRecommendations(userId: string) {
  try {
    const usage = await getUserUsage(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentTierLimits = USAGE_LIMITS[user.subscriptionTier];
    const recommendations: string[] = [];

    // Check if user is approaching limits
    for (const [feature, limits] of Object.entries(currentTierLimits)) {
      if (typeof limits === 'object' && 'monthly' in limits && limits.monthly !== -1) {
        const featureUsage = await getUserUsage(userId, feature);
        const utilizationRate = featureUsage.monthly.requests / limits.monthly;

        if (utilizationRate > 0.8) {
          recommendations.push(`You're using ${Math.round(utilizationRate * 100)}% of your ${feature} allowance`);
        }
      }
    }

    // Suggest next tier
    let suggestedTier: SubscriptionTier | null = null;
    
    switch (user.subscriptionTier) {
      case SubscriptionTier.FREE:
        suggestedTier = SubscriptionTier.SOLO_AGENT;
        break;
      case SubscriptionTier.SOLO_AGENT:
        suggestedTier = SubscriptionTier.PROFESSIONAL;
        break;
      case SubscriptionTier.PROFESSIONAL:
        suggestedTier = SubscriptionTier.TEAM_ENTERPRISE;
        break;
    }

    return {
      currentTier: user.subscriptionTier,
      suggestedTier,
      recommendations,
      usage
    };

  } catch (error) {
    logger.error('Failed to get upgrade recommendations:', error);
    throw error;
  }
}

export default {
  checkUsageLimit,
  recordUsage,
  getUserUsage,
  hasFeatureAccess,
  getUpgradeRecommendations
};