'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, User, ArrowRight, TrendingUp, BarChart3, Map } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  publishedAt: string
  category: string
  readTime: number
  featured: boolean
}

export default function BlogHomePage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock blog posts data - in production this would fetch from CMS
    const mockPosts: BlogPost[] = [
      {
        id: '1',
        title: 'The Future of Real Estate: AI-Powered Market Intelligence',
        excerpt: 'Discover how artificial intelligence is revolutionizing real estate market analysis and property investment strategies.',
        content: 'Full content here...',
        author: 'Sarah Chen, Market Analyst',
        publishedAt: '2025-01-08',
        category: 'Technology',
        readTime: 8,
        featured: true
      },
      {
        id: '2',
        title: 'Q4 2024 Market Report: Key Trends and Opportunities',
        excerpt: 'Comprehensive analysis of the real estate market performance in Q4 2024 with insights for 2025.',
        content: 'Full content here...',
        author: 'Michael Rodriguez, Senior Analyst',
        publishedAt: '2025-01-05',
        category: 'Market Analysis',
        readTime: 12,
        featured: false
      },
      {
        id: '3',
        title: 'Power of Sale Properties: Investment Guide for 2025',
        excerpt: 'Essential strategies for identifying and evaluating power of sale opportunities in the current market.',
        content: 'Full content here...',
        author: 'Jessica Taylor, Investment Specialist',
        publishedAt: '2025-01-03',
        category: 'Investment',
        readTime: 6,
        featured: false
      },
      {
        id: '4',
        title: 'Estate Sale Properties: Hidden Gems in Real Estate',
        excerpt: 'Learn how to discover and evaluate estate sale properties for maximum investment potential.',
        content: 'Full content here...',
        author: 'David Kim, Property Expert',
        publishedAt: '2024-12-28',
        category: 'Investment',
        readTime: 7,
        featured: false
      }
    ]

    setPosts(mockPosts)
    setFeaturedPost(mockPosts.find(post => post.featured) || null)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Featured Post */}
      {featuredPost && (
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block bg-blue-500 text-blue-100 px-3 py-1 rounded-full text-sm font-medium mb-4">
                  Featured Post
                </span>
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  {featuredPost.title}
                </h1>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center space-x-6 mb-8">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>{featuredPost.author}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>{new Date(featuredPost.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">
                    {featuredPost.readTime} min read
                  </span>
                </div>
                <Link 
                  href={`/posts/${featuredPost.id}`}
                  className="inline-flex items-center bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Read Full Article
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
              <div className="lg:order-first">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-2xl font-bold">500K+</div>
                      <div className="text-blue-100">Properties Analyzed</div>
                    </div>
                    <div className="text-center">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-blue-100">Accuracy Rate</div>
                    </div>
                    <div className="text-center">
                      <Map className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-2xl font-bold">50+</div>
                      <div className="text-blue-100">Cities Covered</div>
                    </div>
                    <div className="text-center">
                      <User className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-2xl font-bold">10K+</div>
                      <div className="text-blue-100">Active Users</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Posts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Latest Insights</h2>
            <Link href="/posts" className="text-blue-600 hover:text-blue-800 font-semibold">
              View All Posts →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.filter(post => !post.featured).map((post) => (
              <article key={post.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {post.readTime} min read
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{post.author}</span>
                      <span>•</span>
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </div>
                    
                    <Link 
                      href={`/posts/${post.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Stay Ahead of the Market
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get the latest real estate insights, market analysis, and investment opportunities delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Subscribe
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No spam. Unsubscribe at any time.
          </p>
        </div>
      </section>
    </div>
  )
}