import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Camera, FileText, Users, Award, Calendar, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Press Kit | AgentRadar",
  description: "Media resources, company information, and brand assets for AgentRadar",
}

export default function PressKitPage() {
  const pressReleases = [
    {
      date: "January 8, 2025",
      title: "AgentRadar Raises $2.5M Series A to Revolutionize Real Estate Intelligence",
      excerpt: "Canadian proptech startup secures funding to expand AI-powered property detection platform across North America",
      link: "#"
    },
    {
      date: "December 15, 2024",
      title: "AgentRadar Named 'Best PropTech Innovation' at Canadian Real Estate Awards",
      excerpt: "Platform's early detection technology recognized for transforming how agents discover off-market opportunities",
      link: "#"
    },
    {
      date: "November 22, 2024",
      title: "Study: Agents Using AgentRadar See 247% Increase in Deal Flow",
      excerpt: "Independent research shows significant improvement in lead generation and conversion rates",
      link: "#"
    }
  ]

  const mediaAssets = [
    {
      category: "Logos",
      items: [
        { name: "Primary Logo (PNG)", size: "2MB", format: "PNG" },
        { name: "Primary Logo (SVG)", size: "45KB", format: "SVG" },
        { name: "Logomark Only", size: "1.2MB", format: "PNG" },
        { name: "White Version", size: "1.8MB", format: "PNG" }
      ]
    },
    {
      category: "Screenshots",
      items: [
        { name: "Dashboard Overview", size: "3.2MB", format: "PNG" },
        { name: "Property Alerts", size: "2.8MB", format: "PNG" },
        { name: "Mobile App", size: "2.1MB", format: "PNG" },
        { name: "Analytics View", size: "3.5MB", format: "PNG" }
      ]
    },
    {
      category: "Team Photos",
      items: [
        { name: "CEO Headshot", size: "2.4MB", format: "JPG" },
        { name: "Team Photo", size: "4.1MB", format: "JPG" },
        { name: "Office Photos", size: "5.2MB", format: "ZIP" },
        { name: "Event Photos", size: "8.7MB", format: "ZIP" }
      ]
    }
  ]

  const keyFacts = [
    { label: "Founded", value: "2023" },
    { label: "Headquarters", value: "Toronto, Ontario" },
    { label: "Employees", value: "47+" },
    { label: "Customers", value: "1,200+ agents" },
    { label: "Properties Tracked", value: "50,000+ monthly" },
    { label: "Deal Flow Increase", value: "247% average" }
  ]

  const awards = [
    {
      year: "2024",
      award: "Best PropTech Innovation",
      organization: "Canadian Real Estate Awards",
      description: "Recognition for transforming real estate intelligence"
    },
    {
      year: "2024", 
      award: "Top 10 Startup to Watch",
      organization: "Tech Toronto",
      description: "Selected among most promising Toronto startups"
    },
    {
      year: "2024",
      award: "Innovation Award",
      organization: "Real Estate Council of Ontario",
      description: "Excellence in technology-driven solutions"
    }
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
            Media Resources
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AgentRadar{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Press Kit
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Everything you need to tell the AgentRadar story. Download our brand assets, 
            company information, and latest news resources.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-5 w-5" />
              Download Full Press Kit
            </Button>
            <Button size="lg" variant="outline">
              Contact Media Team
            </Button>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Company Overview
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                AgentRadar is Canada's leading real estate intelligence platform, helping agents 
                and investors discover property opportunities 6-12 months before they hit MLS. 
                Our AI-powered system analyzes court filings, estate sales, and municipal 
                applications to provide early alerts on distressed and off-market properties.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Founded in 2023 and based in Toronto, AgentRadar serves over 1,200 real estate 
                professionals across Ontario, with plans to expand across North America.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-gray-700">Tracks 50,000+ properties monthly</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-gray-700">247% average increase in deal flow</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-gray-700">AI-powered opportunity scoring</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Facts</h3>
              <div className="grid grid-cols-2 gap-6">
                {keyFacts.map((fact, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {fact.value}
                    </div>
                    <div className="text-sm text-gray-600">{fact.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Latest Press Releases
            </h2>
            <p className="text-lg text-gray-600">
              Stay up to date with AgentRadar's latest news and announcements
            </p>
          </div>

          <div className="space-y-6">
            {pressReleases.map((release, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">{release.date}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {release.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {release.excerpt}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-6">
                      <Button variant="outline">
                        Read Full Release
                        <ExternalLink className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Media Assets */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Brand Assets & Media Files
            </h2>
            <p className="text-lg text-gray-600">
              High-resolution logos, screenshots, and photos for media use
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {mediaAssets.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.format} • {item.size}</div>
                        </div>
                        <Download className="w-4 h-4 text-gray-500" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Recognition */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Awards & Recognition
            </h2>
            <p className="text-lg text-gray-600">
              Industry recognition for innovation and excellence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {awards.map((award, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-8 w-8 text-yellow-600" />
                  </div>
                  <CardTitle className="text-lg">{award.award}</CardTitle>
                  <div className="text-sm text-gray-500">{award.organization} • {award.year}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{award.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Media Contact */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Media Inquiries
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            For press inquiries, interviews, or additional resources, contact our media team
          </p>
          
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Mike Holownych</h3>
                <p className="text-gray-600 mb-1">CEO & Founder</p>
                <p className="text-blue-600">media@agentradar.app</p>
                <p className="text-gray-600">(416) 277-4176</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Media Relations</h3>
                <p className="text-gray-600 mb-1">Press & Communications</p>
                <p className="text-blue-600">press@agentradar.app</p>
                <p className="text-gray-600">Response within 4 hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}