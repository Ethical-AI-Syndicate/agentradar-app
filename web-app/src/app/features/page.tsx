"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/footer"
import { 
  Search,
  Bell,
  TrendingUp,
  MapPin,
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  ArrowRight,
  Eye,
  Target,
  Zap,
  BarChart3,
  Filter,
  Star,
  Smartphone,
  Monitor,
  Globe,
  Shield,
  FileText,
  Settings,
  CreditCard,
  Award,
  Calendar,
  Mail,
  AlertTriangle,
  Database,
  PieChart,
  LineChart,
  Map,
  Briefcase,
  Building,
  Home,
  Gavel,
  UserCheck,
  Code,
  Layers,
  Plug,
  Download,
  RefreshCw,
  Lock,
  Headphones,
  BookOpen,
  Video
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState("discovery")

  const featureCategories = [
    {
      id: "discovery",
      name: "Property Discovery",
      icon: Search,
      description: "Find hidden opportunities before your competition"
    },
    {
      id: "intelligence", 
      name: "Market Intelligence",
      icon: TrendingUp,
      description: "AI-powered insights and investment scoring"
    },
    {
      id: "alerts",
      name: "Smart Alerts",
      icon: Bell,
      description: "Real-time notifications for priority opportunities"
    },
    {
      id: "analytics",
      name: "Analytics & Reports",
      icon: BarChart3,
      description: "Comprehensive data analysis and reporting"
    },
    {
      id: "platform",
      name: "Platform & Integration",
      icon: Layers,
      description: "Multi-platform access and API integrations"
    },
    {
      id: "enterprise",
      name: "Enterprise & Team",
      icon: Building,
      description: "White-label solutions and team management"
    }
  ]

  const allFeatures = {
    discovery: [
      {
        icon: Gavel,
        title: "Power of Sale Properties",
        description: "Access court filings and legal notices 6-12 months before properties hit MLS, giving you first-mover advantage on distressed sales.",
        benefits: ["Early access to distressed properties", "Court filing integration", "Legal status tracking", "Automated updates"],
        tier: "All Plans"
      },
      {
        icon: UserCheck,
        title: "Estate Sale Discovery",
        description: "Find probate and estate properties through integrated databases and public records, often at below-market valuations.",
        benefits: ["Probate court integration", "Estate administrator contacts", "Timeline tracking", "Family situation insights"],
        tier: "Pro+"
      },
      {
        icon: Building,
        title: "Development Applications",
        description: "Monitor municipal development applications to identify future high-value areas and investment opportunities.",
        benefits: ["Zoning change alerts", "Development timeline tracking", "Infrastructure investment mapping", "Growth area identification"],
        tier: "Enterprise"
      },
      {
        icon: Map,
        title: "Geographic Search",
        description: "Advanced mapping with customizable search radii, neighborhood analysis, and location-based opportunity scoring.",
        benefits: ["Interactive map interface", "Custom search boundaries", "Neighborhood scoring", "Demographic overlays"],
        tier: "All Plans"
      },
      {
        icon: Filter,
        title: "Advanced Filtering",
        description: "Granular search filters including property type, value range, investment score, timeline, and custom criteria.",
        benefits: ["25+ filter criteria", "Saved search templates", "Boolean logic operators", "Custom field creation"],
        tier: "Pro+"
      },
      {
        icon: Database,
        title: "Comprehensive Database",
        description: "Access to 2M+ properties across Ontario with historical data, ownership records, and transaction history.",
        benefits: ["Complete property histories", "Ownership tracking", "Transaction records", "Market comparables"],
        tier: "All Plans"
      }
    ],
    intelligence: [
      {
        icon: Star,
        title: "AI Investment Scoring",
        description: "Proprietary algorithms analyze 50+ data points to score investment potential from 1-10, highlighting the best opportunities.",
        benefits: ["50+ factor analysis", "Machine learning optimization", "Historical performance validation", "Custom scoring models"],
        tier: "Pro+"
      },
      {
        icon: PieChart,
        title: "Market Analysis",
        description: "Real-time market trends, price predictions, and comparative analysis to inform your investment decisions.",
        benefits: ["Price trend analysis", "Market velocity tracking", "Comparative market analysis", "Future value predictions"],
        tier: "All Plans"
      },
      {
        icon: DollarSign,
        title: "ROI Calculations",
        description: "Automated return on investment calculations including rehab costs, holding periods, and profit projections.",
        benefits: ["Automated ROI modeling", "Rehab cost estimation", "Holding cost analysis", "Profit scenario planning"],
        tier: "Pro+"
      },
      {
        icon: LineChart,
        title: "Predictive Analytics",
        description: "Advanced forecasting models predict market movements, optimal timing, and emerging opportunity areas.",
        benefits: ["Market forecasting", "Timing optimization", "Risk assessment", "Opportunity scoring"],
        tier: "Enterprise"
      },
      {
        icon: Target,
        title: "Opportunity Ranking",
        description: "Intelligent ranking system prioritizes opportunities based on your criteria, investment goals, and market conditions.",
        benefits: ["Personalized ranking", "Goal-based scoring", "Market timing integration", "Risk-adjusted returns"],
        tier: "Pro+"
      },
      {
        icon: BarChart3,
        title: "Portfolio Tracking",
        description: "Track your discovered opportunities, monitor their status, and analyze your success rate and ROI over time.",
        benefits: ["Performance analytics", "Success rate tracking", "Portfolio overview", "Historical analysis"],
        tier: "All Plans"
      }
    ],
    alerts: [
      {
        icon: Zap,
        title: "Real-Time Notifications",
        description: "Instant alerts via email, SMS, and push notifications when new opportunities match your criteria.",
        benefits: ["Multi-channel delivery", "Instant notifications", "Priority handling", "Delivery confirmation"],
        tier: "All Plans"
      },
      {
        icon: Settings,
        title: "Custom Alert Criteria",
        description: "Create sophisticated alert rules with multiple conditions, scoring thresholds, and geographic parameters.",
        benefits: ["Complex logic rules", "Multiple condition sets", "Scoring thresholds", "Geographic boundaries"],
        tier: "Pro+"
      },
      {
        icon: Clock,
        title: "Alert Scheduling",
        description: "Control when you receive alerts with customizable schedules, quiet hours, and frequency limits.",
        benefits: ["Custom schedules", "Quiet hours", "Frequency controls", "Time zone awareness"],
        tier: "All Plans"
      },
      {
        icon: Award,
        title: "Priority Scoring",
        description: "Alerts are prioritized based on opportunity quality, urgency, and your personal preferences.",
        benefits: ["Quality-based priority", "Urgency weighting", "Personal preferences", "Smart filtering"],
        tier: "Pro+"
      },
      {
        icon: Users,
        title: "Team Alerts",
        description: "Distribute alerts to team members based on roles, territories, and specializations for collaborative prospecting.",
        benefits: ["Role-based distribution", "Territory management", "Specialization matching", "Team coordination"],
        tier: "Enterprise"
      },
      {
        icon: RefreshCw,
        title: "Alert Management",
        description: "Comprehensive alert history, performance analytics, and optimization recommendations to improve your results.",
        benefits: ["Alert performance tracking", "Optimization suggestions", "Historical analysis", "ROI measurement"],
        tier: "Pro+"
      }
    ],
    analytics: [
      {
        icon: FileText,
        title: "Custom Reports",
        description: "Generate detailed reports on market trends, opportunity analysis, and portfolio performance with white-label options.",
        benefits: ["Custom report builder", "Automated generation", "White-label branding", "Multiple formats"],
        tier: "Pro+"
      },
      {
        icon: Calendar,
        title: "Scheduled Reports",
        description: "Automated report delivery on your schedule with key metrics, new opportunities, and market updates.",
        benefits: ["Automated delivery", "Custom schedules", "Key metrics dashboard", "Trend analysis"],
        tier: "All Plans"
      },
      {
        icon: PieChart,
        title: "Performance Analytics",
        description: "Track your success rates, conversion metrics, and ROI across different opportunity types and strategies.",
        benefits: ["Success rate tracking", "Conversion analytics", "Strategy comparison", "ROI analysis"],
        tier: "Pro+"
      },
      {
        icon: TrendingUp,
        title: "Market Intelligence Reports",
        description: "Comprehensive market analysis including price trends, inventory levels, and emerging opportunity areas.",
        benefits: ["Market trend analysis", "Inventory tracking", "Emerging area identification", "Competitive intelligence"],
        tier: "Enterprise"
      },
      {
        icon: Download,
        title: "Data Export",
        description: "Export your data in multiple formats including CSV, PDF, and API feeds for integration with your existing tools.",
        benefits: ["Multiple export formats", "API data feeds", "Scheduled exports", "Custom field selection"],
        tier: "All Plans"
      },
      {
        icon: BarChart3,
        title: "Interactive Dashboards",
        description: "Real-time dashboards with customizable widgets, drag-and-drop interface, and collaborative sharing.",
        benefits: ["Customizable widgets", "Drag-and-drop interface", "Real-time updates", "Team sharing"],
        tier: "Pro+"
      }
    ],
    platform: [
      {
        icon: Monitor,
        title: "Web Platform",
        description: "Full-featured web application optimized for desktop workflows, advanced analysis, and power user features.",
        benefits: ["Desktop optimization", "Advanced features", "Multi-tab workflow", "Keyboard shortcuts"],
        tier: "All Plans"
      },
      {
        icon: Smartphone,
        title: "Mobile Apps",
        description: "Native iOS and Android apps with offline capability, push notifications, and location-based features.",
        benefits: ["Native mobile apps", "Offline functionality", "GPS integration", "Camera features"],
        tier: "All Plans"
      },
      {
        icon: Code,
        title: "API Access",
        description: "RESTful API with comprehensive documentation for integration with your existing CRM, marketing, and business tools.",
        benefits: ["RESTful API", "Comprehensive documentation", "SDKs available", "Rate limiting"],
        tier: "Pro+"
      },
      {
        icon: Plug,
        title: "CRM Integration",
        description: "Pre-built integrations with leading CRM systems including Salesforce, HubSpot, and real estate-specific platforms.",
        benefits: ["Pre-built connectors", "Real-time sync", "Custom field mapping", "Automated workflows"],
        tier: "Enterprise"
      },
      {
        icon: Globe,
        title: "Cloud Infrastructure",
        description: "Enterprise-grade cloud hosting with 99.9% uptime, global CDN, and automatic scaling for peak performance.",
        benefits: ["99.9% uptime SLA", "Global CDN", "Auto-scaling", "Load balancing"],
        tier: "All Plans"
      },
      {
        icon: Shield,
        title: "Enterprise Security",
        description: "Bank-level security with end-to-end encryption, SOC 2 compliance, and advanced threat protection.",
        benefits: ["End-to-end encryption", "SOC 2 compliance", "Threat protection", "Audit logging"],
        tier: "All Plans"
      }
    ],
    enterprise: [
      {
        icon: Building,
        title: "White-Label Platform",
        description: "Complete white-label solution with custom branding, domain, and user interface for brokerages and enterprises.",
        benefits: ["Custom branding", "Custom domain", "UI customization", "Brand consistency"],
        tier: "Enterprise"
      },
      {
        icon: Users,
        title: "Team Management",
        description: "Advanced user management with role-based permissions, territory assignments, and performance tracking.",
        benefits: ["Role-based access", "Territory management", "Performance tracking", "User analytics"],
        tier: "Enterprise"
      },
      {
        icon: CreditCard,
        title: "Multi-Tier Pricing",
        description: "Flexible pricing models including per-user, revenue sharing, and custom enterprise agreements.",
        benefits: ["Flexible pricing models", "Revenue sharing options", "Custom agreements", "Volume discounts"],
        tier: "Enterprise"
      },
      {
        icon: Headphones,
        title: "Dedicated Support",
        description: "Priority support with dedicated account management, custom training, and 24/7 technical assistance.",
        benefits: ["Dedicated account manager", "Priority support queue", "Custom training", "24/7 assistance"],
        tier: "Enterprise"
      },
      {
        icon: BookOpen,
        title: "Custom Training",
        description: "Personalized training programs including on-site workshops, webinars, and certification programs.",
        benefits: ["On-site training", "Custom workshops", "Certification programs", "Ongoing education"],
        tier: "Enterprise"
      },
      {
        icon: Lock,
        title: "Advanced Security",
        description: "Enhanced security features including SSO, LDAP integration, IP whitelisting, and custom compliance requirements.",
        benefits: ["Single sign-on", "LDAP integration", "IP restrictions", "Custom compliance"],
        tier: "Enterprise"
      }
    ]
  }

  const pricingTiers = [
    {
      name: "Starter",
      price: "$99",
      period: "month",
      description: "Perfect for individual agents getting started",
      features: ["Property discovery", "Basic alerts", "Mobile app access", "Email support"],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Professional",
      price: "$199",
      period: "month", 
      description: "Advanced features for serious investors",
      features: ["Everything in Starter", "AI scoring", "Advanced analytics", "API access", "Priority support"],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "White-label solutions for teams and brokerages",
      features: ["Everything in Pro", "White-label platform", "Team management", "Custom training", "Dedicated support"],
      cta: "Contact Sales",
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
              <span className="text-xl font-bold text-gray-900">AgentRadar</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link href="/demo" className="text-gray-600 hover:text-gray-900">Demo</Link>
              <Link href="/contact">
                <Button variant="outline">Contact Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
            Platform Features
          </Badge>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Everything You Need to 
            <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent"> Dominate Real Estate</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Comprehensive real estate intelligence platform with advanced discovery, AI-powered analysis, 
            and enterprise-grade tools to find opportunities your competition misses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-orange-600">
                See All Features in Action
                <Eye className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featureCategories.map((category) => (
              <Card 
                key={category.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  activeCategory === category.id 
                    ? 'ring-2 ring-blue-500 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-orange-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">{category.name}</h3>
                  <p className="text-xs text-gray-600">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Details */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {featureCategories.find(c => c.id === activeCategory)?.name} Features
            </h2>
            <p className="text-xl text-gray-600">
              {featureCategories.find(c => c.id === activeCategory)?.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allFeatures[activeCategory as keyof typeof allFeatures]?.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {feature.tier}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-600">
              Select the perfect plan for your real estate intelligence needs
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`border-0 shadow-xl relative ${tier.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-orange-600 text-white px-6 py-2">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                    <p className="text-gray-600 mb-6">{tier.description}</p>
                    <div className="mb-6">
                      {tier.price === "Custom" ? (
                        <div className="text-3xl font-bold text-gray-900">Custom Pricing</div>
                      ) : (
                        <>
                          <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                          <span className="text-gray-600">/{tier.period}</span>
                        </>
                      )}
                    </div>
                    <Button 
                      className={`w-full ${tier.popular ? 'bg-gradient-to-r from-blue-600 to-orange-600' : ''}`}
                      variant={tier.popular ? 'default' : 'outline'}
                    >
                      {tier.cta}
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">All plans include 14-day free trial • No credit card required • Cancel anytime</p>
            <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
              Need a custom solution? Contact our sales team →
            </Link>
          </div>
        </div>
      </section>

      {/* Integration Showcase */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Integrates With Your Existing Tools</h2>
            <p className="text-xl text-gray-600">
              Seamlessly connect AgentRadar with your CRM, marketing tools, and business systems
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              { name: "Salesforce", type: "CRM", logo: "SF" },
              { name: "HubSpot", type: "Marketing", logo: "HS" },
              { name: "Mailchimp", type: "Email", logo: "MC" },
              { name: "Slack", type: "Communication", logo: "SL" },
              { name: "Zapier", type: "Automation", logo: "ZP" },
              { name: "Google Sheets", type: "Spreadsheets", logo: "GS" },
              { name: "Microsoft Teams", type: "Collaboration", logo: "MT" },
              { name: "Custom API", type: "Development", logo: "API" }
            ].map((integration, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-sm">{integration.logo}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{integration.name}</h3>
                  <p className="text-sm text-gray-600">{integration.type}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline">
              <Code className="mr-2 w-5 h-5" />
              View API Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">
              Common questions about AgentRadar's features and capabilities
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                question: "How early do you detect property opportunities?",
                answer: "Our AI monitors court filings, estate proceedings, and municipal applications to identify opportunities 6-12 months before they typically appear on MLS. This gives our users a significant first-mover advantage in competitive markets."
              },
              {
                question: "What makes your AI investment scoring unique?",
                answer: "Our proprietary algorithms analyze 50+ data points including market trends, property history, neighborhood dynamics, and economic indicators. The system continuously learns from market outcomes to improve accuracy and provide scores from 1-10 with 94% prediction accuracy."
              },
              {
                question: "Can I integrate AgentRadar with my existing CRM?",
                answer: "Yes, we offer pre-built integrations with major CRM platforms including Salesforce, HubSpot, and real estate-specific systems. Our RESTful API also allows custom integrations with any system that supports modern web standards."
              },
              {
                question: "Is my data secure and compliant?",
                answer: "Absolutely. We maintain bank-level security with end-to-end encryption, SOC 2 compliance, and adhere to all privacy regulations including GDPR and PIPEDA. All data is stored in Canadian data centers with full audit trails."
              },
              {
                question: "Do you offer training and support?",
                answer: "Yes, all plans include comprehensive training materials, video tutorials, and email support. Professional and Enterprise plans include priority support, and Enterprise customers receive dedicated account management and custom training programs."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/help">
                <Button variant="outline">
                  <BookOpen className="mr-2 w-4 h-4" />
                  Visit Help Center
                </Button>
              </Link>
              <Link href="/contact">
                <Button>
                  <Mail className="mr-2 w-4 h-4" />
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of agents already using AgentRadar to discover opportunities before their competition.
            Start your free trial today - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Start 14-Day Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Watch Demo
                <Video className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}