"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Footer } from "@/components/footer"
import { 
  Code,
  Book,
  Zap,
  Shield,
  Globe,
  Key,
  CheckCircle,
  ArrowRight,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Download,
  Play,
  Terminal,
  FileText,
  Users,
  Clock,
  Star,
  AlertTriangle,
  Database,
  Settings,
  Layers,
  Webhook,
  RefreshCw,
  BarChart3,
  MessageSquare,
  Mail,
  Phone,
  Video,
  Github,
  ChevronRight,
  ChevronDown,
  Cpu,
  Gauge,
  Lock,
  Cloud,
  PlusCircle,
  MinusCircle
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ApiDocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState("properties")
  const [expandedSection, setExpandedSection] = useState("")

  const apiEndpoints = [
    {
      id: "properties",
      name: "Properties",
      method: "GET",
      endpoint: "/api/v1/properties",
      description: "Search and retrieve property data including power of sale, estate sales, and development opportunities."
    },
    {
      id: "alerts", 
      name: "Alerts",
      method: "POST",
      endpoint: "/api/v1/alerts",
      description: "Create, manage, and retrieve custom property alerts based on your criteria."
    },
    {
      id: "analysis",
      name: "Analysis",
      method: "GET", 
      endpoint: "/api/v1/analysis/{property_id}",
      description: "Get AI-powered investment analysis and scoring for specific properties."
    },
    {
      id: "webhooks",
      name: "Webhooks",
      method: "POST",
      endpoint: "/api/v1/webhooks",
      description: "Set up real-time notifications for new opportunities and alert triggers."
    }
  ]

  const quickStart = {
    steps: [
      {
        title: "Get Your API Key",
        description: "Generate your API key from the AgentRadar dashboard",
        code: "// Available in your dashboard under Settings > API Keys\nconst API_KEY = 'ar_live_1234567890abcdef';"
      },
      {
        title: "Make Your First Request",
        description: "Search for properties using our REST API",
        code: `fetch('https://api.agentradar.app/v1/properties', {
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));`
      },
      {
        title: "Handle the Response",
        description: "Process the returned property data in your application",
        code: `{
  "properties": [
    {
      "id": "prop_123",
      "address": "123 Main St, Toronto, ON",
      "type": "power_of_sale",
      "score": 8.7,
      "price_estimate": 850000,
      "opportunity_type": "below_market"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 247
  }
}`
      }
    ]
  }

  const sdks = [
    {
      language: "JavaScript",
      icon: "JS",
      description: "Node.js and browser-compatible SDK",
      install: "npm install agentradar-sdk",
      example: "const AgentRadar = require('agentradar-sdk');\nconst client = new AgentRadar(API_KEY);"
    },
    {
      language: "Python",
      icon: "PY", 
      description: "Python SDK with async support",
      install: "pip install agentradar",
      example: "import agentradar\nclient = agentradar.Client(api_key=API_KEY)"
    },
    {
      language: "PHP",
      icon: "PHP",
      description: "Laravel and standalone PHP support",
      install: "composer require agentradar/sdk",
      example: "use AgentRadar\\Client;\n$client = new Client($apiKey);"
    },
    {
      language: "cURL",
      icon: "⚡",
      description: "Direct HTTP requests for any language",
      install: "Built into most systems",
      example: "curl -H 'Authorization: Bearer $API_KEY' \\\n  https://api.agentradar.app/v1/properties"
    }
  ]

  const features = [
    {
      icon: Zap,
      title: "Real-Time Data",
      description: "Access live property data updated every 15 minutes from court filings, estate proceedings, and municipal applications."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with OAuth 2.0, rate limiting, and comprehensive audit logging for all API requests."
    },
    {
      icon: Gauge,
      title: "High Performance", 
      description: "Sub-100ms response times with global CDN, intelligent caching, and horizontal scaling architecture."
    },
    {
      icon: Database,
      title: "Rich Data Model",
      description: "Comprehensive property data including investment scores, market analysis, ownership history, and predictive analytics."
    }
  ]

  const pricingTiers = [
    {
      name: "Developer",
      price: "Free",
      description: "Perfect for testing and small applications",
      limits: ["1,000 requests/month", "Basic property data", "Community support"],
      cta: "Get Started Free"
    },
    {
      name: "Professional", 
      price: "$199/mo",
      description: "For production applications and integrations",
      limits: ["25,000 requests/month", "Full property data", "Investment analysis", "Email support"],
      cta: "Start Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Unlimited scale with dedicated support",  
      limits: ["Unlimited requests", "Custom endpoints", "White-label options", "Dedicated support"],
      cta: "Contact Sales"
    }
  ]

  const codeExample = {
    properties: {
      request: `GET /api/v1/properties?location=toronto&type=power_of_sale&min_score=8.0
Authorization: Bearer ar_live_1234567890abcdef
Content-Type: application/json`,
      response: `{
  "data": [
    {
      "id": "prop_abc123",
      "address": "123 Maple Street, Toronto, ON M5V 2A8",
      "type": "power_of_sale",
      "status": "active",
      "price_estimate": 850000,
      "investment_score": 8.7,
      "opportunity_type": "below_market",
      "court_filing_date": "2025-01-15",
      "estimated_market_value": 1050000,
      "potential_profit": 175000,
      "roi_estimate": 0.206,
      "location": {
        "lat": 43.6532,
        "lng": -79.3832,
        "neighborhood": "Downtown Toronto",
        "postal_code": "M5V 2A8"
      },
      "property_details": {
        "bedrooms": 3,
        "bathrooms": 2,
        "square_feet": 1200,
        "year_built": 1985,
        "property_type": "condo"
      },
      "market_analysis": {
        "comparable_sales": 12,
        "average_sale_price": 975000,
        "days_on_market_avg": 23,
        "price_per_sqft": 812
      },
      "timeline": {
        "court_date": "2025-02-20",
        "expected_sale_date": "2025-03-15",
        "days_until_sale": 45
      },
      "alerts_triggered": ["high_score", "below_market", "fast_timeline"],
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T14:22:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 25,
    "total": 247,
    "total_pages": 10,
    "has_more": true
  },
  "filters_applied": {
    "location": "toronto",
    "type": "power_of_sale", 
    "min_score": 8.0
  },
  "request_id": "req_xyz789",
  "processing_time_ms": 87
}`
    },
    alerts: {
      request: `POST /api/v1/alerts
Authorization: Bearer ar_live_1234567890abcdef
Content-Type: application/json

{
  "name": "High Value Toronto Opportunities",
  "criteria": {
    "location": {
      "city": "toronto",
      "radius_km": 25
    },
    "property_types": ["power_of_sale", "estate_sale"],
    "min_investment_score": 8.0,
    "max_price": 1200000,
    "min_profit_potential": 100000
  },
  "notifications": {
    "email": "agent@example.com",
    "webhook_url": "https://your-app.com/webhooks/agentradar",
    "frequency": "immediate"
  },
  "active": true
}`,
      response: `{
  "data": {
    "id": "alert_def456",
    "name": "High Value Toronto Opportunities",
    "status": "active",
    "created_at": "2025-01-15T15:30:00Z",
    "criteria": {
      "location": {
        "city": "toronto",
        "radius_km": 25
      },
      "property_types": ["power_of_sale", "estate_sale"],
      "min_investment_score": 8.0,
      "max_price": 1200000,
      "min_profit_potential": 100000
    },
    "notifications": {
      "email": "agent@example.com",
      "webhook_url": "https://your-app.com/webhooks/agentradar",
      "frequency": "immediate"
    },
    "statistics": {
      "properties_matched_today": 3,
      "total_matches": 47,
      "success_rate": 0.23
    },
    "next_check": "2025-01-15T16:00:00Z"
  },
  "message": "Alert created successfully",
  "request_id": "req_abc123"
}`
    }
  }

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
              <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
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
            Developer API
          </Badge>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Build with 
            <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent"> AgentRadar API</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Integrate real estate intelligence directly into your applications. Access property opportunities, 
            market analysis, and AI-powered insights through our comprehensive REST API.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-orange-600">
              <Key className="mr-2 w-5 h-5" />
              Get API Key
            </Button>
            <Button size="lg" variant="outline">
              <Play className="mr-2 w-5 h-5" />
              Try Interactive Demo
            </Button>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Free developer tier</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Comprehensive SDKs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>99.9% uptime SLA</span>
            </div>
          </div>
        </div>
      </section>

      {/* API Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Developers Choose Our API</h2>
            <p className="text-xl text-gray-600">Built for scale, designed for developers</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg text-center">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Start Guide</h2>
            <p className="text-xl text-gray-600">Get up and running in under 5 minutes</p>
          </div>

          <div className="space-y-12">
            {quickStart.steps.map((step, index) => (
              <div key={index} className="grid lg:grid-cols-2 gap-12 items-center">
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>
                
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <Card className="bg-gray-900 text-green-400 font-mono">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4" />
                          <span className="text-sm">Code Example</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                        <code>{step.code}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">API Reference</h2>
            <p className="text-xl text-gray-600">Comprehensive documentation for all endpoints</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Book className="w-5 h-5" />
                    Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {apiEndpoints.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      onClick={() => setActiveEndpoint(endpoint.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeEndpoint === endpoint.id
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-xs ${
                          endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                          endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {endpoint.method}
                        </Badge>
                        <span className="font-semibold text-sm">{endpoint.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{endpoint.endpoint}</div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="mb-8">
                <CardContent className="p-8">
                  {(() => {
                    const current = apiEndpoints.find(e => e.id === activeEndpoint)!
                    const examples = codeExample[activeEndpoint as keyof typeof codeExample] || codeExample.properties
                    
                    return (
                      <>
                        <div className="flex items-center gap-4 mb-6">
                          <Badge className={`${
                            current.method === 'GET' ? 'bg-green-100 text-green-800' :
                            current.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {current.method}
                          </Badge>
                          <code className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                            {current.endpoint}
                          </code>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{current.name}</h3>
                        <p className="text-gray-600 mb-8">{current.description}</p>

                        {/* Request Example */}
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Request</h4>
                          <Card className="bg-gray-900 text-green-400 font-mono">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-gray-400">Request Example</span>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                                <code>{examples.request}</code>
                              </pre>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Response Example */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Response</h4>
                          <Card className="bg-gray-900 text-green-400 font-mono">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-gray-400">Response Example</span>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                                <code>{examples.response}</code>
                              </pre>
                            </CardContent>
                          </Card>
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Official SDKs</h2>
            <p className="text-xl text-gray-600">
              Use our official libraries to integrate faster with type safety and built-in error handling
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sdks.map((sdk, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-4">
                    {sdk.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{sdk.language}</h3>
                  <p className="text-gray-600 text-sm mb-4">{sdk.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">Install</div>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block">{sdk.install}</code>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">Usage</div>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block whitespace-pre-wrap">{sdk.example}</code>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="w-3 h-3 mr-2" />
                      Install
                    </Button>
                    <Button size="sm" variant="outline">
                      <Github className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">API Pricing</h2>
            <p className="text-xl text-gray-600">Transparent pricing that scales with your needs</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`border-0 shadow-xl ${tier.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {tier.popular && (
                  <div className="bg-gradient-to-r from-blue-600 to-orange-600 text-white text-center py-2 rounded-t-lg">
                    <Badge className="bg-white/20 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{tier.price}</div>
                    <p className="text-gray-600 mb-6">{tier.description}</p>
                    <Button 
                      className={`w-full ${tier.popular ? 'bg-gradient-to-r from-blue-600 to-orange-600' : ''}`}
                      variant={tier.popular ? 'default' : 'outline'}
                    >
                      {tier.cta}
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {tier.limits.map((limit, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{limit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Developer Support</h2>
            <p className="text-xl text-gray-600">Get help when you need it from our technical team</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Community Forum</h3>
                <p className="text-gray-600 mb-6">Connect with other developers, share code, and get help from the community.</p>
                <Button variant="outline">Join Community</Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Email Support</h3>
                <p className="text-gray-600 mb-6">Technical support via email with guaranteed response times based on your plan.</p>
                <Button variant="outline">Contact Support</Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Priority Support</h3>
                <p className="text-gray-600 mb-6">Direct phone and chat support for Enterprise customers with dedicated engineers.</p>
                <Button variant="outline">Enterprise Sales</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Building?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get your API key today and start integrating real estate intelligence into your applications. 
            Free tier includes 1,000 requests per month with no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              <Key className="mr-2 w-5 h-5" />
              Get Free API Key
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <FileText className="mr-2 w-5 h-5" />
              View Full Documentation
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Free tier available</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Start in minutes</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}