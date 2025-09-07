'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, FileText, Shield, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChangelogPage() {
  const changes = [
    {
      version: '1.2.0',
      date: '2024-01-15',
      type: 'major',
      category: 'Terms of Service',
      title: 'Enhanced Data Processing Terms',
      description: 'Added detailed sections on AI-powered property analysis, updated data retention policies, and clarified user data ownership rights.',
      changes: [
        'Added AI Processing section (Section 4.3)',
        'Updated Data Retention policy to 7 years for transaction data',
        'Clarified intellectual property rights for user-generated content',
        'Enhanced third-party integration disclosure requirements'
      ]
    },
    {
      version: '1.1.8',
      date: '2024-01-10',
      type: 'minor',
      category: 'Privacy Policy',
      title: 'Cookie Consent Updates',
      description: 'Updated cookie consent mechanism to comply with latest GDPR requirements and added granular cookie controls.',
      changes: [
        'Enhanced cookie categorization (Essential, Analytics, Marketing)',
        'Added cookie consent withdrawal mechanism',
        'Updated third-party cookie disclosure list',
        'Improved cookie duration transparency'
      ]
    },
    {
      version: '1.1.7',
      date: '2024-01-05',
      type: 'patch',
      category: 'Terms of Service',
      title: 'Minor Clarifications',
      description: 'Clarified billing cycle definitions and updated contact information.',
      changes: [
        'Clarified pro-rata billing for plan changes',
        'Updated dispute resolution contact information',
        'Fixed typos in Section 8.2 and 8.4',
        'Added clarity to subscription cancellation process'
      ]
    },
    {
      version: '1.1.6',
      date: '2023-12-20',
      type: 'major',
      category: 'Privacy Policy',
      title: 'Data Subject Rights Enhancement',
      description: 'Comprehensive update to data subject rights section with new self-service portal capabilities.',
      changes: [
        'Added Data Portability section with export formats',
        'Enhanced Right to Erasure procedures',
        'Introduced automated data access request processing',
        'Updated data processing lawful basis documentation',
        'Added biometric data processing disclosure (mobile app features)'
      ]
    },
    {
      version: '1.1.5',
      date: '2023-12-15',
      type: 'minor',
      category: 'Terms of Service',
      title: 'API Usage Terms',
      description: 'Added comprehensive terms governing API access and third-party integrations.',
      changes: [
        'New Section 12: API Access and Usage',
        'Rate limiting and fair use policy',
        'Developer agreement requirements',
        'API key management responsibilities'
      ]
    },
    {
      version: '1.1.0',
      date: '2023-12-01',
      type: 'major',
      category: 'Both Documents',
      title: 'Mobile App Launch Updates',
      description: 'Comprehensive updates to support mobile application features including location services, camera access, and push notifications.',
      changes: [
        'Added mobile-specific data collection disclosures',
        'Enhanced location data processing terms',
        'Updated push notification consent mechanisms',
        'Added camera and photo library access policies',
        'Introduced offline data synchronization terms'
      ]
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'minor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'patch':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Terms of Service':
        return <FileText className="w-4 h-4" />;
      case 'Privacy Policy':
        return <Shield className="w-4 h-4" />;
      default:
        return <UserCheck className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/terms"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Terms
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Legal Document Changelog</h1>
              <p className="text-gray-600 mt-1">
                Track changes to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Navigation */}
        <div className="flex gap-2 mb-8">
          <Link 
            href="/terms"
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Terms of Service
          </Link>
          <Link 
            href="/privacy"
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Privacy Policy
          </Link>
          <div className="px-3 py-1.5 bg-indigo-600 border border-indigo-600 rounded-lg text-sm font-medium text-white">
            Change History
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {changes.map((change, index) => (
            <Card key={change.version} className="relative">
              {index !== changes.length - 1 && (
                <div className="absolute left-6 top-16 bottom-0 w-px bg-gray-200" />
              )}
              
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center relative z-10">
                    {getCategoryIcon(change.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{change.title}</CardTitle>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getTypeColor(change.type)}`}>
                        v{change.version}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {change.category}
                      </span>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(change.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="ml-16">
                <p className="text-gray-600 mb-4">{change.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Changes Made:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {change.changes.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full flex-shrink-0 mt-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay Informed</h3>
            <p className="text-gray-600 mb-4">
              We notify all users via email 30 days before any material changes to our Terms of Service or Privacy Policy take effect.
            </p>
            <div className="flex justify-center gap-3">
              <Link 
                href="/contact"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Contact Legal Team
              </Link>
              <Link 
                href="/help"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Get Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}