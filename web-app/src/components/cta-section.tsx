"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Clock,
  Star,
  Users,
  Zap,
  TrendingUp,
  Target,
  Gift,
  Sparkles,
} from "lucide-react";
import { EarlyAdopterForm } from "./early-adopter-form";

export function CTASection() {
  const [showForm, setShowForm] = useState(false);

  const urgencyPoints = [
    {
      icon: Clock,
      text: "Limited Early Adopter Spots",
      subtext: "Only 500 more available",
    },
    {
      icon: TrendingUp,
      text: "50% OFF Lifetime Pricing",
      subtext: "Never pay full price again",
    },
    {
      icon: Target,
      text: "Get First-Mover Advantage",
      subtext: "Before your competition knows we exist",
    },
  ];

  const socialProof = [
    "1,200+ agents already signed up",
    "Average 247% pipeline increase",
    "6-12 month competitive advantage",
    "$127M+ in sales volume generated",
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        {/* Main CTA Content */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            style={{ opacity: 1 }}
          >
            {/* Urgency Badge */}
            <Badge className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 border-0 text-white px-4 py-2 text-base animate-pulse">
              <Sparkles className="w-4 h-4 mr-2" />
              Early Adopter Pricing Ends Soon
            </Badge>

            {/* Headline */}
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8">
              Stop Competing.
              <br />
              Start{" "}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Dominating.
              </span>
            </h2>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              While other agents chase MLS listings, you&apos;ll be building
              relationships with sellers
              <strong className="text-orange-400">
                {" "}
                6-12 months earlier
              </strong>{" "}
              through exclusive property intelligence.
            </p>
          </motion.div>
        </div>

        {/* Urgency Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          style={{ opacity: 1 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {urgencyPoints.map((point, index) => (
            <Card
              key={index}
              className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center"
            >
              <div className="inline-flex p-3 rounded-full bg-orange-500/20 mb-4">
                <point.icon className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{point.text}</h3>
              <p className="text-gray-300 text-sm">{point.subtext}</p>
            </Card>
          ))}
        </motion.div>

        {/* Main CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          style={{ opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 text-xl px-12 py-8 h-auto font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              data-early-adopter-trigger
            >
              <Gift className="mr-3 h-6 w-6" />
              Claim My Early Adopter Benefits
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </div>

          {/* Risk Reversal */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">✓</span>
              </div>
              <span>30-day money-back guarantee</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">✓</span>
              </div>
              <span>No setup fees or contracts</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">✓</span>
              </div>
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>

        {/* Social Proof Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          style={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-gray-400 mb-4">
            Trusted by successful agents across Ontario:
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {socialProof.map((proof, index) => (
              <div
                key={index}
                className="flex items-center justify-center gap-2 text-gray-300"
              >
                <Star className="w-4 h-4 text-orange-400 fill-current flex-shrink-0" />
                <span>{proof}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Final Urgency Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          style={{ opacity: 1 }}
          className="mt-16 text-center max-w-3xl mx-auto"
        >
          <Card className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border-red-500/30 p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">
              Don&apos;t Let Your Competition Get There First
            </h3>
            <p className="text-red-100 mb-6 leading-relaxed">
              Every day you wait is another day your competition could discover
              AgentRadar. The agents who get early access will have an
              insurmountable advantage in their markets. This opportunity
              won&apos;t last long.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-red-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>500 early adopter spots remaining</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Limited time pricing</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Early Adopter Form Modal */}
      <EarlyAdopterForm open={showForm} onOpenChange={setShowForm} />
    </section>
  );
}
