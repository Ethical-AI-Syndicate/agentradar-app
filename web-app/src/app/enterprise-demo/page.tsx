'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EnterpriseDemo() {
  const [loading, setLoading] = useState(false);

  const contacts = [
    {
      name: 'Sarah Chen',
      title: 'Enterprise Sales Director',
      email: 'sarah@agentradar.app',
      phone: '+1-555-0123',
      timezone: 'PST (San Francisco)'
    },
    {
      name: 'Michael Torres',
      title: 'Solutions Architect',
      email: 'michael@agentradar.app', 
      phone: '+1-555-0124',
      timezone: 'EST (New York)'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Enterprise Real Estate Intelligence
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Transform your brokerage with AI-powered market intelligence, automated workflows, 
            and white-label solutions designed for enterprise scale.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Market Intelligence Platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h4 className="text-white font-semibold mb-2">AI-Powered Analytics</h4>
                <p>Advanced machine learning algorithms analyze market trends, predict property values, and identify investment opportunities before they hit the market.</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Automated Lead Generation</h4>
                <p>Our system continuously monitors court filings, estate sales, and development applications across multiple jurisdictions to surface high-value opportunities.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">White-Label Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div>
                <h4 className="text-white font-semibold mb-2">Custom Branding</h4>
                <p>Deploy our platform under your brokerage brand with custom colors, logos, and domain names. Your clients see only your brand.</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">API Integration</h4>
                <p>Seamlessly integrate with your existing CRM, MLS systems, and workflow tools through our comprehensive REST API.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-slate-800 rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Enterprise Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Advanced Analytics</h3>
              <p className="text-slate-400">Comprehensive market analysis with predictive modeling and trend forecasting.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Alerts</h3>
              <p className="text-slate-400">Instant notifications when new opportunities match your investment criteria.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Multi-Market Coverage</h3>
              <p className="text-slate-400">Monitor opportunities across multiple metropolitan areas and jurisdictions.</p>
            </div>
          </div>
        </div>

        <div className="text-center bg-slate-800 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Brokerage?</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Join leading brokerages who have increased their deal flow by 300% using AgentRadar's enterprise platform.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {contacts.map((contact, index) => (
              <div key={index} className="bg-slate-700 rounded-lg p-6">
                <h4 className="text-white font-semibold">{contact.name}</h4>
                <p className="text-blue-400 text-sm">{contact.title}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-4 h-4">📧</span>
                    <a href={'mailto:' + contact.email} className="hover:text-blue-400">
                      {contact.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-4 h-4">📞</span>
                    <a href={'tel:' + contact.phone} className="hover:text-blue-400">
                      {contact.phone}
                    </a>
                  </div>
                  <p className="text-slate-400 text-sm">{contact.timezone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}