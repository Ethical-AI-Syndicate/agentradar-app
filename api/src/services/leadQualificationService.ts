import { prisma } from '../lib/database';
import { LeadScore, LeadQualificationProfile, SalesActivity } from '@prisma/client';

interface LeadScoringCriteria {
  companySize: number;
  budget: number;
  timeline: string;
  authority: string;
  need: string;
  engagement: number;
  referralSource: string;
  previousDemo: boolean;
}

interface QualifiedLead {
  id: string;
  score: number;
  tier: 'HOT' | 'WARM' | 'COLD';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: string;
  assignedSalesRep: string;
  qualification: LeadQualificationProfile;
  activities: SalesActivity[];
}

interface LeadNurturingSequence {
  leadId: string;
  sequenceType: 'STARTER_TRIAL' | 'PROFESSIONAL_DEMO' | 'ENTERPRISE_PILOT';
  touchpoints: Array<{
    day: number;
    type: 'EMAIL' | 'CALL' | 'SMS' | 'DEMO';
    template: string;
    completed: boolean;
  }>;
  currentStep: number;
  completionRate: number;
}

export class LeadQualificationService {
  
  /**
   * Score a lead based on BANT (Budget, Authority, Need, Timeline) + Engagement
   */
  async scoreLeadByBANT(leadData: LeadScoringCriteria): Promise<number> {
    let score = 0;
    
    // Budget scoring (0-30 points)
    if (leadData.budget >= 50000) score += 30;
    else if (leadData.budget >= 25000) score += 20;
    else if (leadData.budget >= 10000) score += 10;
    else if (leadData.budget >= 5000) score += 5;
    
    // Authority scoring (0-25 points)
    if (leadData.authority === 'DECISION_MAKER') score += 25;
    else if (leadData.authority === 'INFLUENCER') score += 15;
    else if (leadData.authority === 'RECOMMENDER') score += 8;
    else if (leadData.authority === 'USER') score += 3;
    
    // Need urgency (0-20 points)
    if (leadData.need === 'CRITICAL') score += 20;
    else if (leadData.need === 'HIGH') score += 15;
    else if (leadData.need === 'MODERATE') score += 10;
    else if (leadData.need === 'LOW') score += 5;
    
    // Timeline (0-15 points)
    if (leadData.timeline === 'IMMEDIATE') score += 15;
    else if (leadData.timeline === 'THIS_QUARTER') score += 12;
    else if (leadData.timeline === 'NEXT_QUARTER') score += 8;
    else if (leadData.timeline === 'THIS_YEAR') score += 5;
    else if (leadData.timeline === 'NEXT_YEAR') score += 2;
    
    // Engagement level (0-10 points)
    score += Math.min(leadData.engagement, 10);
    
    return Math.min(score, 100);
  }
  
  /**
   * Calculate lead tier based on score and additional factors
   */
  classifyLeadTier(score: number, criteria: LeadScoringCriteria): 'HOT' | 'WARM' | 'COLD' {
    // Hot leads: High score + good indicators
    if (score >= 70 && (
      criteria.referralSource === 'CUSTOMER_REFERRAL' ||
      criteria.previousDemo === true ||
      criteria.timeline === 'IMMEDIATE'
    )) {
      return 'HOT';
    }
    
    // Warm leads: Moderate score or high engagement
    if (score >= 45 || criteria.engagement >= 7) {
      return 'WARM';
    }
    
    return 'COLD';
  }
  
  /**
   * Assign appropriate sales rep based on lead characteristics
   */
  assignSalesRep(criteria: LeadScoringCriteria, tier: string): string {
    // Enterprise prospects go to senior reps
    if (criteria.companySize >= 50 || criteria.budget >= 50000) {
      return 'Sarah Chen - Enterprise Sales Director';
    }
    
    // Hot leads get priority assignment
    if (tier === 'HOT') {
      return 'Michael Rodriguez - Senior Sales Consultant';
    }
    
    // Mid-market prospects
    if (criteria.companySize >= 20 || criteria.budget >= 25000) {
      return 'Jessica Park - Growth Sales Specialist';
    }
    
    // Standard assignment for smaller leads
    return 'Alex Thompson - Sales Development Rep';
  }
  
