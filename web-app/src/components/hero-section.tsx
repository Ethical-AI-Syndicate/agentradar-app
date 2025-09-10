"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight, Star, Users, MapPin, Clock } from "lucide-react";
import { EarlyAdopterForm } from "./early-adopter-form";
import { Navigation } from "./navigation";

export function HeroSection() {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Navigation */}
      <Navigation />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            style={{ opacity: 1 }}
            className="text-center lg:text-left"
          >
            {/* Social Proof Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ opacity: 1 }}
              className="inline-flex items-center space-x-2 mb-6"
            >
              <Badge
                variant="secondary"
                className="bg-orange-500/20 text-orange-300 border-orange-500/30"
              >
                <Users className="w-3 h-3 mr-1" />
                Join 1,200+ forward-thinking agents
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ opacity: 1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            >
              Find Tomorrow&apos;s{" "}
              <span className="bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
                Listings Today
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{ opacity: 1 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed"
            >
              Discover properties{" "}
              <strong className="text-orange-400">
                6-12 months before MLS
              </strong>{" "}
              through court filings, estate sales, and development applications.
              Build your pipeline with exclusive intelligence.
            </motion.p>

            {/* Value Props */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              style={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            >
              <div className="flex items-center space-x-2 text-gray-300">
                <Clock className="w-5 h-5 text-orange-400" />
                <span className="text-sm">6-12 Month Head Start</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span className="text-sm">Ontario Market Focus</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Star className="w-5 h-5 text-orange-400" />
                <span className="text-sm">AI-Powered Scoring</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              style={{ opacity: 1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 text-lg px-8 py-6 h-auto font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={() => setShowForm(true)}
              >
                Get Early Access (50% Off Lifetime)
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-lg px-8 py-6 h-auto font-semibold"
                onClick={() =>
                  document
                    .getElementById("demo")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Watch Demo
              </Button>
            </motion.div>

            {/* Risk Reversal */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              style={{ opacity: 1 }}
              className="text-sm text-gray-400 mt-6"
            >
              💳 No credit card required • ⚡ Setup in 2 minutes • 🔒 Cancel
              anytime
            </motion.p>
          </motion.div>

          {/* Right Column - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ opacity: 1 }}
            className="relative"
          >
            {/* Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ opacity: 1 }}
            >
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Property Intelligence Dashboard
                  </h3>
                  <Badge variant="destructive" className="bg-red-500">
                    Live
                  </Badge>
                </div>

                {/* Mock Property Alerts */}
                <div className="space-y-3">
                  {[
                    {
                      address: "123 Maple Street, Toronto",
                      type: "Power of Sale",
                      timeline: "6 months",
                      score: 92,
                      status: "Court Filed",
                    },
                    {
                      address: "456 Oak Avenue, Mississauga",
                      type: "Estate Sale",
                      timeline: "3 months",
                      score: 87,
                      status: "Probate Filed",
                    },
                    {
                      address: "789 Pine Road, Vaughan",
                      type: "Development",
                      timeline: "12 months",
                      score: 95,
                      status: "Municipal App",
                    },
                  ].map((property, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">
                            {property.address}
                          </p>
                          <p className="text-sm text-gray-300">
                            {property.type} • {property.timeline}
                          </p>
                          <p className="text-xs text-gray-400">
                            {property.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <span className="text-orange-400 font-bold">
                              {property.score}
                            </span>
                            <Star className="w-4 h-4 text-orange-400 fill-current" />
                          </div>
                          <p className="text-xs text-gray-400">
                            Opportunity Score
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">
                      Total Opportunities This Week
                    </span>
                    <span className="text-orange-400 font-bold">
                      47 Properties
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Floating Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              style={{ opacity: 1 }}
              className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-4 shadow-xl"
            >
              <div className="text-white text-center">
                <div className="text-2xl font-bold">+247%</div>
                <div className="text-xs opacity-90">Lead Generation</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: 10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              style={{ opacity: 1 }}
              className="absolute -bottom-4 -left-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-4 shadow-xl"
            >
              <div className="text-white text-center">
                <div className="text-2xl font-bold">6-12</div>
                <div className="text-xs opacity-90">Months Earlier</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Early Adopter Form Modal */}
      <EarlyAdopterForm open={showForm} onOpenChange={setShowForm} />
    </section>
  );
}
