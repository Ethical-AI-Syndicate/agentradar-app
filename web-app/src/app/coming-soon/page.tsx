'use client';

import Link from 'next/link';
import { ArrowLeft, Clock, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function ComingSoonPage() {
  const title = "Coming Soon";
  const description = "This feature is currently in development.";
  const backLink = "/";
  const estimatedLaunch = "Q1 2026";
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-orange-600 flex items-center justify-center mb-6">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-gray-600 mb-6">{description}</p>
          {estimatedLaunch && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-blue-800">
                Estimated Launch: {estimatedLaunch}
              </p>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Get Notified When Available</h3>
            <div className="space-y-4">
              <Input 
                type="email" 
                placeholder="Enter your email address"
              />
              <Button className="w-full bg-gradient-to-r from-blue-600 to-orange-600">
                <Bell className="mr-2 h-4 w-4" />
                Notify Me
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              We&apos;ll send you one email when this feature is ready
            </p>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <Link 
            href={backLink}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {backLink === "/" ? "Home" : "Previous Page"}
          </Link>
          
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <Link href="/contact" className="hover:text-gray-700">Contact Support</Link>
            <span>•</span>
            <Link href="/help" className="hover:text-gray-700">Help Center</Link>
          </div>
        </div>
      </div>
    </div>
  );
}