  /**
   * Create comprehensive lead qualification profile
   */
  async qualifyLead(leadData: LeadScoringCriteria & {
    contactInfo: {
      name: string;
      email: string;
      company: string;
      phone?: string;
    };
    source: string;
    notes?: string;
  }): Promise<QualifiedLead> {
    
    // Calculate lead score
    const score = await this.scoreLeadByBANT(leadData);
    const tier = this.classifyLeadTier(score, leadData);
    const assignedSalesRep = this.assignSalesRep(leadData, tier);
    
    // Determine priority based on score and tier
    let priority: 'HIGH' | 'MEDIUM' | 'LOW';
    if (score >= 70 || tier === 'HOT') priority = 'HIGH';
    else if (score >= 45 || tier === 'WARM') priority = 'MEDIUM';
    else priority = 'LOW';
    
    // Generate recommended action
    let recommendedAction: string;
    if (tier === 'HOT') {
      recommendedAction = 'Schedule demo within 24 hours. Prepare custom proposal.';
    } else if (tier === 'WARM') {
      recommendedAction = 'Send nurture sequence. Schedule discovery call within 3 days.';
    } else {
      recommendedAction = 'Add to nurture campaign. Follow up in 1 week.';
    }
    
    // Create qualification record
    const qualificationProfile = await prisma.leadQualificationProfile.create({
      data: {
        contactName: leadData.contactInfo.name,
        email: leadData.contactInfo.email,
        companyName: leadData.contactInfo.company,
        phone: leadData.contactInfo.phone,
        companySize: leadData.companySize,
        estimatedBudget: leadData.budget,
        timeline: leadData.timeline,
        authority: leadData.authority,
        needLevel: leadData.need,
        engagementScore: leadData.engagement,
        leadSource: leadData.source,
        qualificationNotes: leadData.notes,
        salesRepAssigned: assignedSalesRep,
        status: 'NEW'
      }
    });
    
    // Create lead score record
    const leadScore = await prisma.leadScore.create({
      data: {
        leadId: qualificationProfile.id,
        bantScore: score,
        engagementScore: leadData.engagement,
        totalScore: score + leadData.engagement,
        tier: tier,
        priority: priority,
        lastUpdated: new Date(),
        scoringFactors: JSON.stringify({
          budget: leadData.budget,
          authority: leadData.authority,
          need: leadData.need,
          timeline: leadData.timeline,
          engagement: leadData.engagement,
          referralBonus: leadData.referralSource === 'CUSTOMER_REFERRAL' ? 10 : 0
        })
      }
    });
    
    // Create initial sales activity
    const initialActivity = await prisma.salesActivity.create({
      data: {
        leadId: qualificationProfile.id,
        activityType: 'LEAD_QUALIFICATION',
        description: `Lead qualified with ${score} BANT score, ${tier} tier assignment`,
        scheduledFor: new Date(),
        assignedTo: assignedSalesRep,
        status: 'COMPLETED',
        outcome: `Qualified as ${tier} lead, priority: ${priority}`
      }
    });
    
    return {
      id: qualificationProfile.id,
      score,
      tier,
      priority,
      recommendedAction,
      assignedSalesRep,
      qualification: qualificationProfile,
      activities: [initialActivity]
    };
  }
  
