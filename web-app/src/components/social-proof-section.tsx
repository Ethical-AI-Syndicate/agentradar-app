"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Quote, TrendingUp, Users, Award, MapPin } from "lucide-react"

export function SocialProofSection() {
  const testimonials = [
    {
      quote: "AgentRadar gave us a 6-month head start on a $2.8M power of sale listing. We built a relationship with the owners before any other agent even knew about it. Game changer.",
      name: "Maria Santos",
      title: "Top 1% Agent, RE/MAX Elite", 
      location: "Toronto, ON",
      image: "/avatars/maria.jpg",
      initials: "MS",
      deals: "47 deals this year",
      rating: 5
    },
    {
      quote: "The estate sale alerts alone have generated over $180K in commissions. These opportunities never make it to MLS, so there's zero competition.",
      name: "Michael Rodriguez",
      title: "Investment Specialist",
      location: "Mississauga, ON", 
      image: "/avatars/michael.jpg",
      initials: "MR",
      deals: "Investment focus",
      rating: 5
    },
    {
      quote: "Our brokerage deployed the white-label version for our 200+ agents. The intelligence advantage has increased our market share by 23% in just 6 months.",
      name: "Jennifer Walsh",
      title: "Broker of Record",
      location: "Vaughan, ON",
      image: "/avatars/jennifer.jpg", 
      initials: "JW",
      deals: "200+ agents",
      rating: 5
    }
  ]

  const stats = [
    {
      number: "1,247",
      label: "Active Real Estate Professionals",
      icon: Users,
      color: "text-blue-600"
    },
    {
      number: "6,834", 
      label: "Properties Discovered Pre-MLS",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      number: "$127M",
      label: "In Sales Volume Generated", 
      icon: Award,
      color: "text-orange-600"
    },
    {
      number: "247%",
      label: "Average Pipeline Increase",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ]

  const recognitions = [
    {
      title: "Top PropTech Innovation 2024",
      organization: "Real Estate Innovation Council",
      logo: "/logos/reic.png"
    },
    {
      title: "Best New Technology Platform",
      organization: "Toronto Real Estate Board",
      logo: "/logos/treb.png"
    },
    {
      title: "Agent's Choice Award",
      organization: "Ontario Real Estate Association",
      logo: "/logos/orea.png"
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
              <Award className="w-4 h-4 mr-1" />
              Trusted by Industry Leaders
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Real Agents, Real{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Results
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Join over 1,200 forward-thinking real estate professionals who are already 
              building their competitive advantage with AgentRadar.
            </p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 text-center bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg">
                <div className={`inline-flex p-3 rounded-full bg-gray-100 mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`text-3xl font-bold mb-2 ${stat.color}`}>
                  {stat.number}
                </div>
                <div className="text-gray-600 text-sm">
                  {stat.label}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center text-gray-900 mb-12"
          >
            What Top Agents Are Saying
          </motion.h3>

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-8 h-full bg-white border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg relative">
                  {/* Quote Icon */}
                  <div className="absolute top-4 right-4">
                    <Quote className="w-6 h-6 text-gray-300" />
                  </div>

                  {/* Star Rating */}
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <blockquote className="text-gray-700 leading-relaxed mb-6 italic">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author Info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={testimonial.image} alt={testimonial.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.title}</div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {testimonial.location}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          {testimonial.deals}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recognition and Awards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-8">
            Recognized by Industry Leaders
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8 items-center justify-center">
            {recognitions.map((recognition, index) => (
              <div key={index} className="text-center">
                <div className="h-16 w-32 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-500 font-medium">
                    {recognition.organization}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {recognition.title}
                </h4>
                <p className="text-xs text-gray-600">
                  {recognition.organization}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600">
              Join the growing community of successful agents using intelligence-driven prospecting
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex -space-x-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-orange-400 border-2 border-white" />
                ))}
              </div>
              <span className="text-sm text-gray-600 ml-2">+1,200 agents</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}