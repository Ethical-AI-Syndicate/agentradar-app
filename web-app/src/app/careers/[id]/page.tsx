"use client"

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Footer } from "@/components/footer";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  ChevronRight,
  Upload,
  Loader2,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

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

export default function JobDetailsPage() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplication, setShowApplication] = useState(false);
  const [applicationData, setApplicationData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetter: '',
    experience: '',
    availability: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadJobDetails(params.id as string);
    }
  }, [params.id]);

  const loadJobDetails = async (jobId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${window.location.origin}/api/careers/jobs/${jobId}`);
      if (!response.ok) throw new Error('Job not found');
      const data = await response.json();
      setJob(data.job);
    } catch (error) {
      console.error('Failed to load job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${window.location.origin}/api/careers/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job?.id,
          ...applicationData
        })
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Application submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="border-b bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
                <span className="text-xl font-bold">AgentRadar</span>
              </Link>
            </div>
          </div>
        </nav>
        
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <Link href="/careers">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Careers
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="border-b bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
                <span className="text-xl font-bold">AgentRadar</span>
              </Link>
            </div>
          </div>
        </nav>
        
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-20 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for applying to {job.title}. Our HR team will review your application and get back to you within 5 business days.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/careers">
              <Button variant="outline">View More Jobs</Button>
            </Link>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
              <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link href="/careers" className="text-gray-600 hover:text-gray-900">Careers</Link>
              <Link href="/contact">
                <Button>Contact Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/careers" className="hover:text-gray-700">Careers</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">{job.title}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Job Details */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
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
              
              <div className="flex gap-4 mb-8">
                <Button 
                  onClick={() => setShowApplication(!showApplication)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {showApplication ? 'Hide Application' : 'Apply Now'}
                </Button>
                <Button variant="outline">
                  Share Job
                </Button>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                <div className="space-y-2">
                  {job.requirements.split('\n').map((req, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{req.replace('• ', '')}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Benefits</h2>
                <div className="space-y-2">
                  {job.benefits.split('\n').map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{benefit.replace('• ', '')}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Application Form */}
            {showApplication && (
              <div className="mt-12">
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for {job.title}</h2>
                    
                    <form onSubmit={handleApply} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <Input
                            required
                            value={applicationData.firstName}
                            onChange={(e) => setApplicationData(prev => ({...prev, firstName: e.target.value}))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <Input
                            required
                            value={applicationData.lastName}
                            onChange={(e) => setApplicationData(prev => ({...prev, lastName: e.target.value}))}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <Input
                            type="email"
                            required
                            value={applicationData.email}
                            onChange={(e) => setApplicationData(prev => ({...prev, email: e.target.value}))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <Input
                            value={applicationData.phone}
                            onChange={(e) => setApplicationData(prev => ({...prev, phone: e.target.value}))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cover Letter *
                        </label>
                        <Textarea
                          required
                          rows={4}
                          placeholder="Tell us why you're interested in this position..."
                          value={applicationData.coverLetter}
                          onChange={(e) => setApplicationData(prev => ({...prev, coverLetter: e.target.value}))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relevant Experience
                        </label>
                        <Textarea
                          rows={3}
                          placeholder="Describe your relevant experience..."
                          value={applicationData.experience}
                          onChange={(e) => setApplicationData(prev => ({...prev, experience: e.target.value}))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Availability
                        </label>
                        <Input
                          placeholder="When can you start?"
                          value={applicationData.availability}
                          onChange={(e) => setApplicationData(prev => ({...prev, availability: e.target.value}))}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {submitting ? (
                          <div className="flex items-center">
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Submitting Application...
                          </div>
                        ) : (
                          'Submit Application'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Quick Apply</h3>
                <Button 
                  onClick={() => setShowApplication(!showApplication)}
                  className="w-full mb-4"
                >
                  {showApplication ? 'Hide Application' : 'Apply Now'}
                </Button>
                <p className="text-sm text-gray-600">
                  Join our team and help revolutionize real estate intelligence.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Job Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{job.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{job.employmentType.replace('_', '-')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span className="font-medium">{job.experienceLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remote Work:</span>
                    <span className="font-medium">{job.remoteWork ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Applications:</span>
                    <span className="font-medium">{job.applicationsCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Share This Job</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Share</Button>
                  <Button variant="outline" size="sm" className="flex-1">Copy Link</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}