  /**
   * Create nurturing sequence based on lead tier and profile
   */
  async createNurturingSequence(leadId: string, tier: 'HOT' | 'WARM' | 'COLD'): Promise<LeadNurturingSequence> {
    let sequenceType: 'STARTER_TRIAL' | 'PROFESSIONAL_DEMO' | 'ENTERPRISE_PILOT';
    let touchpoints: Array<{
      day: number;
      type: 'EMAIL' | 'CALL' | 'SMS' | 'DEMO';
      template: string;
      completed: boolean;
    }>;
    
    if (tier === 'HOT') {
      sequenceType = 'ENTERPRISE_PILOT';
      touchpoints = [
        { day: 0, type: 'EMAIL', template: 'hot_lead_immediate_followup', completed: false },
        { day: 1, type: 'CALL', template: 'discovery_call_hot_lead', completed: false },
        { day: 2, type: 'DEMO', template: 'custom_enterprise_demo', completed: false },
        { day: 5, type: 'EMAIL', template: 'proposal_followup', completed: false },
        { day: 7, type: 'CALL', template: 'closing_call', completed: false }
      ];
    } else if (tier === 'WARM') {
      sequenceType = 'PROFESSIONAL_DEMO';
      touchpoints = [
        { day: 0, type: 'EMAIL', template: 'warm_lead_welcome', completed: false },
        { day: 2, type: 'EMAIL', template: 'roi_calculator_sharing', completed: false },
        { day: 5, type: 'CALL', template: 'discovery_call_warm', completed: false },
        { day: 7, type: 'DEMO', template: 'standard_product_demo', completed: false },
        { day: 10, type: 'EMAIL', template: 'demo_followup_materials', completed: false },
        { day: 14, type: 'CALL', template: 'proposal_discussion', completed: false }
      ];
    } else {
      sequenceType = 'STARTER_TRIAL';
      touchpoints = [
        { day: 0, type: 'EMAIL', template: 'cold_lead_nurture_intro', completed: false },
        { day: 3, type: 'EMAIL', template: 'educational_content_share', completed: false },
        { day: 7, type: 'EMAIL', template: 'case_study_success_stories', completed: false },
        { day: 14, type: 'EMAIL', template: 'free_trial_invitation', completed: false },
        { day: 21, type: 'CALL', template: 'qualification_check_in', completed: false },
        { day: 30, type: 'EMAIL', template: 'long_term_nurture_sequence', completed: false }
      ];
    }
    
    return {
      leadId,
      sequenceType,
      touchpoints,
      currentStep: 0,
      completionRate: 0
    };
  }
  
  /**
   * Update lead scoring based on new interactions
   */
  async updateLeadScore(
    leadId: string, 
    newInteractions: {
      emailOpens?: number;
      linkClicks?: number;
      demoAttended?: boolean;
      responseRate?: number;
      meetingScheduled?: boolean;
    }
  ): Promise<LeadScore> {
    
    const existingScore = await prisma.leadScore.findFirst({
      where: { leadId }
    });
    
    if (!existingScore) {
      throw new Error(`Lead score not found for leadId: ${leadId}`);
    }
    
    // Calculate engagement boost
    let engagementBoost = 0;
    if (newInteractions.emailOpens) engagementBoost += Math.min(newInteractions.emailOpens * 2, 10);
    if (newInteractions.linkClicks) engagementBoost += Math.min(newInteractions.linkClicks * 5, 15);
    if (newInteractions.demoAttended) engagementBoost += 20;
    if (newInteractions.meetingScheduled) engagementBoost += 15;
    if (newInteractions.responseRate && newInteractions.responseRate > 0.5) engagementBoost += 10;
    
    const newEngagementScore = Math.min(existingScore.engagementScore + engagementBoost, 50);
    const newTotalScore = existingScore.bantScore + newEngagementScore;
    
    // Recalculate tier if score improved significantly
    let newTier = existingScore.tier;
    if (newTotalScore >= 80 && existingScore.tier !== 'HOT') newTier = 'HOT';
    else if (newTotalScore >= 60 && existingScore.tier === 'COLD') newTier = 'WARM';
    
    // Update priority based on new score
    let newPriority = existingScore.priority;
    if (newTotalScore >= 80) newPriority = 'HIGH';
    else if (newTotalScore >= 60) newPriority = 'MEDIUM';
    
    return await prisma.leadScore.update({
      where: { id: existingScore.id },
      data: {
        engagementScore: newEngagementScore,
        totalScore: newTotalScore,
        tier: newTier,
        priority: newPriority,
        lastUpdated: new Date(),
        scoringFactors: JSON.stringify({
          ...JSON.parse(existingScore.scoringFactors as string),
          engagementBoost,
          interactionHistory: newInteractions
        })
      }
    });
  }
  
