import { prisma } from '../lib/database';
import { leadQualificationService } from './leadQualificationService';

interface SalesAutomationRule {
  id: string;
  name: string;
  trigger: {
    condition: 'LEAD_SCORE_CHANGE' | 'TIME_BASED' | 'ACTIVITY_COMPLETED' | 'MANUAL';
    criteria: Record<string, any>;
  };
  actions: Array<{
    type: 'EMAIL' | 'TASK_CREATE' | 'CALENDAR_SCHEDULE' | 'CRM_UPDATE' | 'NOTIFICATION';
    parameters: Record<string, any>;
    delay?: number; // minutes
  }>;
  enabled: boolean;
}

interface SalesPipeline {
  stages: Array<{
    name: string;
    order: number;
    criteria: Record<string, any>;
    automations: string[]; // automation rule IDs
  }>;
}

interface DealForecast {
  leadId: string;
  probability: number;
  estimatedValue: number;
  estimatedCloseDate: Date;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: {
    leadScore: number;
    engagementLevel: number;
    timeInPipeline: number;
    salesRepPerformance: number;
    historicalData: number;
  };
}

export class EnterpriseSalesAutomation {
  
  private salesAutomationRules: SalesAutomationRule[] = [
    {
      id: 'hot-lead-immediate-response',
      name: 'Hot Lead Immediate Response',
      trigger: {
        condition: 'LEAD_SCORE_CHANGE',
        criteria: { tier: 'HOT', scoreIncrease: 20 }
      },
      actions: [
        {
          type: 'EMAIL',
          parameters: {
            template: 'hot_lead_immediate_response',
            priority: 'HIGH'
          },
          delay: 0
        },
        {
          type: 'TASK_CREATE',
          parameters: {
            assignee: 'ASSIGNED_SALES_REP',
            priority: 'URGENT',
            dueIn: 30, // minutes
            task: 'Call hot lead immediately - window closes fast'
          },
          delay: 0
        },
        {
          type: 'CALENDAR_SCHEDULE',
          parameters: {
            type: 'DEMO',
            duration: 45,
            suggestedTimes: 'NEXT_24_HOURS'
          },
          delay: 5
        }
      ],
      enabled: true
    },
    {
      id: 'demo-no-show-recovery',
      name: 'Demo No-Show Recovery Sequence',
      trigger: {
        condition: 'ACTIVITY_COMPLETED',
        criteria: { activityType: 'DEMO_SCHEDULED', outcome: 'NO_SHOW' }
      },
      actions: [
        {
          type: 'EMAIL',
          parameters: {
            template: 'demo_no_show_apologetic',
            includeRescheduling: true
          },
          delay: 60 // 1 hour after no-show
        },
        {
          type: 'TASK_CREATE',
          parameters: {
            assignee: 'ASSIGNED_SALES_REP',
            task: 'Rescue no-show demo - personalized outreach needed',
            priority: 'HIGH'
          },
          delay: 120
        },
        {
          type: 'EMAIL',
          parameters: {
            template: 'demo_reschedule_incentive',
            incentive: '30min_free_consultation'
          },
          delay: 1440 // 24 hours
        }
      ],
      enabled: true
    },
    {
      id: 'enterprise-lead-escalation',
      name: 'Enterprise Lead Escalation',
      trigger: {
        condition: 'LEAD_SCORE_CHANGE',
        criteria: { companySize: 50, budget: 50000 }
      },
      actions: [
        {
          type: 'NOTIFICATION',
          parameters: {
            to: 'enterprise_sales_director',
            message: 'High-value enterprise lead requires senior attention',
            urgency: 'HIGH'
          },
          delay: 0
        },
        {
          type: 'CRM_UPDATE',
          parameters: {
            assignTo: 'Sarah Chen - Enterprise Sales Director',
            addTags: ['ENTERPRISE', 'HIGH_VALUE', 'DIRECTOR_ATTENTION']
          },
          delay: 0
        }
      ],
      enabled: true
    },
    {
      id: 'stale-lead-reactivation',
      name: 'Stale Lead Reactivation Campaign',
      trigger: {
        condition: 'TIME_BASED',
        criteria: { daysSinceLastActivity: 14, tier: 'WARM' }
      },
      actions: [
        {
          type: 'EMAIL',
          parameters: {
            template: 'reactivation_market_update',
            includeInsights: true
          },
          delay: 0
        },
        {
          type: 'EMAIL',
          parameters: {
            template: 'reactivation_case_study',
            customerSuccessStory: true
          },
          delay: 4320 // 3 days
        },
        {
          type: 'TASK_CREATE',
          parameters: {
            assignee: 'ASSIGNED_SALES_REP',
            task: 'Personal check-in call for warm lead reactivation'
          },
          delay: 7200 // 5 days
        }
      ],
      enabled: true
    }
  ];

