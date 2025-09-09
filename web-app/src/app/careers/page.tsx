import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, DollarSign, Users, Building, Heart, Code, BarChart3, Headphones, Briefcase, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Careers | AgentRadar",
  description: "Join AgentRadar and help revolutionize real estate intelligence. View our open positions and company culture.",
}

export default function CareersPage() {
  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health coverage, dental, vision, and mental health support"
    },
    {
      icon: Clock,
      title: "Flexible Schedule",
      description: "Remote-first culture with flexible hours and unlimited PTO"
    },
    {
      icon: DollarSign,
      title: "Competitive Pay",
      description: "Top-tier compensation with equity participation and performance bonuses"
    },
    {
      icon: Users,
      title: "Amazing Team",
      description: "Work with brilliant, passionate people who love real estate and technology"
    },
    {
      icon: Building,
      title: "Growth Opportunities",
      description: "Clear career progression paths and learning & development budget"
    },
    {
      icon: BarChart3,
      title: "Impact & Ownership",
      description: "Make real impact on the industry with full autonomy over your work"
    }
  ]

  const openPositions = [
    {
      id: 1,
      title: "Senior Full Stack Developer",
      department: "Engineering",
      location: "Toronto, ON (Remote OK)",
      type: "Full-time",
      salary: "$120k - $160k CAD",
      description: "Lead development of our core platform using React, Node.js, and PostgreSQL. Build features that help thousands of real estate professionals find their next big opportunity.",
      requirements: [
        "5+ years React/TypeScript experience",
        "Node.js and PostgreSQL expertise",
        "Experience with real-time systems",
        "Strong problem-solving skills"
      ]
    },
    {
      id: 2,
      title: "AI/ML Engineer",
      department: "Data Science",
      location: "Toronto, ON (Remote OK)",
      type: "Full-time", 
      salary: "$130k - $170k CAD",
      description: "Build and improve our property opportunity scoring algorithms. Work with large datasets to identify investment patterns and predict market trends.",
      requirements: [
        "MS/PhD in CS, Statistics, or related field",
        "3+ years Python/ML experience",
        "Experience with TensorFlow/PyTorch",
        "Real estate or finance domain knowledge preferred"
      ]
    },
    {
      id: 3,
      title: "Product Designer",
      department: "Design",
      location: "Toronto, ON (Hybrid)",
      type: "Full-time",
      salary: "$90k - $120k CAD",
      description: "Own the entire design process from user research to final implementation. Create intuitive interfaces that make complex real estate data accessible to everyone.",
      requirements: [
        "4+ years product design experience",
        "Figma/Adobe Creative Suite expertise", 
        "Strong UX research background",
        "B2B SaaS experience preferred"
      ]
    },
    {
      id: 4,
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Toronto, ON (Hybrid)",
      type: "Full-time",
      salary: "$70k - $95k CAD",
      description: "Help real estate professionals maximize their success with AgentRadar. Build relationships, provide training, and ensure customer satisfaction and growth.",
      requirements: [
        "3+ years customer success experience",
        "Real estate industry knowledge",
        "Excellent communication skills",
        "SaaS platform experience"
      ]
    },
    {
      id: 5,
      title: "Real Estate Data Analyst",
      department: "Research",
      location: "Toronto, ON (Remote OK)",
      type: "Full-time",
      salary: "$80k - $110k CAD",
      description: "Analyze court filings, municipal data, and market trends to identify property opportunities. Work directly with our AI team to improve detection algorithms.",
      requirements: [
        "Bachelor's in Economics, Statistics, or related",
        "2+ years data analysis experience",
        "SQL and Python proficiency",
        "Real estate market knowledge"
      ]
    },
    {
      id: 6,
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Toronto, ON (Remote OK)",
      type: "Full-time",
      salary: "$110k - $140k CAD",
      description: "Scale our infrastructure to handle millions of property records and thousands of concurrent users. Build robust, secure, and performant systems.",
      requirements: [
        "4+ years DevOps/Infrastructure experience",
        "AWS/GCP cloud platform expertise",
        "Docker/Kubernetes experience",
        "Security and compliance knowledge"
      ]
    }
  ]

  const companyStats = [
    { label: "Team Members", value: "47", suffix: "+" },
    { label: "Countries", value: "3", suffix: "" },
    { label: "Growth Rate", value: "340", suffix: "%" },
    { label: "Customer Satisfaction", value: "98", suffix: "%" }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
              <span className="text-xl font-bold">AgentRadar</span>
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/contact">
                <Button>Contact Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
            🚀 We're Hiring!
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Build the Future of{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Real Estate Intelligence
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join our mission to democratize real estate intelligence. We're a fast-growing team 
            helping thousands of agents and investors find their next big opportunity.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              View Open Positions
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              Learn About Our Culture
            </Button>
          </div>

          {/* Company Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {companyStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Work at AgentRadar?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We believe in creating an environment where talented people can do their best work 
              while building something meaningful together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Open Positions
            </h2>
            <p className="text-lg text-gray-600">
              Join our growing team and make an impact from day one
            </p>
          </div>

          <div className="space-y-6">
            {openPositions.map((position) => (
              <Card key={position.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {position.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {position.department}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {position.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {position.type}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {position.salary}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4 lg:mt-0">
                      <Button size="lg">Apply Now</Button>
                      <Button variant="outline" size="lg">Learn More</Button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6">
                    {position.description}
                  </p>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Key Requirements:</h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {position.requirements.map((req, reqIndex) => (
                        <div key={reqIndex} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          {req}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Culture & Values
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">🎯 Customer Obsession</h3>
                  <p className="text-gray-600">Every decision starts with our customers. We build what they need, not what we think is cool.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">🚀 Move Fast & Learn</h3>
                  <p className="text-gray-600">We ship quickly, measure results, and iterate. Failure is learning, and learning is growth.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">🤝 Radical Candor</h3>
                  <p className="text-gray-600">We care personally and challenge directly. Honest feedback makes everyone better.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">🌍 Think Big</h3>
                  <p className="text-gray-600">We're not just building software - we're transforming how real estate professionals work.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Life at AgentRadar</h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Code className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Tech Talks</div>
                      <div className="text-sm text-gray-600">Weekly knowledge sharing sessions</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Team Retreats</div>
                      <div className="text-sm text-gray-600">Quarterly in-person team building</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Growth Budget</div>
                      <div className="text-sm text-gray-600">$2,000 annual learning & development</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Join Our Mission?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Don't see the perfect role? We're always looking for exceptional talent. 
            Send us your resume and tell us how you'd like to contribute.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Send Us Your Resume
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Meet Our Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}