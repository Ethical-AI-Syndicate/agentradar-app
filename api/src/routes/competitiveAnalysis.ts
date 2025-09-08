import express from 'express';
import { competitiveAnalysisService } from '../services/competitiveAnalysis';
import { requireAuth } from '../middleware/auth';
import { query, validationResult } from 'express-validator';

const router = express.Router();

/**
 * GET /api/competitive/landscape
 * Get comprehensive competitive landscape analysis
 */
router.get('/landscape', [
  requireAuth
], async (req, res) => {
  try {
    const landscape = competitiveAnalysisService.getCompetitiveLandscape();
    
    res.json({
      success: true,
      data: landscape
    });
    
  } catch (error) {
    console.error('Get competitive landscape error:', error);
    res.status(500).json({
      error: 'Failed to retrieve competitive landscape'
    });
  }
});

/**
 * GET /api/competitive/benchmark
 * Generate competitive benchmarking analysis
 */
router.get('/benchmark', [
  requireAuth
], async (req, res) => {
  try {
    const benchmarks = competitiveAnalysisService.generateCompetitiveBenchmark();
    
    res.json({
      success: true,
      data: {
        benchmarks,
        summary: {
          totalCategories: benchmarks.length,
          totalMetrics: benchmarks.reduce((sum, cat) => sum + cat.metrics.length, 0),
          strongAdvantages: benchmarks.reduce((sum, cat) => 
            sum + cat.metrics.filter(m => m.advantage === 'STRONG').length, 0),
          disadvantages: benchmarks.reduce((sum, cat) => 
            sum + cat.metrics.filter(m => m.advantage === 'DISADVANTAGE').length, 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Get competitive benchmark error:', error);
    res.status(500).json({
      error: 'Failed to generate competitive benchmark'
    });
  }
});

/**
 * GET /api/competitive/positioning
 * Generate market positioning strategy
 */
router.get('/positioning', [
  requireAuth
], async (req, res) => {
  try {
    const positioning = competitiveAnalysisService.generateMarketPositioning();
    
    res.json({
      success: true,
      data: positioning
    });
    
  } catch (error) {
    console.error('Get market positioning error:', error);
    res.status(500).json({
      error: 'Failed to generate market positioning'
    });
  }
});

/**
 * GET /api/competitive/win-loss
 * Calculate win/loss rates against competitors
 */
router.get('/win-loss', [
  requireAuth,
  query('timeframe').optional().isIn(['MONTH', 'QUARTER', 'YEAR'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { timeframe = 'QUARTER' } = req.query;
    const analysis = await competitiveAnalysisService.calculateWinLossAnalysis(
      timeframe as 'MONTH' | 'QUARTER' | 'YEAR'
    );
    
    res.json({
      success: true,
      data: {
        ...analysis,
        timeframe,
        insights: [
          analysis.overall.winRate > 60 ? 'Strong competitive position' : 'Needs improvement',
          `Top performing against: ${analysis.byCompetitor
            .filter(c => c.winRate > 65)
            .map(c => c.competitor.split(' ')[0])
            .join(', ')}`,
          `Challenging matchups: ${analysis.byCompetitor
            .filter(c => c.winRate < 50)
            .map(c => c.competitor.split(' ')[0])
            .join(', ')}`
        ].filter(insight => !insight.includes('undefined'))
      }
    });
    
  } catch (error) {
    console.error('Get win-loss analysis error:', error);
    res.status(500).json({
      error: 'Failed to calculate win-loss analysis'
    });
  }
});

/**
 * GET /api/competitive/messaging
 * Generate competitive messaging and positioning statements
 */
router.get('/messaging', [
  requireAuth
], async (req, res) => {
  try {
    const messaging = competitiveAnalysisService.generateCompetitiveMessaging();
    
    res.json({
      success: true,
      data: {
        ...messaging,
        usage: {
          againstZillow: 'Use when competing against Zillow Premier Agent',
          againstCompass: 'Use for enterprise prospects comparing to Compass',
          againstKW: 'Use when prospect is considering KW Command',
          againstFollowUpBoss: 'Use when prospect needs both CRM and lead generation',
          generalPositioning: 'Use for general market positioning and PR'
        }
      }
    });
    
  } catch (error) {
    console.error('Get competitive messaging error:', error);
    res.status(500).json({
      error: 'Failed to generate competitive messaging'
    });
  }
});

/**
 * GET /api/competitive/intelligence
 * Monitor competitor activities and news
 */
router.get('/intelligence', [
  requireAuth,
  query('competitorId').optional().trim().isLength({ min: 2, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { competitorId } = req.query;
    const intelligence = await competitiveAnalysisService.getCompetitorIntelligence(
      competitorId as string
    );
    
    res.json({
      success: true,
      data: {
        ...intelligence,
        summary: {
          totalNews: intelligence.recentNews.length,
          highImpactNews: intelligence.recentNews.filter(n => n.impact === 'HIGH').length,
          pricingChanges: intelligence.pricingChanges.length,
          marketMovements: intelligence.marketMovements.length,
          lastUpdated: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Get competitor intelligence error:', error);
    res.status(500).json({
      error: 'Failed to retrieve competitor intelligence'
    });
  }
});

/**
 * GET /api/competitive/dashboard
 * Comprehensive competitive analysis dashboard
 */
router.get('/dashboard', [
  requireAuth
], async (req, res) => {
  try {
    const [
      landscape,
      winLossAnalysis,
      positioning,
      intelligence
    ] = await Promise.all([
      competitiveAnalysisService.getCompetitiveLandscape(),
      competitiveAnalysisService.calculateWinLossAnalysis('QUARTER'),
      competitiveAnalysisService.generateMarketPositioning(),
      competitiveAnalysisService.getCompetitorIntelligence()
    ]);
    
    const benchmarks = competitiveAnalysisService.generateCompetitiveBenchmark();
    
    // Calculate key metrics
    const strongAdvantages = benchmarks.reduce((sum, cat) => 
      sum + cat.metrics.filter(m => m.advantage === 'STRONG').length, 0);
    
    const totalMetrics = benchmarks.reduce((sum, cat) => sum + cat.metrics.length, 0);
    const competitiveStrengthScore = Math.round((strongAdvantages / totalMetrics) * 100);
    
    // Market opportunity score
    const marketOpportunityScore = Math.round(
      (landscape.marketAnalysis.opportunities.length / 
       (landscape.marketAnalysis.opportunities.length + landscape.marketAnalysis.threats.length)) * 100
    );
    
    res.json({
      success: true,
      data: {
        overview: {
          competitiveStrengthScore,
          marketOpportunityScore,
          winRate: winLossAnalysis.overall.winRate,
          marketPosition: positioning.positioningStrategy,
          topStrengths: benchmarks
            .flatMap(cat => cat.metrics)
            .filter(m => m.advantage === 'STRONG' && m.impact === 'HIGH')
            .slice(0, 5)
            .map(m => m.name),
          keyGaps: benchmarks
            .flatMap(cat => cat.metrics)
            .filter(m => m.advantage === 'DISADVANTAGE' && m.impact === 'HIGH')
            .slice(0, 3)
            .map(m => m.name)
        },
        recentActivity: {
          competitorNews: intelligence.recentNews.slice(0, 5),
          pricingChanges: intelligence.pricingChanges.slice(0, 3),
          marketMovements: intelligence.marketMovements.slice(0, 3)
        },
        marketInsights: {
          tamSize: landscape.marketAnalysis.tam,
          growthRate: landscape.marketAnalysis.growthRate,
          topOpportunities: landscape.marketAnalysis.opportunities.slice(0, 3),
          keyThreats: landscape.marketAnalysis.threats.slice(0, 3)
        },
        actionItems: [
          competitiveStrengthScore < 60 ? 'Focus on competitive differentiation' : null,
          winLossAnalysis.overall.winRate < 50 ? 'Improve win rate through better positioning' : null,
          intelligence.pricingChanges.length > 0 ? 'Review pricing strategy against competitors' : null,
          'Monitor high-impact competitor news weekly',
          'Update competitive messaging quarterly'
        ].filter(Boolean)
      }
    });
    
  } catch (error) {
    console.error('Get competitive dashboard error:', error);
    res.status(500).json({
      error: 'Failed to generate competitive dashboard'
    });
  }
});

/**
 * POST /api/competitive/battle-card
 * Generate competitive battle card for specific competitor
 */
router.post('/battle-card', [
  requireAuth,
  query('competitor').isIn([
    'zillow-premier-agent',
    'realogy-leads', 
    'compass-platform',
    'kw-command',
    'chime-crm',
    'follow-up-boss'
  ])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { competitor } = req.query;
    const landscape = competitiveAnalysisService.getCompetitiveLandscape();
    const messaging = competitiveAnalysisService.generateCompetitiveMessaging();
    const benchmarks = competitiveAnalysisService.generateCompetitiveBenchmark();
    
    const competitorProfile = landscape.competitors.find(c => c.id === competitor);
    if (!competitorProfile) {
      return res.status(404).json({
        error: 'Competitor not found'
      });
    }
    
    // Get relevant messaging
    const competitorMessaging = {
      'zillow-premier-agent': messaging.againstZillow,
      'compass-platform': messaging.againstCompass,
      'kw-command': messaging.againstKW,
      'follow-up-boss': messaging.againstFollowUpBoss
    }[competitor as string] || messaging.generalPositioning;
    
    // Get relevant benchmarks
    const relevantBenchmarks = benchmarks.map(category => ({
      ...category,
      metrics: category.metrics.filter(metric => 
        metric.competitor.toLowerCase().includes(competitorProfile.name.toLowerCase()) ||
        competitorProfile.name.toLowerCase().includes(metric.competitor.toLowerCase())
      )
    })).filter(category => category.metrics.length > 0);
    
    const battleCard = {
      competitor: competitorProfile,
      positioning: competitorMessaging,
      keyAdvantages: relevantBenchmarks
        .flatMap(cat => cat.metrics)
        .filter(m => m.advantage === 'STRONG')
        .slice(0, 5),
      challenges: relevantBenchmarks
        .flatMap(cat => cat.metrics)
        .filter(m => m.advantage === 'DISADVANTAGE')
        .slice(0, 3),
      salesTips: [
        `Lead with ${competitorProfile.weaknesses[0]?.toLowerCase()}`,
        'Emphasize ROI and cost savings',
        'Demo AI features early in conversation',
        'Address integration concerns proactively',
        'Share relevant customer success stories'
      ],
      commonObjections: [
        {
          objection: `"We're already using ${competitorProfile.name}"`,
          response: 'I understand. What specific challenges are you facing with your current solution? Many of our customers switched from [competitor] when they realized they could get better results at a lower cost.'
        },
        {
          objection: '"Your company is too small/new"',
          response: 'That\'s actually our advantage. We\'re built from the ground up with modern AI technology, while larger competitors are limited by legacy systems. You get cutting-edge innovation with personalized service.'
        },
        {
          objection: '"We need enterprise features"',
          response: 'What specific enterprise features are most important to you? Our platform includes advanced automation, white-label capabilities, and dedicated support - often more comprehensive than legacy enterprise solutions.'
        }
      ]
    };
    
    res.json({
      success: true,
      data: battleCard
    });
    
  } catch (error) {
    console.error('Generate battle card error:', error);
    res.status(500).json({
      error: 'Failed to generate competitive battle card'
    });
  }
});

export default router;