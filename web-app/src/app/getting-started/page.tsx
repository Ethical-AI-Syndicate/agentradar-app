'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Play, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Getting Started with AgentRadar</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive onboarding guides and tutorials
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Under Development Notice */}
        <Card className="border-orange-200 bg-orange-50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 bg-orange-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-orange-800">Development in Progress</h3>
            </div>
            <p className="text-orange-700 mb-4">
              We&apos;re currently building comprehensive onboarding resources to help new users get started quickly and effectively with AgentRadar.
            </p>
            <p className="text-sm text-orange-600">
              <strong>Expected Launch:</strong> Q1 2026 • <strong>Current Status:</strong> Content Creation & Design
            </p>
          </CardContent>
        </Card>

        {/* Preview of Planned Content */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What&apos;s Coming</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Quick Start Videos</CardTitle>
                </div>
                <CardDescription>
                  Step-by-step video tutorials covering platform setup and basic features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Account setup and profile configuration</li>
                  <li>• Setting up your first property alerts</li>
                  <li>• Understanding the dashboard</li>
                  <li>• Interpreting opportunity scoring</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg">Comprehensive Guides</CardTitle>
                </div>
                <CardDescription>
                  Detailed written documentation with screenshots and examples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Complete feature walkthrough</li>
                  <li>• Best practices and strategies</li>
                  <li>• Advanced filtering techniques</li>
                  <li>• Integration with your CRM</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">Live Onboarding Sessions</CardTitle>
                </div>
                <CardDescription>
                  Scheduled group sessions with our product experts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Weekly group onboarding calls</li>
                  <li>• Q&A with platform experts</li>
                  <li>• Networking with other users</li>
                  <li>• Advanced strategy sessions</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                  <CardTitle className="text-lg">Resource Library</CardTitle>
                </div>
                <CardDescription>
                  Templates, checklists, and downloadable resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Property analysis templates</li>
                  <li>• Client communication scripts</li>
                  <li>• Market research checklists</li>
                  <li>• Success tracking spreadsheets</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Temporary Resources */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Now</h3>
          <div className="space-y-3">
            <Link href="/demo">
              <Button variant="outline" className="w-full justify-start">
                <Play className="mr-2 w-4 h-4" />
                Watch Platform Demo
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 w-4 h-4" />
                Schedule 1-on-1 Onboarding Call
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 w-4 h-4" />
                Browse Help Center
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}