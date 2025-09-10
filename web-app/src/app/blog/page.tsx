"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageLayout } from "@/components/page-layout"
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
  FileText,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImage?: string
  category: string
  tags: string[]
  viewCount: number
  publishedAt: string
  createdAt: string
  readTime: string
  author: {
    name: string
    role: string
  }
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBlogPosts()
  }, [selectedCategory, searchQuery])

  const loadBlogPosts = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory.replace("-", " "))
      }
      if (searchQuery) {
        params.append("search", searchQuery)
      }
      
      // Load regular posts
      const postsResponse = await fetch(`${window.location.origin}/api/blog/posts?${params.toString()}`)
      if (!postsResponse.ok) throw new Error(`HTTP ${postsResponse.status}`)
      const postsData = await postsResponse.json()
      
      // Load featured post (most viewed)
      const featuredResponse = await fetch(`${window.location.origin}/api/blog/posts?featured=true&limit=1`)
      if (!featuredResponse.ok) throw new Error(`HTTP ${featuredResponse.status}`)
      const featuredData = await featuredResponse.json()
      
      setBlogPosts(postsData.posts || [])
      setFeaturedPost(featuredData.posts?.[0] || null)
    } catch (error) {
      console.error('Failed to load blog posts:', error)
      setBlogPosts([])
      setFeaturedPost(null)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { id: "all", name: "All Posts", count: blogPosts.length },
    { id: "market-insights", name: "Market Insights", count: blogPosts.filter(p => p.category === "Market Insights").length },
    { id: "investment-strategies", name: "Investment Strategies", count: blogPosts.filter(p => p.category === "Investment Strategies").length },
    { id: "technology", name: "Technology", count: blogPosts.filter(p => p.category === "Technology").length },
    { id: "case-studies", name: "Case Studies", count: blogPosts.filter(p => p.category === "Case Studies").length },
    { id: "industry-news", name: "Industry News", count: blogPosts.filter(p => p.category === "Industry News").length }
  ]

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const filteredPosts = selectedCategory === "all" 
    ? blogPosts 
    : blogPosts.filter(post => post.category.toLowerCase().replace(" ", "-") === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    )
  }

  return (
    <PageLayout>

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
                onChange={handleSearch}
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
      {featuredPost && (
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
                      <p className="text-sm opacity-80">Featured Article</p>
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
                      <span>{featuredPost.author.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(featuredPost.publishedAt).toLocaleDateString()}</span>
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
                        {featuredPost.viewCount}
                      </div>
                    </div>
                    <Link href={`/blog/${featuredPost.slug}`}>
                      <Button className="bg-gradient-to-r from-blue-600 to-orange-600">
                        Read Article
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

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

              {blogPosts.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No blog posts yet</h3>
                  <p className="text-gray-500">Check back soon for expert insights and market analysis.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {filteredPosts.map((post) => (
                    <Card key={post.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                      <CardContent className="p-0">
                        <div className="h-48 bg-gradient-to-br from-blue-600 to-orange-600 flex items-center justify-center">
                          <div className="text-center text-white">
                            <BookOpen className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-xs opacity-80">Article</p>
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
                              <span>{post.author.name}</span>
                              <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                            </div>
                            <span>{post.readTime}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {post.viewCount}
                              </div>
                            </div>
                            <Link href={`/blog/${post.slug}`}>
                              <Button variant="ghost" size="sm">
                                Read More
                                <ChevronRight className="ml-1 w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Load More */}
              {filteredPosts.length > 0 && (
                <div className="text-center mt-12">
                  <Button variant="outline" size="lg">
                    Load More Articles
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
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
                    {["Market Analysis", "Investment Strategy", "AI Technology", "Ontario Real Estate", 
                      "Power of Sale", "Estate Sales", "Development", "ROI Analysis"].map((tag, index) => (
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

    </PageLayout>
  )
}