  private salesPipeline: SalesPipeline = {
    stages: [
      {
        name: 'Lead',
        order: 1,
        criteria: { status: 'NEW' },
        automations: ['hot-lead-immediate-response', 'enterprise-lead-escalation']
      },
      {
        name: 'Qualified',
        order: 2,
        criteria: { status: 'QUALIFIED', score: 45 },
        automations: []
      },
      {
        name: 'Demo Scheduled',
        order: 3,
        criteria: { hasDemo: true },
        automations: ['demo-no-show-recovery']
      },
      {
        name: 'Demo Completed',
        order: 4,
        criteria: { demoCompleted: true },
        automations: []
      },
      {
        name: 'Proposal Sent',
        order: 5,
        criteria: { proposalSent: true },
        automations: []
      },
      {
        name: 'Negotiation',
        order: 6,
        criteria: { status: 'NEGOTIATION' },
        automations: []
      },
      {
        name: 'Closed Won',
        order: 7,
        criteria: { status: 'CLOSED_WON' },
        automations: []
      },
      {
        name: 'Closed Lost',
        order: 8,
        criteria: { status: 'CLOSED_LOST' },
        automations: ['stale-lead-reactivation']
      }
    ]
  };
  
  /**
   * Execute automation rules based on trigger events
   */
  async executeAutomationRules(
    trigger: 'LEAD_SCORE_CHANGE' | 'TIME_BASED' | 'ACTIVITY_COMPLETED' | 'MANUAL',
    context: Record<string, any>
  ): Promise<void> {
    
    const applicableRules = this.salesAutomationRules.filter(rule => 
      rule.enabled && 
      rule.trigger.condition === trigger &&
      this.matchesCriteria(context, rule.trigger.criteria)
    );
    
    for (const rule of applicableRules) {
      console.log(`Executing automation rule: ${rule.name}`);
      
      for (const action of rule.actions) {
        if (action.delay && action.delay > 0) {
          // Schedule delayed action
          setTimeout(() => {
            this.executeAction(action, context);
          }, action.delay * 60 * 1000); // Convert minutes to milliseconds
        } else {
          // Execute immediately
          await this.executeAction(action, context);
        }
      }
    }
  }
  
  /**
   * Check if context matches rule criteria
   */
  private matchesCriteria(context: Record<string, any>, criteria: Record<string, any>): boolean {
    return Object.entries(criteria).every(([key, value]) => {
      const contextValue = context[key];
      
      if (typeof value === 'object' && value.operator) {
        // Handle complex criteria like { operator: 'gte', value: 50 }
        switch (value.operator) {
          case 'gte': return contextValue >= value.value;
          case 'lte': return contextValue <= value.value;
          case 'gt': return contextValue > value.value;
          case 'lt': return contextValue < value.value;
          case 'in': return value.value.includes(contextValue);
          default: return contextValue === value.value;
        }
      }
      
      return contextValue === value || (Array.isArray(value) && value.includes(contextValue));
    });
  }
  
  /**
   * Execute individual automation action
   */
  private async executeAction(
    action: {
      type: 'EMAIL' | 'TASK_CREATE' | 'CALENDAR_SCHEDULE' | 'CRM_UPDATE' | 'NOTIFICATION';
      parameters: Record<string, any>;
    },
    context: Record<string, any>
  ): Promise<void> {
    
    switch (action.type) {
      case 'EMAIL':
        await this.sendAutomatedEmail(action.parameters, context);
        break;
        
      case 'TASK_CREATE':
        await this.createSalesTask(action.parameters, context);
        break;
        
      case 'CALENDAR_SCHEDULE':
        await this.scheduleCalendarEvent(action.parameters, context);
        break;
        
      case 'CRM_UPDATE':
        await this.updateCRMRecord(action.parameters, context);
        break;
        
      case 'NOTIFICATION':
        await this.sendNotification(action.parameters, context);
        break;
    }
  }
  
  /**
   * Send automated email
   */
  private async sendAutomatedEmail(parameters: Record<string, any>, context: Record<string, any>): Promise<void> {
    const emailTemplates = {
      'hot_lead_immediate_response': {
        subject: 'Your AgentRadar inquiry - Let\'s talk today!',
        content: `Hi ${context.contactName},\n\nThank you for your interest in AgentRadar. Based on your profile, I can see significant value opportunities for ${context.companyName}.\n\nI'd like to schedule a brief 15-minute call today to discuss your specific needs. When would work best for you?\n\nBest regards,\n${context.salesRep}`
      },
      'demo_no_show_apologetic': {
        subject: 'Missed our demo - My fault, let\'s reschedule',
        content: `Hi ${context.contactName},\n\nI noticed we missed each other for our scheduled demo. This happens more often than you'd think - probably my fault for not confirming properly.\n\nI have a few open slots this week and would love to show you how AgentRadar can help ${context.companyName}. The demo is really worth your time.\n\nReply with what works for you?\n\nThanks,\n${context.salesRep}`
      },
      'reactivation_market_update': {
        subject: 'Major market shifts affecting real estate professionals',
        content: `Hi ${context.contactName},\n\nI wanted to share some market insights I thought ${context.companyName} would find valuable...\n\n[Market insights content]\n\nHave you had a chance to consider how these changes might affect your business strategy?\n\nBest,\n${context.salesRep}`
      }
    };
    
    const template = emailTemplates[parameters.template as keyof typeof emailTemplates];
    if (!template) return;
    
    // In production, integrate with email service (SendGrid, etc.)
    console.log(`Sending automated email:`, {
      to: context.email,
      subject: template.subject,
      content: template.content,
      priority: parameters.priority || 'NORMAL'
    });
  }
  
