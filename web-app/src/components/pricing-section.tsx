"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  Star,
  Crown,
  Building,
  Users,
  ArrowRight,
  Gift,
} from "lucide-react";

export function PricingSection() {
  const [isEarlyAdopter, setIsEarlyAdopter] = useState(true);

  const plans = [
    {
      name: "Solo Agent",
      description: "Perfect for individual agents",
      icon: Users,
      price: isEarlyAdopter ? 49 : 197,
      originalPrice: 197,
      period: "/month",
      popular: false,
      features: [
        "Up to 500 property alerts/month",
        "Basic geographic filtering",
        "Email and SMS notifications",
        "Web and mobile access",
        "Basic analytics dashboard",
        "Email support",
        "Court filings monitoring",
        "Estate sales tracking",
      ],
      limitations: [
        "No development applications",
        "No team collaboration",
        "No white-label options",
      ],
    },
    {
      name: "Professional",
      description: "Most popular for active agents",
      icon: Star,
      price: isEarlyAdopter ? 97 : 197,
      originalPrice: 197,
      period: "/month",
      popular: true,
      features: [
        "Unlimited property alerts",
        "Advanced geographic filtering",
        "Real-time push notifications",
        "All platform access (web/mobile/desktop)",
        "Advanced analytics & reporting",
        "Priority support",
        "All data sources included",
        "AI opportunity scoring",
        "Custom alert criteria",
        "Export capabilities",
        "Integration with major CRMs",
      ],
      limitations: ["Up to 5 team members"],
    },
    {
      name: "Team Enterprise",
      description: "For teams and small brokerages",
      icon: Crown,
      price: "Custom",
      originalPrice: "Custom",
      period: " Pricing",
      popular: false,
      isCustom: true,
      features: [
        "Everything in Professional",
        "Unlimited team members",
        "Team collaboration tools",
        "Advanced role management",
        "Custom branding options",
        "API access",
        "Advanced integrations",
        "Custom reporting",
        "Dedicated account manager",
        "Priority feature requests",
        "SLA guarantee",
      ],
      limitations: [],
    },
  ];

  const enterpriseFeatures = [
    "White-label platform deployment",
    "Custom domain and branding",
    "Multi-tenant architecture",
    "Advanced security controls",
    "Custom integrations",
    "Dedicated infrastructure",
    "24/7 enterprise support",
    "Compliance reporting",
  ];

  return (
    <section
      className="py-20 bg-gradient-to-br from-gray-50 to-blue-50"
      id="pricing"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            style={{ opacity: 1 }}
          >
            <Badge className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
              <Gift className="w-4 h-4 mr-1" />
              Early Adopter Pricing
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                Intelligence Level
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              All plans include our core intelligence sources. Choose based on
              your team size and advanced feature needs.
            </p>

            {/* Early Adopter Toggle */}
            <div className="inline-flex items-center gap-4 p-2 bg-white rounded-lg border border-orange-200 shadow-sm">
              <span className="text-sm font-medium text-gray-700">
                Regular Pricing
              </span>
              <button
                onClick={() => setIsEarlyAdopter(!isEarlyAdopter)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isEarlyAdopter ? "bg-orange-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isEarlyAdopter ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-orange-600">
                Early Adopter (50% OFF Lifetime!)
              </span>
            </div>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              style={{ opacity: 1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-4 py-1 shadow-lg">
                    Most Popular
                  </Badge>
                </div>
              )}

              <Card
                className={`p-8 h-full relative ${
                  plan.popular
                    ? "border-2 border-orange-200 shadow-xl bg-gradient-to-br from-white to-orange-50"
                    : "border-2 border-gray-200 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
                }`}
              >
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div
                    className={`inline-flex p-3 rounded-full mb-4 ${
                      plan.popular ? "bg-orange-100" : "bg-gray-100"
                    }`}
                  >
                    <plan.icon
                      className={`w-6 h-6 ${
                        plan.popular ? "text-orange-600" : "text-gray-600"
                      }`}
                    />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  <div className="mb-6">
                    {plan.isCustom ? (
                      <>
                        <div className="flex items-baseline justify-center">
                          <span className="text-4xl font-bold text-gray-900">
                            {plan.price}
                          </span>
                          <span className="text-gray-600 ml-1">{plan.period}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Starting at $1,997/month
                        </div>
                      </>
                    ) : (
                      <>
                        {isEarlyAdopter && (
                          <div className="text-sm text-gray-500 line-through mb-1">
                            ${plan.originalPrice}
                            {plan.period}
                          </div>
                        )}
                        <div className="flex items-baseline justify-center">
                          <span className="text-4xl font-bold text-gray-900">
                            ${plan.price}
                          </span>
                          <span className="text-gray-600 ml-1">{plan.period}</span>
                        </div>
                        {isEarlyAdopter && (
                          <div className="text-sm font-medium text-orange-600 mt-1">
                            50% OFF Lifetime!
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <Button
                    size="lg"
                    className={`w-full font-semibold ${
                      plan.popular
                        ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                  >
                    {plan.popular ? "Get Started Now" : "Choose Plan"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    What&apos;s included:
                  </h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Limitations:
                      </h5>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, limitationIndex) => (
                          <li
                            key={limitationIndex}
                            className="text-xs text-gray-500"
                          >
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Enterprise Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{ opacity: 1 }}
          className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-8 lg:p-12 text-white text-center shadow-2xl"
        >
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex p-4 rounded-full bg-white/10 mb-6">
              <Building className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-3xl font-bold mb-4">
              Enterprise & Brokerage Solutions
            </h3>
            <p className="text-xl text-indigo-100 mb-8">
              Deploy AgentRadar as your own white-labeled platform for your
              entire brokerage. Custom branding, dedicated infrastructure, and
              enterprise-grade security.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
              {enterpriseFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-indigo-100">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold px-8"
              >
                Schedule Enterprise Demo
              </Button>
              <div className="text-indigo-200">
                <div className="font-semibold">Custom Pricing</div>
                <div className="text-sm">Starting at $2,997/month</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Money Back Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          style={{ opacity: 1 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-6 py-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-green-900">
                30-Day Money-Back Guarantee
              </div>
              <div className="text-sm text-green-700">
                Try AgentRadar risk-free. Cancel anytime in the first 30 days
                for a full refund.
              </div>
            </div>
          </div>

          <p className="text-gray-600 mt-6 text-sm">
            All plans include access to our core intelligence sources. No setup
            fees. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
