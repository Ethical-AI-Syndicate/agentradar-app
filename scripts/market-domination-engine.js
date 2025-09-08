#!/usr/bin/env node

/**
 * AgentRadar Market Domination Engine
 * Phase 7: GO-TO-MARKET EXCELLENCE & REVENUE ACCELERATION
 * 
 * Features:
 * - Multi-tier customer acquisition targeting
 * - Lead qualification and conversion optimization  
 * - ROI calculation and value proposition delivery
 * - Competitive analysis and market positioning
 * - Revenue tracking and growth acceleration
 * - Customer success and retention optimization
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[${new Date().toISOString()}] INFO:${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[${new Date().toISOString()}] WARN:${colors.reset} ⚠️ ${msg}`),
  error: (msg) => console.log(`${colors.red}[${new Date().toISOString()}] ERROR:${colors.reset} ❌ ${msg}`),
  success: (msg) => console.log(`${colors.green}[${new Date().toISOString()}] SUCCESS:${colors.reset} ✅ ${msg}`)
};

class MarketDominationEngine {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    this.marketConfig = this.loadMarketConfiguration();
    this.competitors = this.loadCompetitorAnalysis();
    this.customerSegments = this.initializeCustomerSegments();
  }

  loadMarketConfiguration() {
    return {
      revenueTargets: {
        month1: 100000,    // $100K MRR
        month3: 500000,    // $500K MRR  
        month6: 1500000,   // $1.5M MRR
        month12: 10000000  // $10M MRR
      },
      marketSize: {
        totalAddressableMarket: 50000000000,  // $50B real estate tech market
        serviceableMarket: 5000000000,        // $5B SaaS segment
        serviceableObtainableMarket: 500000000 // $500M target segment
      },
      acquisitionTargets: {
        individual: { count: 10000, avgValue: 150, conversionRate: 0.05 },
        brokerages: { count: 1000, avgValue: 5000, conversionRate: 0.15 },
        enterprise: { count: 50, avgValue: 50000, conversionRate: 0.25 }
      }
    };
  }

  loadCompetitorAnalysis() {
    return {
      primary: [
        {
          name: 'Top Producer',
          marketShare: 0.15,
          pricing: { starter: 40, pro: 75, enterprise: 150 },
          strengths: ['Market leader', 'Large customer base'],
          weaknesses: ['Legacy technology', 'Poor AI capabilities', 'Limited compliance'],
          ourAdvantage: ['285-556% ROI vs their 150%', 'Modern AI tech', 'Full compliance suite']
        },
        {
          name: 'Chime',
          marketShare: 0.12,
          pricing: { starter: 50, pro: 85, enterprise: 180 },
          strengths: ['Good integrations', 'Mobile app'],
          weaknesses: ['No AI automation', 'Basic analytics', 'No white-label'],
          ourAdvantage: ['AI-powered automation', 'Advanced analytics', 'White-label platform']
        },
        {
          name: 'BoomTown',
          marketShare: 0.10,
          pricing: { starter: 60, pro: 120, enterprise: 250 },
          strengths: ['CRM integration', 'Lead generation'],
          weaknesses: ['High cost', 'Complex setup', 'No compliance tools'],
          ourAdvantage: ['Better ROI', 'Easy setup', 'Built-in compliance']
        }
      ],
      secondary: [
        'Wise Agent', 'Real Geeks', 'Follow Up Boss', 'LionDesk', 'Zurple'
      ],
      marketGaps: [
        'AI-powered property intelligence',
        'Comprehensive compliance automation',
        'White-label platform capabilities',
        'Real-time ROI tracking',
        'Enterprise-grade security'
      ]
    };
  }

  initializeCustomerSegments() {
    return {
      tier1_individual: {
        name: 'Individual Agents & Small Teams',
        size: 2000000,
        targetPenetration: 0.005, // 0.5%
        avgRevenue: 1800, // $150/month annual
        segments: {
          newAgents: { size: 0.3, conversionRate: 0.08, urgency: 'high' },
          established: { size: 0.5, conversionRate: 0.04, urgency: 'medium' },
          topProducers: { size: 0.2, conversionRate: 0.10, urgency: 'high' }
        }
      },
      tier2_brokerages: {
        name: 'Mid-Size Brokerages',
        size: 50000,
        targetPenetration: 0.02, // 2%
        avgRevenue: 60000, // $5K/month annual
        segments: {
          growing: { size: 0.4, conversionRate: 0.20, urgency: 'high' },
          established: { size: 0.4, conversionRate: 0.12, urgency: 'medium' },
          franchise: { size: 0.2, conversionRate: 0.15, urgency: 'medium' }
        }
      },
      tier3_enterprise: {
        name: 'Enterprise Brokerages',
        size: 5000,
        targetPenetration: 0.10, // 10%
        avgRevenue: 600000, // $50K/month annual
        segments: {
          regional: { size: 0.6, conversionRate: 0.30, urgency: 'high' },
          national: { size: 0.3, conversionRate: 0.25, urgency: 'medium' },
          international: { size: 0.1, conversionRate: 0.20, urgency: 'low' }
        }
      }
    };
  }

  async initialize() {
    log.info('🚀 Initializing Market Domination Engine...');
    
    try {
      await this.analyzeMarketOpportunity();
      await this.setupAcquisitionChannels();
      await this.initializeCompetitiveIntelligence();
      log.success('Market domination engine initialized successfully');
      return true;
    } catch (error) {
      log.error(`Market domination initialization failed: ${error.message}`);
      return false;
    }
  }

  async analyzeMarketOpportunity() {
    log.info('📊 Analyzing market opportunity and sizing...');
    
    const analysis = {
      totalMarketValue: this.marketConfig.marketSize.totalAddressableMarket,
      targetableMarket: this.marketConfig.marketSize.serviceableObtainableMarket,
      competitorAnalysis: {
        primaryCompetitors: this.competitors.primary.length,
        averageMarketShare: this.competitors.primary.reduce((sum, comp) => sum + comp.marketShare, 0) / this.competitors.primary.length,
        marketGaps: this.competitors.marketGaps.length,
        ourAdvantages: this.competitors.primary.reduce((total, comp) => total + comp.ourAdvantage.length, 0)
      },
      revenueOpportunity: {
        tier1Potential: this.customerSegments.tier1_individual.size * this.customerSegments.tier1_individual.targetPenetration * this.customerSegments.tier1_individual.avgRevenue,
        tier2Potential: this.customerSegments.tier2_brokerages.size * this.customerSegments.tier2_brokerages.targetPenetration * this.customerSegments.tier2_brokerages.avgRevenue,
        tier3Potential: this.customerSegments.tier3_enterprise.size * this.customerSegments.tier3_enterprise.targetPenetration * this.customerSegments.tier3_enterprise.avgRevenue,
      }
    };

    analysis.totalRevenuePotential = analysis.revenueOpportunity.tier1Potential + analysis.revenueOpportunity.tier2Potential + analysis.revenueOpportunity.tier3Potential;

    log.success(`Market analysis complete: $${(analysis.totalRevenuePotential / 1000000).toFixed(1)}M revenue potential`);
    return analysis;
  }

  async setupAcquisitionChannels() {
    log.info('🎯 Setting up customer acquisition channels...');
    
    const channels = {
      digital: {
        seo: {
          targetKeywords: [
            'real estate AI', 'real estate CRM', 'property automation',
            'real estate leads', 'agent productivity', 'brokerage software'
          ],
          monthlyBudget: 50000,
          expectedTraffic: 25000,
          conversionRate: 0.03
        },
        ppc: {
          platforms: ['Google Ads', 'Facebook', 'LinkedIn'],
          monthlyBudget: 100000,
          expectedClicks: 50000,
          conversionRate: 0.05
        },
        contentMarketing: {
          monthlyPosts: 20,
          expectedReach: 100000,
          leadGeneration: 1000
        }
      },
      partnerships: {
        realEstateAssociations: {
          target: 50,
          avgMemberAccess: 1000,
          conversionRate: 0.02
        },
        technologyPartners: {
          mlsProviders: 10,
          crmIntegrations: 15,
          referralRate: 0.15
        },
        franchisePartnerships: {
          target: 20,
          avgAgentAccess: 500,
          conversionRate: 0.08
        }
      },
      sales: {
        insideSales: {
          teamSize: 10,
          callsPerDay: 100,
          conversionRate: 0.15
        },
        fieldSales: {
          teamSize: 5,
          meetingsPerWeek: 25,
          conversionRate: 0.30
        },
        customerSuccess: {
          teamSize: 8,
          accountsPerManager: 100,
          upsellRate: 0.25
        }
      }
    };

    log.success(`Acquisition channels configured: ${Object.keys(channels).length} channel categories`);
    return channels;
  }

  async initializeCompetitiveIntelligence() {
    log.info('🔍 Initializing competitive intelligence system...');
    
    const intelligence = {
      monitoring: {
        competitorWebsites: this.competitors.primary.map(c => c.name),
        priceTracking: true,
        featureComparison: true,
        marketPositioning: true
      },
      analysis: {
        strengthsWeaknesses: this.competitors.primary.length,
        pricingAdvantage: this.calculatePricingAdvantage(),
        featureAdvantage: this.calculateFeatureAdvantage(),
        marketPositioning: this.calculateMarketPosition()
      },
      responseStrategies: {
        pricingStrategy: 'Value-based premium pricing with ROI justification',
        featureStrategy: 'AI-first with compliance and automation focus',
        marketStrategy: 'Multi-tier approach with white-label enterprise focus'
      }
    };

    log.success('Competitive intelligence system operational');
    return intelligence;
  }

  calculatePricingAdvantage() {
    const competitorAvgPricing = {
      starter: this.competitors.primary.reduce((sum, c) => sum + c.pricing.starter, 0) / this.competitors.primary.length,
      pro: this.competitors.primary.reduce((sum, c) => sum + c.pricing.pro, 0) / this.competitors.primary.length,
      enterprise: this.competitors.primary.reduce((sum, c) => sum + c.pricing.enterprise, 0) / this.competitors.primary.length
    };

    const ourPricing = { starter: 99, pro: 199, enterprise: 399 };
    
    return {
      starterPremium: ((ourPricing.starter / competitorAvgPricing.starter) - 1) * 100,
      proPremium: ((ourPricing.pro / competitorAvgPricing.pro) - 1) * 100,
      enterprisePremium: ((ourPricing.enterprise / competitorAvgPricing.enterprise) - 1) * 100,
      justification: '285-556% ROI vs competitor 150% average'
    };
  }

  calculateFeatureAdvantage() {
    return {
      aiAutomation: 'Unique - no competitor offers comprehensive AI property intelligence',
      complianceTools: 'Market leading - GDPR/SOX ready vs basic compliance',
      whiteLabelPlatform: 'Superior - full customization vs limited branding',
      roiTracking: 'Unique - real-time ROI calculation and reporting',
      enterpriseSecurity: 'Superior - enterprise-grade vs basic security'
    };
  }

  calculateMarketPosition() {
    return {
      currentPosition: 'Challenger with superior technology',
      targetPosition: 'Market leader through innovation and value',
      differentiators: [
        'AI-powered property intelligence',
        'Comprehensive compliance automation',
        'White-label enterprise platform',
        'Proven ROI with tracking',
        'Modern technology stack'
      ],
      competitiveMotat: [
        'Data network effects',
        'AI algorithm improvement with scale',
        'Compliance expertise barrier',
        'Technology integration complexity'
      ]
    };
  }

  async executeCustomerAcquisition(segment = 'all', budget = 100000) {
    log.info(`💰 Executing customer acquisition for ${segment} with $${budget.toLocaleString()} budget`);
    
    const campaigns = [];
    
    if (segment === 'all' || segment === 'individual') {
      campaigns.push({
        segment: 'individual',
        channels: ['SEO', 'PPC', 'Content Marketing'],
        budget: Math.round(budget * 0.4), // 40% for individual agents
        expectedLeads: 2000,
        conversionRate: 0.05,
        expectedCustomers: 100,
        expectedRevenue: 18000 // $150/month * 12 months * 100 customers
      });
    }

    if (segment === 'all' || segment === 'brokerages') {
      campaigns.push({
        segment: 'brokerages',
        channels: ['Partnerships', 'Field Sales', 'LinkedIn'],
        budget: Math.round(budget * 0.35), // 35% for brokerages
        expectedLeads: 500,
        conversionRate: 0.15,
        expectedCustomers: 75,
        expectedRevenue: 4500000 // $5K/month * 12 months * 75 customers
      });
    }

    if (segment === 'all' || segment === 'enterprise') {
      campaigns.push({
        segment: 'enterprise',
        channels: ['Direct Sales', 'Conferences', 'Strategic Partnerships'],
        budget: Math.round(budget * 0.25), // 25% for enterprise
        expectedLeads: 100,
        conversionRate: 0.25,
        expectedCustomers: 25,
        expectedRevenue: 15000000 // $50K/month * 12 months * 25 customers
      });
    }

    const totalExpectedRevenue = campaigns.reduce((sum, campaign) => sum + campaign.expectedRevenue, 0);
    const totalExpectedCustomers = campaigns.reduce((sum, campaign) => sum + campaign.expectedCustomers, 0);
    const averageCAC = budget / totalExpectedCustomers;
    const averageLTV = totalExpectedRevenue / totalExpectedCustomers;
    const ltvCacRatio = averageLTV / averageCAC;

    const results = {
      campaigns,
      totalBudget: budget,
      expectedRevenue: totalExpectedRevenue,
      expectedCustomers: totalExpectedCustomers,
      averageCAC,
      averageLTV,
      ltvCacRatio,
      roi: ((totalExpectedRevenue - budget) / budget) * 100
    };

    log.success(`Acquisition plan: ${totalExpectedCustomers} customers, $${(totalExpectedRevenue / 1000000).toFixed(1)}M revenue, ${results.roi.toFixed(0)}% ROI`);
    return results;
  }

  async optimizeConversionFunnel() {
    log.info('🔄 Optimizing conversion funnel and customer journey...');
    
    const funnel = {
      awareness: {
        traffic: 100000, // Monthly website visitors
        sources: {
          organic: 0.40,
          paid: 0.30,
          referral: 0.20,
          direct: 0.10
        }
      },
      interest: {
        landingPageConversion: 0.15, // 15% of traffic converts to leads
        expectedLeads: 15000,
        leadQualification: {
          qualified: 0.60,
          nurture: 0.25,
          disqualified: 0.15
        }
      },
      consideration: {
        demoRequestRate: 0.25, // 25% of qualified leads request demo
        expectedDemos: 2250,
        demoToTrialConversion: 0.70
      },
      trial: {
        trialSignups: 1575,
        trialToCustomerConversion: {
          individual: 0.12,
          brokerages: 0.25,
          enterprise: 0.35
        }
      },
      purchase: {
        expectedCustomers: 315, // Monthly new customers
        averageMonthlyRevenue: 450000, // $450K MRR from new customers
        customerSegmentation: {
          individual: 0.60,
          brokerages: 0.30,
          enterprise: 0.10
        }
      }
    };

    const optimizations = {
      landingPageOptimization: 'A/B testing to improve 15% to 20% conversion',
      leadNurturing: 'Automated email sequences for nurture segment',
      demoExperience: 'Interactive demos with ROI calculators',
      trialOnboarding: '7-day success guarantee with guided setup',
      customerSuccess: 'Dedicated success managers for enterprise customers'
    };

    log.success(`Conversion funnel optimized: ${funnel.purchase.expectedCustomers} monthly customers, $${(funnel.purchase.averageMonthlyRevenue / 1000).toFixed(0)}K MRR`);
    return { funnel, optimizations };
  }

  async trackRevenueGrowth() {
    log.info('📈 Tracking revenue growth and market penetration...');
    
    const months = 12;
    const growthProjection = [];
    
    let currentMRR = 50000; // Starting MRR
    let currentCustomers = 300; // Starting customers
    
    for (let month = 1; month <= months; month++) {
      const growthRate = month <= 3 ? 0.25 : month <= 6 ? 0.20 : month <= 9 ? 0.15 : 0.10; // Decreasing growth rate
      const churnRate = 0.05; // 5% monthly churn
      const expansionRate = 0.15; // 15% expansion revenue
      
      const newCustomers = Math.round(currentCustomers * growthRate);
      const churnedCustomers = Math.round(currentCustomers * churnRate);
      const netNewCustomers = newCustomers - churnedCustomers;
      
      currentCustomers += netNewCustomers;
      
      const newRevenue = newCustomers * 1500; // Average revenue per new customer
      const churnedRevenue = churnedCustomers * 1200; // Average revenue per churned customer
      const expansionRevenue = currentMRR * expansionRate;
      
      currentMRR = currentMRR + newRevenue - churnedRevenue + expansionRevenue;
      
      growthProjection.push({
        month,
        customers: currentCustomers,
        mrr: Math.round(currentMRR),
        arr: Math.round(currentMRR * 12),
        newCustomers,
        churnedCustomers,
        netGrowth: netNewCustomers,
        growthRate: Math.round(growthRate * 100),
        churnRate: Math.round(churnRate * 100)
      });
    }

    const finalProjection = growthProjection[growthProjection.length - 1];
    
    log.success(`Revenue projection: ${finalProjection.customers} customers, $${(finalProjection.arr / 1000000).toFixed(1)}M ARR by month 12`);
    return growthProjection;
  }

  async generateMarketDominationReport() {
    log.info('📊 Generating comprehensive market domination report...');
    
    try {
      const [
        marketAnalysis,
        acquisitionPlan,
        conversionOptimization,
        revenueProjection
      ] = await Promise.all([
        this.analyzeMarketOpportunity(),
        this.executeCustomerAcquisition(),
        this.optimizeConversionFunnel(),
        this.trackRevenueGrowth()
      ]);

      const report = {
        generatedAt: new Date().toISOString(),
        marketDominationStrategy: {
          marketOpportunity: marketAnalysis,
          customerAcquisition: acquisitionPlan,
          conversionOptimization,
          revenueGrowth: revenueProjection
        },
        
        keyMetrics: {
          totalMarketValue: `$${(marketAnalysis.totalRevenuePotential / 1000000).toFixed(0)}M`,
          expectedCustomers: acquisitionPlan.expectedCustomers,
          projectedARR: `$${(revenueProjection[revenueProjection.length - 1].arr / 1000000).toFixed(1)}M`,
          customerAcquisitionCost: `$${Math.round(acquisitionPlan.averageCAC)}`,
          lifetimeValue: `$${Math.round(acquisitionPlan.averageLTV)}`,
          ltvCacRatio: acquisitionPlan.ltvCacRatio.toFixed(1)
        },
        
        competitiveAdvantage: {
          pricingPosition: this.calculatePricingAdvantage(),
          featureAdvantage: this.calculateFeatureAdvantage(),
          marketPosition: this.calculateMarketPosition()
        },
        
        executionRoadmap: {
          phase1: '0-30 days: Customer acquisition engine launch',
          phase2: '30-60 days: Conversion optimization and sales scaling',
          phase3: '60-90 days: Market penetration and competitive moat',
          phase4: '90+ days: Revenue acceleration and market domination'
        },
        
        successMetrics: {
          month3Target: '$500K MRR',
          month6Target: '$1.5M MRR',
          month12Target: '$10M MRR',
          marketShareTarget: '5% in target segments',
          customerSatisfactionTarget: '95% retention, NPS 70+'
        },
        
        riskMitigation: {
          competitorResponse: 'Superior technology and ROI advantage',
          marketSaturation: 'Multi-tier approach captures entire market',
          customerChurn: 'Customer success team and proven ROI retention',
          scalingChallenges: 'Automated processes and proven infrastructure'
        }
      };

      // Save report
      const reportPath = path.join(process.cwd(), 'market-reports');
      if (!fs.existsSync(reportPath)) {
        fs.mkdirSync(reportPath, { recursive: true });
      }

      const filename = `market-domination-report-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(path.join(reportPath, filename), JSON.stringify(report, null, 2));

      log.success(`Market domination report generated: ${filename}`);
      return report;
    } catch (error) {
      log.error(`Report generation failed: ${error.message}`);
      throw error;
    }
  }

  displayHelp() {
    console.log(`
${colors.cyan}AgentRadar Market Domination Engine${colors.reset}

${colors.yellow}Usage:${colors.reset}
  node market-domination-engine.js [command] [options]

${colors.yellow}Commands:${colors.reset}
  ${colors.green}init${colors.reset}              Initialize market domination engine
  ${colors.green}analyze${colors.reset}           Analyze market opportunity and sizing  
  ${colors.green}acquire${colors.reset}           Execute customer acquisition campaign
  ${colors.green}optimize${colors.reset}          Optimize conversion funnel
  ${colors.green}track${colors.reset}             Track revenue growth projections
  ${colors.green}compete${colors.reset}           Analyze competitive landscape
  ${colors.green}report${colors.reset}            Generate comprehensive domination report
  ${colors.green}help${colors.reset}              Show this help message

${colors.yellow}Options:${colors.reset}
  --segment=<tier>         Target customer segment (individual|brokerages|enterprise|all)
  --budget=<amount>        Marketing budget for acquisition campaigns
  --months=<number>        Projection timeframe (default: 12)

${colors.yellow}Examples:${colors.reset}
  node market-domination-engine.js init
  node market-domination-engine.js acquire --segment=enterprise --budget=500000
  node market-domination-engine.js report
  node market-domination-engine.js track --months=24
    `);
  }
}

// Main execution
async function main() {
  const command = process.argv[2] || 'help';
  const domination = new MarketDominationEngine();

  // Parse options
  const options = {};
  process.argv.slice(3).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      options[key] = value;
    }
  });

  switch (command.toLowerCase()) {
    case 'init':
    case 'initialize':
      const initialized = await domination.initialize();
      process.exit(initialized ? 0 : 1);
      break;

    case 'analyze':
      const analysis = await domination.analyzeMarketOpportunity();
      console.log(JSON.stringify(analysis, null, 2));
      break;

    case 'acquire':
      const segment = options.segment || 'all';
      const budget = parseInt(options.budget) || 100000;
      const acquisition = await domination.executeCustomerAcquisition(segment, budget);
      console.log('\n💰 Customer Acquisition Plan:');
      console.log(`Expected Revenue: $${(acquisition.expectedRevenue / 1000000).toFixed(1)}M`);
      console.log(`Expected Customers: ${acquisition.expectedCustomers}`);
      console.log(`ROI: ${acquisition.roi.toFixed(0)}%`);
      console.log(`LTV:CAC Ratio: ${acquisition.ltvCacRatio.toFixed(1)}:1`);
      break;

    case 'optimize':
      const optimization = await domination.optimizeConversionFunnel();
      console.log('\n🔄 Conversion Funnel Optimization:');
      console.log(`Monthly Customers: ${optimization.funnel.purchase.expectedCustomers}`);
      console.log(`Monthly Revenue: $${(optimization.funnel.purchase.averageMonthlyRevenue / 1000).toFixed(0)}K`);
      break;

    case 'track':
      const months = parseInt(options.months) || 12;
      const growth = await domination.trackRevenueGrowth();
      console.log('\n📈 Revenue Growth Projection:');
      growth.forEach((month, index) => {
        if (index % 3 === 0 || index === growth.length - 1) { // Show quarterly + final
          console.log(`Month ${month.month}: ${month.customers} customers, $${(month.arr / 1000000).toFixed(1)}M ARR`);
        }
      });
      break;

    case 'compete':
      const pricingAdv = domination.calculatePricingAdvantage();
      const featureAdv = domination.calculateFeatureAdvantage();
      console.log('\n🏆 Competitive Analysis:');
      console.log('Pricing Premium:', pricingAdv);
      console.log('Feature Advantages:', featureAdv);
      break;

    case 'report':
      const report = await domination.generateMarketDominationReport();
      console.log('\n🚀 Market Domination Summary:');
      console.log(`Market Opportunity: ${report.keyMetrics.totalMarketValue}`);
      console.log(`12-Month ARR Target: ${report.keyMetrics.projectedARR}`);
      console.log(`Customer Acquisition: ${report.keyMetrics.expectedCustomers} customers`);
      console.log(`LTV:CAC Ratio: ${report.keyMetrics.ltvCacRatio}:1`);
      break;

    case 'help':
    case '--help':
    case '-h':
    default:
      domination.displayHelp();
      break;
  }
}

// Handle global errors
process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

// Run the application
if (require.main === module) {
  main();
}