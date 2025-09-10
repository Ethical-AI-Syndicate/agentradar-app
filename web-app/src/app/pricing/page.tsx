'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, 
  Star, 
  TrendingUp, 
  Shield, 
  Users, 
  Building2, 
  Zap,
  Calculator,
  Crown,
  Rocket
} from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  pricePerAgent?: number;
  targetMarket: string;
  maxAgents?: number;
  features: string[];
  advancedFeatures: string[];
  support: string;
  trial: string;
  popular?: boolean;
  enterprise?: boolean;
  roi: {
    timeHours: number;
    dealsIncrease: number;
    monthlySavings: number;
    roiPercentage: number;
  };
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [agentCount, setAgentCount] = useState(10);

  const pricingTiers: PricingTier[] = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for individual agents and small teams getting started with AI automation',
      monthlyPrice: 99,
      yearlyPrice: 999, // 2 months free
      pricePerAgent: 99,
      targetMarket: 'Individual Agents & Small Teams',
      maxAgents: 5,
      features: [
        'AI-powered property alerts',
        'Basic lead generation',
        'Mobile app access',
        'Email notifications',
        'Standard integrations',
        'Basic analytics',
        'Email support'
      ],
      advancedFeatures: [],
      support: 'Email support (24-48h response)',
      trial: '14-day free trial',
      roi: {
        timeHours: 10,
        dealsIncrease: 15,
        monthlySavings: 2500,
        roiPercentage: 285
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Advanced AI features and compliance tools for growing real estate professionals',
      monthlyPrice: 199,
      yearlyPrice: 1990, // 2 months free
      pricePerAgent: 199,
      targetMarket: 'Professional Agents & Teams',
      maxAgents: 25,
      popular: true,
      features: [
        'Everything in Starter',
        'Advanced AI analytics',
        'Predictive market insights',
        'Automated lead scoring',
        'CRM integrations',
        'Custom workflows',
        'Priority phone support',
        'ROI tracking dashboard'
      ],
      advancedFeatures: [
        'GDPR compliance tools',
        'Advanced reporting',
        'API access',
        'White-label options'
      ],
      support: 'Priority support (4-8h response)',
      trial: '30-day free trial',
      roi: {
        timeHours: 20,
        dealsIncrease: 25,
        monthlySavings: 5000,
        roiPercentage: 425
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Complete platform with white-label capabilities for large brokerages',
      monthlyPrice: 399,
      yearlyPrice: 3990, // 2 months free
      pricePerAgent: 399,
      targetMarket: 'Large Brokerages & Enterprises',
      enterprise: true,
      features: [
        'Everything in Professional',
        'Full white-label platform',
        'Custom integrations',
        'Dedicated success manager',
        'SOX compliance ready',
        'Advanced security features',
        'Custom onboarding',
        'SLA guarantees'
      ],
      advancedFeatures: [
        'Custom development',
        'Multi-market coverage',
        'Advanced automation',
        'Enterprise SSO',
        '24/7 priority support'
      ],
      support: 'Dedicated success manager + 24/7 support',
      trial: 'Custom pilot program',
      roi: {
        timeHours: 40,
        dealsIncrease: 35,
        monthlySavings: 15000,
        roiPercentage: 556
      }
    }
  ];

  const calculateCustomPrice = (tier: PricingTier, agents: number) => {
    if (tier.enterprise) {
      // Enterprise volume pricing
      const basePrice = tier.monthlyPrice;
      if (agents <= 10) return basePrice;
      if (agents <= 50) return Math.round(basePrice * agents * 0.85); // 15% discount
      if (agents <= 100) return Math.round(basePrice * agents * 0.75); // 25% discount
      return Math.round(basePrice * agents * 0.65); // 35% discount
    }
    
    return tier.monthlyPrice * Math.min(agents, tier.maxAgents || agents);
  };

  const getEffectivePrice = (tier: PricingTier) => {
    return isYearly ? tier.yearlyPrice : tier.monthlyPrice;
  };

  const getSavings = (tier: PricingTier) => {
    if (!isYearly) return 0;
    return (tier.monthlyPrice * 12) - tier.yearlyPrice;
  };

  const startTrial = async (tierId: string) => {
    try {
      // Get the corresponding Stripe price ID for the tier
      const priceIds = {
        'solo-agent': process.env.NEXT_PUBLIC_STRIPE_SOLO_AGENT_PRICE_ID,
        'professional': process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID,
        'team-enterprise': process.env.NEXT_PUBLIC_STRIPE_TEAM_ENTERPRISE_PRICE_ID
      };
      
      const priceId = priceIds[tierId as keyof typeof priceIds];
      
      if (!priceId) {
        // Fallback to signup for tiers without direct Stripe integration
        window.location.href = `/signup?tier=${tierId}&trial=true`;
        return;
      }

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('agentradar_token')}`,
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing?cancelled=true`,
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        // Fallback to signup
        window.location.href = `/signup?tier=${tierId}&trial=true`;
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      // Fallback to signup
      window.location.href = `/signup?tier=${tierId}&trial=true`;
    }
  };

  const contactSales = () => {
    window.location.href = '/enterprise-demo?contact=true';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-400/20">
              Market-Leading Value Proposition
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Pricing That Delivers
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                285-556% ROI
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Transform your real estate business with AI automation that pays for itself 
              in the first month. Choose the plan that matches your ambition.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-lg ${!isYearly ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-green-500"
              />
              <span className={`text-lg ${isYearly ? 'text-white' : 'text-slate-400'}`}>
                Yearly
                <Badge className="ml-2 bg-green-500/20 text-green-400">Save 20%</Badge>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 mb-8">
            <TabsTrigger value="plans">Pricing Plans</TabsTrigger>
            <TabsTrigger value="calculator">ROI Calculator</TabsTrigger>
            <TabsTrigger value="comparison">Feature Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingTiers.map((tier) => (
                <Card 
                  key={tier.id} 
                  className={`relative ${
                    tier.popular 
                      ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-900/30 to-purple-900/30' 
                      : tier.enterprise
                      ? 'border-2 border-yellow-500 bg-gradient-to-br from-yellow-900/20 to-orange-900/20'
                      : 'bg-slate-800/50 border-slate-700'
                  } hover:scale-[1.02] transition-all duration-300`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  {tier.enterprise && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                        <Crown className="w-3 h-3 mr-1" />
                        Enterprise
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex items-center justify-center mb-4">
                      {tier.id === 'starter' && <Zap className="w-8 h-8 text-blue-400" />}
                      {tier.id === 'professional' && <TrendingUp className="w-8 h-8 text-green-400" />}
                      {tier.id === 'enterprise' && <Building2 className="w-8 h-8 text-yellow-400" />}
                    </div>
                    
                    <CardTitle className="text-2xl text-white mb-2">{tier.name}</CardTitle>
                    <p className="text-slate-400 text-sm mb-4">{tier.description}</p>
                    
                    <div className="mb-4">
                      <div className="text-4xl font-bold text-white mb-1">
                        ${getEffectivePrice(tier).toLocaleString()}
                        <span className="text-lg text-slate-400 font-normal">
                          /{isYearly ? 'year' : 'month'}
                        </span>
                      </div>
                      {isYearly && getSavings(tier) > 0 && (
                        <div className="text-green-400 text-sm">
                          Save ${getSavings(tier)} annually
                        </div>
                      )}
                      {tier.pricePerAgent && (
                        <div className="text-slate-400 text-sm">
                          ${tier.pricePerAgent}/agent/{isYearly ? 'year' : 'month'}
                        </div>
                      )}
                    </div>

                    {/* ROI Highlight */}
                    <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-3 mb-4">
                      <div className="text-green-400 font-semibold text-lg">
                        {tier.roi.roiPercentage}% ROI
                      </div>
                      <div className="text-slate-300 text-sm">
                        ${tier.roi.monthlySavings.toLocaleString()}/month savings
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="text-center text-slate-400 text-sm mb-4">
                      {tier.targetMarket}
                      {tier.maxAgents && ` • Up to ${tier.maxAgents} agents`}
                    </div>

                    {/* Core Features */}
                    <div className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-slate-300">
                          <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Advanced Features */}
                    {tier.advancedFeatures.length > 0 && (
                      <div className="border-t border-slate-700 pt-4 space-y-2">
                        <div className="text-blue-400 font-semibold text-sm mb-2">Advanced Features:</div>
                        {tier.advancedFeatures.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2 text-slate-300">
                            <Star className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Support */}
                    <div className="border-t border-slate-700 pt-4">
                      <div className="flex items-center gap-2 text-slate-300 mb-2">
                        <Shield className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium">Support</span>
                      </div>
                      <p className="text-slate-400 text-sm">{tier.support}</p>
                    </div>

                    {/* Trial Info */}
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <p className="text-green-400 text-sm font-medium">{tier.trial}</p>
                    </div>

                    {/* CTA Button */}
                    <div className="pt-4">
                      {tier.enterprise ? (
                        <Button 
                          className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                          onClick={contactSales}
                        >
                          Contact Sales
                        </Button>
                      ) : (
                        <Button 
                          className={`w-full ${tier.popular 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                            : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                          onClick={() => startTrial(tier.id)}
                        >
                          Start {tier.trial.split(' ')[0]} Trial
                        </Button>
                      )}
                    </div>

                    {tier.popular && (
                      <div className="text-center">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                          <Rocket className="w-3 h-3 mr-1" />
                          Most agents choose this plan
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Volume Discount Info */}
            <div className="mt-12 text-center">
              <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30 max-w-3xl mx-auto">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-green-400" />
                    <h3 className="text-xl font-semibold text-white">Volume Discounts Available</h3>
                  </div>
                  <p className="text-slate-300 mb-4">
                    Save up to 35% with volume pricing for larger teams and brokerages
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-green-400 font-semibold">10-50 agents</div>
                      <div className="text-slate-400 text-sm">15% discount</div>
                    </div>
                    <div>
                      <div className="text-green-400 font-semibold">51-100 agents</div>
                      <div className="text-slate-400 text-sm">25% discount</div>
                    </div>
                    <div>
                      <div className="text-green-400 font-semibold">100+ agents</div>
                      <div className="text-slate-400 text-sm">35% discount</div>
                    </div>
                  </div>
                  <Button className="mt-4" onClick={contactSales}>
                    Get Volume Pricing
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calculator">
            <Card className="bg-slate-800/50 border-slate-700 max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-blue-400" />
                  ROI Calculator
                </CardTitle>
                <p className="text-slate-400">
                  Calculate your potential return on investment with AgentRadar
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Your Current Situation</h3>
                    
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Number of Agents</label>
                      <input
                        type="number"
                        value={agentCount}
                        onChange={(e) => setAgentCount(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        min="1"
                        max="1000"
                      />
                    </div>

                    <div className="space-y-2 text-slate-300">
                      <div className="flex justify-between">
                        <span>Deals closed per month:</span>
                        <span className="text-white">{Math.round(agentCount * 2.4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average deal value:</span>
                        <span className="text-white">$750,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time spent on manual searches:</span>
                        <span className="text-white">{agentCount * 2} hours/day</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">With AgentRadar</h3>
                    
                    {pricingTiers.map((tier) => {
                      const monthlyCost = calculateCustomPrice(tier, agentCount);
                      const timeSaved = agentCount * tier.roi.timeHours;
                      const additionalDeals = Math.round(agentCount * 2.4 * (tier.roi.dealsIncrease / 100));
                      const monthlySavings = tier.roi.monthlySavings * (agentCount / 10);
                      const roi = Math.round(((monthlySavings - monthlyCost) / monthlyCost) * 100);

                      return (
                        <div key={tier.id} className="p-4 bg-slate-700/50 rounded-lg">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-white">{tier.name}</h4>
                            <Badge className={tier.popular ? 'bg-blue-500' : 'bg-slate-600'}>
                              {roi > 0 ? `${roi}% ROI` : 'Calculate'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between text-slate-300">
                              <span>Monthly cost:</span>
                              <span className="text-white">${monthlyCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span>Time saved:</span>
                              <span className="text-green-400">{timeSaved} hours/month</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span>Additional deals:</span>
                              <span className="text-green-400">+{additionalDeals}/month</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span>Monthly savings:</span>
                              <span className="text-green-400">${monthlySavings.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t border-slate-600 pt-1">
                              <span className="text-white">Net monthly benefit:</span>
                              <span className="text-green-400">
                                ${(monthlySavings - monthlyCost).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-2">Key Benefits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{agentCount * 20}h</div>
                      <div className="text-slate-300">Time saved monthly</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">25%</div>
                      <div className="text-slate-300">More deals closed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">$50k+</div>
                      <div className="text-slate-300">Annual value increase</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Complete Feature Comparison</CardTitle>
                <p className="text-slate-400">
                  Compare all features across our pricing tiers
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-white py-3">Features</th>
                        <th className="text-center text-white py-3">Starter</th>
                        <th className="text-center text-white py-3">Professional</th>
                        <th className="text-center text-white py-3">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {/* Feature comparison rows */}
                      <tr className="border-b border-slate-700/50">
                        <td className="py-3">AI Property Alerts</td>
                        <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                        <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                        <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-3">Advanced Analytics</td>
                        <td className="text-center text-slate-600">Basic</td>
                        <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                        <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-3">White Label Platform</td>
                        <td className="text-center">—</td>
                        <td className="text-center text-slate-400">Limited</td>
                        <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-3">GDPR Compliance</td>
                        <td className="text-center">—</td>
                        <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                        <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-3">SOX Compliance</td>
                        <td className="text-center">—</td>
                        <td className="text-center">—</td>
                        <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-3">Custom Integrations</td>
                        <td className="text-center">—</td>
                        <td className="text-center text-slate-400">Basic</td>
                        <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="py-3">Support Level</td>
                        <td className="text-center text-slate-400">Email</td>
                        <td className="text-center text-slate-400">Priority</td>
                        <td className="text-center text-green-400">24/7 Dedicated</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              q: "How quickly will I see ROI from AgentRadar?",
              a: "Most customers see positive ROI within the first month. Our AI automation typically saves 20+ hours per agent monthly while increasing deal flow by 25%."
            },
            {
              q: "Can I upgrade or downgrade my plan at any time?",
              a: "Yes, you can change your plan at any time. Upgrades are effective immediately, and downgrades take effect at your next billing cycle."
            },
            {
              q: "What's included in the free trial?",
              a: "Full access to all features in your selected tier, including AI alerts, analytics, and support. No credit card required to start."
            },
            {
              q: "Do you offer custom enterprise solutions?",
              a: "Yes, we provide fully customized solutions for large brokerages, including white-label platforms, custom integrations, and dedicated support."
            },
            {
              q: "Is my data secure and compliant?",
              a: "Absolutely. We're GDPR and SOX compliant with enterprise-grade security, including encryption, audit trails, and compliance reporting."
            }
          ].map((faq, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-slate-300">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Real Estate Business?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of successful agents and brokerages who&apos;ve chosen AgentRadar
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => startTrial('professional')}
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-slate-600 hover:bg-slate-800"
              onClick={contactSales}
            >
              Talk to Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}