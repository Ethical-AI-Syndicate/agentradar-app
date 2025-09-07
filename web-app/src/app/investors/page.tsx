'use client';

import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, DollarSign, BarChart3, Globe, Zap, Mail, Calendar, Download, Shield, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function InvestorsPage() {
  const metrics = [
    { label: 'Market Size (TAM)', value: '$2.1B', description: 'Canadian real estate tech market', icon: Globe },
    { label: 'Target Users', value: '145,000+', description: 'Licensed real estate agents in Canada', icon: Users },
    { label: 'Early Traction', value: 'Pre-Launch', description: 'Platform launching September 2025', icon: Zap },
    { label: 'Revenue Model', value: 'SaaS', description: 'Recurring monthly subscriptions', icon: DollarSign }
  ];

  const competitive = [
    { advantage: 'First-Mover', description: 'First AI-powered court filing intelligence platform in Canada' },
    { advantage: 'Data Moat', description: 'Proprietary algorithms for processing legal documents and municipal filings' },
    { advantage: 'Network Effects', description: 'More users = better market intelligence for everyone' },
    { advantage: 'High Switching Costs', description: 'Integrated workflows make platform sticky once adopted' }
  ];

  const roadmap = [
    { phase: 'Phase 1 (Q4 2025)', milestone: 'MVP Launch', description: 'Ontario court filings + 1,000 beta users' },
    { phase: 'Phase 2 (Q1 2026)', milestone: 'Market Expansion', description: 'All provinces + mobile/desktop apps' },
    { phase: 'Phase 3 (Q2 2026)', milestone: 'AI Enhancement', description: 'Predictive scoring + market forecasting' },
    { phase: 'Phase 4 (Q3 2026)', milestone: 'Enterprise', description: 'White-label for brokerages + API platform' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/about"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to About
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Investor Information</h1>
              <p className="text-xl text-gray-600 mt-2">
                Pre-Seed Investment Opportunity in Real Estate Intelligence
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Executive Summary */}
        <section className="mb-16">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Executive Summary</h2>
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  <strong>AgentRadar</strong> is democratizing real estate intelligence by giving agents access to off-market opportunities 
                  6-12 months before they hit MLS. Our AI-powered platform analyzes court filings, estate sales, and municipal 
                  development applications to identify properties before the competition.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  We&apos;re seeking <strong>$500K - $1.2M in pre-seed funding</strong> to accelerate development, expand across Canada, 
                  and build our team. This represents a unique opportunity to invest in the future of real estate technology 
                  with a proven founder and clear path to revenue.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Key Metrics */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Market Opportunity</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <metric.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                  <div className="font-medium text-gray-900 mb-2">{metric.label}</div>
                  <div className="text-sm text-gray-600">{metric.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Problem & Solution */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">The Problem</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-red-700">
                  <li>• Real estate agents compete for the same MLS listings</li>
                  <li>• Off-market opportunities require manual research across multiple sources</li>
                  <li>• Court filings and municipal data are fragmented and difficult to access</li>
                  <li>• Agents miss opportunities that could have generated significant commissions</li>
                  <li>• No unified platform exists for early-stage property intelligence</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Our Solution</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-green-700">
                  <li>• AI-powered analysis of court filings and estate sales</li>
                  <li>• Real-time alerts for properties matching agent criteria</li>
                  <li>• 6-12 month head start on market opportunities</li>
                  <li>• Unified dashboard with opportunity scoring and market intelligence</li>
                  <li>• White-label solutions for brokerages and enterprise clients</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Competitive Advantages */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Competitive Advantages</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {competitive.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{item.advantage}</h3>
                  </div>
                  <p className="text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Revenue Model */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Revenue Model</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Badge className="bg-blue-100 text-blue-800 mb-2">Individual Agents</Badge>
                <CardTitle>$99/month</CardTitle>
                <CardDescription>Per agent subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Unlimited property alerts</li>
                  <li>• Court filing intelligence</li>
                  <li>• Basic market analytics</li>
                  <li>• Mobile & web access</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge className="bg-green-100 text-green-800 mb-2">Team Plans</Badge>
                <CardTitle>$79/month</CardTitle>
                <CardDescription>Per agent (5+ agents)</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Everything in Individual</li>
                  <li>• Team collaboration tools</li>
                  <li>• Advanced analytics</li>
                  <li>• Priority support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge className="bg-purple-100 text-purple-800 mb-2">Enterprise</Badge>
                <CardTitle>$49/month</CardTitle>
                <CardDescription>Per agent (50+ agents)</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• White-label platform</li>
                  <li>• API access</li>
                  <li>• Custom integrations</li>
                  <li>• Dedicated support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Growth Roadmap */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Growth Roadmap</h2>
          <div className="space-y-6">
            {roadmap.map((item, index) => (
              <Card key={index} className="border-l-4 border-l-blue-600">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">{item.phase}</Badge>
                        <h3 className="font-semibold text-gray-900">{item.milestone}</h3>
                      </div>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-blue-600 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Investment Ask */}
        <section className="mb-16">
          <Card className="bg-gradient-to-br from-blue-600 to-orange-600 text-white border-0">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Investment Opportunity</h2>
              <p className="text-xl text-blue-100 mb-6">
                Seeking $500K - $1.2M in pre-seed funding to accelerate growth and market expansion
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div>
                  <div className="text-2xl font-bold">$500K - $1.2M</div>
                  <div className="text-blue-200">Funding Range</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">18-24 months</div>
                  <div className="text-blue-200">Runway</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">5-10%</div>
                  <div className="text-blue-200">Equity Range</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  <Mail className="mr-2 w-5 h-5" />
                  Request Investment Deck
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  <Calendar className="mr-2 w-5 h-5" />
                  Schedule Investor Call
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact */}
        <section>
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Learn More?</h3>
              <p className="text-gray-600 mb-6">
                Get in touch to discuss this investment opportunity and access our detailed investor materials.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button className="bg-gradient-to-r from-blue-600 to-orange-600">
                    <Mail className="mr-2 w-4 h-4" />
                    Contact Mike Holownych
                  </Button>
                </Link>
                <Button variant="outline">
                  <Download className="mr-2 w-4 h-4" />
                  Download Executive Summary
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                All investor materials are confidential and require NDA
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}