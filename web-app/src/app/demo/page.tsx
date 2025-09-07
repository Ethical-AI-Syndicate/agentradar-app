"use client"

import React from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/footer"
import { 
  Play,
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
  Calendar,
  Filter,
  Star,
  AlertTriangle,
  Download,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  FileText,
  Award
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function DemoPage() {
  const [activeDemo, setActiveDemo] = useState("search")
  const [showVideoModal, setShowVideoModal] = useState(false)

  const demoSections = [
    {
      id: "search",
      title: "Property Discovery",
      description: "Find hidden opportunities before they hit MLS",
      icon: Search,
      features: ["Advanced filtering", "Real-time alerts", "Map visualization", "Property history"]
    },
    {
      id: "alerts",
      title: "Smart Alerts",
      description: "Get notified of opportunities 6-12 months early",
      icon: Bell,
      features: ["Custom criteria", "Instant notifications", "Priority scoring", "Email & SMS"]
    },
    {
      id: "analysis",
      title: "Market Analysis", 
      description: "AI-powered investment scoring and market insights",
      icon: TrendingUp,
      features: ["Investment scores", "Market trends", "Comparable analysis", "ROI projections"]
    },
    {
      id: "dashboard",
      title: "Professional Dashboard",
      description: "Complete overview of opportunities and performance",
      icon: BarChart3,
      features: ["Real-time metrics", "Pipeline management", "Team collaboration", "Custom reports"]
    }
  ]

  const liveData = {
    newProperties: 47,
    powerOfSale: 23,
    estateSales: 12,
    development: 15,
    avgScore: 8.2,
    marketTrend: "+12%"
  }

  const sampleProperties = [
    {
      id: 1,
      address: "1245 Maple Street, Toronto, ON",
      type: "Power of Sale",
      price: "$850,000",
      score: 9.2,
      status: "New",
      daysAgo: "2 hours ago",
      potential: "+$180K"
    },
    {
      id: 2,
      address: "67 Oak Avenue, Mississauga, ON",
      type: "Estate Sale",
      price: "$675,000",
      score: 8.7,
      status: "Hot",
      daysAgo: "1 day ago",
      potential: "+$125K"
    },
    {
      id: 3,
      address: "890 Pine Road, Brampton, ON",
      type: "Development",
      price: "$1,200,000",
      score: 8.1,
      status: "Opportunity",
      daysAgo: "3 days ago",
      potential: "+$200K"
    }
  ]

  const platforms = [
    {
      name: "Web Dashboard",
      icon: Monitor,
      description: "Full-featured platform for desktop power users",
      features: ["Complete analytics", "Bulk operations", "Advanced filtering", "Team management"]
    },
    {
      name: "Mobile App",
      icon: Smartphone,
      description: "iOS & Android apps for agents on the go",
      features: ["Push notifications", "Offline access", "Camera integration", "GPS mapping"]
    },
    {
      name: "Tablet Interface",
      icon: Tablet,
      description: "Optimized for presentations and client meetings",
      features: ["Touch interface", "Client-ready views", "Presentation mode", "Easy sharing"]
    }
  ]

  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-green-600 bg-green-50"
    if (score >= 8) return "text-orange-600 bg-orange-50"
    return "text-blue-600 bg-blue-50"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-green-100 text-green-800"
      case "Hot": return "bg-red-100 text-red-800"
      case "Opportunity": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
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
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              Interactive Demo
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              See AgentRadar 
              <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent"> In Action</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Experience how AgentRadar transforms real estate prospecting with live data, 
              AI-powered insights, and early opportunity detection. No signup required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
                onClick={() => setShowVideoModal(true)}
              >
                <Play className="mr-2 w-5 h-5" />
                Watch 3-Minute Overview
              </Button>
              <Button size="lg" variant="outline">
                Try Interactive Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Live Ontario data</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Real-time updates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Live Platform Activity</h2>
            <p className="text-gray-600">Real data from our production system updated every hour</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{liveData.newProperties}</div>
                <div className="text-sm text-gray-600">New Opportunities</div>
                <div className="text-xs text-gray-500 mt-1">Today</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{liveData.powerOfSale}</div>
                <div className="text-sm text-gray-600">Power of Sale</div>
                <div className="text-xs text-gray-500 mt-1">Active</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{liveData.estateSales}</div>
                <div className="text-sm text-gray-600">Estate Sales</div>
                <div className="text-xs text-gray-500 mt-1">Available</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{liveData.development}</div>
                <div className="text-sm text-gray-600">Development</div>
                <div className="text-xs text-gray-500 mt-1">Applications</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{liveData.avgScore}</div>
                <div className="text-sm text-gray-600">Avg Score</div>
                <div className="text-xs text-gray-500 mt-1">Investment</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-teal-600 mb-2">{liveData.marketTrend}</div>
                <div className="text-sm text-gray-600">Market Trend</div>
                <div className="text-xs text-gray-500 mt-1">30-day</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Demo Sections */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Key Features</h2>
            <p className="text-xl text-gray-600">
              Click on any feature below to see it in action with real data
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6 mb-12">
            {demoSections.map((section) => (
              <Card 
                key={section.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  activeDemo === section.id 
                    ? 'ring-2 ring-blue-500 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setActiveDemo(section.id)}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    activeDemo === section.id
                      ? 'bg-gradient-to-r from-blue-600 to-orange-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{section.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{section.description}</p>
                  <ul className="space-y-1">
                    {section.features.map((feature, index) => (
                      <li key={index} className="text-xs text-gray-500 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Demo Content */}
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-3">
                {demoSections.find(s => s.id === activeDemo)?.icon && (
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    {React.createElement(demoSections.find(s => s.id === activeDemo)!.icon, { className: "w-5 h-5" })}
                  </div>
                )}
                {demoSections.find(s => s.id === activeDemo)?.title}
                <Badge className="bg-white/20 text-white border-white/30 ml-auto">
                  Live Demo
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              
              {/* Property Discovery Demo */}
              {activeDemo === "search" && (
                <div className="p-8">
                  <div className="space-y-6">
                    {/* Search Interface */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            placeholder="Search by location, property type, or criteria..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            defaultValue="Toronto power of sale properties"
                          />
                        </div>
                        <Button className="bg-gradient-to-r from-blue-600 to-orange-600">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-blue-100 text-blue-800">Power of Sale</Badge>
                        <Badge className="bg-green-100 text-green-800">Estate Sale</Badge>
                        <Badge className="bg-orange-100 text-orange-800">Development</Badge>
                        <Badge className="bg-purple-100 text-purple-800">Score 8.0+</Badge>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="space-y-4">
                      {sampleProperties.map((property) => (
                        <div key={property.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{property.address}</h3>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge className={getStatusColor(property.status)}>
                                  {property.status}
                                </Badge>
                                <span className="text-sm text-gray-500">{property.type}</span>
                                <span className="text-sm text-gray-500">{property.daysAgo}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-gray-900">{property.price}</div>
                              <div className="text-sm text-green-600 font-medium">{property.potential} potential</div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className={`font-semibold px-2 py-1 rounded ${getScoreColor(property.score)}`}>
                                  {property.score}
                                </span>
                                <span className="text-sm text-gray-500">Investment Score</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                              <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Alert
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Alerts Demo */}
              {activeDemo === "alerts" && (
                <div className="p-8">
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Bell className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-blue-900">Active Alert: High-Value Properties</h3>
                        <Badge className="bg-green-100 text-green-800">3 new matches</Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Alert Criteria</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li>• Location: Toronto, Mississauga</li>
                            <li>• Property Value: $600K - $1.2M</li>
                            <li>• Investment Score: 8.0+</li>
                            <li>• Types: Power of Sale, Estate</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Notification Settings</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li>• Email: Immediate</li>
                            <li>• SMS: High priority only</li>
                            <li>• Push: All matches</li>
                            <li>• Frequency: Real-time</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Recent Alert Notifications</h4>
                      {[
                        { time: "2 min ago", type: "Power of Sale", address: "1245 Maple Street", priority: "High" },
                        { time: "1 hour ago", type: "Estate Sale", address: "67 Oak Avenue", priority: "Medium" },
                        { time: "3 hours ago", type: "Development", address: "890 Pine Road", priority: "High" }
                      ].map((alert, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${alert.priority === 'High' ? 'bg-red-500' : 'bg-orange-500'}`} />
                            <div>
                              <div className="font-medium text-gray-900">{alert.type} Alert</div>
                              <div className="text-sm text-gray-600">{alert.address}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">{alert.time}</div>
                            <Badge className={alert.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}>
                              {alert.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Market Analysis Demo */}
              {activeDemo === "analysis" && (
                <div className="p-8">
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Analysis</h3>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">1245 Maple Street, Toronto</h4>
                          <div className="text-2xl font-bold text-green-600">9.2</div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Market Value</span>
                            <span className="font-medium">$850,000</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Estimated ARV</span>
                            <span className="font-medium text-green-600">$1,030,000</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Profit Potential</span>
                            <span className="font-medium text-green-600">+$180,000</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">ROI Estimate</span>
                            <span className="font-medium text-green-600">21.2%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Trends</h3>
                      <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-lg p-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">+12%</div>
                            <div className="text-sm text-gray-600">Price Growth</div>
                            <div className="text-xs text-gray-500">YoY</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">18</div>
                            <div className="text-sm text-gray-600">Days on Market</div>
                            <div className="text-xs text-gray-500">Average</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">94%</div>
                            <div className="text-sm text-gray-600">Sale to List</div>
                            <div className="text-xs text-gray-500">Ratio</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">3.2</div>
                            <div className="text-sm text-gray-600">Inventory</div>
                            <div className="text-xs text-gray-500">Months</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dashboard Demo */}
              {activeDemo === "dashboard" && (
                <div className="p-8">
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-gray-600">Active Opportunities</div>
                                <div className="text-2xl font-bold text-blue-600">47</div>
                              </div>
                              <TrendingUp className="w-8 h-8 text-blue-600" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-gray-600">Total Saved</div>
                                <div className="text-2xl font-bold text-green-600">$1.2M</div>
                              </div>
                              <DollarSign className="w-8 h-8 text-green-600" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Recent Activity</h4>
                        <div className="space-y-3">
                          {[
                            { action: "New property alert", location: "Maple Street", time: "2 min ago" },
                            { action: "Analysis completed", location: "Oak Avenue", time: "1 hour ago" },
                            { action: "Property saved", location: "Pine Road", time: "3 hours ago" }
                          ].map((activity, index) => (
                            <div key={index} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                                  <div className="text-xs text-gray-500">{activity.location}</div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">{activity.time}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <Button className="w-full justify-start" variant="outline">
                          <Search className="w-4 h-4 mr-2" />
                          Create New Search
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <Bell className="w-4 h-4 mr-2" />
                          Set Up Alert
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Report
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Account Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Multi-Platform Experience */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Works Everywhere You Do</h2>
            <p className="text-xl text-gray-600">
              Access AgentRadar on any device with synchronized data and seamless experience
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {platforms.map((platform, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <platform.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{platform.name}</h3>
                  <p className="text-gray-600 mb-6">{platform.description}</p>
                  <ul className="space-y-2 text-sm text-gray-600 mb-8">
                    {platform.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full">
                    Try {platform.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Real Estate Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your free trial today and discover opportunities your competition doesn't know exist.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Schedule Live Demo
              <Calendar className="ml-2 w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>14-day free trial</span>
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