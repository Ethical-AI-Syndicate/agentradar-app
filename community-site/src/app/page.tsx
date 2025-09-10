'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, MessageSquare, TrendingUp, BookOpen, Star, Calendar, UserPlus, Search } from 'lucide-react'

export default function CommunityHomePage() {
  const [searchQuery, setSearchQuery] = useState('')

  const featuredDiscussions = [
    {
      id: 1,
      title: "Market Predictions for Q1 2025",
      author: "Sarah Chen",
      role: "Senior Market Analyst",
      replies: 24,
      lastActivity: "2 hours ago",
      category: "Market Analysis",
      isHot: true
    },
    {
      id: 2,
      title: "Power of Sale Success Stories",
      author: "Michael Rodriguez",
      role: "Investment Specialist",
      replies: 18,
      lastActivity: "4 hours ago",
      category: "Investment",
      isHot: false
    },
    {
      id: 3,
      title: "Best Tools for Property Analysis",
      author: "Jessica Taylor",
      role: "Real Estate Professional",
      replies: 31,
      lastActivity: "6 hours ago",
      category: "Tools & Technology",
      isHot: true
    }
  ]

  const communityStats = {
    totalMembers: 12547,
    activeToday: 834,
    totalDiscussions: 2156,
    questionsAnswered: 8943
  }

  const categories = [
    { name: "Market Analysis", count: 245, icon: TrendingUp },
    { name: "Investment Strategies", count: 189, icon: Star },
    { name: "Tools & Technology", count: 167, icon: BookOpen },
    { name: "Legal & Compliance", count: 134, icon: MessageSquare },
    { name: "Networking", count: 98, icon: Users },
    { name: "Education", count: 87, icon: Calendar }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="https://agentradar.app" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AR</span>
                </div>
                <span className="text-xl font-bold text-gray-900">AgentRadar</span>
              </a>
              <span className="ml-2 text-sm text-gray-500">Community</span>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
              <a href="/discussions" className="text-gray-600 hover:text-gray-900">Discussions</a>
              <a href="/members" className="text-gray-600 hover:text-gray-900">Members</a>
              <a href="/events" className="text-gray-600 hover:text-gray-900">Events</a>
              <a href="https://agentradar.app" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Back to App
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Connect with Real Estate Professionals
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of real estate professionals sharing insights, strategies, and opportunities in the AgentRadar community.
            </p>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-900 border border-transparent rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              />
              <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors flex items-center justify-center">
                <Search className="w-5 h-5 mr-2" />
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{communityStats.totalMembers.toLocaleString()}</div>
              <div className="text-gray-600">Community Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{communityStats.activeToday}</div>
              <div className="text-gray-600">Active Today</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{communityStats.totalDiscussions.toLocaleString()}</div>
              <div className="text-gray-600">Discussions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{communityStats.questionsAnswered.toLocaleString()}</div>
              <div className="text-gray-600">Questions Answered</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Featured Discussions */}
            <div className="bg-white rounded-xl shadow-sm border mb-8">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Featured Discussions</h2>
              </div>
              <div className="divide-y">
                {featuredDiscussions.map((discussion) => (
                  <div key={discussion.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {discussion.category}
                          </span>
                          {discussion.isHot && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                              🔥 Hot
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                          {discussion.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>by <strong>{discussion.author}</strong></span>
                          <span>•</span>
                          <span>{discussion.role}</span>
                          <span>•</span>
                          <span>{discussion.replies} replies</span>
                          <span>•</span>
                          <span>{discussion.lastActivity}</span>
                        </div>
                      </div>
                      <MessageSquare className="w-5 h-5 text-gray-400 ml-4" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t bg-gray-50">
                <Link href="/discussions" className="text-blue-600 hover:text-blue-800 font-semibold">
                  View All Discussions →
                </Link>
              </div>
            </div>

            {/* Join Community CTA */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white text-center">
              <UserPlus className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Join the Community</h3>
              <p className="text-green-100 mb-6">
                Connect with fellow real estate professionals, share insights, and grow your network.
              </p>
              <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                Sign Up Free
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.name} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <category.icon className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-900">{category.name}</span>
                      </div>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                        {category.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Market Outlook Webinar</h4>
                    <p className="text-sm text-gray-600">January 15, 2025 at 2:00 PM EST</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Investment Strategies Workshop</h4>
                    <p className="text-sm text-gray-600">January 22, 2025 at 7:00 PM EST</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Community Meetup - Toronto</h4>
                    <p className="text-sm text-gray-600">January 28, 2025 at 6:00 PM EST</p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/events" className="text-blue-600 hover:text-blue-800 font-semibold">
                    View All Events →
                  </Link>
                </div>
              </div>
            </div>

            {/* Top Contributors */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Top Contributors</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">SC</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Sarah Chen</div>
                      <div className="text-sm text-gray-600">Market Analyst</div>
                    </div>
                    <div className="ml-auto">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                        ⭐ Expert
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold">MR</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Michael Rodriguez</div>
                      <div className="text-sm text-gray-600">Investment Specialist</div>
                    </div>
                    <div className="ml-auto">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                        💎 Pro
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold">JT</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Jessica Taylor</div>
                      <div className="text-sm text-gray-600">Real Estate Professional</div>
                    </div>
                    <div className="ml-auto">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        🏆 Top
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AR</span>
                </div>
                <span className="text-xl font-bold text-white">AgentRadar</span>
              </div>
              <p className="text-gray-400">
                Connecting real estate professionals worldwide with intelligent insights and community collaboration.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/discussions" className="hover:text-white">Discussions</a></li>
                <li><a href="/members" className="hover:text-white">Members</a></li>
                <li><a href="/events" className="hover:text-white">Events</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://blog.agentradar.app" className="hover:text-white">Blog</a></li>
                <li><a href="https://agentradar.app/help" className="hover:text-white">Help Center</a></li>
                <li><a href="https://agentradar.app/api-docs" className="hover:text-white">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://agentradar.app/about" className="hover:text-white">About</a></li>
                <li><a href="https://careers.agentradar.app" className="hover:text-white">Careers</a></li>
                <li><a href="https://agentradar.app/contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AgentRadar Community. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}