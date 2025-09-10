"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/page-layout";
import {
  MapPin,
  Clock,
  DollarSign,
  Users,
  Building,
  Heart,
  Code,
  BarChart3,
  Briefcase,
  ArrowRight,
  Loader2
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  description: string;
  requirements: string;
  benefits: string;
  remoteWork: boolean;
  experienceLevel: string;
  applicationsCount: number;
  daysPosted: number;
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${window.location.origin}/api/careers/jobs`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description:
        "Comprehensive health coverage, dental, vision, and mental health support",
    },
    {
      icon: Clock,
      title: "Flexible Schedule",
      description: "Remote-first culture with flexible hours and unlimited PTO",
    },
    {
      icon: DollarSign,
      title: "Competitive Pay",
      description:
        "Top-tier compensation with equity participation and performance bonuses",
    },
    {
      icon: Users,
      title: "Amazing Team",
      description:
        "Work with brilliant, passionate people who love real estate and technology",
    },
    {
      icon: Building,
      title: "Growth Opportunities",
      description:
        "Clear career progression paths and learning & development budget",
    },
    {
      icon: BarChart3,
      title: "Impact & Ownership",
      description:
        "Make real impact on the industry with full autonomy over your work",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading career opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>

      {/* Hero Section */}
      <section className="pt-16 pb-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
            🚀 We're Hiring!
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Build the Future of{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Real Estate Intelligence
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join our mission to democratize real estate intelligence. We're a
            fast-growing team helping thousands of agents and investors find
            their next big opportunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button className="bg-blue-600 hover:bg-blue-700">
              View Open Positions
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline">Learn About Our Culture</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">47+</div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">3</div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">340%</div>
              <div className="text-sm text-gray-600">Growth Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">98%</div>
              <div className="text-sm text-gray-600">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Work at AgentRadar?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We believe in creating an environment where talented people can do
              their best work while building something meaningful together.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="font-semibold text-lg">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Open Positions
            </h2>
            <p className="text-lg text-gray-600">
              Join our growing team and make an impact from day one
            </p>
          </div>
          <div className="space-y-6">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {job.department}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.employmentType.replace('_', '-')}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {job.salaryRange}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4 lg:mt-0">
                      <Link href={`/careers/${job.id}`}>
                        <Button>Apply Now</Button>
                      </Link>
                      <Link href={`/careers/${job.id}`}>
                        <Button variant="outline">Learn More</Button>
                      </Link>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6">{job.description}</p>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Key Requirements:
                    </h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {job.requirements.split('\n').map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          {req.replace('• ', '')}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </PageLayout>
  );
}