"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone,
  Laptop,
  Monitor,
  Bell,
  Brain,
  MapPin,
  Filter,
  Users,
  BarChart3,
  Shield,
  Zap,
  Globe,
  CheckCircle,
  Star
} from "lucide-react"

export function FeaturesSection() {
  const platforms = [
    {
      icon: Monitor,
      title: "Web Dashboard",
      description: "Full-featured web application with real-time alerts and comprehensive property intelligence",
      features: ["Real-time dashboard", "Advanced filtering", "Bulk operations", "Detailed analytics"]
    },
    {
      icon: Smartphone,
      title: "Mobile Apps",
      description: "iOS and Android apps with push notifications for instant alerts on the go",
      features: ["Push notifications", "GPS-based filtering", "Quick actions", "Offline access"]
    },
    {
      icon: Laptop,
      title: "Desktop App",
      description: "Power tools for enterprise users with advanced features and bulk operations",
      features: ["Bulk processing", "Advanced analytics", "Export tools", "Multi-workspace"]
    }
  ]

  const coreFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Machine learning algorithms analyze patterns and predict the best opportunities",
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Get alerted instantly via email, SMS, or push notifications when opportunities match your criteria",
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      icon: MapPin,
      title: "Geographic Targeting",
      description: "Focus on specific neighborhoods, cities, or regions within the Greater Toronto Area",
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      icon: Filter,
      title: "Advanced Filtering",
      description: "Filter by property type, value range, timeline, and opportunity score",
      color: "text-orange-500",
      bgColor: "bg-orange-50"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track your pipeline, conversion rates, and market opportunities with detailed reporting",
      color: "text-indigo-500",
      bgColor: "bg-indigo-50"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share opportunities with your team and track who&apos;s working on what",
      color: "text-pink-500",
      bgColor: "bg-pink-50"
    }
  ]

  const enterpriseFeatures = [
    {
      icon: Globe,
      title: "White-Label Platform",
      description: "Brokerages can deploy their own branded version with custom domains and styling",
      highlight: "For Brokerages"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with data encryption, audit trails, and compliance reporting",
      highlight: "Enterprise"
    },
    {
      icon: Zap,
      title: "API Access",
      description: "Integrate with your existing CRM, marketing automation, and business tools",
      highlight: "Developers"
    }
  ]

  return (
    <section className="py-20 bg-gray-50" id="features">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
              <Star className="w-4 h-4 mr-1" />
              Platform Features
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                Dominate Your Market
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              AgentRadar provides a complete intelligence platform with tools designed 
              specifically for modern real estate professionals.
            </p>
          </motion.div>
        </div>

        {/* Platform Access */}
        <div className="mb-20">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center text-gray-900 mb-12"
          >
            Access Your Intelligence Anywhere
          </motion.h3>

          <div className="grid lg:grid-cols-3 gap-8">
            {platforms.map((platform, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-8 h-full bg-white border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg group">
                  <div className="text-center mb-6">
                    <div className="inline-flex p-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors duration-300 mb-4">
                      <platform.icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{platform.title}</h4>
                    <p className="text-gray-600">{platform.description}</p>
                  </div>
                  
                  <div className="space-y-2">
                    {platform.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Core Features Grid */}
        <div className="mb-20">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center text-gray-900 mb-12"
          >
            Core Intelligence Features
          </motion.h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full bg-white border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg">
                  <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h4>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Enterprise Features */}
        <div className="mb-16">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center text-gray-900 mb-12"
          >
            Enterprise & Brokerage Solutions
          </motion.h3>

          <div className="grid lg:grid-cols-3 gap-8">
            {enterpriseFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-8 h-full bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 hover:border-indigo-200 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex p-3 rounded-lg bg-indigo-100">
                      <feature.icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <Badge variant="secondary" className="bg-indigo-200 text-indigo-800">
                      {feature.highlight}
                    </Badge>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h4>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 lg:p-12 shadow-xl border border-gray-200"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              How AgentRadar Compares
            </h3>
            <p className="text-gray-600">
              See why AgentRadar is the most comprehensive real estate intelligence platform
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-green-600">AgentRadar</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-500">Traditional MLS</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-500">Other Platforms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  ["Lead Time Advantage", "6-12 months", "0 days", "1-30 days"],
                  ["Court Filing Monitoring", "✓", "✗", "Limited"],
                  ["Estate Sale Tracking", "✓", "✗", "✗"],
                  ["Development Applications", "✓", "✗", "✗"],
                  ["AI Opportunity Scoring", "✓", "✗", "Basic"],
                  ["Multi-Platform Access", "✓", "Limited", "Web Only"],
                  ["White-Label Options", "✓", "✗", "✗"],
                  ["Real-Time Notifications", "✓", "Limited", "Email Only"]
                ].map(([feature, agentradar, mls, others], index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-4 text-gray-900">{feature}</td>
                    <td className="py-4 px-4 text-center">
                      {agentradar === "✓" ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="font-medium text-green-600">{agentradar}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {mls === "✗" ? (
                        <span className="text-gray-400">✗</span>
                      ) : (
                        <span className="text-gray-600">{mls}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {others === "✗" ? (
                        <span className="text-gray-400">✗</span>
                      ) : (
                        <span className="text-gray-600">{others}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  )
}