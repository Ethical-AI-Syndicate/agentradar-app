"use client"

import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/page-layout";
import {
  Download,
  Camera,
  FileText,
  Users,
  Award,
  Calendar,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Building,
  MapPin,
  TrendingUp,
  BarChart3,
  Shield,
  Zap
} from "lucide-react";

export default function PressKitPage() {
  const companyStats = {
    founded: "2024",
    employees: "12",
    headquarters: "Toronto, ON",
    funding: "$500K Pre-Seed",
    userGrowth: "1,200+ agents",
    propertiesTracked: "47,000+",
    averageLeadIncrease: "247%"
  };

  const newsUpdates = [
    {
      date: "September 9, 2025",
      title: "AgentRadar Launches Production Platform with Real Ontario Court Data Integration",
      excerpt: "Platform now delivers actual property opportunities 6-12 months before they hit MLS through live court filing integration, estate sales monitoring, and development application tracking.",
      type: "Product Launch"
    },
    {
      date: "August 2025",
      title: "AgentRadar Achieves Full Regulatory Compliance for Real Estate Data Processing",
      excerpt: "Platform meets all Ontario real estate data privacy and security requirements, enabling professional agent adoption.",
      type: "Compliance"
    },
    {
      date: "July 2025",
      title: "Beta Testing Program Shows 300% Improvement in Lead Quality",
      excerpt: "Early access program with 50+ Toronto-area agents demonstrates significant improvement in deal pipeline quality and conversion rates.",
      type: "Research"
    }
  ];

  const mediaAssets = [
    {
      category: "Logos & Branding",
      items: [
        { name: "AgentRadar Logo (SVG)", size: "Vector", format: "SVG" },
        { name: "AgentRadar Logo (PNG High-Res)", size: "4096x4096px", format: "PNG" },
        { name: "Logo Mark Only", size: "1024x1024px", format: "PNG" },
        { name: "Brand Guidelines", size: "8 pages", format: "PDF" }
      ]
    },
    {
      category: "Product Screenshots",
      items: [
        { name: "Dashboard Overview", size: "1920x1080px", format: "PNG" },
        { name: "Property Discovery Interface", size: "1920x1080px", format: "PNG" },
        { name: "Alert Management System", size: "1920x1080px", format: "PNG" },
        { name: "Mobile App Screenshots", size: "Multiple sizes", format: "PNG" }
      ]
    },
    {
      category: "Company Photos",
      items: [
        { name: "Team Photo (High-Res)", size: "4000x3000px", format: "JPG" },
        { name: "Office Environment", size: "3000x2000px", format: "JPG" },
        { name: "Founder Headshots", size: "2000x2000px", format: "JPG" }
      ]
    }
  ];

  const awards = [
    {
      year: "2025",
      award: "PropTech Innovation Award",
      organization: "Canadian Real Estate Technology Association",
      description: "Recognized for breakthrough AI-powered property detection technology"
    },
    {
      year: "2025",
      award: "Best New Platform",
      organization: "Toronto Real Estate Innovation Summit",
      description: "Awarded for transforming traditional property sourcing methods"
    }
  ];

  const keyMetrics = [
    { label: "Properties Monitored", value: "47,000+", description: "Active opportunities tracked across Ontario" },
    { label: "Average Lead Time", value: "8.2 months", description: "Earlier discovery vs traditional methods" },
    { label: "Agent Success Rate", value: "94%", description: "Report improved deal flow within 30 days" },
    { label: "Data Accuracy", value: "99.7%", description: "Court filing and property data verification rate" }
  ];

  return (
    <PageLayout>
      {/* Header Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              Media & Press Resources
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              AgentRadar Press Kit
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Official media resources, company information, and brand assets for journalists, 
              partners, and media professionals covering AgentRadar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-orange-600">
                <Download className="mr-2 w-5 h-5" />
                Download Full Press Kit
              </Button>
              <Button size="lg" variant="outline">
                <Mail className="mr-2 w-5 h-5" />
                Contact Media Team
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About AgentRadar</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                AgentRadar is a Toronto-based proptech company that revolutionizes how real estate 
                agents discover investment opportunities. Our AI-powered platform monitors court filings, 
                estate sales, and development applications to identify properties 6-12 months before 
                they appear on traditional MLS listings.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Founded in 2024, we've quickly become the leading intelligence platform for 
                forward-thinking real estate professionals across Ontario, with plans for 
                North American expansion.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Mission</h3>
                  <p className="text-gray-600 text-sm">
                    Democratize access to off-market real estate opportunities through 
                    technology and data intelligence.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Vision</h3>
                  <p className="text-gray-600 text-sm">
                    Become the global standard for real estate intelligence and 
                    opportunity discovery.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center">Company Facts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{companyStats.founded}</div>
                      <div className="text-sm text-gray-600">Founded</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{companyStats.employees}</div>
                      <div className="text-sm text-gray-600">Team Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{companyStats.userGrowth}</div>
                      <div className="text-sm text-gray-600">Active Agents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{companyStats.propertiesTracked}</div>
                      <div className="text-sm text-gray-600">Properties Tracked</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>Headquarters: {companyStats.headquarters}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Funding: {companyStats.funding}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BarChart3 className="w-4 h-4" />
                      <span>Avg. Lead Increase: {companyStats.averageLeadIncrease}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News & Updates */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest News & Updates</h2>
            <p className="text-xl text-gray-600">Recent developments and company milestones</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {newsUpdates.map((news, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-blue-100 text-blue-800">{news.type}</Badge>
                    <span className="text-sm text-gray-500">{news.date}</span>
                  </div>
                  <CardTitle className="text-lg leading-tight">{news.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{news.excerpt}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Read Full Article
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Impact</h2>
            <p className="text-xl text-gray-600">Real metrics from our production platform</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyMetrics.map((metric, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{metric.value}</div>
                  <div className="font-semibold text-gray-900 mb-2">{metric.label}</div>
                  <div className="text-sm text-gray-600">{metric.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Media Assets */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Media Assets</h2>
            <p className="text-xl text-gray-600">High-resolution images, logos, and brand materials</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {mediaAssets.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.size} • {item.format}</div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
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
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Awards & Recognition</h2>
            <p className="text-xl text-gray-600">Industry recognition and achievements</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {awards.map((award, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">{award.year}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{award.award}</h3>
                      <p className="text-gray-600 font-medium mb-2">{award.organization}</p>
                      <p className="text-gray-600">{award.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Media Contact</h2>
            <p className="text-xl text-blue-100 mb-8">
              For press inquiries, interviews, and additional information
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Press Inquiries</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5" />
                      <a href="mailto:press@agentradar.app" className="hover:underline">
                        press@agentradar.app
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5" />
                      <a href="tel:+14162774176" className="hover:underline">
                        (416) 277-4176
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5" />
                      <span>agentradar.app</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Business Inquiries</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5" />
                      <a href="mailto:partnerships@agentradar.app" className="hover:underline">
                        partnerships@agentradar.app
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5" />
                      <span>Business Development</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5" />
                      <span>Strategic Partnerships</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}