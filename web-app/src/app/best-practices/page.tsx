import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, TrendingUp, Users, CheckCircle, Star, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Best Practices | AgentRadar",
  description: "Proven strategies and best practices for maximizing success with real estate intelligence",
}

export default function BestPracticesPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
              <span className="text-xl font-bold">AgentRadar</span>
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link href="/contact">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-16 pb-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
            Expert Strategies
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Real Estate Intelligence{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Best Practices
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Learn from top-performing agents who've increased their deal flow by 300%+ using 
            AgentRadar's intelligence platform. Discover proven strategies and tactics.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Alert Optimization",
                description: "Set up smart filters to receive only the highest-quality opportunities",
                practices: [
                  "Focus on 3-5 key cities maximum",
                  "Set opportunity score threshold >80",
                  "Use property type filters strategically",
                  "Enable mobile notifications for urgent alerts"
                ]
              },
              {
                icon: TrendingUp,
                title: "Opportunity Evaluation", 
                description: "Quickly assess property potential using our scoring system",
                practices: [
                  "Review opportunity score first",
                  "Check comparable sales in area",
                  "Analyze timeline to market",
                  "Verify property details independently"
                ]
              },
              {
                icon: Users,
                title: "Lead Conversion",
                description: "Turn property intelligence into closed deals",
                practices: [
                  "Contact property owners within 24 hours",
                  "Prepare market analysis in advance",
                  "Build relationships with probate lawyers",
                  "Follow up consistently with prospects"
                ]
              }
            ].map((practice, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <practice.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{practice.title}</CardTitle>
                  <p className="text-gray-600">{practice.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {practice.practices.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Implement These Strategies?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Start your free trial and put these proven best practices to work today.
          </p>
          
          <Button size="lg" variant="secondary">
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  )
}