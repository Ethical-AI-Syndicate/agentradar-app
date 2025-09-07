"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Footer } from "@/components/footer"
import { 
  Target,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Award,
  Building,
  Home,
  BarChart3,
  MapPin,
  Calendar,
  Quote,
  Play,
  Download,
  ExternalLink,
  User,
  Briefcase,
  Zap,
  Eye,
  ThumbsUp,
  Share,
  Mail,
  Phone,
  MessageCircle,
  Video,
  FileText,
  PieChart,
  LineChart,
  X,
  Send
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function CaseStudiesPage() {
  const [activeFilter, setActiveFilter] = useState("all")
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)

  const filters = [
    { id: "all", name: "All Studies", count: 12 },
    { id: "individual", name: "Individual Agents", count: 7 },
    { id: "teams", name: "Teams", count: 3 },
    { id: "brokerages", name: "Brokerages", count: 2 }
  ]

  const featuredCase = {
    id: 1,
    title: "340% Increase in Deal Flow: How Maria Santos Dominated Toronto's Hidden Market",
    subtitle: "From 3 deals/month to 13 deals/month using AgentRadar's early detection system",
    client: "Maria Santos",
    role: "Independent Real Estate Agent",
    location: "Toronto, ON",
    timeframe: "6 months",
    image: "/api/placeholder/400/300",
    results: [
      { metric: "Deal Flow Increase", value: "340%", description: "From 3 to 13 deals per month" },
      { metric: "Revenue Growth", value: "$2.1M", description: "Additional commission revenue" },
      { metric: "Properties Found Early", value: "47", description: "Before hitting MLS" },
      { metric: "Average Days Ahead", value: "89", description: "Earlier than competition" }
    ],
    challenge: "Maria was struggling in Toronto's competitive market, often losing out on properties to agents with better connections or inside information.",
    solution: "Implemented AgentRadar's court filing monitoring and estate sale tracking to find opportunities 2-3 months before MLS listings.",
    outcome: "Became the #1 agent in her brokerage within 6 months, with a pipeline of exclusive opportunities her competitors never saw.",
    testimonial: "AgentRadar gave me superpowers. I went from chasing listings to having sellers call me. My income tripled in 6 months.",
    industry: "Residential Real Estate",
    type: "Individual Agent"
  }

  const caseStudies = [
    {
      id: 2,
      title: "Team Collaboration Success: How RedStone Realty Scaled with AgentRadar",
      client: "RedStone Realty Team",
      location: "Mississauga, ON",
      type: "Team",
      timeframe: "8 months",
      results: [
        { metric: "Team Revenue", value: "+156%", color: "green" },
        { metric: "Properties Tracked", value: "284", color: "blue" },
        { metric: "Conversion Rate", value: "23%", color: "orange" }
      ],
      challenge: "15-person team struggling with lead distribution and opportunity tracking across different specializations.",
      outcome: "Centralized opportunity management increased team revenue by 156% with automated lead routing by expertise.",
      industry: "Residential Real Estate",
      featured: false
    },
    {
      id: 3,
      title: "Investment Portfolio Growth: $12M in Hidden Opportunities",
      client: "David Chen",
      location: "Brampton, ON", 
      type: "Individual Agent",
      timeframe: "12 months",
      results: [
        { metric: "Portfolio Value", value: "$12M", color: "green" },
        { metric: "Properties Acquired", value: "34", color: "blue" },
        { metric: "Average ROI", value: "28%", color: "orange" }
      ],
      challenge: "Real estate investor needed consistent deal flow of below-market properties for his growing portfolio.",
      outcome: "Acquired 34 properties totaling $12M in value through power of sale and estate opportunities.",
      industry: "Investment Real Estate",
      featured: true
    },
    {
      id: 4,
      title: "Brokerage Transformation: White-Label Platform Implementation",
      client: "Century 21 North Star",
      location: "Vaughan, ON",
      type: "Brokerage",
      timeframe: "10 months",
      results: [
        { metric: "Agent Productivity", value: "+89%", color: "green" },
        { metric: "Brokerage Revenue", value: "+234%", color: "blue" },
        { metric: "Agent Retention", value: "94%", color: "orange" }
      ],
      challenge: "147-agent brokerage losing top performers to competitors with better technology and lead generation.",
      outcome: "White-label AgentRadar platform became their competitive advantage, retaining 94% of agents.",
      industry: "Brokerage Operations",
      featured: false
    },
    {
      id: 5,
      title: "New Agent Success: From Zero to Hero in 90 Days",
      client: "Jennifer Park",
      location: "Oakville, ON",
      type: "Individual Agent", 
      timeframe: "3 months",
      results: [
        { metric: "First Deals", value: "8", color: "green" },
        { metric: "Commission Earned", value: "$124K", color: "blue" },
        { metric: "Client Satisfaction", value: "98%", color: "orange" }
      ],
      challenge: "New agent with no sphere of influence struggling to find her first clients in competitive Oakville market.",
      outcome: "Closed 8 deals in her first 90 days using estate sale and power of sale opportunities.",
      industry: "Residential Real Estate",
      featured: true
    },
    {
      id: 6,
      title: "Commercial Success: $45M in Development Opportunities",
      client: "Thompson Commercial Group",
      location: "Toronto, ON",
      type: "Team",
      timeframe: "14 months",
      results: [
        { metric: "Deal Volume", value: "$45M", color: "green" },
        { metric: "Development Projects", value: "12", color: "blue" },
        { metric: "Success Rate", value: "78%", color: "orange" }
      ],
      challenge: "Commercial team needed early intelligence on development applications and zoning changes.",
      outcome: "Identified $45M worth of development opportunities through municipal application monitoring.",
      industry: "Commercial Real Estate", 
      featured: false
    }
  ]

  const metrics = [
    {
      value: "2,847",
      label: "Agents Using AgentRadar",
      sublabel: "Across Canada"
    },
    {
      value: "$1.2B", 
      label: "Total Transaction Volume",
      sublabel: "From discovered opportunities"
    },
    {
      value: "89%",
      label: "Success Rate",
      sublabel: "Agents exceeding goals"
    },
    {
      value: "23%",
      label: "Average Commission Increase",
      sublabel: "Within first 6 months"
    }
  ]

  const filteredCases = activeFilter === "all" 
    ? caseStudies 
    : caseStudies.filter(study => {
        if (activeFilter === "individual") return study.type === "Individual Agent"
        if (activeFilter === "teams") return study.type === "Team"
        if (activeFilter === "brokerages") return study.type === "Brokerage"
        return true
      })

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
              <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
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
            Success Stories
          </Badge>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Real Results from 
            <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent"> Real Agents</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Discover how real estate professionals across Canada are using AgentRadar 
            to find hidden opportunities, increase deal flow, and transform their businesses.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-orange-600">
            Start Your Success Story
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Impact</h2>
            <p className="text-gray-600">Real metrics from our user community</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((metric, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="text-4xl font-bold text-gradient bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent mb-2">
                    {metric.value}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">{metric.label}</div>
                  <div className="text-sm text-gray-500">{metric.sublabel}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Case Study */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-orange-100 text-orange-800 border-orange-200">
              Featured Success Story
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{featuredCase.title}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{featuredCase.subtitle}</p>
          </div>

          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="lg:flex">
              <div className="lg:w-1/3">
                <div className="h-64 lg:h-full bg-gradient-to-br from-blue-600 to-orange-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <User className="w-16 h-16 mx-auto mb-4" />
                    <div className="text-xl font-bold">{featuredCase.client}</div>
                    <div className="text-blue-200">{featuredCase.role}</div>
                    <div className="text-blue-200 text-sm">{featuredCase.location}</div>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-2/3 p-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {featuredCase.results.map((result, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-1">{result.value}</div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">{result.metric}</div>
                      <div className="text-xs text-gray-500">{result.description}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">The Challenge</h4>
                    <p className="text-gray-600">{featuredCase.challenge}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">The Solution</h4>
                    <p className="text-gray-600">{featuredCase.solution}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">The Outcome</h4>
                    <p className="text-gray-600">{featuredCase.outcome}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mt-8">
                  <div className="flex items-start gap-4">
                    <Quote className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-gray-700 italic mb-4 text-lg">&quot;{featuredCase.testimonial}&quot;</p>
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-semibold text-gray-900">{featuredCase.client}</div>
                          <div className="text-sm text-gray-600">{featuredCase.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button className="bg-gradient-to-r from-blue-600 to-orange-600">
                    <Video className="w-4 h-4 mr-2" />
                    Watch Video Case Study
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Filter and Case Studies Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">More Success Stories</h2>
            <p className="text-xl text-gray-600">See how different types of real estate professionals are winning</p>
          </div>

          {/* Filters */}
          <div className="flex justify-center gap-4 mb-12">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "default" : "outline"}
                onClick={() => setActiveFilter(filter.id)}
                className={activeFilter === filter.id 
                  ? "bg-gradient-to-r from-blue-600 to-orange-600" 
                  : ""
                }
              >
                {filter.name}
                <Badge className="ml-2 bg-white/20 text-current border-current">
                  {filter.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Case Studies Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {filteredCases.map((study) => (
              <Card key={study.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-blue-100 text-blue-800">
                      {study.industry}
                    </Badge>
                    {study.featured && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl mb-2">{study.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {study.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {study.timeframe}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {study.type}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Results */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {study.results.map((result, index) => (
                      <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className={`text-xl font-bold mb-1 ${
                          result.color === 'green' ? 'text-green-600' :
                          result.color === 'blue' ? 'text-blue-600' :
                          'text-orange-600'
                        }`}>
                          {result.value}
                        </div>
                        <div className="text-xs text-gray-600">{result.metric}</div>
                      </div>
                    ))}
                  </div>

                  {/* Challenge and Outcome */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-1 text-sm">Challenge</h5>
                      <p className="text-gray-600 text-sm">{study.challenge}</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-1 text-sm">Outcome</h5>
                      <p className="text-gray-600 text-sm">{study.outcome}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Eye className="w-3 h-3 mr-2" />
                      Read Full Story
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Breakdown */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Across All Market Segments</h2>
            <p className="text-xl text-gray-600">
              AgentRadar delivers results for every type of real estate professional
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Home,
                title: "Residential Agents",
                stats: "1,847 agents",
                improvement: "+127% average deal flow",
                description: "Individual agents finding more listings and closing more deals"
              },
              {
                icon: Building,
                title: "Commercial Teams", 
                stats: "89 teams",
                improvement: "$2.1B deal volume",
                description: "Commercial specialists tracking development and investment opportunities"
              },
              {
                icon: Users,
                title: "Real Estate Teams",
                stats: "156 teams", 
                improvement: "+89% team productivity",
                description: "Multi-agent teams scaling with centralized opportunity management"
              },
              {
                icon: Briefcase,
                title: "Brokerages",
                stats: "23 brokerages",
                improvement: "+234% brokerage revenue",
                description: "Full brokerage implementations with white-label solutions"
              }
            ].map((segment, index) => (
              <Card key={index} className="border-0 shadow-lg text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <segment.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{segment.title}</h3>
                  <div className="text-sm text-gray-600 mb-2">{segment.stats}</div>
                  <div className="text-lg font-semibold text-green-600 mb-4">{segment.improvement}</div>
                  <p className="text-sm text-gray-600">{segment.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Submit Your Story */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-8">
                <Award className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Share Your Success Story
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Are you achieving great results with AgentRadar? We&apos;d love to feature your success 
                and help other agents learn from your experience.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">Case Study</div>
                  <div className="text-sm text-gray-600">Detailed written analysis</div>
                </div>
                <div className="text-center">
                  <Video className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">Video Interview</div>
                  <div className="text-sm text-gray-600">Professional video production</div>
                </div>
                <div className="text-center">
                  <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">Recognition</div>
                  <div className="text-sm text-gray-600">Industry spotlight & awards</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-orange-600"
                  onClick={() => setShowSubmissionForm(true)}
                >
                  <Mail className="mr-2 w-5 h-5" />
                  Submit Your Story
                </Button>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    <MessageCircle className="mr-2 w-5 h-5" />
                    Schedule Interview
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Write Your Own Success Story?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of agents who are already using AgentRadar to find hidden opportunities 
            and transform their real estate business. Your success story could be next.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Start 14-Day Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                See Platform Demo
                <Play className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>14-day money back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Setup support included</span>
            </div>
          </div>
        </div>
      </section>

      {/* Story Submission Modal */}
      {showSubmissionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Submit Your Success Story</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSubmissionForm(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault()
                // Handle form submission here
                alert('Thank you for your submission! We\'ll review your story and get back to you within 2-3 business days.')
                setShowSubmissionForm(false)
              }}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Your Name *</Label>
                    <Input id="name" required className="mt-1" placeholder="John Doe" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" required className="mt-1" placeholder="john@example.com" />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company/Brokerage</Label>
                    <Input id="company" className="mt-1" placeholder="RE/MAX Elite" />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" className="mt-1" placeholder="Toronto, ON" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="title">Success Story Title *</Label>
                  <Input id="title" required className="mt-1" placeholder="How I Found 10 Off-Market Properties in 3 Months" />
                </div>
                
                <div>
                  <Label htmlFor="story">Your Story *</Label>
                  <textarea
                    id="story"
                    required
                    rows={6}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Tell us about your success with AgentRadar. Include specific results, challenges overcome, and how the platform helped you achieve your goals..."
                  />
                </div>
                
                <div>
                  <Label>Key Results (check all that apply)</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      'Increased deal flow',
                      'Found off-market properties',
                      'Beat competition to listings',
                      'Improved client relationships',
                      'Generated more revenue',
                      'Saved time on research'
                    ].map((result) => (
                      <label key={result} className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-indigo-600" />
                        <span className="ml-2 text-sm text-gray-700">{result}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Interested in video interview?</Label>
                  <div className="mt-2 space-x-4">
                    <label className="flex items-center">
                      <input type="radio" name="video" value="yes" className="text-indigo-600" />
                      <span className="ml-2 text-sm text-gray-700">Yes, I&apos;m interested</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="video" value="no" className="text-indigo-600" />
                      <span className="ml-2 text-sm text-gray-700">No, written case study only</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSubmissionForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-orange-600"
                  >
                    <Send className="mr-2 w-4 h-4" />
                    Submit Story
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}