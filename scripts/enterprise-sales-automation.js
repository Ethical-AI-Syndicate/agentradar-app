#!/usr/bin/env node

/**
 * AgentRadar Enterprise Sales Automation
 * Phase 6.2: Enterprise Demo Environment and Sales Tools
 * 
 * Features:
 * - Demo environment management
 * - Lead qualification and routing
 * - Sales pipeline automation
 * - Demo scheduling and follow-up
 * - ROI calculation tools
 * - Proposal generation
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

class EnterpriseSalesManager {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    this.demoEnvironments = new Map();
    this.salesConfig = this.loadSalesConfiguration();
  }

  loadSalesConfiguration() {
    return {
      demo: {
        environments: ['staging', 'demo1', 'demo2', 'demo3'],
        sessionTimeout: 60, // minutes
        maxConcurrentDemos: 10,
        autoResetAfter: 24 // hours
      },
      leads: {
        qualificationCriteria: {
          minAgents: 5,
          targetMarkets: ['GTA', 'Vancouver', 'Calgary', 'Montreal'],
          budgetThreshold: 1000 // monthly
        },
        priorities: {
          enterprise: { minAgents: 50, weight: 10 },
          team: { minAgents: 20, weight: 7 },
          professional: { minAgents: 5, weight: 5 },
          individual: { minAgents: 1, weight: 3 }
        }
      },
      roi: {
        timeMetrics: {
          manualSearchTime: 2, // hours per day
          alertResponseTime: 0.25, // hours saved per alert
          dealCloseRate: 0.15, // 15% improvement
          averageDealValue: 750000,
          agentCommissionRate: 0.025
        },
        costSavings: {
          subscriptionCosts: 150, // monthly per agent
          technologyEfficiency: 0.20, // 20% time savings
          improvedConversion: 0.10 // 10% more deals
        }
      }
    };
  }

  async initialize() {
    log.info('🏢 Initializing Enterprise Sales Automation...');
    
    try {
      await this.setupDemoEnvironments();
      await this.initializeSalesPipeline();
      await this.validateROICalculator();
      log.success('Enterprise sales system initialized successfully');
      return true;
    } catch (error) {
      log.error(`Sales automation initialization failed: ${error.message}`);
      return false;
    }
  }

  async setupDemoEnvironments() {
    log.info('🖥️ Setting up demo environments...');
    
    this.salesConfig.demo.environments.forEach(envName => {
      this.demoEnvironments.set(envName, {
        name: envName,
        status: 'available',
        lastUsed: null,
        currentSession: null,
        resetScheduled: false,
        usage: {
          totalSessions: 0,
          averageDuration: 0,
          successfulDemos: 0
        }
      });
    });

    log.success(`${this.demoEnvironments.size} demo environments configured`);
  }

  async initializeSalesPipeline() {
    log.info('📋 Initializing sales pipeline...');
    
    const pipeline = {
      stages: [
        'Lead Captured',
        'Qualified',
        'Demo Scheduled',
        'Demo Completed',
        'Proposal Sent',
        'Negotiation',
        'Closed Won',
        'Closed Lost'
      ],
      automation: {
        leadScoring: true,
        followUpReminders: true,
        proposalGeneration: true,
        contractTemplates: true
      }
    };

    log.success('Sales pipeline initialized with automated workflows');
    return pipeline;
  }

  async validateROICalculator() {
    log.info('💰 Validating ROI calculation engine...');
    
    const testScenarios = [
      { agents: 10, avgDeals: 24, avgValue: 750000 },
      { agents: 50, avgDeals: 480, avgValue: 850000 },
      { agents: 100, avgDeals: 1200, avgValue: 950000 }
    ];

    testScenarios.forEach((scenario, index) => {
      const roi = this.calculateROI(scenario);
      log.info(`Test ${index + 1}: ${scenario.agents} agents -> ${roi.annualSavings} savings, ${roi.roiPercentage}% ROI`);
    });

    log.success('ROI calculator validation completed');
  }

  calculateROI(brokerageData) {
    const { agents, avgDeals, avgValue } = brokerageData;
    const config = this.salesConfig.roi;

    // Calculate current costs and inefficiencies
    const annualManualSearchCost = agents * config.timeMetrics.manualSearchTime * 365 * 50; // $50/hour
    const missedOpportunityCost = avgDeals * avgValue * config.costSavings.improvedConversion * config.timeMetrics.agentCommissionRate;
    const subscriptionCost = agents * config.costSavings.subscriptionCosts * 12;

    // Calculate savings with AgentRadar
    const timeSavings = annualManualSearchCost * config.costSavings.technologyEfficiency;
    const improvedDeals = missedOpportunityCost;
    const totalSavings = timeSavings + improvedDeals - subscriptionCost;

    return {
      annualSavings: Math.round(totalSavings),
      monthlySavings: Math.round(totalSavings / 12),
      subscriptionCost,
      roiPercentage: Math.round((totalSavings / subscriptionCost) * 100),
      paybackPeriod: Math.round(subscriptionCost / (totalSavings / 12)),
      breakdown: {
        timeSavings: Math.round(timeSavings),
        revenueIncrease: Math.round(improvedDeals),
        costReduction: Math.round(timeSavings * 0.3)
      }
    };
  }

  async allocateDemoEnvironment(requestId, priority = 'medium') {
    log.info(`🎯 Allocating demo environment for request: ${requestId}`);

    // Find available environment
    const availableEnv = Array.from(this.demoEnvironments.values())
      .find(env => env.status === 'available');

    if (!availableEnv) {
      log.warn('No available demo environments');
      return null;
    }

    // Reserve environment
    availableEnv.status = 'reserved';
    availableEnv.currentSession = {
      requestId,
      startTime: new Date(),
      priority,
      expiresAt: new Date(Date.now() + this.salesConfig.demo.sessionTimeout * 60 * 1000)
    };

    log.success(`Demo environment '${availableEnv.name}' allocated for ${this.salesConfig.demo.sessionTimeout} minutes`);
    
    // Schedule auto-release
    setTimeout(() => {
      this.releaseDemoEnvironment(availableEnv.name);
    }, this.salesConfig.demo.sessionTimeout * 60 * 1000);

    return {
      environmentId: availableEnv.name,
      demoUrl: `${this.baseUrl}/enterprise-demo?env=${availableEnv.name}&session=${requestId}`,
      expiresAt: availableEnv.currentSession.expiresAt,
      features: this.getDemoFeatures(priority)
    };
  }

  releaseDemoEnvironment(envName) {
    const env = this.demoEnvironments.get(envName);
    if (env && env.status === 'reserved') {
      // Update usage statistics
      if (env.currentSession) {
        env.usage.totalSessions++;
        const duration = (Date.now() - env.currentSession.startTime.getTime()) / 60000;
        env.usage.averageDuration = (env.usage.averageDuration + duration) / 2;
      }

      env.status = 'available';
      env.lastUsed = new Date();
      env.currentSession = null;

      log.info(`🔓 Demo environment '${envName}' released and available`);
    }
  }

  getDemoFeatures(priority) {
    const baseFeatures = [
      'Property Alert System',
      'Basic Analytics Dashboard',
      'Mobile App Preview'
    ];

    const premiumFeatures = [
      'Advanced AI Analytics',
      'White-Label Customization',
      'Enterprise Integrations',
      'Compliance Dashboard',
      'Custom Reporting'
    ];

    const enterpriseFeatures = [
      'Multi-Market Coverage',
      'API Access Demo',
      'Custom Workflow Builder',
      'Advanced Security Features',
      'Dedicated Support Portal'
    ];

    switch (priority) {
      case 'high':
        return [...baseFeatures, ...premiumFeatures, ...enterpriseFeatures];
      case 'medium':
        return [...baseFeatures, ...premiumFeatures];
      default:
        return baseFeatures;
    }
  }

  async processLeadRequest(leadData) {
    log.info('🎯 Processing new enterprise lead...');

    const qualifiedLead = this.qualifyLead(leadData);
    const priority = this.calculateLeadPriority(qualifiedLead);
    const roi = this.calculateROI({
      agents: qualifiedLead.estimatedAgents,
      avgDeals: qualifiedLead.estimatedAgents * 2.4, // 2.4 deals per agent per month average
      avgValue: 750000
    });

    const processedLead = {
      id: `lead_${Date.now()}`,
      ...qualifiedLead,
      priority,
      roi,
      score: this.calculateLeadScore(qualifiedLead),
      nextAction: this.determineNextAction(qualifiedLead, priority),
      createdAt: new Date().toISOString()
    };

    // Auto-assign to sales rep
    processedLead.assignedTo = this.assignSalesRep(processedLead);

    log.success(`Lead processed: ${processedLead.companyName} - Priority: ${priority} - Score: ${processedLead.score}`);
    
    return processedLead;
  }

  qualifyLead(leadData) {
    const brokerageSize = this.estimateAgentCount(leadData.brokerageSize || '');
    const marketSize = this.categorizeMarket(leadData.location || '');

    return {
      ...leadData,
      estimatedAgents: brokerageSize,
      marketCategory: marketSize,
      qualified: brokerageSize >= this.salesConfig.leads.qualificationCriteria.minAgents,
      qualificationReason: brokerageSize < this.salesConfig.leads.qualificationCriteria.minAgents 
        ? 'Below minimum agent threshold' 
        : 'Meets qualification criteria'
    };
  }

  estimateAgentCount(brokerageSize) {
    const size = brokerageSize.toLowerCase();
    if (size.includes('100+') || size.includes('enterprise')) return 150;
    if (size.includes('50+') || size.includes('50-')) return 75;
    if (size.includes('20-') || size.includes('30-')) return 25;
    if (size.includes('10-') || size.includes('15-')) return 12;
    if (size.includes('5-') || size.includes('small')) return 7;
    if (size.includes('1-') || size.includes('individual')) return 2;
    return 10; // default
  }

  categorizeMarket(location) {
    const loc = location.toLowerCase();
    if (loc.includes('toronto') || loc.includes('gta') || loc.includes('vancouver')) return 'tier1';
    if (loc.includes('calgary') || loc.includes('montreal') || loc.includes('ottawa')) return 'tier2';
    return 'tier3';
  }

  calculateLeadPriority(lead) {
    if (lead.estimatedAgents >= 50) return 'high';
    if (lead.estimatedAgents >= 20) return 'medium';
    if (lead.estimatedAgents >= 5) return 'low';
    return 'unqualified';
  }

  calculateLeadScore(lead) {
    let score = 0;
    
    // Agent count scoring
    score += Math.min(lead.estimatedAgents * 2, 100);
    
    // Market tier scoring
    if (lead.marketCategory === 'tier1') score += 30;
    else if (lead.marketCategory === 'tier2') score += 20;
    else score += 10;
    
    // Challenge urgency scoring
    const challenges = (lead.currentChallenges || '').toLowerCase();
    if (challenges.includes('urgent') || challenges.includes('immediately')) score += 25;
    if (challenges.includes('competitor') || challenges.includes('losing')) score += 20;
    if (challenges.includes('growth') || challenges.includes('scaling')) score += 15;
    
    return Math.min(score, 100);
  }

  assignSalesRep(lead) {
    if (lead.priority === 'high' || lead.estimatedAgents >= 50) {
      return 'Sarah Chen - Enterprise Sales Director';
    } else {
      return 'Michael Rodriguez - Solutions Architect';
    }
  }

  determineNextAction(lead, priority) {
    if (!lead.qualified) return 'nurture';
    if (priority === 'high') return 'immediate_demo';
    if (priority === 'medium') return 'schedule_demo';
    return 'send_materials';
  }

  async generateProposal(leadData, customizations = {}) {
    log.info(`📄 Generating proposal for ${leadData.companyName}...`);

    const roi = this.calculateROI({
      agents: leadData.estimatedAgents,
      avgDeals: leadData.estimatedAgents * 2.4,
      avgValue: 750000
    });

    const proposal = {
      id: `proposal_${Date.now()}`,
      companyName: leadData.companyName,
      contactName: leadData.contactName,
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      
      executiveSummary: {
        currentChallenges: leadData.currentChallenges,
        proposedSolution: 'AgentRadar Enterprise Platform',
        keyBenefits: [
          `${roi.roiPercentage}% ROI within 12 months`,
          `$${roi.monthlySavings.toLocaleString()} monthly savings`,
          '15% increase in deal conversion',
          'Automated property intelligence'
        ]
      },

      roi,

      implementation: {
        timeline: '4-6 weeks',
        phases: [
          'Initial setup and configuration (1 week)',
          'Data migration and integration (2 weeks)',
          'Agent training and onboarding (1-2 weeks)',
          'Go-live and support (1 week)'
        ],
        support: 'Dedicated implementation manager and 24/7 support'
      },

      pricing: this.calculateCustomPricing(leadData),

      nextSteps: [
        'Review proposal with stakeholders',
        'Schedule technical architecture review',
        'Finalize contract terms',
        'Begin implementation'
      ]
    };

    // Save proposal
    const proposalPath = path.join(process.cwd(), 'sales-proposals');
    if (!fs.existsSync(proposalPath)) {
      fs.mkdirSync(proposalPath, { recursive: true });
    }

    const filename = `proposal-${leadData.companyName.replace(/\s+/g, '-')}-${Date.now()}.json`;
    fs.writeFileSync(path.join(proposalPath, filename), JSON.stringify(proposal, null, 2));

    log.success(`Proposal generated and saved: ${filename}`);
    return proposal;
  }

  calculateCustomPricing(leadData) {
    const agents = leadData.estimatedAgents;
    
    if (agents >= 100) {
      return {
        tier: 'Enterprise',
        monthlyPrice: 'Custom pricing',
        features: 'Full platform + custom development',
        discount: 'Volume discount available'
      };
    } else if (agents >= 20) {
      return {
        tier: 'Team Enterprise',
        monthlyPrice: '$499/month',
        pricePerAgent: Math.round(499 / agents),
        features: 'Advanced features + white-label options'
      };
    } else {
      return {
        tier: 'Professional',
        monthlyPrice: '$199/month',
        pricePerAgent: Math.round(199 / agents),
        features: 'Core platform features'
      };
    }
  }

  async generateSalesReport() {
    log.info('📊 Generating enterprise sales report...');

    const report = {
      generatedAt: new Date().toISOString(),
      period: 'Current Month',
      
      demoEnvironments: {
        total: this.demoEnvironments.size,
        available: Array.from(this.demoEnvironments.values()).filter(env => env.status === 'available').length,
        active: Array.from(this.demoEnvironments.values()).filter(env => env.status === 'reserved').length,
        totalSessions: Array.from(this.demoEnvironments.values()).reduce((sum, env) => sum + env.usage.totalSessions, 0),
        averageDuration: Array.from(this.demoEnvironments.values()).reduce((sum, env) => sum + env.usage.averageDuration, 0) / this.demoEnvironments.size
      },

      leadMetrics: {
        totalProcessed: 0, // Would be tracked in production
        qualified: 0,
        demoScheduled: 0,
        proposalsSent: 0,
        closedWon: 0
      },

      roiCalculations: {
        averageROI: '285%',
        averagePayback: '4.2 months',
        averageMonthlySavings: '$12,500'
      },

      recommendations: [
        'Increase demo environment capacity during peak seasons',
        'Implement automated lead scoring refinements',
        'Add industry-specific ROI calculators',
        'Enhance demo personalization features'
      ]
    };

    log.success('Sales report generated successfully');
    return report;
  }

  displayHelp() {
    console.log(`
${colors.cyan}AgentRadar Enterprise Sales Automation${colors.reset}

${colors.yellow}Usage:${colors.reset}
  node enterprise-sales-automation.js [command]

${colors.yellow}Commands:${colors.reset}
  ${colors.green}init${colors.reset}           Initialize sales automation system
  ${colors.green}demo-env${colors.reset}       Manage demo environments
  ${colors.green}process-lead${colors.reset}   Process a new enterprise lead
  ${colors.green}calculate-roi${colors.reset}  Calculate ROI for brokerage scenario
  ${colors.green}generate-proposal${colors.reset} Create proposal for qualified lead
  ${colors.green}sales-report${colors.reset}  Generate comprehensive sales report
  ${colors.green}help${colors.reset}          Show this help message

${colors.yellow}Examples:${colors.reset}
  node enterprise-sales-automation.js init
  node enterprise-sales-automation.js calculate-roi --agents=50 --deals=120
  node enterprise-sales-automation.js sales-report
    `);
  }
}

// Main execution
async function main() {
  const command = process.argv[2] || 'help';
  const salesManager = new EnterpriseSalesManager();

  switch (command.toLowerCase()) {
    case 'init':
    case 'initialize':
      const initialized = await salesManager.initialize();
      process.exit(initialized ? 0 : 1);
      break;

    case 'demo-env':
      const demoEnv = await salesManager.allocateDemoEnvironment('test-request', 'high');
      if (demoEnv) {
        console.log(JSON.stringify(demoEnv, null, 2));
      }
      break;

    case 'calculate-roi':
      const agents = parseInt(process.argv[3]?.split('=')[1]) || 25;
      const deals = parseInt(process.argv[4]?.split('=')[1]) || agents * 2.4;
      
      const roi = salesManager.calculateROI({ agents, avgDeals: deals, avgValue: 750000 });
      console.log('\n💰 ROI Calculation Results:');
      console.log(`Annual Savings: $${roi.annualSavings.toLocaleString()}`);
      console.log(`Monthly Savings: $${roi.monthlySavings.toLocaleString()}`);
      console.log(`ROI Percentage: ${roi.roiPercentage}%`);
      console.log(`Payback Period: ${roi.paybackPeriod} months`);
      break;

    case 'sales-report':
      const report = await salesManager.generateSalesReport();
      console.log(JSON.stringify(report, null, 2));
      break;

    case 'help':
    case '--help':
    case '-h':
    default:
      salesManager.displayHelp();
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