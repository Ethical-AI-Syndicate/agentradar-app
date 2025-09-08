"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Bell, 
  MessageCircle, 
  ArrowRight,
  FileText,
  Gavel,
  Building2,
  Clock,
  Target,
  CheckCircle
} from "lucide-react"

export function SolutionSection() {
  const steps = [
    {
      number: "01",
      icon: Search,
      title: "Intelligent Discovery",
      description: "Our AI continuously monitors court filings, estate sales, and municipal applications across Ontario",
      details: [
        "Power of sale proceedings",
        "Probate and estate filings", 
        "Development applications",
        "Municipal permit applications"
      ],
      color: "from-blue-500 to-blue-600"
    },
    {
      number: "02", 
      icon: Target,
      title: "Smart Scoring",
      description: "Every opportunity gets an AI-powered score based on timeline, property value, and market conditions",
      details: [
        "Timeline to market prediction",
        "Property value analysis",
        "Market condition assessment",
        "Competition level scoring"
      ],
      color: "from-orange-500 to-red-500"
    },
    {
      number: "03",
      icon: Bell,
      title: "Instant Alerts",
      description: "Get notified immediately when high-score opportunities match your criteria and geographic focus",
      details: [
        "Real-time push notifications",
        "Email digest summaries",
        "Geographic filtering",
        "Custom scoring thresholds"
      ],
      color: "from-green-500 to-emerald-600"
    },
    {
      number: "04",
      icon: MessageCircle,
      title: "Early Relationship Building",
      description: "Connect with property owners months before they need to sell, building trust and positioning yourself as the obvious choice",
      details: [
        "Contact information research",
        "Approach timing optimization",
        "Conversation starter templates",
        "Follow-up scheduling"
      ],
      color: "from-purple-500 to-indigo-600"
    }
  ]

  const sources = [
    {
      icon: Gavel,
      title: "Court Filings",
      subtitle: "Power of Sale Proceedings",
      description: "Monitor Ontario Superior Court bulletins for power of sale listings 6-12 months before they hit MLS",
      timeline: "6-12 months ahead",
      color: "text-red-500"
    },
    {
      icon: FileText,
      title: "Estate Sales",
      subtitle: "Probate Applications",
      description: "Track probate filings and estate sales that often result in motivated sellers and below-market opportunities",
      timeline: "3-9 months ahead", 
      color: "text-orange-500"
    },
    {
      icon: Building2,
      title: "Development Apps",
      subtitle: "Municipal Applications",
      description: "Identify development applications that signal upcoming construction, rezoning, or property improvements",
      timeline: "12+ months ahead",
      color: "text-blue-500"
    }
  ]

  return (
    <section className="py-20 bg-white" id="demo">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="w-4 h-4 mr-1" />
              The AgentRadar Solution
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              How Smart Agents{" "}
              <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                Stay Ahead
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              While other agents react to MLS listings, you&apos;ll be building relationships with sellers 
              6-12 months before they even think about listing their property.
            </p>
          </motion.div>
        </div>

        {/* Data Sources */}
        <div className="mb-20">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center text-gray-900 mb-12"
          >
            We Monitor Multiple Intelligence Sources
          </motion.h3>

          <div className="grid lg:grid-cols-3 gap-8">
            {sources.map((source, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gray-100 rounded-lg mr-4">
                      <source.icon className={`w-6 h-6 ${source.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{source.title}</h4>
                      <p className="text-sm text-gray-500">{source.subtitle}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {source.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      <Clock className="w-3 h-3 mr-1" />
                      {source.timeline}
                    </Badge>
                    <span className={`text-sm font-medium ${source.color}`}>
                      Live Monitoring
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How It Works Steps */}
        <div className="mb-16">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center text-gray-900 mb-12"
          >
            How It Works: From Discovery to Deal
          </motion.h3>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`flex flex-col lg:flex-row items-center gap-8 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Step Content */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {step.number}
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900">{step.title}</h4>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pl-16">
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step Visual */}
                <div className="flex-1">
                  <Card className="p-8 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 shadow-lg">
                    <div className="text-center">
                      <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${step.color} mb-4`}>
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-2">Step {step.number}</h5>
                      <p className="text-gray-600 text-sm">
                        {step.title === "Intelligent Discovery" && "Monitor 24/7 across multiple data sources"}
                        {step.title === "Smart Scoring" && "AI analyzes and ranks every opportunity"}
                        {step.title === "Instant Alerts" && "Get notified immediately via your preferred method"}
                        {step.title === "Early Relationship Building" && "Connect months before the competition knows"}
                      </p>
                    </div>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Results Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 lg:p-12 border border-green-200 text-center"
        >
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            The Result? You Win More Listings
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">6-12x</div>
              <div className="text-gray-700">More Lead Time Than Competitors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">247%</div>
              <div className="text-gray-700">Average Increase in Pipeline</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">Zero</div>
              <div className="text-gray-700">Competition When You Call First</div>
            </div>
          </div>

          <p className="text-lg text-gray-700 mb-8 max-w-3xl mx-auto">
            Imagine calling a property owner who&apos;s dealing with a power of sale proceeding, 
            and you&apos;re the <strong>first and only agent</strong> who knows about their situation. 
            That&apos;s the power of intelligence-driven prospecting.
          </p>

          <Button 
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 h-auto text-lg font-semibold"
            onClick={() => (document.querySelector('[data-early-adopter-trigger]') as HTMLElement)?.click()}
          >
            Start Building Your Intelligence Advantage
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}