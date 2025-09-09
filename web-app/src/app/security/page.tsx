import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Eye, Server, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Security | AgentRadar",
  description: "Learn about AgentRadar's security measures and data protection",
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
              <span className="text-xl font-bold">AgentRadar</span>
            </Link>
            <Link href="/contact"><Button>Contact Us</Button></Link>
          </div>
        </div>
      </nav>

      <section className="pt-16 pb-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Enterprise-Grade{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Security
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your data security is our top priority. Learn about our comprehensive 
            security measures and compliance standards.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                icon: Shield,
                title: "SOC 2 Compliant",
                description: "Audited security controls"
              },
              {
                icon: Lock,
                title: "256-bit Encryption",
                description: "Data encrypted in transit and at rest"
              },
              {
                icon: Eye,
                title: "24/7 Monitoring",
                description: "Continuous security monitoring"
              },
              {
                icon: Server,
                title: "Secure Infrastructure",
                description: "Enterprise cloud hosting"
              }
            ].map((item, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Security Measures</h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Data Encryption</h3>
                  <p className="text-gray-700">All data is encrypted using AES-256 encryption both in transit and at rest.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Access Controls</h3>
                  <p className="text-gray-700">Multi-factor authentication and role-based access controls protect your account.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Regular Audits</h3>
                  <p className="text-gray-700">Third-party security audits and penetration testing ensure ongoing protection.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Compliance</h3>
                  <p className="text-gray-700">SOC 2, GDPR, and PIPEDA compliant with regular compliance assessments.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Incident Response</h3>
                  <p className="text-gray-700">24/7 security monitoring with immediate incident response procedures.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Questions About Security?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Our security team is available to answer any questions about our security practices.
          </p>
          
          <Button size="lg" variant="secondary">
            Contact Security Team
          </Button>
        </div>
      </section>
    </div>
  )
}