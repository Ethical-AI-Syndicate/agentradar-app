'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Shield, 
  Database, 
  Smartphone,
  Globe,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  Download,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';

interface DemoMetrics {
  totalProperties: number;
  activeAlerts: number;
  savedSearches: number;
  monthlyGrowth: number;
  averageROI: number;
  responseTime: string;
}

interface SalesContact {
  name: string;
  title: string;
  email: string;
  phone: string;
  timezone: string;
}

export default function EnterpriseDemoPage() {
  const [demoMetrics, setDemoMetrics] = useState<DemoMetrics>({
    totalProperties: 15847,
    activeAlerts: 234,
    savedSearches: 1205,
    monthlyGrowth: 23.5,
    averageROI: 18.7,
    responseTime: '< 200ms'
  });

  const [contactForm, setContactForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    brokerageSize: '',
    currentChallenges: '',
    demoDate: ''
  });

  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [demoStarted, setDemoStarted] = useState(false);

  const salesTeam: SalesContact[] = [
    {
      name: 'Sarah Chen',
      title: 'Enterprise Sales Director',
      email: 'sarah.chen@agentradar.app',
      phone: '+1 (555) 123-4567',
      timezone: 'PT (Pacific Time)'
    },
    {
      name: 'Michael Rodriguez',
      title: 'Solutions Architect',
      email: 'michael.rodriguez@agentradar.app',
      phone: '+1 (555) 234-5678',
      timezone: 'ET (Eastern Time)'
    }
  ];

  const demoFeatures = [
    {
      id: 'intelligent-alerts',
      title: 'Intelligent Property Alerts',
      description: 'AI-powered alerts for power of sale, estate sales, and development opportunities',
      icon: <TrendingUp className="w-5 h-5" />,
      metrics: ['234 Active Alerts', '89% Accuracy Rate', '< 15min Detection'],
      demoData: {
        recentAlerts: [
          { id: 1, type: 'Power of Sale', address: '123 Maple St, Toronto', value: '$750,000', probability: 94 },
          { id: 2, type: 'Estate Sale', address: '456 Oak Ave, Mississauga', value: '$920,000', probability: 87 },
          { id: 3, type: 'Development Opportunity', address: '789 Pine Rd, Vaughan', value: '$1,200,000', probability: 91 }
        ]
      }
    },
    {
      id: 'multi-platform',
      title: 'Multi-Platform Access',
      description: 'Web, mobile, and desktop applications with real-time synchronization',
      icon: <Smartphone className="w-5 h-5" />,
      metrics: ['3 Platforms', '99.9% Uptime', 'Real-time Sync'],
      demoData: {
        platforms: ['Web Dashboard', 'iOS App', 'Android App', 'Desktop Client']
      }
    },
    {
      id: 'enterprise-security',
      title: 'Enterprise Security & Compliance',
      description: 'GDPR, SOX compliant with advanced security features',
      icon: <Shield className="w-5 h-5" />,
      metrics: ['GDPR Compliant', 'SOX Audited', 'ISO 27001'],
      demoData: {
        securityFeatures: ['End-to-End Encryption', 'Multi-Factor Authentication', 'Audit Trails', 'Data Loss Prevention']
      }
    },
    {
      id: 'white-label',
      title: 'White-Label Platform',
      description: 'Fully customizable platform with your brokerage branding',
      icon: <Building2 className="w-5 h-5" />,
      metrics: ['Custom Branding', 'Domain Mapping', 'API Access'],
      demoData: {
        customizations: ['Logo & Colors', 'Custom Domain', 'Branded Emails', 'API Integration']
      }
    }
  ];

  const pricingTiers = [
    {
      name: 'Professional',
      price: '$199/month',
      agents: 'Up to 10 agents',
      features: [
        'Core alert system',
        'Web & mobile access',
        'Basic analytics',
        'Email support'
      ],
      recommended: false
    },
    {
      name: 'Team Enterprise',
      price: '$499/month',
      agents: 'Up to 50 agents',
      features: [
        'Advanced AI alerts',
        'Custom integrations',
        'Advanced analytics',
        'Priority support',
        'White-label options'
      ],
      recommended: true
    },
    {
      name: 'White Label',
      price: 'Custom pricing',
      agents: 'Unlimited agents',
      features: [
        'Full white-label platform',
        'Custom development',
        'Dedicated support',
        'SLA guarantees',
        'Custom onboarding'
      ],
      recommended: false
    }
  ];

  const startInteractiveDemo = (demoType: string) => {
    setActiveDemo(demoType);
    setDemoStarted(true);
    
    // Simulate demo progression
    setTimeout(() => {
      setDemoMetrics(prev => ({
        ...prev,
        totalProperties: prev.totalProperties + 150,
        activeAlerts: prev.activeAlerts + 5,
        monthlyGrowth: prev.monthlyGrowth + 2.1
      }));
    }, 2000);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/enterprise/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      
      if (response.ok) {
        alert('Demo request submitted successfully! Our sales team will contact you within 24 hours.');
        setContactForm({
          companyName: '',
          contactName: '',
          email: '',
          phone: '',
          brokerageSize: '',
          currentChallenges: '',
          demoDate: ''
        });
      }
    } catch (error) {
      console.error('Demo request failed:', error);
      alert('Failed to submit demo request. Please try again or contact us directly.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-400/20">
              Enterprise Demo Environment
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Experience AgentRadar
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Enterprise Platform
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Interactive demo showcasing real-time property intelligence, 
              enterprise-grade security, and white-label capabilities for brokerages.
            </p>
            
            {/* Live Demo Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-12 max-w-4xl mx-auto">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{demoMetrics.totalProperties.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">Properties</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{demoMetrics.activeAlerts}</div>
                  <div className="text-sm text-slate-400">Live Alerts</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{demoMetrics.savedSearches}</div>
                  <div className="text-sm text-slate-400">Saved Searches</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{demoMetrics.monthlyGrowth}%</div>
                  <div className="text-sm text-slate-400">Growth</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{demoMetrics.averageROI}%</div>
                  <div className="text-sm text-slate-400">Avg ROI</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{demoMetrics.responseTime}</div>
                  <div className="text-sm text-slate-400">Response</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => startInteractiveDemo('full-platform')}
              >
                <Play className="w-5 h-5 mr-2" />
                Start Interactive Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-slate-600 hover:bg-slate-800"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Live Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Demo Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
            <TabsTrigger value="features">Platform Features</TabsTrigger>
            <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
            <TabsTrigger value="pricing">Enterprise Pricing</TabsTrigger>
            <TabsTrigger value="contact">Get Started</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Platform Capabilities</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Explore the comprehensive features that power successful real estate professionals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {demoFeatures.map((feature) => (
                <Card key={feature.id} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        {feature.icon}
                      </div>
                      <div>
                        <CardTitle className="text-white">{feature.title}</CardTitle>
                        <p className="text-slate-400 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {feature.metrics.map((metric, index) => (
                        <Badge key={index} variant="secondary" className="bg-slate-700 text-slate-300">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={() => startInteractiveDemo(feature.id)}
                    >
                      Try This Feature
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Interactive Platform Demo</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Experience the platform with real data and interactive features
              </p>
            </div>

            {!demoStarted ? (
              <Card className="bg-slate-800/50 border-slate-700 max-w-2xl mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="text-white">Ready to Start?</CardTitle>
                  <p className="text-slate-400">
                    Choose your demo experience based on your primary interest
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full"
                    onClick={() => startInteractiveDemo('alerts')}
                  >
                    🎯 Property Alert System Demo
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => startInteractiveDemo('analytics')}
                  >
                    📊 Analytics & Reporting Demo
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => startInteractiveDemo('white-label')}
                  >
                    🏢 White-Label Platform Demo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <h3 className="text-lg font-semibold text-white">Demo Active</h3>
                    </div>
                    <p className="text-slate-300">
                      You are now experiencing a live simulation of the AgentRadar platform. 
                      All data and interactions are representative of real-world usage.
                    </p>
                  </CardContent>
                </Card>

                {activeDemo === 'alerts' && (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Live Property Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {demoFeatures[0].demoData.recentAlerts.map((alert) => (
                          <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                            <div>
                              <div className="text-white font-medium">{alert.address}</div>
                              <div className="text-slate-400 text-sm">{alert.type}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-400 font-semibold">{alert.value}</div>
                              <div className="text-blue-400 text-sm">{alert.probability}% match</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-center">
                  <Button onClick={() => setDemoStarted(false)}>
                    Reset Demo
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Enterprise Pricing</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Scalable pricing designed for brokerages of all sizes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingTiers.map((tier, index) => (
                <Card 
                  key={index} 
                  className={`${tier.recommended 
                    ? 'bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500/50' 
                    : 'bg-slate-800/50 border-slate-700'
                  } relative`}
                >
                  {tier.recommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-white text-xl">{tier.name}</CardTitle>
                    <div className="text-3xl font-bold text-blue-400 mb-2">{tier.price}</div>
                    <p className="text-slate-400">{tier.agents}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-slate-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${tier.recommended 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                        : ''
                      }`}
                      variant={tier.recommended ? 'default' : 'outline'}
                    >
                      {tier.price === 'Custom pricing' ? 'Contact Sales' : 'Start Free Trial'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Schedule Your Demo</CardTitle>
                  <p className="text-slate-400">
                    Get a personalized demo tailored to your brokerage needs
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="companyName" className="text-white">Brokerage Name</Label>
                      <Input
                        id="companyName"
                        value={contactForm.companyName}
                        onChange={(e) => setContactForm({...contactForm, companyName: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactName" className="text-white">Your Name</Label>
                      <Input
                        id="contactName"
                        value={contactForm.contactName}
                        onChange={(e) => setContactForm({...contactForm, contactName: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-white">Phone Number</Label>
                      <Input
                        id="phone"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="brokerageSize" className="text-white">Brokerage Size</Label>
                      <Input
                        id="brokerageSize"
                        placeholder="e.g., 1-10 agents, 50+ agents"
                        value={contactForm.brokerageSize}
                        onChange={(e) => setContactForm({...contactForm, brokerageSize: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="challenges" className="text-white">Current Challenges</Label>
                      <textarea
                        id="challenges"
                        placeholder="What challenges are you looking to solve?"
                        value={contactForm.currentChallenges}
                        onChange={(e) => setContactForm({...contactForm, currentChallenges: e.target.value})}
                        className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-md"
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                      Request Demo
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Sales Team */}
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Meet Our Sales Team</CardTitle>
                    <p className="text-slate-400">
                      Speak directly with our enterprise specialists
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {salesTeam.map((contact, index) => (
                      <div key={index} className="border-b border-slate-700 pb-4 last:border-b-0">
                        <h4 className="text-white font-semibold">{contact.name}</h4>
                        <p className="text-blue-400 text-sm">{contact.title}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${contact.email}`} className="hover:text-blue-400">
                              {contact.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${contact.phone}`} className="hover:text-blue-400">
                              {contact.phone}
                            </a>
                          </div>
                          <p className="text-slate-400 text-sm">{contact.timezone}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Star className="w-6 h-6 text-yellow-400" />
                      <h3 className="text-lg font-semibold text-white">Enterprise Support</h3>
                    </div>
                    <ul className="space-y-2 text-slate-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        24/7 Priority Support
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Dedicated Account Manager
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Custom Integration Support
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        SLA Guarantees
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}