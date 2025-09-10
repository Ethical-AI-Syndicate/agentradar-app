import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowRight,
  Building,
  Users,
  Palette,
  Code,
  Shield,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "White Label Solutions | AgentRadar",
  description:
    "Launch your own real estate intelligence platform with AgentRadar's white-label solution",
};

export default function WhiteLabelPage() {
  const features = [
    {
      icon: Palette,
      title: "Custom Branding",
      description:
        "Complete brand customization with your logo, colors, and domain",
    },
    {
      icon: Code,
      title: "API Access",
      description: "Full API access to integrate with your existing systems",
    },
    {
      icon: Shield,
      title: "Data Security",
      description: "Enterprise-grade security with SOC 2 compliance",
    },
    {
      icon: Users,
      title: "Multi-Tenant",
      description: "Support for unlimited agents and brokerages",
    },
    {
      icon: Zap,
      title: "Fast Deployment",
      description: "Launch in 30 days with full technical support",
    },
    {
      icon: Building,
      title: "Enterprise Support",
      description: "24/7 dedicated support and account management",
    },
  ];

  const pricingTiers = [
    {
      name: "Startup",
      price: "$5,000",
      period: "/month",
      description: "Perfect for growing brokerages",
      features: [
        "Up to 100 agents",
        "Custom branding",
        "API access",
        "Email support",
        "Basic analytics",
      ],
    },
    {
      name: "Professional",
      price: "$15,000",
      period: "/month",
      description: "For established real estate companies",
      features: [
        "Up to 500 agents",
        "Advanced customization",
        "Full API suite",
        "Priority support",
        "Advanced analytics",
        "Custom integrations",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large franchises and enterprise clients",
      features: [
        "Unlimited agents",
        "Complete white-labeling",
        "Dedicated infrastructure",
        "24/7 support",
        "Custom development",
        "SLA guarantee",
      ],
    },
  ];

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
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">
                About
              </Link>
              <Link
                href="/features"
                className="text-gray-600 hover:text-gray-900"
              >
                Features
              </Link>
              <Link href="/contact">
                <Button>Contact Sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
            White Label Solution
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Launch Your Own{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Real Estate Platform
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Power your brokerage with AgentRadar&apos;s proven technology. Get a
            fully customized real estate intelligence platform under your brand
            in just 30 days.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Schedule Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              View Case Studies
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Launch
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our white-label solution includes all the tools and support you
              need to launch a successful real estate intelligence platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              White Label Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Choose the plan that fits your business size and growth plans
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <Card
                key={index}
                className={`relative ${tier.popular ? "border-blue-500 shadow-lg" : ""}`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {tier.price}
                    </span>
                    <span className="text-gray-600">{tier.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{tier.description}</p>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full mt-6 ${tier.popular ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                    variant={tier.popular ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Launch Your Platform?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join successful brokerages using AgentRadar&apos;s white-label
            solution to power their real estate intelligence platforms.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Schedule Consultation
            </Button>
            <Button size="lg" variant="outline">
              Download Brochure
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
