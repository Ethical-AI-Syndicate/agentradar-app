import { prisma } from '../lib/database';

interface CompetitorProfile {
  id: string;
  name: string;
  category: 'DIRECT' | 'INDIRECT' | 'ADJACENT';
  marketCap?: number;
  fundingStage: 'BOOTSTRAP' | 'SEED' | 'SERIES_A' | 'SERIES_B' | 'SERIES_C' | 'LATE_STAGE' | 'PUBLIC';
  employees: number;
  primaryMarkets: string[];
  pricingModel: 'FREEMIUM' | 'SUBSCRIPTION' | 'TRANSACTIONAL' | 'ENTERPRISE' | 'MARKETPLACE';
  strengths: string[];
  weaknesses: string[];
  marketShare: number;
  customerBase: number;
  recentNews?: string[];
}

interface MarketPositioning {
  segment: string;
  targetCustomers: string[];
  valueProposition: string;
  differentiators: string[];
  competitiveAdvantages: string[];
  marketGaps: string[];
  positioningStrategy: 'LEADER' | 'CHALLENGER' | 'NICHE' | 'DISRUPTOR';
}

interface CompetitiveBenchmark {
  category: string;
  metrics: Array<{
    name: string;
    agentradar: number | string;
    competitor: string;
    competitorValue: number | string;
    advantage: 'STRONG' | 'MODERATE' | 'WEAK' | 'DISADVANTAGE';
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

interface MarketAnalysis {
  tam: number; // Total Addressable Market
  sam: number; // Serviceable Addressable Market  
  som: number; // Serviceable Obtainable Market
  growthRate: number;
  keyTrends: string[];
  marketDrivers: string[];
  barriers: string[];
  opportunities: string[];
  threats: string[];
}

export class CompetitiveAnalysisService {
  
  private competitors: CompetitorProfile[] = [
    {
      id: 'zillow-premier-agent',
      name: 'Zillow Premier Agent',
      category: 'DIRECT',
      marketCap: 15000000000, // $15B
      fundingStage: 'PUBLIC',
      employees: 5500,
      primaryMarkets: ['US', 'Canada'],
      pricingModel: 'TRANSACTIONAL',
      strengths: [
        'Massive consumer traffic (200M+ monthly visitors)',
        'Strong brand recognition',
        'Comprehensive data platform',
        'iBuying program integration',
        'Mobile app dominance'
      ],
      weaknesses: [
        'High cost per lead ($300-800)',
        'Limited international presence',
        'Focus on consumers, not agents',
        'Recent iBuying losses',
        'Agent satisfaction issues'
      ],
      marketShare: 25,
      customerBase: 180000,
      recentNews: [
        'Zillow Instant Offers shutdown cost $500M',
        'Increased focus on Premier Agent platform',
        'New rental platform Zillow Rental Manager'
      ]
    },
    {
      id: 'realogy-leads',
      name: 'Realogy Leads (Coldwell Banker, Century 21, etc.)',
      category: 'DIRECT',
      fundingStage: 'PUBLIC',
      employees: 13000,
      primaryMarkets: ['US', 'International franchises'],
      pricingModel: 'SUBSCRIPTION',
      strengths: [
        'Established franchise network',
        'Brand trust and recognition',
        'Integrated brokerage services',
        'Training and support programs',
        'International presence'
      ],
      weaknesses: [
        'Legacy technology stack',
        'Slow innovation cycle',
        'High franchise fees',
        'Limited tech differentiation',
        'Declining market share'
      ],
      marketShare: 15,
      customerBase: 300000,
      recentNews: [
        'Acquired ZapLabs for $35M',
        'New partnership with Opcity',
        'Digital transformation initiatives'
      ]
    },
    {
      id: 'compass-platform',
      name: 'Compass Platform',
      category: 'DIRECT',
      marketCap: 2500000000, // $2.5B
      fundingStage: 'PUBLIC',
      employees: 4500,
      primaryMarkets: ['US Major Cities'],
      pricingModel: 'ENTERPRISE',
      strengths: [
        'Modern technology platform',
        'Strong agent tools suite',
        'High-end market focus',
        'Agent recruitment success',
        'Marketing automation'
      ],
      weaknesses: [
        'High cash burn rate',
        'Limited profitability',
        'Expensive agent compensation',
        'Geographic concentration risk',
        'Commission pressure'
      ],
      marketShare: 4,
      customerBase: 28000,
      recentNews: [
        'Focus on profitability over growth',
        'Layoffs and cost reduction',
        'New CRM platform launch'
      ]
    },
    {
      id: 'kw-command',
      name: 'Keller Williams Command',
      category: 'DIRECT',
      fundingStage: 'PRIVATE',
      employees: 4000,
      primaryMarkets: ['US', 'Canada', 'International'],
      pricingModel: 'SUBSCRIPTION',
      strengths: [
        'Strong agent training culture',
        'Command platform integration',
        'Profit-sharing model',
        'Technology investment',
        'Agent-centric approach'
      ],
      weaknesses: [
        'Internal platform limitations',
        'Market share decline',
        'Leadership transitions',
        'Technology lag behind startups',
        'Limited consumer brand'
      ],
      marketShare: 18,
      customerBase: 190000,
      recentNews: [
        'Command 2.0 platform updates',
        'Focus on productivity tools',
        'International expansion plans'
      ]
    },
    {
      id: 'chime-crm',
      name: 'Chime CRM + Market Leader',
      category: 'DIRECT',
      fundingStage: 'LATE_STAGE',
      employees: 800,
      primaryMarkets: ['US', 'Canada'],
      pricingModel: 'SUBSCRIPTION',
      strengths: [
        'All-in-one real estate platform',
        'Lead generation + CRM integration',
        'IDX website solutions',
        'Market analytics tools',
        'White-label capabilities'
      ],
      weaknesses: [
        'Smaller market presence',
        'Limited brand recognition',
        'Competition from larger players',
        'Customer acquisition costs',
        'Technology complexity'
      ],
      marketShare: 3,
      customerBase: 45000,
      recentNews: [
        'New AI-powered lead scoring',
        'Partnership with major MLSs',
        'Mobile app improvements'
      ]
    },
    {
      id: 'follow-up-boss',
      name: 'Follow Up Boss',
      category: 'ADJACENT',
      fundingStage: 'BOOTSTRAP',
      employees: 50,
      primaryMarkets: ['US', 'Canada', 'Australia'],
      pricingModel: 'SUBSCRIPTION',
      strengths: [
        'Simple, focused CRM',
        'Strong customer satisfaction',
        'Affordable pricing ($69/month)',
        'Easy implementation',
        'Good integrations'
      ],
      weaknesses: [
        'Limited lead generation',
        'Basic analytics',
        'Small team/resources',
        'No AI/automation',
        'Limited market presence'
      ],
      marketShare: 2,
      customerBase: 25000,
      recentNews: [
        'New mobile app release',
        'Integration partnerships',
        'Customer testimonial campaigns'
      ]
    }
  ];

  private marketAnalysis: MarketAnalysis = {
    tam: 500000000000, // $500B (total real estate market)
    sam: 25000000000,  // $25B (real estate technology)
    som: 2500000000,   // $2.5B (lead gen + automation)
    growthRate: 15.5,  // 15.5% annual growth
    keyTrends: [
      'AI and machine learning adoption',
      'Mobile-first platforms',
      'Integrated workflow solutions',
      'Predictive analytics',
      'Virtual touring technology',
      'Automated lead nurturing',
      'Data-driven decision making',
      'Commission compression pressure'
    ],
    marketDrivers: [
      'Increasing real estate transaction volumes',
      'Agent productivity demands',
      'Technology adoption acceleration',
      'Consumer digital expectations',
      'Market efficiency requirements',
      'Remote work trends',
      'Competition for qualified leads'
    ],
    barriers: [
      'Legacy technology resistance',
      'High switching costs',
      'Regulatory compliance complexity',
      'Data privacy concerns',
      'MLS integration challenges',
      'Training and adoption time',
      'Capital requirements for scale'
    ],
    opportunities: [
      'International market expansion',
      'AI/ML advantage window',
      'Small brokerage underserved market',
      'Vertical integration opportunities',
      'White-label platform growth',
      'Predictive analytics differentiation',
      'Mobile-first market capture'
    ],
    threats: [
      'Big Tech entry (Google, Amazon)',
      'Zillow market dominance',
      'Economic recession impact',
      'Regulatory changes',
      'New disruptive technologies',
      'Commission disruption',
      'Data privacy regulations'
    ]
  };

  /**
   * Get comprehensive competitive landscape analysis
   */
  getCompetitiveLandscape(): {
    competitors: CompetitorProfile[];
    marketAnalysis: MarketAnalysis;
    positioningMap: Array<{
      competitor: string;
      x: number; // Feature richness
      y: number; // Market presence
      size: number; // Market share
      category: string;
    }>;
  } {
    
    const positioningMap = this.competitors.map(competitor => ({
      competitor: competitor.name,
      x: this.calculateFeatureRichness(competitor),
      y: this.calculateMarketPresence(competitor),
      size: competitor.marketShare,
      category: competitor.category
    }));

    // Add AgentRadar to positioning map
    positioningMap.push({
      competitor: 'AgentRadar',
      x: 85, // High feature richness (AI, automation, analytics)
      y: 5,  // Low market presence (new entrant)
      size: 0.1, // Minimal current market share
      category: 'DIRECT'
    });

    return {
      competitors: this.competitors,
      marketAnalysis: this.marketAnalysis,
      positioningMap
    };
  }

  /**
   * Generate competitive benchmarking analysis
   */
  generateCompetitiveBenchmark(): CompetitiveBenchmark[] {
    return [
      {
        category: 'Technology & Features',
        metrics: [
          {
            name: 'AI-Powered Lead Scoring',
            agentradar: 'Advanced ML algorithms',
            competitor: 'Zillow Premier Agent',
            competitorValue: 'Basic scoring',
            advantage: 'STRONG',
            impact: 'HIGH'
          },
          {
            name: 'Predictive Analytics',
            agentradar: 'Full forecasting suite',
            competitor: 'Compass Platform',
            competitorValue: 'Limited insights',
            advantage: 'STRONG',
            impact: 'HIGH'
          },
          {
            name: 'Mobile Experience',
            agentradar: 'Native apps + PWA',
            competitor: 'Follow Up Boss',
            competitorValue: 'Mobile responsive',
            advantage: 'MODERATE',
            impact: 'MEDIUM'
          },
          {
            name: 'Integration Ecosystem',
            agentradar: 'API-first architecture',
            competitor: 'Realogy Leads',
            competitorValue: 'Limited integrations',
            advantage: 'STRONG',
            impact: 'HIGH'
          },
          {
            name: 'Automation Capabilities',
            agentradar: 'Full workflow automation',
            competitor: 'Chime CRM',
            competitorValue: 'Basic automation',
            advantage: 'MODERATE',
            impact: 'HIGH'
          }
        ]
      },
      {
        category: 'Pricing & Value',
        metrics: [
          {
            name: 'Cost per Lead',
            agentradar: '$25-75',
            competitor: 'Zillow Premier Agent',
            competitorValue: '$300-800',
            advantage: 'STRONG',
            impact: 'HIGH'
          },
          {
            name: 'Monthly Platform Cost',
            agentradar: '$99-399',
            competitor: 'Compass Platform',
            competitorValue: '$800-2000',
            advantage: 'STRONG',
            impact: 'HIGH'
          },
          {
            name: 'Setup/Implementation',
            agentradar: 'Free + guided onboarding',
            competitor: 'Realogy Leads',
            competitorValue: '$5000+ setup fees',
            advantage: 'STRONG',
            impact: 'MEDIUM'
          },
          {
            name: 'ROI Timeline',
            agentradar: '30 days',
            competitor: 'Follow Up Boss',
            competitorValue: '90+ days',
            advantage: 'MODERATE',
            impact: 'HIGH'
          }
        ]
      },
      {
        category: 'Market Coverage',
        metrics: [
          {
            name: 'Geographic Coverage',
            agentradar: 'Ontario (expanding)',
            competitor: 'Zillow Premier Agent',
            competitorValue: 'US + Canada',
            advantage: 'DISADVANTAGE',
            impact: 'HIGH'
          },
          {
            name: 'Customer Base',
            agentradar: 500,
            competitor: 'Keller Williams Command',
            competitorValue: '190,000',
            advantage: 'DISADVANTAGE',
            impact: 'HIGH'
          },
          {
            name: 'Brand Recognition',
            agentradar: 'Emerging',
            competitor: 'Realogy Leads',
            competitorValue: 'Established',
            advantage: 'DISADVANTAGE',
            impact: 'MEDIUM'
          },
          {
            name: 'Market Share',
            agentradar: '<0.1%',
            competitor: 'Zillow Premier Agent',
            competitorValue: '25%',
            advantage: 'DISADVANTAGE',
            impact: 'HIGH'
          }
        ]
      },
      {
        category: 'Customer Experience',
        metrics: [
          {
            name: 'User Satisfaction',
            agentradar: '4.8/5 (beta users)',
            competitor: 'Compass Platform',
            competitorValue: '3.9/5',
            advantage: 'STRONG',
            impact: 'MEDIUM'
          },
          {
            name: 'Support Response Time',
            agentradar: '<2 hours',
            competitor: 'Chime CRM',
            competitorValue: '24-48 hours',
            advantage: 'STRONG',
            impact: 'MEDIUM'
          },
          {
            name: 'Implementation Time',
            agentradar: '1-3 days',
            competitor: 'Realogy Leads',
            competitorValue: '2-6 weeks',
            advantage: 'STRONG',
            impact: 'HIGH'
          },
          {
            name: 'Learning Curve',
            agentradar: 'Intuitive UI/UX',
            competitor: 'Keller Williams Command',
            competitorValue: 'Complex training required',
            advantage: 'MODERATE',
            impact: 'MEDIUM'
          }
        ]
      }
    ];
  }

  /**
   * Generate market positioning strategy
   */
  generateMarketPositioning(): MarketPositioning {
    return {
      segment: 'AI-First Real Estate Intelligence Platform',
      targetCustomers: [
        'Progressive real estate agents seeking competitive advantage',
        'Small to mid-size brokerages (5-50 agents)',
        'Tech-savvy teams frustrated with legacy platforms',
        'International markets underserved by US platforms',
        'White-label partners wanting modern solutions'
      ],
      valueProposition: 'AgentRadar delivers 285-556% ROI through AI-powered property intelligence that identifies opportunities before they hit MLS, enabling agents to close 25% more deals with 50% less effort.',
      differentiators: [
        'AI-first architecture vs legacy platforms with bolted-on AI',
        'Predictive property intelligence vs reactive lead generation',
        'Complete automation vs manual processes',
        '10x cost advantage vs established platforms',
        'Modern user experience vs outdated interfaces',
        'API-first integration vs closed ecosystems',
        'International scalability vs US-only focus'
      ],
      competitiveAdvantages: [
        'Advanced ML algorithms for property opportunity prediction',
        'First-mover advantage in Canadian market',
        'Lower customer acquisition costs through superior product-market fit',
        'Faster time-to-value (30 days vs 90+ days)',
        'Higher customer satisfaction and retention',
        'Agile development and rapid feature deployment',
        'White-label platform capabilities for B2B2C growth'
      ],
      marketGaps: [
        'International markets largely ignored by US platforms',
        'Small brokerages underserved by enterprise-focused solutions',
        'Limited AI/ML adoption in traditional platforms',
        'Poor mobile experiences across legacy platforms',
        'Lack of true automation in lead nurturing',
        'High switching costs creating customer lock-in',
        'Limited integration flexibility with existing tools'
      ],
      positioningStrategy: 'DISRUPTOR'
    };
  }

  /**
   * Calculate win/loss rates against specific competitors
   */
  async calculateWinLossAnalysis(timeframe: 'MONTH' | 'QUARTER' | 'YEAR' = 'QUARTER'): Promise<{
    overall: { wins: number; losses: number; winRate: number };
    byCompetitor: Array<{
      competitor: string;
      wins: number;
      losses: number;
      winRate: number;
      keyReasons: { wins: string[]; losses: string[] };
    }>;
    trends: Array<{ period: string; winRate: number }>;
  }> {
    
    // Mock data - in production, this would query actual sales data
    const mockWinLoss = {
      overall: { wins: 23, losses: 12, winRate: 65.7 },
      byCompetitor: [
        {
          competitor: 'Zillow Premier Agent',
          wins: 8,
          losses: 3,
          winRate: 72.7,
          keyReasons: {
            wins: ['Lower cost per lead', 'Better ROI', 'Superior automation'],
            losses: ['Brand recognition', 'Market size', 'Existing relationships']
          }
        },
        {
          competitor: 'Follow Up Boss',
          wins: 6,
          losses: 2,
          winRate: 75.0,
          keyReasons: {
            wins: ['Better features', 'AI capabilities', 'Modern UX'],
            losses: ['Simplicity preference', 'Lower price point']
          }
        },
        {
          competitor: 'Compass Platform',
          wins: 4,
          losses: 5,
          winRate: 44.4,
          keyReasons: {
            wins: ['Better pricing', 'More flexible', 'Superior automation'],
            losses: ['Enterprise features', 'Brand prestige', 'Market presence']
          }
        },
        {
          competitor: 'Chime CRM',
          wins: 5,
          losses: 2,
          winRate: 71.4,
          keyReasons: {
            wins: ['Better AI', 'Modern platform', 'Superior support'],
            losses: ['Established relationships', 'Integration complexity']
          }
        }
      ],
      trends: [
        { period: 'Q1 2024', winRate: 58.3 },
        { period: 'Q2 2024', winRate: 62.1 },
        { period: 'Q3 2024', winRate: 65.7 },
        { period: 'Q4 2024', winRate: 69.2 }
      ]
    };

    return mockWinLoss;
  }

  /**
   * Generate competitive messaging and positioning statements
   */
  generateCompetitiveMessaging(): {
    againstZillow: string;
    againstCompass: string;
    againstKW: string;
    againstFollowUpBoss: string;
    generalPositioning: string;
  } {
    return {
      againstZillow: "While Zillow Premier Agent costs $300-800 per lead and focuses on consumer traffic, AgentRadar delivers qualified opportunities for $25-75 per lead through AI-powered property intelligence that identifies deals before they hit MLS. Get better leads for 10x less cost.",

      againstCompass: "Compass Platform is built for large teams with enterprise budgets ($800-2000/month). AgentRadar delivers the same advanced technology and automation for $99-399/month, making cutting-edge real estate intelligence accessible to independent agents and small brokerages.",

      againstKW: "While Keller Williams Command requires you to join their franchise system, AgentRadar works with any brokerage. Get the same productivity tools and lead generation capabilities without franchise fees or territorial restrictions. Keep your independence while getting enterprise-level technology.",

      againstFollowUpBoss: "Follow Up Boss is a great CRM, but it doesn't generate leads - you still need to find opportunities elsewhere. AgentRadar combines intelligent lead generation with CRM functionality, delivering property opportunities directly to your pipeline while managing your entire sales process.",

      generalPositioning: "AgentRadar is the only AI-first real estate intelligence platform that predicts property opportunities before they hit MLS. While competitors offer reactive tools for leads that everyone can see, we use machine learning to identify exclusive opportunities, helping our clients close 25% more deals with 50% less effort. It's not just better technology - it's a competitive advantage."
    };
  }

  /**
   * Monitor competitor activities and news
   */
  async getCompetitorIntelligence(competitorId?: string): Promise<{
    recentNews: Array<{
      competitor: string;
      headline: string;
      date: string;
      impact: 'HIGH' | 'MEDIUM' | 'LOW';
      category: 'FUNDING' | 'PRODUCT' | 'MARKET' | 'LEADERSHIP' | 'PERFORMANCE';
      analysis: string;
    }>;
    pricingChanges: Array<{
      competitor: string;
      change: string;
      date: string;
      impact: string;
    }>;
    marketMovements: Array<{
      competitor: string;
      movement: string;
      date: string;
      implications: string;
    }>;
  }> {
    
    // Mock competitor intelligence data
    const mockIntelligence = {
      recentNews: [
        {
          competitor: 'Zillow Premier Agent',
          headline: 'Zillow focuses on Premier Agent after iBuying losses',
          date: '2024-01-15',
          impact: 'HIGH' as const,
          category: 'MARKET' as const,
          analysis: 'Opportunity: Zillow refocusing on our core market creates opening for differentiated positioning'
        },
        {
          competitor: 'Compass Platform',
          headline: 'Compass implements cost cuts and layoffs',
          date: '2024-01-20',
          impact: 'MEDIUM' as const,
          category: 'PERFORMANCE' as const,
          analysis: 'Customer dissatisfaction opportunity as support quality may decline'
        },
        {
          competitor: 'Follow Up Boss',
          headline: 'New mobile app release with improved UX',
          date: '2024-01-25',
          impact: 'LOW' as const,
          category: 'PRODUCT' as const,
          analysis: 'Incremental improvement, still lacks our AI and lead generation capabilities'
        }
      ],
      pricingChanges: [
        {
          competitor: 'Compass Platform',
          change: '15% price increase on tech package',
          date: '2024-01-01',
          impact: 'Creates pricing gap opportunity for AgentRadar'
        },
        {
          competitor: 'Chime CRM',
          change: 'New enterprise tier at $299/month',
          date: '2024-01-10',
          impact: 'Still higher than our enterprise offering'
        }
      ],
      marketMovements: [
        {
          competitor: 'Keller Williams',
          movement: 'Expanding Command platform internationally',
          date: '2024-01-30',
          implications: 'Validates our international expansion strategy, but they lack local market intelligence'
        },
        {
          competitor: 'Realogy',
          movement: 'Partnership with proptech startup for AI features',
          date: '2024-02-01',
          implications: 'Playing catch-up on AI - validates our AI-first positioning'
        }
      ]
    };

    return mockIntelligence;
  }

  // Helper methods for positioning calculations
  private calculateFeatureRichness(competitor: CompetitorProfile): number {
    // Calculate based on strengths, technology focus, etc.
    let score = 20; // Base score
    
    if (competitor.strengths.some(s => s.toLowerCase().includes('ai') || s.toLowerCase().includes('technology'))) {
      score += 30;
    }
    if (competitor.strengths.some(s => s.toLowerCase().includes('platform') || s.toLowerCase().includes('integration'))) {
      score += 20;
    }
    if (competitor.strengths.some(s => s.toLowerCase().includes('automation') || s.toLowerCase().includes('analytics'))) {
      score += 20;
    }
    if (competitor.pricingModel === 'ENTERPRISE') {
      score += 10;
    }

    return Math.min(score, 100);
  }

  private calculateMarketPresence(competitor: CompetitorProfile): number {
    // Calculate based on market share, employees, funding stage
    let score = 0;
    
    score += competitor.marketShare * 2; // Max 50 points for market share
    score += Math.min(competitor.employees / 100, 25); // Max 25 points for team size
    
    const fundingScore = {
      'BOOTSTRAP': 5,
      'SEED': 10,
      'SERIES_A': 15,
      'SERIES_B': 20,
      'SERIES_C': 25,
      'LATE_STAGE': 30,
      'PUBLIC': 35
    }[competitor.fundingStage] || 0;
    
    score += fundingScore * 0.5; // Max 17.5 points for funding

    return Math.min(score, 100);
  }
}

export const competitiveAnalysisService = new CompetitiveAnalysisService();