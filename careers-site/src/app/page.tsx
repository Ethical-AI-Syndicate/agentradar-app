'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Clock, Users, Briefcase, ArrowRight, Heart, Zap, Globe, Code, BarChart3, Shield } from 'lucide-react'

interface JobPosition {
  id: string
  title: string
  department: string
  location: string
  type: string
  posted: string
  description: string
  requirements: string[]
  isRemote: boolean
  isUrgent: boolean
}

export default function CareersHomePage() {
  const [selectedDepartment, setSelectedDepartment] = useState('All')

  const openPositions: JobPosition[] = [
    {
      id: '1',
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      location: 'Toronto, ON',
      type: 'Full-time',
      posted: '2 days ago',
      description: 'Join our engineering team to build the next generation of real estate intelligence platform.',
      requirements: ['5+ years React/Node.js', 'PostgreSQL experience', 'AWS/Cloud platforms'],
      isRemote: true,
      isUrgent: true
    },
    {
      id: '2',
      title: 'Data Scientist - Real Estate Analytics',
      department: 'Data Science',
      location: 'Remote',
      type: 'Full-time',
      posted: '1 week ago',
      description: 'Develop AI models and analytics to predict real estate market trends and opportunities.',
      requirements: ['PhD/Masters in Data Science', 'Python/R expertise', 'Real estate domain knowledge'],
      isRemote: true,
      isUrgent: false
    },
    {
      id: '3',
      title: 'Product Manager - AI Platform',
      department: 'Product',
      location: 'Vancouver, BC',
      type: 'Full-time',
      posted: '3 days ago',
      description: 'Lead product strategy for our AI-powered real estate intelligence features.',
      requirements: ['5+ years product management', 'AI/ML product experience', 'User-centric mindset'],
      isRemote: true,
      isUrgent: true
    },
    {
      id: '4',
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Montreal, QC',
      type: 'Full-time',
      posted: '5 days ago',
      description: 'Scale our infrastructure to handle millions of property data points and real-time analytics.',
      requirements: ['Kubernetes/Docker', 'AWS/GCP experience', 'Infrastructure as Code'],
      isRemote: true,
      isUrgent: false
    },
    {
      id: '5',
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      posted: '1 week ago',
      description: 'Design intuitive experiences for real estate professionals using our platform.',
      requirements: ['Figma/Sketch expertise', 'B2B SaaS experience', 'User research skills'],
      isRemote: true,
      isUrgent: false
    }
  ]

  const departments = ['All', 'Engineering', 'Data Science', 'Product', 'Design', 'Sales', 'Marketing']
  
  const filteredPositions = selectedDepartment === 'All' 
    ? openPositions 
    : openPositions.filter(pos => pos.department === selectedDepartment)

  const companyValues = [
    {
      icon: Zap,
      title: 'Innovation First',
      description: 'We push the boundaries of real estate technology with AI and data science.'
    },
    {
      icon: Users,
      title: 'Collaborative Culture',
      description: 'We believe the best ideas come from diverse teams working together.'
    },
    {
      icon: Globe,
      title: 'Remote-First',
      description: 'Work from anywhere while building the future of real estate intelligence.'
    },
    {
      icon: Heart,
      title: 'Impact Driven',
      description: 'Every feature we build helps real estate professionals succeed.'
    }
  ]

  const benefits = [
    'Competitive salary + equity',
    'Comprehensive health & dental',
    'Unlimited vacation policy',
    'Remote work stipend',
    'Learning & development budget',
    'Top-tier equipment',
    'Flexible working hours',
    'Stock option plan'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="https://agentradar.app" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AR</span>
                </div>
                <span className="text-xl font-bold text-gray-900">AgentRadar</span>
              </a>
              <span className="ml-2 text-sm text-gray-500">Careers</span>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="/" className="text-gray-600 hover:text-gray-900">Positions</a>
              <a href="/culture" className="text-gray-600 hover:text-gray-900">Culture</a>
              <a href="/benefits" className="text-gray-600 hover:text-gray-900">Benefits</a>
              <a href="/team" className="text-gray-600 hover:text-gray-900">Team</a>
              <a href="https://agentradar.app" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Back to App
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Build the Future of Real Estate
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join our mission to revolutionize real estate with AI-powered intelligence, data science, and cutting-edge technology that empowers professionals worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#positions" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                View Open Positions
              </a>
              <a href="#culture" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                Learn About Our Culture
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Team Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">$50M</div>
              <div className="text-gray-600">Series A Raised</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">95%</div>
              <div className="text-gray-600">Employee Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-16 bg-gray-50" id="culture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're building more than just software – we're creating a culture where innovation thrives and every team member can make a meaningful impact.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {companyValues.map((value, index) => (
              <div key={index} className="bg-white rounded-xl p-8 text-center shadow-sm border hover:shadow-md transition-shadow">
                <value.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 bg-white" id="positions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Open Positions</h2>
            <p className="text-xl text-gray-600">Join our team and help shape the future of real estate technology</p>
          </div>

          {/* Department Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedDepartment === dept
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Job Listings */}
          <div className="space-y-6">
            {filteredPositions.map((position) => (
              <div key={position.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{position.title}</h3>
                      {position.isUrgent && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                          🚀 Urgent
                        </span>
                      )}
                      {position.isRemote && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          🌍 Remote
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{position.department}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{position.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{position.type}</span>
                      </div>
                      <span>Posted {position.posted}</span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{position.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {position.requirements.slice(0, 3).map((req, index) => (
                        <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {req}
                        </span>
                      ))}
                      {position.requirements.length > 3 && (
                        <span className="text-gray-500 text-sm">+{position.requirements.length - 3} more</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <button className="w-full lg:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                      Apply Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPositions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No positions found in {selectedDepartment} department.</p>
              <p className="text-gray-400 mt-2">Check back soon or explore other departments!</p>
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Benefits & Perks</h2>
            <p className="text-xl text-gray-600">We invest in our team's success and well-being</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-medium text-gray-900">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Join Us?</h2>
          <p className="text-xl text-green-100 mb-8">
            Don't see a perfect fit? We're always interested in connecting with talented individuals who share our passion for real estate technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors">
              Send Us Your Resume
            </button>
            <a href="mailto:careers@agentradar.app" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors">
              Contact HR Team
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AR</span>
                </div>
                <span className="text-xl font-bold text-white">AgentRadar</span>
              </div>
              <p className="text-gray-400">
                Building the future of real estate technology with AI-powered intelligence and data science.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Careers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/positions" className="hover:text-white">Open Positions</a></li>
                <li><a href="/culture" className="hover:text-white">Culture</a></li>
                <li><a href="/benefits" className="hover:text-white">Benefits</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://agentradar.app/about" className="hover:text-white">About</a></li>
                <li><a href="https://blog.agentradar.app" className="hover:text-white">Blog</a></li>
                <li><a href="https://agentradar.app/press" className="hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:careers@agentradar.app" className="hover:text-white">careers@agentradar.app</a></li>
                <li><a href="https://community.agentradar.app" className="hover:text-white">Community</a></li>
                <li><a href="https://agentradar.app/contact" className="hover:text-white">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AgentRadar Careers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}