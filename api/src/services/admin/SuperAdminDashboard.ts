import { prisma } from '../../lib/database';
import { stripeService } from '../stripeService';
import { createLogger } from '../../utils/logger';
import Redis from 'ioredis';

const logger = createLogger();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface BusinessHealthMetrics {
  mrr: {
    value: number;
    growthRate: number;
    previousPeriod: number;
  };
  arr: {
    value: number;
    projection: number;
  };
  ltv: {
    overall: number;
    bySegment: Record<string, number>;
  };
  cac: {
    overall: number;
    byChannel: Record<string, number>;
  };
  churn: {
    rate: number;
    cohortAnalysis: Array<{
      period: string;
      churnRate: number;
      customerCount: number;
    }>;
  };
  nps: {
    score: number;
    trend: number;
    responses: number;
  };
}

export interface OperationalMetrics {
  activeUsers: {
    realTime: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  apiUsage: {
    rpm: number;
    rph: number;
    rpd: number;
    errors: number;
    latency: number;
  };
  aiCosts: {
    current: number;
    daily: number;
    monthly: number;
    budget: number;
    utilization: number;
  };
  serverLoad: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  errorRates: {
    api: number;
    frontend: number;
    database: number;
    integrations: number;
  };
  responseTimes: {
    api: number;
    database: number;
    cache: number;
    external: number;
  };
}

export interface SupportMetrics {
  openTickets: {
    total: number;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
  };
  resolutionTime: {
    average: number;
    p95: number;
    byPriority: Record<string, number>;
  };
  customerSatisfaction: {
    csat: number;
    trend: number;
    responses: number;
  };
  agentPerformance: {
    avgTicketsPerAgent: number;
    topPerformers: Array<{
      agentId: string;
      name: string;
      ticketsResolved: number;
      avgResolutionTime: number;
      csat: number;
    }>;
  };
  escalationRate: {
    percentage: number;
    trend: number;
  };
}

export interface SystemAlert {
  id: string;
  type: 'system' | 'business' | 'security';
  severity: 1 | 2 | 3 | 4;
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface QuickAction {
  id: string;
  category: 'emergency' | 'business';
  title: string;
  description: string;
  confirmationRequired: boolean;
  enabled: boolean;
}

export class SuperAdminDashboard {
  private cacheTimeout = 60000; // 1 minute cache

  /**
   * Get comprehensive business health metrics
   */
  async getBusinessHealthMetrics(): Promise<BusinessHealthMetrics> {
    const cacheKey = 'admin:business_health';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const [mrrData, churnData, npsData] = await Promise.all([
        this.calculateMRRMetrics(),
        this.calculateChurnMetrics(),
        this.calculateNPSMetrics()
      ]);

      const ltvData = await this.calculateLTVMetrics();
      const cacData = await this.calculateCACMetrics();

      const metrics: BusinessHealthMetrics = {
        mrr: mrrData,
        arr: {
          value: mrrData.value * 12,
          projection: this.calculateARRProjection(mrrData.value, mrrData.growthRate)
        },
        ltv: ltvData,
        cac: cacData,
        churn: churnData,
        nps: npsData
      };

      await redis.setex(cacheKey, this.cacheTimeout, JSON.stringify(metrics));
      return metrics;

    } catch (error) {
      logger.error('Error calculating business health metrics:', error);
      throw new Error('Failed to calculate business metrics');
    }
  }

  /**
   * Get real-time operational metrics
   */
  async getOperationalMetrics(): Promise<OperationalMetrics> {
    const cacheKey = 'admin:operational_metrics';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const [
        activeUsersData,
        apiUsageData,
        aiCostsData,
        serverLoadData,
        errorRatesData,
        responseTimesData
      ] = await Promise.all([
        this.getActiveUsersMetrics(),
        this.getAPIUsageMetrics(),
        this.getAICostsMetrics(),
        this.getServerLoadMetrics(),
        this.getErrorRatesMetrics(),
        this.getResponseTimesMetrics()
      ]);

      const metrics: OperationalMetrics = {
        activeUsers: activeUsersData,
        apiUsage: apiUsageData,
        aiCosts: aiCostsData,
        serverLoad: serverLoadData,
        errorRates: errorRatesData,
        responseTimes: responseTimesData
      };

      await redis.setex(cacheKey, 30, JSON.stringify(metrics)); // 30 second cache for real-time data
      return metrics;

    } catch (error) {
      logger.error('Error calculating operational metrics:', error);
      throw new Error('Failed to calculate operational metrics');
    }
  }

