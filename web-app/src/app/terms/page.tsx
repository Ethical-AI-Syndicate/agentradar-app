"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/footer"
import { 
  FileText,
  Scale,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Mail,
  User,
  CreditCard,
  Globe,
  Lock,
  Gavel,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

export default function TermsOfServicePage() {
  const lastUpdated = "January 15, 2025"

  const keyTerms = [
    {
      icon: User,
      title: "User Responsibilities",
      description: "Your obligations when using AgentRadar services and platform features."
    },
    {
      icon: CreditCard,
      title: "Billing & Subscriptions",
      description: "Payment terms, refund policies, and subscription management."
    },
    {
      icon: Shield,
      title: "Service Availability",
      description: "Platform uptime commitments and service level agreements."
    },
    {
      icon: Lock,
      title: "Data & Privacy",
      description: "How we handle your information in compliance with privacy laws."
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
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Clear, fair terms that govern your use of AgentRadar's real estate intelligence platform. 
              These terms are designed to protect both you and our service.
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

      {/* Key Terms Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Terms Overview</h2>
            <p className="text-xl text-gray-600">
              Quick reference to the most important sections of our terms
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyTerms.map((term, index) => (
              <Card key={index} className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <term.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{term.title}</h3>
                  <p className="text-gray-600 text-sm">{term.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          
          {/* Agreement to Terms */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Scale className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 m-0">Agreement to Terms</h2>
              </div>
              
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-600 mb-4">
                  By accessing or using AgentRadar ("the Service"), you agree to be bound by these Terms of Service 
                  and all applicable laws and regulations. If you do not agree with any part of these terms, 
                  you may not use our service.
                </p>
                
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 my-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">Professional Use Only</p>
                      <p className="text-blue-800 text-sm">
                        AgentRadar is intended for use by licensed real estate professionals, brokerages, 
                        and related industry participants. Personal or non-professional use is not permitted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 m-0">Service Description</h2>
              </div>
              
              <div className="space-y-6">
                <p className="text-gray-600">
                  AgentRadar provides real estate intelligence services including but not limited to:
                </p>
                
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>Property opportunity alerts from court filings, estate sales, and development applications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>Market analysis and property investment scoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>Real-time notifications and customizable search alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>API access for integration with existing real estate tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span>White-label platform solutions for brokerages</span>
                  </li>
                </ul>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-900">Service Limitations</p>
                      <p className="text-orange-800 text-sm">
                        AgentRadar provides information and intelligence tools. We do not guarantee the accuracy, 
                        completeness, or timeliness of all data. Users are responsible for verifying information 
                        before making business decisions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Accounts & Responsibilities */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 m-0">User Accounts & Responsibilities</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Registration</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Provide accurate and complete registration information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Maintain the security of your account credentials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Promptly update account information when changes occur</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Notify us immediately of any unauthorized account access</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Acceptable Use</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">✓ Permitted Uses</h4>
                      <ul className="text-green-800 text-sm space-y-1">
                        <li>• Professional real estate activities</li>
                        <li>• Market research and analysis</li>
                        <li>• Client property searches</li>
                        <li>• Investment opportunity identification</li>
                        <li>• Integration with licensed tools</li>
                      </ul>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">✗ Prohibited Uses</h4>
                      <ul className="text-red-800 text-sm space-y-1">
                        <li>• Scraping or bulk data extraction</li>
                        <li>• Sharing account access</li>
                        <li>• Reverse engineering the platform</li>
                        <li>• Harassment or spam activities</li>
                        <li>• Violating applicable laws</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing & Subscriptions */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 m-0">Billing & Subscriptions</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Payment Terms</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Subscription fees are billed monthly or annually in advance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Payment is due upon receipt of invoice or automatic billing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Late payments may result in service suspension after 30 days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>All fees are in Canadian dollars unless otherwise specified</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Refund Policy</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 mb-3">
                      <strong>30-Day Money-Back Guarantee:</strong> New subscribers can cancel within 
                      30 days of first payment for a full refund.
                    </p>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Monthly subscriptions: Prorated refunds for unused portions</li>
                      <li>• Annual subscriptions: Refunds available until 30 days after purchase</li>
                      <li>• Enterprise plans: Custom refund terms in service agreement</li>
                      <li>• Add-on services: Refunded if cancelled within billing cycle</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Cancellation & Changes</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                      <span>Cancel anytime through your account dashboard or by contacting support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                      <span>Service continues until the end of your current billing period</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                      <span>Plan upgrades take effect immediately; downgrades at next billing cycle</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Availability & Support */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 m-0">Service Availability & Support</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Level Agreement</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">99.5%</div>
                      <div className="text-green-800 font-medium">Uptime Guarantee</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">&lt;2h</div>
                      <div className="text-blue-800 font-medium">Support Response</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-1">24/7</div>
                      <div className="text-orange-800 font-medium">System Monitoring</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Maintenance & Downtime</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                      <span>Scheduled maintenance windows: Sundays 2-4 AM EST</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                      <span>72-hour advance notice for planned downtime via email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                      <span>Emergency maintenance may occur without prior notice</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 m-0">Intellectual Property</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Rights</h3>
                  <p className="text-gray-600 mb-4">
                    AgentRadar retains all rights, title, and interest in the Service, including all 
                    software, algorithms, data analysis methods, and proprietary intelligence systems.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                      <span>Proprietary algorithms and market analysis methodologies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                      <span>Platform interface, design, and user experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                      <span>Aggregated and processed real estate intelligence data</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Rights</h3>
                  <p className="text-gray-600 mb-4">
                    Subject to these terms and your subscription, you have a limited, non-exclusive, 
                    non-transferable right to access and use the Service for your professional real estate activities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Gavel className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 m-0">Limitation of Liability</h2>
              </div>
              
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900 mb-2">Important Legal Notice</p>
                      <p className="text-yellow-800 text-sm">
                        AgentRadar provides information and tools to assist in real estate activities. 
                        We are not responsible for investment decisions, property valuations, or business 
                        outcomes based on information from our platform. Users must conduct their own 
                        due diligence and verification.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Disclaimer</h3>
                  <p className="text-gray-600 mb-4">
                    The Service is provided "as is" and "as available." We make no warranties, express 
                    or implied, regarding the accuracy, completeness, or reliability of information provided.
                  </p>
                  
                  <p className="text-gray-600">
                    In no event shall AgentRadar be liable for any indirect, incidental, special, 
                    consequential, or punitive damages, including but not limited to lost profits, 
                    missed opportunities, or business interruption.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <RefreshCw className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 m-0">Termination</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Termination by You</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Cancel your subscription at any time through your account dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Access continues until the end of your current billing period</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>Data export available for 90 days after cancellation</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Termination by AgentRadar</h3>
                  <p className="text-gray-600 mb-4">
                    We may suspend or terminate your account for violations of these terms, including:
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                      <span>Non-payment of subscription fees after 30 days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                      <span>Violation of acceptable use policies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                      <span>Fraudulent activity or security violations</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Changes */}
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 m-0">Contact & Terms Changes</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Legal Questions</h3>
                  <p className="text-gray-600 mb-4">
                    Questions about these terms or need clarification on any provision? 
                    Our legal team is available to help.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="outline">
                      <Mail className="w-4 h-4 mr-2" />
                      legal@agentradar.app
                    </Button>
                    <Link href="/contact">
                      <Button>Contact Legal Team</Button>
                    </Link>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Changes to Terms</h3>
                  <p className="text-gray-600 mb-4">
                    We may update these terms to reflect changes in our services, legal requirements, 
                    or business practices. Significant changes will be communicated via email with 30 days notice.
                  </p>
                  <p className="text-sm text-gray-500">
                    Current version effective: {lastUpdated} • 
                    <Link href="/changelog" className="text-blue-600 hover:text-blue-700 ml-1">View change history</Link>
                  </p>
                </div>

                <div className="border-t pt-6">
                  <p className="text-sm text-gray-500">
                    These Terms of Service are governed by the laws of Ontario, Canada. 
                    Any disputes will be resolved in the courts of Toronto, Ontario.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}