  /**
   * Get leads ready for outreach based on priority and timing
   */
  async getLeadsForOutreach(
    salesRep?: string,
    priority?: 'HIGH' | 'MEDIUM' | 'LOW',
    limit: number = 20
  ): Promise<QualifiedLead[]> {
    
    const whereClause: any = {};
    if (salesRep) whereClause.salesRepAssigned = salesRep;
    if (priority) whereClause.LeadScore = { some: { priority } };
    
    const leads = await prisma.leadQualificationProfile.findMany({
      where: {
        ...whereClause,
        status: { in: ['NEW', 'IN_PROGRESS'] }
      },
      include: {
        LeadScore: true,
        SalesActivity: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: [
        { LeadScore: { priority: 'asc' } }, // HIGH priority first
        { LeadScore: { totalScore: 'desc' } },
        { createdAt: 'asc' }
      ],
      take: limit
    });
    
    return leads.map(lead => ({
      id: lead.id,
      score: lead.LeadScore?.[0]?.totalScore || 0,
      tier: (lead.LeadScore?.[0]?.tier as 'HOT' | 'WARM' | 'COLD') || 'COLD',
      priority: (lead.LeadScore?.[0]?.priority as 'HIGH' | 'MEDIUM' | 'LOW') || 'LOW',
      recommendedAction: this.generateRecommendedAction(lead, lead.LeadScore?.[0]),
      assignedSalesRep: lead.salesRepAssigned || 'Unassigned',
      qualification: lead,
      activities: lead.SalesActivity
    }));
  }
  
  /**
   * Generate next recommended action based on lead history
   */
  private generateRecommendedAction(lead: any, score?: any): string {
    if (!score) return 'Review and score lead';
    
    const daysSinceCreated = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const lastActivity = lead.SalesActivity?.[0];
    
    if (score.tier === 'HOT') {
      if (!lastActivity || daysSinceCreated === 0) {
        return 'Call immediately - Hot lead requires immediate attention';
      } else if (lastActivity.activityType === 'CALL_ATTEMPTED') {
        return 'Send follow-up email with calendar link';
      } else if (lastActivity.activityType === 'EMAIL_SENT') {
        return 'Follow up with phone call within 2 hours';
      }
      return 'Schedule demo presentation within 24 hours';
    }
    
    if (score.tier === 'WARM') {
      if (daysSinceCreated <= 1) {
        return 'Send welcome sequence and schedule discovery call';
      } else if (daysSinceCreated <= 7) {
        return 'Share ROI calculator and case studies';
      }
      return 'Schedule product demonstration';
    }
    
    // COLD leads
    if (daysSinceCreated <= 3) {
      return 'Add to nurture sequence';
    } else if (daysSinceCreated <= 14) {
      return 'Send educational content';
    }
    return 'Long-term nurture - check in monthly';
  }
  
  /**
   * Calculate conversion rates and sales metrics
   */
  async getLeadConversionMetrics(dateFrom: Date, dateTo: Date): Promise<{
    totalLeads: number;
    qualifiedLeads: number;
    demos: number;
    closedWon: number;
    conversionRates: {
      leadToQualified: number;
      qualifiedToDemo: number;
      demoToClose: number;
      overallConversion: number;
    };
    averageScore: number;
    tierDistribution: { tier: string; count: number; percentage: number }[];
  }> {
    
    const totalLeads = await prisma.leadQualificationProfile.count({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo }
      }
    });
    
    const qualifiedLeads = await prisma.leadQualificationProfile.count({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        status: { in: ['QUALIFIED', 'IN_PROGRESS', 'DEMO_SCHEDULED'] }
      }
    });
    
    const demos = await prisma.salesActivity.count({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        activityType: 'DEMO_COMPLETED'
      }
    });
    
    const closedWon = await prisma.leadQualificationProfile.count({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        status: 'CLOSED_WON'
      }
    });
    
    const avgScoreResult = await prisma.leadScore.aggregate({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo }
      },
      _avg: { totalScore: true }
    });
    
    const tierDistribution = await prisma.leadScore.groupBy({
      by: ['tier'],
      where: {
        createdAt: { gte: dateFrom, lte: dateTo }
      },
      _count: { tier: true }
    });
    
    const tierDistributionFormatted = tierDistribution.map(tier => ({
      tier: tier.tier,
      count: tier._count.tier,
      percentage: Math.round((tier._count.tier / totalLeads) * 100)
    }));
    
    return {
      totalLeads,
      qualifiedLeads,
      demos,
      closedWon,
      conversionRates: {
        leadToQualified: Math.round((qualifiedLeads / totalLeads) * 100),
        qualifiedToDemo: Math.round((demos / qualifiedLeads) * 100),
        demoToClose: Math.round((closedWon / demos) * 100),
        overallConversion: Math.round((closedWon / totalLeads) * 100)
      },
      averageScore: Math.round(avgScoreResult._avg.totalScore || 0),
      tierDistribution: tierDistributionFormatted
    };
  }
}

export const leadQualificationService = new LeadQualificationService();