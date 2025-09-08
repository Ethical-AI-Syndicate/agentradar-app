import express from 'express';
import { leadQualificationService } from '../services/leadQualificationService';
import { requireAuth } from '../middleware/auth';
import { body, query, validationResult } from 'express-validator';

const router = express.Router();

/**
 * POST /api/leads/qualify
 * Qualify a new lead and assign to sales rep
 */
router.post('/qualify', [
  requireAuth,
  body('contactInfo.name').trim().isLength({ min: 2, max: 100 }).withMessage('Contact name is required (2-100 characters)'),
  body('contactInfo.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('contactInfo.company').trim().isLength({ min: 2, max: 200 }).withMessage('Company name is required'),
  body('contactInfo.phone').optional().isMobilePhone('any'),
  body('companySize').isInt({ min: 1, max: 10000 }).withMessage('Company size must be between 1-10000'),
  body('budget').isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('timeline').isIn(['IMMEDIATE', 'THIS_QUARTER', 'NEXT_QUARTER', 'THIS_YEAR', 'NEXT_YEAR']),
  body('authority').isIn(['DECISION_MAKER', 'INFLUENCER', 'RECOMMENDER', 'USER']),
  body('need').isIn(['CRITICAL', 'HIGH', 'MODERATE', 'LOW']),
  body('engagement').isInt({ min: 0, max: 10 }).withMessage('Engagement score must be 0-10'),
  body('referralSource').isIn(['ORGANIC_SEARCH', 'PAID_SEARCH', 'SOCIAL_MEDIA', 'REFERRAL', 'CUSTOMER_REFERRAL', 'CONTENT', 'EVENT', 'COLD_OUTREACH']),
  body('previousDemo').isBoolean(),
  body('source').trim().isLength({ min: 1, max: 100 }).withMessage('Lead source is required'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const qualifiedLead = await leadQualificationService.qualifyLead(req.body);
    
    // Create nurturing sequence
    const nurturingSequence = await leadQualificationService.createNurturingSequence(
      qualifiedLead.id,
      qualifiedLead.tier
    );
    
    res.status(201).json({
      success: true,
      message: 'Lead qualified successfully',
      data: {
        ...qualifiedLead,
        nurturingSequence
      }
    });
    
  } catch (error) {
    console.error('Lead qualification error:', error);
    res.status(500).json({
      error: 'Failed to qualify lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/leads/outreach
 * Get leads ready for outreach
 */
router.get('/outreach', [
  requireAuth,
  query('salesRep').optional().trim().isLength({ min: 2, max: 100 }),
  query('priority').optional().isIn(['HIGH', 'MEDIUM', 'LOW']),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { salesRep, priority, limit = '20' } = req.query;
    
    const leads = await leadQualificationService.getLeadsForOutreach(
      salesRep as string,
      priority as 'HIGH' | 'MEDIUM' | 'LOW',
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: leads,
      pagination: {
        total: leads.length,
        limit: parseInt(limit as string)
      }
    });
    
  } catch (error) {
    console.error('Get outreach leads error:', error);
    res.status(500).json({
      error: 'Failed to retrieve leads for outreach'
    });
  }
});

/**
 * PUT /api/leads/:leadId/score
 * Update lead score based on new interactions
 */
router.put('/:leadId/score', [
  requireAuth,
  body('emailOpens').optional().isInt({ min: 0, max: 100 }),
  body('linkClicks').optional().isInt({ min: 0, max: 50 }),
  body('demoAttended').optional().isBoolean(),
  body('responseRate').optional().isFloat({ min: 0, max: 1 }),
  body('meetingScheduled').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { leadId } = req.params;
    const interactions = req.body;
    
    const updatedScore = await leadQualificationService.updateLeadScore(leadId, interactions);
    
    res.json({
      success: true,
      message: 'Lead score updated successfully',
      data: updatedScore
    });
    
  } catch (error) {
    console.error('Update lead score error:', error);
    res.status(500).json({
      error: 'Failed to update lead score',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/leads/metrics
 * Get lead conversion metrics and analytics
 */
router.get('/metrics', [
  requireAuth,
  query('dateFrom').isISO8601().withMessage('Valid dateFrom is required'),
  query('dateTo').isISO8601().withMessage('Valid dateTo is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { dateFrom, dateTo } = req.query;
    const fromDate = new Date(dateFrom as string);
    const toDate = new Date(dateTo as string);
    
    // Validate date range
    if (fromDate > toDate) {
      return res.status(400).json({
        error: 'dateFrom must be before dateTo'
      });
    }
    
    const metrics = await leadQualificationService.getLeadConversionMetrics(fromDate, toDate);
    
    res.json({
      success: true,
      data: {
        ...metrics,
        dateRange: {
          from: fromDate.toISOString(),
          to: toDate.toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Get lead metrics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve lead metrics'
    });
  }
});

/**
 * POST /api/leads/:leadId/activity
 * Log sales activity for a lead
 */
router.post('/:leadId/activity', [
  requireAuth,
  body('activityType').isIn([
    'CALL_ATTEMPTED', 'CALL_COMPLETED', 'EMAIL_SENT', 'EMAIL_RESPONDED',
    'DEMO_SCHEDULED', 'DEMO_COMPLETED', 'PROPOSAL_SENT', 'CONTRACT_SENT',
    'MEETING_SCHEDULED', 'FOLLOW_UP', 'LEAD_QUALIFICATION'
  ]),
  body('description').trim().isLength({ min: 5, max: 500 }).withMessage('Description must be 5-500 characters'),
  body('outcome').optional().trim().isLength({ max: 300 }),
  body('scheduledFor').optional().isISO8601(),
  body('assignedTo').optional().trim().isLength({ min: 2, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { leadId } = req.params;
    const { activityType, description, outcome, scheduledFor, assignedTo } = req.body;
    
    // Import prisma here to avoid circular dependencies
    const { prisma } = await import('../lib/database');
    
    const activity = await prisma.salesActivity.create({
      data: {
        leadId,
        activityType,
        description,
        outcome,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
        assignedTo: assignedTo || req.user?.email || 'System',
        status: 'COMPLETED'
      }
    });
    
    // Update lead engagement score based on activity type
    const engagementBoost = {
      'CALL_COMPLETED': { responseRate: 1.0 },
      'EMAIL_RESPONDED': { responseRate: 1.0, emailOpens: 1 },
      'DEMO_COMPLETED': { demoAttended: true },
      'MEETING_SCHEDULED': { meetingScheduled: true }
    }[activityType];
    
    if (engagementBoost) {
      await leadQualificationService.updateLeadScore(leadId, engagementBoost);
    }
    
    res.status(201).json({
      success: true,
      message: 'Sales activity logged successfully',
      data: activity
    });
    
  } catch (error) {
    console.error('Log sales activity error:', error);
    res.status(500).json({
      error: 'Failed to log sales activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/leads/dashboard
 * Get sales dashboard data with lead pipeline
 */
router.get('/dashboard', [
  requireAuth,
  query('salesRep').optional().trim().isLength({ min: 2, max: 100 }),
  query('period').optional().isIn(['TODAY', 'WEEK', 'MONTH', 'QUARTER'])
], async (req, res) => {
  try {
    const { salesRep, period = 'MONTH' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let dateFrom: Date;
    
    switch (period) {
      case 'TODAY':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'WEEK':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'QUARTER':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // MONTH
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const [metrics, outreachLeads] = await Promise.all([
      leadQualificationService.getLeadConversionMetrics(dateFrom, now),
      leadQualificationService.getLeadsForOutreach(salesRep as string, undefined, 10)
    ]);
    
    res.json({
      success: true,
      data: {
        metrics,
        topLeads: outreachLeads,
        period: period,
        dateRange: {
          from: dateFrom.toISOString(),
          to: now.toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      error: 'Failed to retrieve dashboard data'
    });
  }
});

/**
 * GET /api/leads/nurture/:leadId
 * Get nurturing sequence status for a lead
 */
router.get('/nurture/:leadId', [
  requireAuth
], async (req, res) => {
  try {
    const { leadId } = req.params;
    
    // Import prisma for database access
    const { prisma } = await import('../lib/database');
    
    const lead = await prisma.leadQualificationProfile.findUnique({
      where: { id: leadId },
      include: {
        LeadScore: true,
        SalesActivity: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!lead) {
      return res.status(404).json({
        error: 'Lead not found'
      });
    }
    
    const leadScore = lead.LeadScore?.[0];
    const tier = (leadScore?.tier as 'HOT' | 'WARM' | 'COLD') || 'COLD';
    
    const nurturingSequence = await leadQualificationService.createNurturingSequence(leadId, tier);
    
    res.json({
      success: true,
      data: {
        lead: {
          id: lead.id,
          name: lead.contactName,
          company: lead.companyName,
          email: lead.email,
          status: lead.status,
          tier,
          score: leadScore?.totalScore || 0
        },
        nurturingSequence,
        recentActivities: lead.SalesActivity
      }
    });
    
  } catch (error) {
    console.error('Get nurturing sequence error:', error);
    res.status(500).json({
      error: 'Failed to retrieve nurturing sequence'
    });
  }
});

export default router;