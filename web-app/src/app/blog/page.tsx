"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Footer } from "@/components/footer"
import { 
  Search,
  Calendar,
  User,
  Clock,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Eye,
  MessageCircle,
  Tag,
  ChevronRight,
  BookOpen,
  Video,
  Download,
  ExternalLink,
  Mail,
  Bell,
  Zap,
  FileText
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const categories = [
    { id: "all", name: "All Posts", count: 24 },
    { id: "market-insights", name: "Market Insights", count: 8 },
    { id: "investment-strategies", name: "Investment Strategies", count: 6 },
    { id: "technology", name: "Technology", count: 4 },
    { id: "case-studies", name: "Case Studies", count: 3 },
    { id: "industry-news", name: "Industry News", count: 3 }
  ]

  const featuredPost = {
    id: 1,
    title: "2025 Ontario Real Estate Market Forecast: Hidden Opportunities in Uncertain Times",
    excerpt: "Our AI analysis reveals three emerging trends that will reshape the Ontario real estate market in 2025. Discover where smart investors are positioning themselves now.",
    author: "Mike Holownych",
    role: "CEO & Market Analyst", 
    date: "January 3, 2025",
    readTime: "8 min read",
    category: "Market Insights",
    image: "/api/placeholder/800/400",
    views: "2.4k",
    comments: "42",
    tags: ["Market Analysis", "Ontario", "2025 Forecast", "Investment"]
  }

  const blogPosts = [
    {
      id: 2,
      title: "Power of Sale vs Foreclosure: A Complete Guide for Real Estate Investors",
      excerpt: "Understanding the key differences between power of sale and foreclosure properties can unlock significant investment opportunities. Here's everything you need to know.",
      author: "Michael Rodriguez",
      role: "Senior Investment Analyst",
      date: "December 28, 2024",
      readTime: "6 min read",
      category: "Investment Strategies",
      views: "1.8k",
      comments: "31",
      tags: ["Power of Sale", "Foreclosure", "Investment Guide"]
    },
    {
      id: 3,
      title: "How AI is Revolutionizing Real Estate Investment Decisions",
      excerpt: "Machine learning algorithms can now predict property investment success with 94% accuracy. Discover how technology is changing the game for savvy investors.",
      author: "Dr. Lisa Wang",
      role: "Head of AI Development",
      date: "December 22, 2024", 
      readTime: "7 min read",
      category: "Technology",
      views: "1.5k",
      comments: "28",
      tags: ["AI", "Machine Learning", "PropTech", "Innovation"]
    },
    {
      id: 4,
      title: "Estate Sale Properties: Finding Hidden Gems in Probate Court",
      excerpt: "Probate and estate sale properties often sell below market value. Learn our proven system for identifying and acquiring these hidden opportunities.",
      author: "Jennifer Thompson",
      role: "Estate Property Specialist",
      date: "December 18, 2024",
      readTime: "5 min read", 
      category: "Investment Strategies",
      views: "1.2k",
      comments: "19",
      tags: ["Estate Sales", "Probate", "Below Market", "Strategy"]
    },
    {
      id: 5,
      title: "Case Study: How One Agent Found 47 Properties Before MLS Using AgentRadar",
      excerpt: "Toronto agent Maria Santos increased her deal flow by 340% using our early detection system. Here's her complete strategy and results breakdown.",
      author: "AgentRadar Team",
      role: "Customer Success",
      date: "December 15, 2024",
      readTime: "4 min read",
      category: "Case Studies", 
      views: "2.1k",
      comments: "35",
      tags: ["Success Story", "Toronto", "Deal Flow", "Results"]
    },
    {
      id: 6,
      title: "The Ultimate Guide to Development Application Monitoring",
      excerpt: "Municipal development applications can reveal future high-growth areas months in advance. Our comprehensive guide shows you how to track and analyze them.",
      author: "David Kim",
      role: "Market Research Director",
      date: "December 10, 2024",
      readTime: "9 min read",
      category: "Market Insights",
      views: "987",
      comments: "24",
      tags: ["Development", "Municipal", "Growth Areas", "Research"]
    },
    {
      id: 7,
      title: "Breaking: New Ontario Housing Policy Creates Investment Opportunities",
      excerpt: "The province's latest housing initiative opens new investment channels for qualified investors. Here's what you need to know and how to position yourself.",
      author: "Mike Holownych",
      role: "CEO & Market Analyst",
      date: "December 8, 2024",
      readTime: "3 min read",
      category: "Industry News",
      views: "3.2k", 
      comments: "67",
      tags: ["Policy", "Ontario", "Breaking News", "Government"]
    },
    {
      id: 8,
      title: "ROI Analysis: Comparing Traditional MLS vs Early Detection Strategies",
      excerpt: "Our data analysis of 1,000+ transactions shows early detection strategies deliver 23% higher returns. See the complete performance breakdown.",
      author: "Michael Rodriguez", 
      role: "Senior Investment Analyst",
      date: "December 3, 2024",
      readTime: "6 min read",
      category: "Market Insights",
      views: "1.4k",
      comments: "29",
      tags: ["ROI", "Analysis", "Performance", "Strategy Comparison"]
    },
    {
      id: 9,
      title: "API Integration Guide: Connecting AgentRadar to Your CRM",
      excerpt: "Step-by-step tutorial for integrating AgentRadar's property intelligence directly into your existing CRM workflow for seamless deal management.",
      author: "Tech Team",
      role: "Developer Relations",
      date: "November 29, 2024",
      readTime: "10 min read",
      category: "Technology",
      views: "756",
      comments: "18",
      tags: ["API", "Integration", "CRM", "Technical"]
    }
  ]

  const popularTags = [
    "Market Analysis", "Investment Strategy", "AI Technology", "Ontario Real Estate", 
    "Power of Sale", "Estate Sales", "Development", "ROI Analysis", "Case Studies", "API Integration"
  ]

  const filteredPosts = selectedCategory === "all" 
    ? blogPosts 
    : blogPosts.filter(post => post.category.toLowerCase().replace(" ", "-") === selectedCategory)

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
            Real Estate Intelligence Blog
          </Badge>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Insights That Drive 
            <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent"> Results</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Stay ahead of the market with expert analysis, proven strategies, and actionable insights 
            from Canada&apos;s leading real estate intelligence platform.
          </p>
          
          {/* Newsletter Signup */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Enter your email for weekly insights"
                className="flex-1"
              />
              <Button className="bg-gradient-to-r from-blue-600 to-orange-600">
                <Bell className="w-4 h-4 mr-2" />
                Subscribe
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Join 12,000+ agents getting weekly market insights</p>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id 
                    ? "bg-gradient-to-r from-blue-600 to-orange-600" 
                    : ""
                  }
                >
                  {category.name}
                  <Badge className="ml-2 bg-white/20 text-current border-current">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured Article</h2>
            <p className="text-gray-600">Our most important insights for this week</p>
          </div>

          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="lg:flex">
              <div className="lg:w-1/2">
                <div className="h-64 lg:h-full bg-gradient-to-br from-blue-600 to-orange-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-sm opacity-80">Featured Article Image</p>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 p-8">
                <div className="flex items-center gap-4 mb-4">
                  <Badge className="bg-blue-100 text-blue-800">
                    {featuredPost.category}
                  </Badge>
                  <Badge className="bg-orange-100 text-orange-800">
                    Featured
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {featuredPost.title}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {featuredPost.excerpt}
                </p>
                
                <div className="flex items-center gap-6 mb-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{featuredPost.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{featuredPost.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {featuredPost.views}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {featuredPost.comments}
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-orange-600">
                    Read Article
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCategory === "all" ? "Latest Articles" : categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Showing {filteredPosts.length} articles</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                    <CardContent className="p-0">
                      <div className="h-48 bg-gradient-to-br from-blue-600 to-orange-600 flex items-center justify-center">
                        <div className="text-center text-white">
                          <BookOpen className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-xs opacity-80">Article Image</p>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-gray-100 text-gray-800 text-xs">
                            {post.category}
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <div className="flex items-center gap-3">
                            <span>{post.author}</span>
                            <span>{post.date}</span>
                          </div>
                          <span>{post.readTime}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {post.views}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {post.comments}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Read More
                            <ChevronRight className="ml-1 w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Load More */}
              <div className="text-center mt-12">
                <Button variant="outline" size="lg">
                  Load More Articles
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              
              {/* Popular Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Popular Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="hover:bg-blue-50 cursor-pointer">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter Signup */}
              <Card className="bg-gradient-to-br from-blue-50 to-orange-50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Weekly Market Report</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Get exclusive market insights and property opportunities delivered every Tuesday.
                  </p>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-orange-600 mb-3">
                    Subscribe Now
                  </Button>
                  <p className="text-xs text-gray-500">12,000+ subscribers</p>
                </CardContent>
              </Card>

              {/* Resources */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Free Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: "2025 Market Forecast", type: "PDF Report", icon: FileText },
                    { title: "Investment Calculator", type: "Excel Tool", icon: BarChart3 },
                    { title: "Platform Walkthrough", type: "Video Guide", icon: Video },
                    { title: "API Documentation", type: "Technical Guide", icon: BookOpen }
                  ].map((resource, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <resource.icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{resource.title}</div>
                        <div className="text-xs text-gray-500">{resource.type}</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Trending Now
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: "New housing policy impact", views: "3.2k views" },
                    { title: "AI investment scoring", views: "2.8k views" }, 
                    { title: "Estate sale strategies", views: "2.1k views" },
                    { title: "Development tracking", views: "1.9k views" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-900">{item.title}</span>
                      </div>
                      <span className="text-xs text-gray-500">{item.views}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Apply These Insights?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Turn market knowledge into profitable opportunities with AgentRadar&apos;s 
            AI-powered real estate intelligence platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Watch Platform Demo
                <Video className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}