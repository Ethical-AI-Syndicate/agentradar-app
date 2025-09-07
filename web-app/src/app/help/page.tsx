"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Footer } from "@/components/footer"
import { 
  Search,
  BookOpen,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  ArrowRight,
  Users,
  Zap,
  Target,
  TrendingUp,
  Settings,
  CreditCard,
  Shield,
  Globe,
  FileText,
  Video,
  Download,
  ExternalLink,
  ChevronRight,
  Star,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const helpCategories = [
    {
      icon: Zap,
      title: "Getting Started",
      description: "New to AgentRadar? Learn the basics and get up and running quickly.",
      articleCount: 12,
      color: "blue"
    },
    {
      icon: Target,
      title: "Property Alerts & Search",
      description: "Master property discovery, alerts, and advanced search capabilities.",
      articleCount: 18,
      color: "green"
    },
    {
      icon: TrendingUp,
      title: "Market Analysis Tools", 
      description: "Understand investment scoring, market trends, and analytics features.",
      articleCount: 15,
      color: "orange"
    },
    {
      icon: Settings,
      title: "Account & Settings",
      description: "Manage your account, preferences, notifications, and team settings.",
      articleCount: 10,
      color: "purple"
    },
    {
      icon: CreditCard,
      title: "Billing & Subscriptions",
      description: "Payment methods, invoices, plan changes, and subscription management.",
      articleCount: 8,
      color: "emerald"
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Data protection, security settings, and privacy controls.",
      articleCount: 6,
      color: "red"
    },
    {
      icon: Globe,
      title: "API & Integrations",
      description: "Technical documentation for developers and third-party integrations.",
      articleCount: 20,
      color: "indigo"
    },
    {
      icon: Users,
      title: "White-Label Solutions",
      description: "Brokerage setup, branding customization, and enterprise features.",
      articleCount: 14,
      color: "pink"
    }
  ]

  const popularArticles = [
    {
      title: "How to Set Up Your First Property Alert",
      category: "Getting Started",
      readTime: "3 min",
      views: "2.4k"
    },
    {
      title: "Understanding Investment Opportunity Scores",
      category: "Market Analysis",
      readTime: "5 min",
      views: "1.8k"
    },
    {
      title: "Power of Sale vs Foreclosure Properties",
      category: "Property Types",
      readTime: "7 min",
      views: "1.6k"
    },
    {
      title: "Setting Up Team Access and Permissions",
      category: "Account Management",
      readTime: "4 min",
      views: "1.2k"
    },
    {
      title: "API Authentication and Rate Limits",
      category: "API Documentation",
      readTime: "6 min",
      views: "986"
    }
  ]

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      availability: "Mon-Fri 9AM-6PM EST",
      responseTime: "Usually responds in minutes",
      action: "Start Chat",
      isPrimary: true
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Detailed help with screenshots and examples",
      availability: "24/7 submission",
      responseTime: "Response within 2 hours",
      action: "Send Email"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our real estate experts",
      availability: "Mon-Fri 8AM-8PM EST",
      responseTime: "Callback within 15 minutes",
      action: "Request Call"
    },
    {
      icon: Video,
      title: "Screen Share Session",
      description: "One-on-one guided training and troubleshooting",
      availability: "By appointment",
      responseTime: "Same day scheduling",
      action: "Book Session"
    }
  ]

  const quickLinks = [
    { title: "Platform Status", href: "#", icon: Globe },
    { title: "Feature Requests", href: "#", icon: Star },
    { title: "Community Forum", href: "#", icon: Users },
    { title: "Training Videos", href: "#", icon: Video },
    { title: "API Documentation", href: "#", icon: FileText },
    { title: "Download Mobile App", href: "#", icon: Download }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 text-blue-800",
      green: "bg-green-50 border-green-200 text-green-800",
      orange: "bg-orange-50 border-orange-200 text-orange-800",
      purple: "bg-purple-50 border-purple-200 text-purple-800",
      emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
      red: "bg-red-50 border-red-200 text-red-800",
      indigo: "bg-indigo-50 border-indigo-200 text-indigo-800",
      pink: "bg-pink-50 border-pink-200 text-pink-800"
    }
    return colors[color as keyof typeof colors] || colors.blue
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
              <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link href="/contact">
                <Button variant="outline">Contact Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              Help Center
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              How can we help you?
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Find answers, get support, and master AgentRadar's real estate intelligence platform
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for help articles, features, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                />
              </div>
              <Button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-orange-600"
              >
                Search
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>24/7 knowledge base</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Expert support team</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Video tutorials included</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Topic</h2>
            <p className="text-xl text-gray-600">
              Explore our comprehensive help resources organized by feature area
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {helpCategories.map((category, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${getColorClasses(category.color)}`}>
                    <category.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{category.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{category.articleCount} articles</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            
            {/* Popular Articles */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Articles</h2>
              <div className="space-y-4">
                {popularArticles.map((article, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {article.category}
                            </span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {article.readTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {article.views} views
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <Button variant="outline">
                  View All Articles
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Links</h3>
              <div className="space-y-3">
                {quickLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <link.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span className="text-gray-700 group-hover:text-blue-600">{link.title}</span>
                    <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                  </a>
                ))}
              </div>

              {/* Status Widget */}
              <Card className="mt-8">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-900">System Status</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">All systems operational</p>
                  <Link href="/status" className="text-sm text-blue-600 hover:text-blue-700">
                    View status page →
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Need More Help?</h2>
            <p className="text-xl text-gray-600">
              Choose the support option that works best for you
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportOptions.map((option, index) => (
              <Card key={index} className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${option.isPrimary ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
                <CardContent className="p-6">
                  {option.isPrimary && (
                    <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
                      Recommended
                    </Badge>
                  )}
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                    <option.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{option.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{option.description}</p>
                  
                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      {option.availability}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Zap className="w-4 h-4" />
                      {option.responseTime}
                    </div>
                  </div>
                  
                  <Button className={`w-full ${option.isPrimary ? 'bg-gradient-to-r from-blue-600 to-orange-600' : ''}`} variant={option.isPrimary ? 'default' : 'outline'}>
                    {option.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Training Resources */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Master AgentRadar</h2>
            <p className="text-xl text-gray-600">
              Comprehensive training resources to maximize your real estate intelligence
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center mb-6">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Video Tutorials</h3>
                <p className="text-gray-600 mb-6">
                  Step-by-step video guides covering every feature, from basic setup to advanced techniques.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    25+ comprehensive video tutorials
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Beginner to advanced levels
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Updated monthly with new features
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Watch Tutorials
                  <Video className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Live Training Sessions</h3>
                <p className="text-gray-600 mb-6">
                  Join live group training sessions with our experts and get your questions answered in real-time.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Weekly group sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Interactive Q&A format
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Recorded for later viewing
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  View Schedule
                  <Clock className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center mb-6">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Best Practices Guide</h3>
                <p className="text-gray-600 mb-6">
                  Learn proven strategies and workflows from top-performing real estate professionals using AgentRadar.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Industry expert insights
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Case studies and examples
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Downloadable templates
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Download Guide
                  <Download className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="py-16 bg-red-50 border-t border-red-200">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h3 className="text-2xl font-bold text-red-900">Critical Issue or Outage?</h3>
          </div>
          <p className="text-red-800 mb-8">
            If you're experiencing a platform outage or critical issue affecting your business, 
            contact our emergency support line for immediate assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Phone className="mr-2 w-5 h-5" />
              Emergency Support: (416) 555-9999
            </Button>
            <Button variant="outline" className="border-red-300 text-red-700">
              Check System Status
              <ExternalLink className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}