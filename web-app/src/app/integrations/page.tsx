import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowRight,
  Zap,
  Database,
  Cloud,
  Code,
} from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Integrations | AgentRadar",
  description:
    "Connect AgentRadar with your favorite CRM, MLS, and real estate tools",
};

export default function IntegrationsPage() {
  const integrationCategories = [
    {
      title: "CRM Systems",
      description: "Sync leads and property data with your CRM",
      integrations: [
        {
          name: "Salesforce",
          logo: "/logos/salesforce.svg",
          status: "Available",
        },
        { name: "HubSpot", logo: "/logos/hubspot.svg", status: "Available" },
        {
          name: "Pipedrive",
          logo: "/logos/pipedrive.svg",
          status: "Available",
        },
        { name: "Zoho CRM", logo: "/logos/zoho.svg", status: "Coming Soon" },
        {
          name: "Microsoft Dynamics",
          logo: "/logos/dynamics.svg",
          status: "Coming Soon",
        },
      ],
    },
    {
      title: "MLS Platforms",
      description: "Connect to regional MLS systems",
      integrations: [
        { name: "Repliers", logo: "/logos/repliers.svg", status: "Available" },
        { name: "TREB", logo: "/logos/treb.svg", status: "Available" },
        { name: "CREA", logo: "/logos/crea.svg", status: "Available" },
        { name: "Regional MLS", logo: "/logos/mls.svg", status: "Custom" },
        { name: "IDX Solutions", logo: "/logos/idx.svg", status: "Available" },
      ],
    },
    {
      title: "Real Estate Tools",
      description: "Enhance your workflow with specialized tools",
      integrations: [
        { name: "DocuSign", logo: "/logos/docusign.svg", status: "Available" },
        { name: "BombBomb", logo: "/logos/bombbomb.svg", status: "Available" },
        { name: "Chime", logo: "/logos/chime.svg", status: "Available" },
        {
          name: "Top Producer",
          logo: "/logos/topproducer.svg",
          status: "Coming Soon",
        },
        {
          name: "Real Geeks",
          logo: "/logos/realgeeks.svg",
          status: "Coming Soon",
        },
      ],
    },
    {
      title: "Communication",
      description: "Stay connected with automated messaging",
      integrations: [
        { name: "Slack", logo: "/logos/slack.svg", status: "Available" },
        {
          name: "Microsoft Teams",
          logo: "/logos/teams.svg",
          status: "Available",
        },
        {
          name: "WhatsApp Business",
          logo: "/logos/whatsapp.svg",
          status: "Available",
        },
        { name: "SMS Platforms", logo: "/logos/sms.svg", status: "Available" },
        {
          name: "Email Marketing",
          logo: "/logos/email.svg",
          status: "Available",
        },
      ],
    },
  ];

  const apiFeatures = [
    {
      icon: Database,
      title: "REST API",
      description:
        "Full REST API access with comprehensive documentation and SDKs",
    },
    {
      icon: Cloud,
      title: "Webhooks",
      description:
        "Real-time notifications for property alerts and status changes",
    },
    {
      icon: Code,
      title: "Custom Integrations",
      description:
        "Work with our team to build custom integrations for your specific needs",
    },
    {
      icon: Zap,
      title: "Zapier Integration",
      description: "Connect to 5,000+ apps through our Zapier integration",
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
              <Link
                href="/features"
                className="text-gray-600 hover:text-gray-900"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900"
              >
                Pricing
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
            200+ Integrations Available
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Connect AgentRadar{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              To Your Stack
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Seamlessly integrate with your existing CRM, MLS, and real estate
            tools. Automate workflows and centralize your property intelligence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              View API Documentation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              Request Integration
            </Button>
          </div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {integrationCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {category.title}
                </h2>
                <p className="text-lg text-gray-600">{category.description}</p>
              </div>

              <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
                {category.integrations.map((integration, index) => (
                  <Card
                    key={index}
                    className="text-center hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <div className="w-8 h-8 bg-gray-300 rounded" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {integration.name}
                      </h3>
                      <Badge
                        variant={
                          integration.status === "Available"
                            ? "default"
                            : integration.status === "Coming Soon"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {integration.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* API Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Developer-Friendly API
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Build custom integrations with our comprehensive API and developer
              tools
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {apiFeatures.map((feature, index) => (
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

          <div className="text-center mt-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Explore API Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Integration Process */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Get up and running with integrations in minutes, not days
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-blue-600">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Connect</h3>
              <p className="text-gray-600">
                Choose your integration from our marketplace or use our API
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-blue-600">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Configure</h3>
              <p className="text-gray-600">
                Set up data mapping and automation rules in minutes
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-blue-600">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Automate</h3>
              <p className="text-gray-600">
                Sit back and let AgentRadar sync your data automatically
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Don&apos;t See Your Integration?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            We&apos;re constantly adding new integrations. Let us know what you
            need and we&apos;ll prioritize it for development.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Request Integration
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600"
            >
              Talk to Developer
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