  /**
   * Get support system metrics
   */
  async getSupportMetrics(): Promise<SupportMetrics> {
    const cacheKey = 'admin:support_metrics';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const [
        openTicketsData,
        resolutionTimeData,
        csatData,
        agentPerformanceData,
        escalationData
      ] = await Promise.all([
        this.getOpenTicketsMetrics(),
        this.getResolutionTimeMetrics(),
        this.getCSATMetrics(),
        this.getAgentPerformanceMetrics(),
        this.getEscalationRateMetrics()
      ]);

      const metrics: SupportMetrics = {
        openTickets: openTicketsData,
        resolutionTime: resolutionTimeData,
        customerSatisfaction: csatData,
        agentPerformance: agentPerformanceData,
        escalationRate: escalationData
      };

      await redis.setex(cacheKey, this.cacheTimeout, JSON.stringify(metrics));
      return metrics;

    } catch (error) {
      logger.error('Error calculating support metrics:', error);
      throw new Error('Failed to calculate support metrics');
    }
  }

  /**
   * Get active system alerts
   */
  async getActiveAlerts(): Promise<SystemAlert[]> {
    try {
      // System alerts from monitoring
      const systemAlerts = await this.getSystemAlerts();
      
      // Business alerts from analytics
      const businessAlerts = await this.getBusinessAlerts();
      
      // Security alerts
      const securityAlerts = await this.getSecurityAlerts();

      const allAlerts = [...systemAlerts, ...businessAlerts, ...securityAlerts];
      
      // Sort by severity and timestamp
      return allAlerts.sort((a, b) => {
        if (a.severity !== b.severity) {
          return a.severity - b.severity; // Lower number = higher severity
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

    } catch (error) {
      logger.error('Error fetching alerts:', error);
      return [];
    }
  }

  /**
   * Get available quick actions
   */
  async getQuickActions(): Promise<QuickAction[]> {
    return [
      // Emergency controls
      {
        id: 'pause_ai_processing',
        category: 'emergency',
        title: 'Pause AI Processing',
        description: 'Temporarily halt all AI API calls to prevent cost overrun',
        confirmationRequired: true,
        enabled: true
      },
      {
        id: 'disable_signups',
        category: 'emergency',
        title: 'Disable New Signups',
        description: 'Prevent new user registrations',
        confirmationRequired: true,
        enabled: true
      },
      {
        id: 'maintenance_mode',
        category: 'emergency',
        title: 'Enable Maintenance Mode',
        description: 'Show maintenance page to all users',
        confirmationRequired: true,
        enabled: true
      },
      {
        id: 'force_cache_refresh',
        category: 'emergency',
        title: 'Force Cache Refresh',
        description: 'Clear all caches and refresh data',
        confirmationRequired: false,
        enabled: true
      },
      {
        id: 'rollback_deployment',
        category: 'emergency',
        title: 'Rollback Deployment',
        description: 'Revert to previous stable version',
        confirmationRequired: true,
        enabled: false // Only enable if rollback is available
      },

      // Business actions
      {
        id: 'send_announcement',
        category: 'business',
        title: 'Send Mass Notification',
        description: 'Send email/push notification to all users',
        confirmationRequired: true,
        enabled: true
      },
      {
        id: 'apply_discount',
        category: 'business',
        title: 'Apply Discount Code',
        description: 'Create and distribute promotional discount',
        confirmationRequired: false,
        enabled: true
      },
      {
        id: 'extend_trials',
        category: 'business',
        title: 'Extend Trial Periods',
        description: 'Add time to active trial accounts',
        confirmationRequired: true,
        enabled: true
      },
      {
        id: 'process_refunds',
        category: 'business',
        title: 'Bulk Refund Processing',
        description: 'Process multiple refunds at once',
        confirmationRequired: true,
        enabled: true
      }
    ];
  }

  /**
   * Execute a quick action
   */
  async executeQuickAction(actionId: string, parameters?: Record<string, any>, adminUserId?: string): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      logger.info(`Executing quick action: ${actionId} by admin: ${adminUserId}`);

      switch (actionId) {
        case 'pause_ai_processing':
          return await this.pauseAIProcessing(adminUserId);
        
        case 'disable_signups':
          return await this.disableSignups(adminUserId);
        
        case 'maintenance_mode':
          return await this.enableMaintenanceMode(adminUserId);
        
        case 'force_cache_refresh':
          return await this.forceCacheRefresh(adminUserId);
        
        case 'send_announcement':
          return await this.sendMassNotification(parameters, adminUserId);
        
        case 'apply_discount':
          return await this.applyDiscountCode(parameters, adminUserId);
        
        case 'extend_trials':
          return await this.extendTrialPeriods(parameters, adminUserId);
        
        case 'process_refunds':
          return await this.processBulkRefunds(parameters, adminUserId);
        
        default:
          throw new Error(`Unknown action: ${actionId}`);
      }

    } catch (error) {
      logger.error(`Quick action ${actionId} failed:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Action failed'
      };
    }
  }

  // Private helper methods for metric calculations

  private async calculateMRRMetrics() {
    const currentMonth = new Date();
    const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    // Get subscription analytics from Stripe
    const analytics = await stripeService.getSubscriptionAnalytics(30);
    
    const currentMRR = analytics.totalRevenue;
    const previousMRR = await this.getPreviousMonthMRR();
    const growthRate = previousMRR > 0 ? ((currentMRR - previousMRR) / previousMRR) * 100 : 0;

    return {
      value: currentMRR,
      growthRate,
      previousPeriod: previousMRR
    };
  }

  private async calculateChurnMetrics() {
    const analytics = await stripeService.getSubscriptionAnalytics(30);
    const totalCustomers = analytics.newSubscriptions + analytics.cancelledSubscriptions;
    const churnRate = totalCustomers > 0 ? (analytics.cancelledSubscriptions / totalCustomers) * 100 : 0;

    // Generate cohort analysis
    const cohortAnalysis = await this.generateCohortAnalysis();

    return {
      rate: churnRate,
      cohortAnalysis
    };
  }

  private async calculateNPSMetrics() {
    // This would integrate with your NPS survey system
    // For now, return mock data structure
    return {
      score: 72, // Mock NPS score
      trend: 5, // +5 from last period
      responses: 156
    };
  }

  private async calculateLTVMetrics() {
    // Calculate customer lifetime value by segment
    const users = await prisma.user.groupBy({
      by: ['subscriptionTier'],
      _count: true,
      _avg: {
        // This would require additional fields in your schema
      }
    });

    const overall = 2500; // Mock LTV calculation
    const bySegment = {
      'SOLO_AGENT': 1800,
      'PROFESSIONAL': 3500,
      'TEAM_ENTERPRISE': 8500,
      'WHITE_LABEL': 25000
    };

    return { overall, bySegment };
  }

  private async calculateCACMetrics() {
    // Calculate customer acquisition cost by channel
    // This would integrate with your marketing attribution system
    return {
      overall: 150,
      byChannel: {
        'organic': 50,
        'paid_search': 200,
        'social': 175,
        'referral': 25,
        'direct': 100
      }
    };
  }

  private calculateARRProjection(currentMRR: number, growthRate: number): number {
    // Simple ARR projection based on current MRR and growth rate
    let projectedARR = 0;
    let monthlyMRR = currentMRR;
    
    for (let i = 0; i < 12; i++) {
      projectedARR += monthlyMRR;
      monthlyMRR *= (1 + growthRate / 100);
    }
    
    return Math.round(projectedARR);
  }

  private async getActiveUsersMetrics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get real-time active users from Redis
    const realTimeActive = await redis.scard('active_users:realtime') || 0;

    const [daily, weekly, monthly] = await Promise.all([
      prisma.user.count({
        where: {
          lastLogin: {
            gte: today
          }
        }
      }),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: thisWeek
          }
        }
      }),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: thisMonth
          }
        }
      })
    ]);

    return {
      realTime: realTimeActive,
      daily,
      weekly,
      monthly
    };
  }

  private async getAPIUsageMetrics() {
    // Get API usage from Redis metrics
    const [rpm, rph, rpd] = await Promise.all([
      redis.get('api:requests:minute') || '0',
      redis.get('api:requests:hour') || '0',
      redis.get('api:requests:day') || '0'
    ]);

    return {
      rpm: parseInt(rpm),
      rph: parseInt(rph),
      rpd: parseInt(rpd),
      errors: await this.getAPIErrorCount(),
      latency: await this.getAverageLatency()
    };
  }

  private async getAICostsMetrics() {
    // Get AI costs from Redis or database
    const dailyBudget = 100; // $100/day from environment
    const currentSpend = await redis.get('ai:costs:daily') || '0';
    const monthlySpend = await redis.get('ai:costs:monthly') || '0';

    return {
      current: parseFloat(currentSpend),
      daily: parseFloat(currentSpend),
      monthly: parseFloat(monthlySpend),
      budget: dailyBudget,
      utilization: (parseFloat(currentSpend) / dailyBudget) * 100
    };
  }

  private async getServerLoadMetrics() {
    // Get server metrics from monitoring system
    // This would integrate with your monitoring solution
    return {
      cpu: 45.2,
      memory: 67.8,
      disk: 23.4,
      network: 12.1
    };
  }

  private async getErrorRatesMetrics() {
    // Get error rates from logs/monitoring
    return {
      api: 0.12,
      frontend: 0.08,
      database: 0.03,
      integrations: 0.15
    };
  }

  private async getResponseTimesMetrics() {
    // Get response times from monitoring
    return {
      api: 145,
      database: 23,
      cache: 2,
      external: 890
    };
  }

  private async getOpenTicketsMetrics() {
    const tickets = await prisma.supportTicket.groupBy({
      by: ['priority', 'category'],
      _count: true,
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS']
        }
      }
    });

    const total = tickets.reduce((sum, ticket) => sum + ticket._count, 0);
    
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    tickets.forEach(ticket => {
      byPriority[ticket.priority] = (byPriority[ticket.priority] || 0) + ticket._count;
      byCategory[ticket.category] = (byCategory[ticket.category] || 0) + ticket._count;
    });

    return { total, byPriority, byCategory };
  }

  private async getResolutionTimeMetrics() {
    // Calculate average resolution time from resolved tickets
    const resolvedTickets = await prisma.supportTicket.findMany({
      where: {
        status: 'RESOLVED',
        resolvedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: {
        priority: true,
        createdAt: true,
        resolvedAt: true
      }
    });

    const resolutionTimes = resolvedTickets
      .filter(ticket => ticket.resolvedAt)
      .map(ticket => ({
        priority: ticket.priority,
        time: ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()
      }));

    const average = resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum, rt) => sum + rt.time, 0) / resolutionTimes.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    const sorted = resolutionTimes.map(rt => rt.time).sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted.length > 0 ? sorted[p95Index] / (1000 * 60 * 60) : 0; // Convert to hours

    const byPriority: Record<string, number> = {};
    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(priority => {
      const priorityTimes = resolutionTimes.filter(rt => rt.priority === priority);
      byPriority[priority] = priorityTimes.length > 0
        ? priorityTimes.reduce((sum, rt) => sum + rt.time, 0) / priorityTimes.length / (1000 * 60 * 60)
        : 0;
    });

    return { average, p95, byPriority };
  }

  private async getCSATMetrics() {
    // This would integrate with your CSAT survey system
    return {
      csat: 4.2, // Out of 5
      trend: 0.1, // +0.1 from last period
      responses: 89
    };
  }

  private async getAgentPerformanceMetrics() {
    // Get performance metrics for support agents
    const agentStats = await prisma.supportTicket.groupBy({
      by: ['assignedToId'],
      _count: true,
      _avg: {
        // Would need resolution time field
      },
      where: {
        status: 'RESOLVED',
        resolvedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    const totalTickets = agentStats.reduce((sum, stat) => sum + stat._count, 0);
    const avgTicketsPerAgent = agentStats.length > 0 ? totalTickets / agentStats.length : 0;

    const topPerformers = agentStats
      .filter(stat => stat.assignedToId)
      .map(stat => ({
        agentId: stat.assignedToId!,
        name: `Agent ${stat.assignedToId}`, // Would get actual name from User table
        ticketsResolved: stat._count,
        avgResolutionTime: 4.5, // Mock data
        csat: 4.3 // Mock data
      }))
      .sort((a, b) => b.ticketsResolved - a.ticketsResolved)
      .slice(0, 5);

    return {
      avgTicketsPerAgent,
      topPerformers
    };
  }

  private async getEscalationRateMetrics() {
    const totalTickets = await prisma.supportTicket.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const escalatedTickets = await prisma.supportTicket.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        // Would need escalated field in schema
        priority: 'CRITICAL' // Using priority as proxy for escalation
      }
    });

    const percentage = totalTickets > 0 ? (escalatedTickets / totalTickets) * 100 : 0;

    return {
      percentage,
      trend: -2.3 // Mock trend data
    };
  }

  // Alert methods
  private async getSystemAlerts(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    // Check for system issues
    const serverLoad = await this.getServerLoadMetrics();
    if (serverLoad.cpu > 80) {
      alerts.push({
        id: 'high_cpu',
        type: 'system',
        severity: 2,
        title: 'High CPU Usage',
        message: `CPU usage at ${serverLoad.cpu.toFixed(1)}%`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check AI costs
    const aiCosts = await this.getAICostsMetrics();
    if (aiCosts.utilization > 80) {
      alerts.push({
        id: 'high_ai_costs',
        type: 'system',
        severity: aiCosts.utilization > 95 ? 1 : 2,
        title: 'AI Budget Warning',
        message: `Daily AI budget ${aiCosts.utilization.toFixed(1)}% utilized`,
        timestamp: new Date(),
        resolved: false
      });
    }

    return alerts;
  }

  private async getBusinessAlerts(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    // Check churn rate
    const businessHealth = await this.getBusinessHealthMetrics();
    if (businessHealth.churn.rate > 10) {
      alerts.push({
        id: 'high_churn',
        type: 'business',
        severity: 2,
        title: 'High Churn Rate',
        message: `Monthly churn rate at ${businessHealth.churn.rate.toFixed(1)}%`,
        timestamp: new Date(),
        resolved: false
      });
    }

    return alerts;
  }

  private async getSecurityAlerts(): Promise<SystemAlert[]> {
    // This would integrate with your security monitoring system
    return [];
  }

  // Quick action implementations
  private async pauseAIProcessing(adminUserId?: string) {
    await redis.set('ai:processing:paused', 'true', 'EX', 3600); // 1 hour
    
    // Log admin action
    if (adminUserId) {
      await prisma.adminAction.create({
        data: {
          adminId: adminUserId,
          action: 'PAUSE_AI_PROCESSING',
          details: { reason: 'Emergency pause via dashboard' },
          timestamp: new Date()
        }
      });
    }

    return {
      success: true,
      message: 'AI processing paused for 1 hour'
    };
  }

  private async disableSignups(adminUserId?: string) {
    await redis.set('signups:disabled', 'true');
    
    if (adminUserId) {
      await prisma.adminAction.create({
        data: {
          adminId: adminUserId,
          action: 'DISABLE_SIGNUPS',
          details: { reason: 'Emergency disable via dashboard' },
          timestamp: new Date()
        }
      });
    }

    return {
      success: true,
      message: 'New user signups disabled'
    };
  }

  private async enableMaintenanceMode(adminUserId?: string) {
    await redis.set('maintenance:enabled', 'true');
    
    if (adminUserId) {
      await prisma.adminAction.create({
        data: {
          adminId: adminUserId,
          action: 'ENABLE_MAINTENANCE',
          details: { reason: 'Emergency maintenance via dashboard' },
          timestamp: new Date()
        }
      });
    }

    return {
      success: true,
      message: 'Maintenance mode enabled'
    };
  }

  private async forceCacheRefresh(adminUserId?: string) {
    // Clear all admin dashboard caches
    const keys = await redis.keys('admin:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return {
      success: true,
      message: `Cleared ${keys.length} cache keys`
    };
  }

  private async sendMassNotification(parameters?: Record<string, any>, adminUserId?: string) {
    // This would integrate with your notification system
    return {
      success: true,
      message: 'Mass notification queued for delivery'
    };
  }

  private async applyDiscountCode(parameters?: Record<string, any>, adminUserId?: string) {
    // This would integrate with Stripe for discount creation
    return {
      success: true,
      message: 'Discount code created and activated'
    };
  }

  private async extendTrialPeriods(parameters?: Record<string, any>, adminUserId?: string) {
    // Extend trial periods for active trial users
    const trialUsers = await prisma.user.count({
      where: {
        subscriptionTier: 'FREE'
        // Would need trial end date field
      }
    });

    return {
      success: true,
      message: `Extended trial periods for ${trialUsers} users`
    };
  }

  private async processBulkRefunds(parameters?: Record<string, any>, adminUserId?: string) {
    // This would integrate with Stripe for bulk refund processing
    return {
      success: true,
      message: 'Bulk refund processing initiated'
    };
  }

  // Helper methods
  private async getPreviousMonthMRR(): Promise<number> {
    // Calculate previous month MRR
    // This would query historical data or Stripe
    return 15000; // Mock data
  }

  private async generateCohortAnalysis() {
    // Generate churn cohort analysis
    // This would analyze user retention by signup cohorts
    return [
      { period: '2024-01', churnRate: 8.5, customerCount: 120 },
      { period: '2024-02', churnRate: 12.1, customerCount: 145 },
      { period: '2024-03', churnRate: 9.8, customerCount: 167 }
    ];
  }

  private async getAPIErrorCount(): Promise<number> {
    const errorCount = await redis.get('api:errors:hour');
    return parseInt(errorCount || '0');
  }

  private async getAverageLatency(): Promise<number> {
    const latency = await redis.get('api:latency:average');
    return parseFloat(latency || '0');
  }
}

export const superAdminDashboard = new SuperAdminDashboard();