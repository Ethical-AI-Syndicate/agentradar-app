"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/footer"
import { 
  Zap, 
  Target, 
  Users, 
  CheckCircle,
  Award,
  Heart,
  ArrowRight,
  Linkedin,
  Mail
} from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const stats = [
    { label: "Properties Tracked", value: "2M+", description: "Across Ontario" },
    { label: "Hours Saved", value: "50K+", description: "For real estate professionals" },
    { label: "Success Rate", value: "94%", description: "Client satisfaction" },
    { label: "Market Coverage", value: "100%", description: "Ontario municipalities" }
  ]

  const values = [
    {
      icon: Target,
      title: "Precision First",
      description: "We deliver accurate, actionable intelligence that real estate professionals can trust to make million-dollar decisions."
    },
    {
      icon: Zap,
      title: "Speed Advantage",
      description: "Time is money in real estate. Our platform gives you the competitive edge by surfacing opportunities 6-12 months early."
    },
    {
      icon: Users,
      title: "Agent Success",
      description: "Every feature is built with real estate professionals in mind. Your success is our primary metric."
    },
    {
      icon: Heart,
      title: "Ethical Intelligence",
      description: "We believe in transparent, ethical data practices that respect privacy while empowering professionals."
    }
  ]

  const team = [
    {
      name: "Mike Holownych",
      role: "CEO & Founder",
      bio: "Entrepreneur and technology innovator building AgentRadar to revolutionize real estate intelligence. Passionate about helping agents find opportunities before they hit MLS.",
      linkedin: "https://www.linkedin.com/in/mikeholownych"
    }
  ]

  const milestones = [
    { year: "2025", title: "Company Founded", description: "AgentRadar launched September 7, 2025 with a vision to democratize real estate intelligence" },
    { year: "2025", title: "Platform Launch", description: "Launched MVP with power of sale and estate tracking capabilities" },
    { year: "2025", title: "AI Integration", description: "Built AI-powered opportunity scoring and market predictions" },
    { year: "2025", title: "Future Growth", description: "Planning expansion across Canada with mobile and desktop applications" },
    { year: "2026", title: "Investment Opportunity", description: "Open to conversations about pre-seed angel investment to accelerate market expansion" }
  ]

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
              About AgentRadar
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Revolutionizing Real Estate 
              <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent"> Intelligence</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We&apos;re on a mission to level the playing field in real estate by giving every agent, 
              regardless of size or connections, access to the same market intelligence that was 
              once reserved for the industry&apos;s elite.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{stat.label}</div>
                <div className="text-gray-600">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Born from Real Estate Frustration
              </h2>
              <div className="space-y-6 text-lg text-gray-600">
                <p>
                  AgentRadar was born from a simple but painful realization: the best deals in real estate 
                  never make it to MLS. While top agents with insider connections were scooping up 
                  power-of-sale properties and estate opportunities, hardworking agents were left fighting 
                  over the scraps.
                </p>
                <p>
                  Our founder, Mike Holownych, experienced this firsthand. As an entrepreneur, 
                  he watched million-dollar opportunities slip away simply because he didn&apos;t have 
                  access to the right information at the right time.
                </p>
                <p>
                  <strong>That&apos;s when everything changed.</strong> We realized that this information wasn&apos;t secret—it 
                  was just scattered across dozens of government databases, court filings, and municipal 
                  records. The challenge wasn&apos;t access; it was aggregation and intelligence.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-600 to-orange-600 p-8 rounded-2xl text-white">
                <h3 className="text-2xl font-bold mb-4">The AgentRadar Promise</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-blue-200 flex-shrink-0 mt-0.5" />
                    <span>Every agent gets access to the same intelligence</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-blue-200 flex-shrink-0 mt-0.5" />
                    <span>Opportunities identified 6-12 months early</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-blue-200 flex-shrink-0 mt-0.5" />
                    <span>AI-powered scoring prioritizes the best deals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-blue-200 flex-shrink-0 mt-0.5" />
                    <span>Transparent, ethical data practices</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide every decision we make and every feature we build
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center mb-6">
                    <value.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real estate veterans and tech innovators working together to transform the industry
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">{member.name}</h3>
                  <p className="text-blue-600 text-center mb-4">{member.role}</p>
                  <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
                  <div className="flex justify-center">
                    <a href={member.linkedin} className="text-blue-600 hover:text-blue-700">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From startup to industry leader, here&apos;s how we&apos;re revolutionizing real estate intelligence
            </p>
          </div>
          
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-8">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-2xl font-bold text-blue-600">{milestone.year}</span>
                    {milestone.title === "Investment Opportunity" ? (
                      <Link href="/investors">
                        <h3 className="text-xl font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors">{milestone.title} →</h3>
                      </Link>
                    ) : (
                      <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
                    )}
                  </div>
                  <p className="text-gray-600 text-lg">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Real Estate Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of agents who are already getting the intelligence advantage with AgentRadar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Contact Our Team
                <Mail className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}