  /**
   * Create sales task
   */
  private async createSalesTask(parameters: Record<string, any>, context: Record<string, any>): Promise<void> {
    const dueDate = new Date();
    if (parameters.dueIn) {
      dueDate.setMinutes(dueDate.getMinutes() + parameters.dueIn);
    }
    
    const assignee = parameters.assignee === 'ASSIGNED_SALES_REP' 
      ? context.salesRep 
      : parameters.assignee;
    
    // In production, integrate with CRM/task management system
    console.log(`Creating sales task:`, {
      assignee,
      task: parameters.task,
      priority: parameters.priority || 'MEDIUM',
      dueDate: dueDate.toISOString(),
      leadId: context.leadId,
      leadContext: {
        name: context.contactName,
        company: context.companyName,
        tier: context.tier
      }
    });
  }
  
  /**
   * Schedule calendar event
   */
  private async scheduleCalendarEvent(parameters: Record<string, any>, context: Record<string, any>): Promise<void> {
    // In production, integrate with calendar service (Google Calendar, Calendly, etc.)
    console.log(`Scheduling calendar event:`, {
      type: parameters.type,
      duration: parameters.duration,
      attendees: [context.email, context.salesRep],
      suggestedTimes: parameters.suggestedTimes,
      leadId: context.leadId
    });
  }
  
  /**
   * Update CRM record
   */
  private async updateCRMRecord(parameters: Record<string, any>, context: Record<string, any>): Promise<void> {
    if (context.leadId) {
      try {
        await prisma.leadQualificationProfile.update({
          where: { id: context.leadId },
          data: {
            salesRepAssigned: parameters.assignTo || context.salesRep,
            qualificationNotes: parameters.notes 
              ? `${context.currentNotes || ''}\nAUTO: ${parameters.notes}` 
              : context.currentNotes
          }
        });
        
        console.log(`Updated CRM record for lead ${context.leadId}:`, parameters);
      } catch (error) {
        console.error('Failed to update CRM record:', error);
      }
    }
  }
  
  /**
   * Send notification
   */
  private async sendNotification(parameters: Record<string, any>, context: Record<string, any>): Promise<void> {
    // In production, integrate with Slack, email, or push notification service
    console.log(`Sending notification:`, {
      to: parameters.to,
      message: parameters.message,
      urgency: parameters.urgency || 'NORMAL',
      context: {
        leadId: context.leadId,
        leadName: context.contactName,
        company: context.companyName
      }
    });
  }
  
  /**
   * Generate deal forecast using ML-style scoring
   */
  async generateDealForecast(leadId: string): Promise<DealForecast> {
    const lead = await prisma.leadQualificationProfile.findUnique({
      where: { id: leadId },
      include: {
        LeadScore: true,
        SalesActivity: true
      }
    });
    
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    
    const leadScore = lead.LeadScore?.[0];
    if (!leadScore) {
      throw new Error(`Lead score not found for lead: ${leadId}`);
    }
    
    // Calculate forecast factors
    const factors = {
      leadScore: this.normalizeScore(leadScore.totalScore, 100),
      engagementLevel: this.normalizeScore(leadScore.engagementScore, 50),
      timeInPipeline: this.calculateTimeInPipelineScore(lead.createdAt),
      salesRepPerformance: this.getSalesRepPerformanceScore(lead.salesRepAssigned || ''),
      historicalData: this.getHistoricalConversionScore(lead.companySize, lead.estimatedBudget)
    };
    
    // Weighted probability calculation
    const weights = {
      leadScore: 0.25,
      engagementLevel: 0.20,
      timeInPipeline: 0.20,
      salesRepPerformance: 0.20,
      historicalData: 0.15
    };
    
    const probability = Math.min(
      Object.entries(factors).reduce((sum, [key, value]) => 
        sum + (value * weights[key as keyof typeof weights]), 0
      ), 
      0.95 // Cap at 95%
    );
    
    // Estimate deal value based on company size and budget
    const baseValue = lead.estimatedBudget || this.estimateValueFromCompanySize(lead.companySize);
    const estimatedValue = baseValue * (0.8 + (probability * 0.4)); // Adjust based on probability
    
    // Estimate close date based on pipeline stage and engagement
    const estimatedCloseDate = this.estimateCloseDate(lead, factors);
    
    // Determine confidence level
    const confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 
      probability >= 0.7 ? 'HIGH' :
      probability >= 0.4 ? 'MEDIUM' : 'LOW';
    
    return {
      leadId,
      probability: Math.round(probability * 100) / 100,
      estimatedValue: Math.round(estimatedValue),
      estimatedCloseDate,
      confidence,
      factors
    };
  }
  
