'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock, Activity, Database, Globe, Server, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';

interface Service {
  name: string;
  status: ServiceStatus;
  description: string;
  icon: React.ReactNode;
  uptime: string;
  responseTime: string;
}

export default function StatusPage() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const services: Service[] = [
    {
      name: 'Web Application',
      status: 'operational',
      description: 'Main web platform and dashboard',
      icon: <Globe className="w-5 h-5" />,
      uptime: '99.97%',
      responseTime: '342ms'
    },
    {
      name: 'API Services',
      status: 'operational',
      description: 'RESTful API and authentication',
      icon: <Server className="w-5 h-5" />,
      uptime: '99.95%',
      responseTime: '178ms'
    },
    {
      name: 'Database',
      status: 'operational',
      description: 'PostgreSQL database cluster',
      icon: <Database className="w-5 h-5" />,
      uptime: '99.99%',
      responseTime: '12ms'
    },
    {
      name: 'Property Scrapers',
      status: 'operational',
      description: 'Real estate data collection services',
      icon: <Activity className="w-5 h-5" />,
      uptime: '99.89%',
      responseTime: '2.1s'
    },
    {
      name: 'Alert System',
      status: 'degraded',
      description: 'Push notifications and email alerts',
      icon: <Zap className="w-5 h-5" />,
      uptime: '98.7%',
      responseTime: '890ms'
    },
    {
      name: 'MCP Integration',
      status: 'operational',
      description: 'Model Context Protocol services',
      icon: <CheckCircle className="w-5 h-5" />,
      uptime: '99.94%',
      responseTime: '245ms'
    }
  ];

  const getStatusColor = (status: ServiceStatus): string => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'outage':
        return 'text-red-600 bg-red-100';
      case 'maintenance':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: ServiceStatus): React.ReactNode => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'outage':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'maintenance':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: ServiceStatus): string => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded':
        return 'Degraded Performance';
      case 'outage':
        return 'Service Outage';
      case 'maintenance':
        return 'Scheduled Maintenance';
      default:
        return 'Unknown';
    }
  };

  const overallStatus = services.some(s => s.status === 'outage') ? 'outage' :
                       services.some(s => s.status === 'degraded') ? 'degraded' :
                       services.some(s => s.status === 'maintenance') ? 'maintenance' : 'operational';

  const incidents = [
    {
      id: 1,
      title: 'Alert System Performance Degradation',
      status: 'investigating',
      severity: 'minor',
      startTime: '2024-01-15 14:30 UTC',
      description: 'We are currently experiencing slower than normal response times for push notifications and email alerts. Our team is actively investigating the issue.',
      updates: [
        {
          time: '2024-01-15 15:45 UTC',
          message: 'We have identified the root cause and are implementing a fix. Email alerts are now processing normally.'
        },
        {
          time: '2024-01-15 14:30 UTC',
          message: 'We are investigating reports of delayed push notifications.'
        }
      ]
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/help"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Help
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
                <p className="text-gray-600 mt-1">
                  Current status of AgentRadar services
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(overallStatus)}`}>
                {getStatusIcon(overallStatus)}
                All Systems {getStatusText(overallStatus)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Incidents */}
        {incidents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Incidents</h2>
            <div className="space-y-4">
              {incidents.map((incident) => (
                <Card key={incident.id} className="border-yellow-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{incident.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          {incident.severity.toUpperCase()} • Started {incident.startTime}
                        </CardDescription>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        {incident.status.toUpperCase()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{incident.description}</p>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Updates:</h4>
                      {incident.updates.map((update, index) => (
                        <div key={index} className="flex gap-3 text-sm">
                          <span className="text-gray-500 w-32 flex-shrink-0">{update.time}</span>
                          <span className="text-gray-700">{update.message}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Services Status */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Services</h2>
          <div className="space-y-4">
            {services.map((service, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {service.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500">Uptime</p>
                        <p className="font-medium">{service.uptime}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Response</p>
                        <p className="font-medium">{service.responseTime}</p>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                        {getStatusIcon(service.status)}
                        {getStatusText(service.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Uptime Chart Placeholder */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>30-Day Uptime History</CardTitle>
            <CardDescription>Daily uptime percentage for all services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Uptime chart visualization would be displayed here</p>
                <p className="text-sm text-gray-500">Historical data: 99.96% average uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscribe to Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Stay Updated</CardTitle>
            <CardDescription>
              Get notified about service incidents and maintenance windows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                Subscribe
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              You can also follow us on social media or check back here for updates
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}