"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/footer"
import { 
  Shield,
  Lock,
  Eye,
  Database,
  Users,
  Mail,
  Globe,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
  Download
} from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  const lastUpdated = "January 15, 2025"

  const keyPrinciples = [
    {
      icon: Shield,
      title: "Data Protection First",
      description: "We employ enterprise-grade security measures to protect your personal and business information at all times."
    },
    {
      icon: Eye,
      title: "Transparency",
      description: "We clearly communicate what data we collect, how we use it, and provide you with full control over your information."
    },
    {
      icon: Lock,
      title: "Minimal Data Collection",
      description: "We only collect information necessary to provide our services and enhance your real estate intelligence experience."
    },
    {
      icon: Users,
      title: "Your Rights",
      description: "You maintain full rights to access, modify, or delete your personal data at any time through your account settings."
    }
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
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              Legal
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Your privacy is fundamental to our mission. This policy explains how we collect, 
              use, and protect your information while providing real estate intelligence services.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Last updated: {lastUpdated}</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <button className="text-blue-600 hover:text-blue-700">Download PDF</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Principles */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Privacy Principles</h2>
            <p className="text-xl text-gray-600">
              Four core commitments that guide how we handle your data
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyPrinciples.map((principle, index) => (
              <Card key={index} className="border-0 shadow-lg text-center">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <principle.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{principle.title}</h3>
                  <p className="text-gray-600 text-sm">{principle.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            {/* Information We Collect */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Database className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Information We Collect</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Information</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Name, email address, and phone number for account creation and communication</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Company/brokerage information for professional verification</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Real estate license information where applicable</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Billing and payment information for subscription management</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Usage Information</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Property searches, alerts, and saved properties for service optimization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Platform usage patterns to improve user experience and features</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Device and browser information for technical support and security</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>IP address and location data for service personalization and fraud prevention</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Communication Data</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Support tickets, chat logs, and email communications for customer service</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Feedback and survey responses to improve our services</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Information */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">How We Use Your Information</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Delivery</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Provide real estate intelligence, property alerts, and market analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Customize property recommendations based on your preferences and search history</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Send timely notifications about new opportunities and market changes</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Management</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Process payments and manage your subscription</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Provide customer support and respond to your inquiries</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Send important account updates and service announcements</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Product Improvement</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Analyze usage patterns to enhance platform features and performance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Conduct research and development for new real estate intelligence tools</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>Generate aggregated, anonymized insights to improve market predictions</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Information Sharing */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Information Sharing</h2>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800">We DO NOT sell your personal information</p>
                      <p className="text-green-700 text-sm">Your data is never sold to third parties for marketing purposes.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Limited Sharing Scenarios</h3>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                        <div>
                          <strong>Service Providers:</strong> Trusted vendors who help us operate our platform (payment processing, email delivery, cloud hosting)
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                        <div>
                          <strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights and users' safety
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                        <div>
                          <strong>Business Transfers:</strong> In the unlikely event of a merger, acquisition, or asset sale (with user notification)
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                        <div>
                          <strong>Your Consent:</strong> Any other sharing only with your explicit permission
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Data Security & Protection</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Safeguards</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                        <span>End-to-end encryption for all data transmission and storage</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                        <span>Regular security audits and penetration testing by third-party experts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                        <span>Multi-factor authentication and role-based access controls</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                        <span>Automated backup systems with geographic redundancy</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Operational Security</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                        <span>Employee background checks and mandatory security training</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                        <span>Principle of least privilege for data access</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                        <span>24/7 security monitoring and incident response team</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Your Privacy Rights</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="font-semibold text-blue-900 mb-2">Access & Portability</h3>
                      <p className="text-blue-800 text-sm mb-3">Request a copy of all personal data we have about you in a portable format.</p>
                      <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                        Request Data Export
                      </Button>
                    </div>
                    
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                      <h3 className="font-semibold text-orange-900 mb-2">Correction & Updates</h3>
                      <p className="text-orange-800 text-sm mb-3">Update or correct any inaccurate personal information in your account.</p>
                      <Button variant="outline" size="sm" className="border-orange-300 text-orange-700">
                        Update Profile
                      </Button>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="font-semibold text-green-900 mb-2">Deletion</h3>
                      <p className="text-green-800 text-sm mb-3">Request deletion of your personal data, subject to legal retention requirements.</p>
                      <Button variant="outline" size="sm" className="border-green-300 text-green-700">
                        Delete Account
                      </Button>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <h3 className="font-semibold text-purple-900 mb-2">Opt-Out</h3>
                      <p className="text-purple-800 text-sm mb-3">Control marketing communications and data processing preferences.</p>
                      <Button variant="outline" size="sm" className="border-purple-300 text-purple-700">
                        Manage Preferences
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cookies & Tracking */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Eye className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Cookies & Tracking Technologies</h2>
                </div>
                
                <div className="space-y-6">
                  <p className="text-gray-600">
                    We use cookies and similar technologies to enhance your experience, analyze usage, 
                    and provide personalized content. You can control cookie preferences through your browser settings.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Essential Cookies</h4>
                      <p className="text-gray-600 text-sm">Required for basic platform functionality and security.</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Performance Cookies</h4>
                      <p className="text-gray-600 text-sm">Help us analyze site usage and improve performance.</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Preference Cookies</h4>
                      <p className="text-gray-600 text-sm">Remember your settings and customize your experience.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Updates */}
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Mail className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 m-0">Contact Us & Policy Updates</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy Questions</h3>
                    <p className="text-gray-600 mb-4">
                      Have questions about this privacy policy or how we handle your data? 
                      Our privacy team is here to help.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button variant="outline">
                        <Mail className="w-4 h-4 mr-2" />
                        privacy@agentradar.app
                      </Button>
                      <Link href="/contact">
                        <Button>Contact Privacy Team</Button>
                      </Link>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Policy Updates</h3>
                    <p className="text-gray-600 mb-4">
                      We may update this privacy policy to reflect changes in our practices or for legal reasons. 
                      We'll notify you of significant changes via email or platform notification.
                    </p>
                    <p className="text-sm text-gray-500">
                      Current version effective: {lastUpdated} • 
                      <Link href="/changelog" className="text-blue-600 hover:text-blue-700 ml-1">View change history</Link>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}