  /**
   * Get sales pipeline analytics
   */
  async getSalesPipelineAnalytics(
    dateFrom: Date, 
    dateTo: Date,
    salesRep?: string
  ): Promise<{
    stageConversion: Array<{ stage: string; leads: number; conversionRate: number }>;
    averageTimeInStage: Array<{ stage: string; avgDays: number }>;
    forecastedRevenue: number;
    pipelineHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    recommendations: string[];
  }> {
    
    // This would typically query actual pipeline data
    // For now, return mock analytics structure
    const mockAnalytics = {
      stageConversion: [
        { stage: 'Lead', leads: 150, conversionRate: 85 },
        { stage: 'Qualified', leads: 128, conversionRate: 65 },
        { stage: 'Demo Scheduled', leads: 83, conversionRate: 80 },
        { stage: 'Demo Completed', leads: 66, conversionRate: 45 },
        { stage: 'Proposal Sent', leads: 30, conversionRate: 60 },
        { stage: 'Closed Won', leads: 18, conversionRate: 100 }
      ],
      averageTimeInStage: [
        { stage: 'Lead', avgDays: 2 },
        { stage: 'Qualified', avgDays: 5 },
        { stage: 'Demo Scheduled', avgDays: 7 },
        { stage: 'Demo Completed', avgDays: 14 },
        { stage: 'Proposal Sent', avgDays: 21 },
        { stage: 'Negotiation', avgDays: 10 }
      ],
      forecastedRevenue: 450000,
      pipelineHealth: 'HEALTHY' as const,
      recommendations: [
        'Demo completion rate is strong - focus on post-demo follow-up',
        'Proposal stage taking too long - implement proposal templates',
        'Lead qualification is effective - maintain current process'
      ]
    };
    
    return mockAnalytics;
  }
  
  // Helper methods for forecast calculations
  private normalizeScore(score: number, max: number): number {
    return Math.min(score / max, 1.0);
  }
  
  private calculateTimeInPipelineScore(createdAt: Date): number {
    const daysInPipeline = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Optimal range is 14-45 days
    if (daysInPipeline < 7) return 0.3; // Too early
    if (daysInPipeline <= 14) return 0.7; // Getting traction
    if (daysInPipeline <= 45) return 0.9; // Sweet spot
    if (daysInPipeline <= 90) return 0.6; // Longer sales cycle
    return 0.3; // Might be stale
  }
  
  private getSalesRepPerformanceScore(salesRep: string): number {
    // Mock performance scores - in production, calculate from historical data
    const performanceMap = {
      'Sarah Chen - Enterprise Sales Director': 0.85,
      'Michael Rodriguez - Senior Sales Consultant': 0.78,
      'Jessica Park - Growth Sales Specialist': 0.72,
      'Alex Thompson - Sales Development Rep': 0.65
    };
    
    return performanceMap[salesRep as keyof typeof performanceMap] || 0.70;
  }
  
  private getHistoricalConversionScore(companySize: number, budget?: number): number {
    // Mock historical conversion rates by segment
    if (companySize >= 50 || (budget && budget >= 50000)) return 0.75; // Enterprise
    if (companySize >= 20 || (budget && budget >= 25000)) return 0.65; // Mid-market
    return 0.55; // SMB
  }
  
  private estimateValueFromCompanySize(companySize: number): number {
    if (companySize >= 50) return 45000; // Enterprise average
    if (companySize >= 20) return 25000; // Mid-market average
    return 12000; // SMB average
  }
  
  private estimateCloseDate(lead: any, factors: Record<string, number>): Date {
    const baselineWeeks = 8; // Default 8-week sales cycle
    
    // Adjust based on factors
    const adjustmentFactor = (
      factors.leadScore + 
      factors.engagementLevel + 
      factors.salesRepPerformance
    ) / 3;
    
    const adjustedWeeks = baselineWeeks * (1.5 - adjustmentFactor); // High factors reduce cycle time
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + (adjustedWeeks * 7));
    
    return closeDate;
  }
}

export const enterpriseSalesAutomation = new EnterpriseSalesAutomation();