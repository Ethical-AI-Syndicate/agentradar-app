"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, Users, TrendingDown, Target } from "lucide-react"

export function ProblemSection() {
  const problems = [
    {
      icon: Users,
      title: "Market Saturation",
      description: "Every agent is fighting over the same MLS listings",
      stat: "20+ agents",
      statDescription: "competing per listing",
      color: "text-red-500"
    },
    {
      icon: Clock,
      title: "Late Discovery",
      description: "By the time it hits MLS, you're already behind",
      stat: "0 days",
      statDescription: "head start on MLS",
      color: "text-orange-500"
    },
    {
      icon: TrendingDown,
      title: "Reactive Approach",
      description: "Always responding to the market instead of predicting it",
      stat: "80%",
      statDescription: "of agents are reactive",
      color: "text-yellow-500"
    }
  ]

  return (
    <section className="py-20 bg-gray-50" id="problem">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge variant="destructive" className="mb-4 bg-red-100 text-red-800 border-red-200">
              <AlertTriangle className="w-4 h-4 mr-1" />
              The Problem Every Agent Faces
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              The Real Estate Game Has{" "}
              <span className="text-red-600">Changed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Traditional prospecting methods are failing. While you&apos;re competing for MLS scraps, 
              smart agents are building relationships with sellers months before they list.
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 h-full bg-white border-l-4 border-l-gray-200 hover:border-l-red-500 transition-colors duration-300 shadow-lg hover:shadow-xl">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-full bg-gray-100 mr-4`}>
                    <problem.icon className={`w-6 h-6 ${problem.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{problem.title}</h3>
                </div>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {problem.description}
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className={`text-3xl font-bold mb-1 ${problem.color}`}>
                    {problem.stat}
                  </div>
                  <div className="text-sm text-gray-500">
                    {problem.statDescription}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pain Point Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 lg:p-12 border border-red-100"
        >
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">😤</div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Sound Familiar?
            </h3>
            
            <div className="text-lg text-gray-700 space-y-4 text-left lg:text-center max-w-3xl mx-auto">
              <p className="italic">
                &quot;I saw the listing hit MLS at 9 AM. By 9:30 AM, there were already 12 agents who had called the seller. 
                By noon, there were showings booked for the entire weekend.&quot;
              </p>
              
              <p className="font-medium text-red-600">
                The agents who win aren&apos;t the ones who respond fastest to MLS listings...
              </p>
              
              <p className="text-xl font-semibold text-gray-900">
                They&apos;re the ones who <span className="text-red-600">knew about the opportunity 6-12 months earlier</span> 
                through public records most agents never see.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-red-500" />
                <span>Court filings predict power of sale listings</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-red-500" />
                <span>Estate filings predict probate sales</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-red-500" />
                <span>Development apps predict new construction</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}