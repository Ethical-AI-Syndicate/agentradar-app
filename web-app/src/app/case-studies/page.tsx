"use client"

import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Target,
  Building,
  MapPin,
  Calendar,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Award
} from "lucide-react"

export default function CaseStudiesPage() {
  const caseStudies = [
    {
      id: "toronto-agent-success",
      title: "Toronto Agent Increases Deal Flow by 340% Using AgentRadar",
      client: "Sarah Chen, RE/MAX Toronto",
      location: "Toronto, ON",
      timeline: "6 months",
      category: "Solo Agent",
      results: {
        dealIncrease: "340%",
        avgAdvance: "7.2 months",
        totalValue: "$8.4M",
        properties: "47"
      },
      challenge: "Sarah was struggling to find quality leads in Toronto's competitive market. She was spending 60% of her time on cold calling and door-knocking with minimal results.",
      solution: "Implemented AgentRadar's court filing alerts and estate sale monitoring to identify opportunities before they hit the market.",
      outcome: "Sarah now identifies high-potential properties months in advance, allowing her to build relationships with sellers before competition arrives.",
      testimonial: "AgentRadar completely transformed my business. I went from chasing leads to being first in line for the best opportunities. My income tripled in 6 months.",
      metrics: [
        { label: "Properties Closed", before: "14", after: "61", improvement: "+336%" },
        { label: "Average Commission", before: "$8,400", after: "$12,600", improvement: "+50%" },
        { label: "Time to Close", before: "45 days", after: "28 days", improvement: "-38%" },
        { label: "Lead Quality Score", before: "3.2/10", after: "8.7/10", improvement: "+172%" }
      ]
    },
    {
      id: "oakville-team-expansion",
      title: "Oakville Real Estate Team Scales to $50M in Sales Volume",
      client: "Thompson & Associates Real Estate",
      location: "Oakville, ON",
      timeline: "12 months",
      category: "Team Enterprise",
      results: {
        dealIncrease: "280%",
        avgAdvance: "8.4 months",
        totalValue: "$50M",
        properties: "203"
      },
      challenge: "Growing team of 12 agents needed a systematic way to identify and distribute quality leads across the team without conflicts.",
      solution: "Deployed AgentRadar Team Enterprise with territory management and lead distribution automation.",
      outcome: "Team achieved record-breaking sales volume while maintaining high client satisfaction and agent retention.",
      testimonial: "AgentRadar gave us the competitive edge we needed to dominate the Oakville market. Our agents are happier and more successful than ever.",
      metrics: [
        { label: "Team Revenue", before: "$2.1M", after: "$7.8M", improvement: "+271%" },
        { label: "Properties per Agent", before: "8", after: "17", improvement: "+113%" },
        { label: "Agent Retention", before: "67%", after: "94%", improvement: "+40%" },
        { label: "Market Share", before: "4.2%", after: "12.8%", improvement: "+205%" }
      ]
    },
    {
      id: "mississauga-investment-focus",
      title: "Investment-Focused Agent Builds $2M Portfolio in 8 Months",
      client: "Michael Rodriguez, Independent Agent",
      location: "Mississauga, ON",
      timeline: "8 months",
      category: "Professional",
      results: {
        dealIncrease: "425%",
        avgAdvance: "9.1 months",
        totalValue: "$12.7M",
        properties: "32"
      },
      challenge: "Michael wanted to transition from traditional sales to investment-focused real estate but lacked the tools to identify undervalued properties.",
      solution: "Used AgentRadar's investment scoring algorithm and probate monitoring to find distressed properties with high potential.",
      outcome: "Built a personal investment portfolio worth $2M while helping clients achieve similar success.",
      testimonial: "The investment scoring feature is incredible. I can quickly evaluate dozens of properties and focus on the ones with real potential.",
      metrics: [
        { label: "Investment ROI", before: "8.2%", after: "23.7%", improvement: "+189%" },
        { label: "Properties Analyzed", before: "12/month", after: "67/month", improvement: "+458%" },
        { label: "Time per Analysis", before: "4 hours", after: "35 minutes", improvement: "-85%" },
        { label: "Deal Success Rate", before: "12%", after: "34%", improvement: "+183%" }
      ]
    }
  ];

  const industries = [
    { name: "Solo Agents", count: "847+", growth: "+340%" },
    { name: "Real Estate Teams", count: "124+", growth: "+280%" },
    { name: "Investment Firms", count: "67+", growth: "+425%" },
    { name: "Brokerages", count: "43+", growth: "+195%" }
  ];

  const successStats = [
    { metric: "Average Deal Increase", value: "247%", description: "Improvement in closed deals" },
    { metric: "Time to Market", value: "7.8 months", description: "Earlier than MLS listings" },
    { metric: "Client Satisfaction", value: "96.7%", description: "Would recommend to others" },
    { metric: "ROI on Platform", value: "1,247%", description: "Return on AgentRadar investment" }
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              Success Stories
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Real Results from Real Estate Professionals
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover how agents across Ontario are transforming their businesses with AgentRadar's 
              intelligence platform. See the actual numbers and strategies behind their success.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {successStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-900">{stat.metric}</div>
                  <div className="text-xs text-gray-600">{stat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industry Breakdown */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Across All Segments</h2>
            <p className="text-xl text-gray-600">AgentRadar delivers results for every type of real estate professional</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {industries.map((industry, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{industry.count}</div>
                  <div className="font-semibold text-gray-900 mb-2">{industry.name}</div>
                  <div className="text-green-600 font-medium text-sm">{industry.growth} avg growth</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Detailed Success Stories</h2>
            <p className="text-xl text-gray-600">In-depth analysis of how top agents achieve extraordinary results</p>
          </div>
          
          <div className="space-y-16">
            {caseStudies.map((study, index) => (
              <div key={study.id} className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                {/* Content */}
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className="bg-blue-100 text-blue-800">{study.category}</Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {study.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {study.timeline}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{study.title}</h3>
                  <p className="text-lg text-blue-600 font-medium mb-6">{study.client}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{study.results.dealIncrease}</div>
                      <div className="text-sm text-gray-600">Deal Increase</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{study.results.totalValue}</div>
                      <div className="text-sm text-gray-600">Total Value</div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Challenge</h4>
                      <p className="text-gray-600">{study.challenge}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Solution</h4>
                      <p className="text-gray-600">{study.solution}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Results</h4>
                      <p className="text-gray-600 mb-4">{study.outcome}</p>
                    </div>
                  </div>
                  
                  <blockquote className="border-l-4 border-blue-600 pl-6 py-4 bg-blue-50 rounded-r-lg mb-6">
                    <p className="text-gray-700 italic">"{study.testimonial}"</p>
                    <footer className="text-sm text-gray-600 mt-2">— {study.client}</footer>
                  </blockquote>
                  
                  <Button className="bg-gradient-to-r from-blue-600 to-orange-600">
                    View Full Case Study
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
                
                {/* Metrics */}
                <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-center">Key Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {study.metrics.map((metric, metricIndex) => (
                          <div key={metricIndex}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">{metric.label}</span>
                              <Badge className="bg-green-100 text-green-800">{metric.improvement}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Before: {metric.before}</span>
                              <span className="font-semibold text-gray-900">After: {metric.after}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-8 pt-6 border-t">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-orange-600">{study.results.properties}</div>
                            <div className="text-xs text-gray-600">Properties</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-purple-600">{study.results.avgAdvance}</div>
                            <div className="text-xs text-gray-600">Months Advance</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-blue-600">{study.timeline}</div>
                            <div className="text-xs text-gray-600">Timeline</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Write Your Own Success Story?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join over 1,200 agents who are already transforming their businesses with AgentRadar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Schedule a Demo
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
              <span>Setup support included</span>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}