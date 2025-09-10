'use client';

import React, { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/AdminLayout';
import { apiClient } from '@/lib/auth';

interface DashboardMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    supportTickets: {
      open: number;
      inProgress: number;
      resolved: number;
    };
    systemHealth: {
      status: 'healthy' | 'warning' | 'critical';
      uptime: number;
      responseTime: number;
    };
  };
  userMetrics: {
    newSignups: number;
    churnRate: number;
    subscriptionDistribution: Record<string, number>;
    geographicDistribution: Array<{ country: string; users: number }>;
  };
  contentMetrics: {
    blogPosts: { total: number; published: number; drafts: number };
    jobPostings: { total: number; active: number; applications: number };
    documentation: { pages: number; lastUpdated: string };
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'error' | 'success';
  }>;
}

export default function AdminDashboardPage() {
  const auth = useRequireAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      fetchDashboardMetrics();
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/health?action=admin-dashboard-metrics');
      
      if (response.data.success) {
        setMetrics(response.data.metrics);
      } else {
        setError('Failed to fetch dashboard metrics');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Dashboard metrics fetch error:', err);
      
      // Mock data for development
      setMetrics({
        overview: {
          totalUsers: 2847,
          activeUsers: 1923,
          totalRevenue: 89750,
          monthlyRecurringRevenue: 24650,
          supportTickets: {
            open: 23,
            inProgress: 15,
            resolved: 157
          },
          systemHealth: {
            status: 'healthy',
            uptime: 99.9,
            responseTime: 245
          }
        },
        userMetrics: {
          newSignups: 156,
          churnRate: 3.2,
          subscriptionDistribution: {
            'FREE': 1234,
            'SOLO_AGENT': 987,
            'PROFESSIONAL': 456,
            'TEAM_ENTERPRISE': 123,
            'WHITE_LABEL': 47
          },
          geographicDistribution: [
            { country: 'Canada', users: 1823 },
            { country: 'United States', users: 756 },
            { country: 'United Kingdom', users: 189 },
            { country: 'Australia', users: 79 }
          ]
        },
        contentMetrics: {
          blogPosts: { total: 87, published: 76, drafts: 11 },
          jobPostings: { total: 23, active: 15, applications: 234 },
          documentation: { pages: 156, lastUpdated: new Date().toISOString() }
        },
        recentActivity: [
          {
            id: '1',
            type: 'user_signup',
            description: 'New user registration: john.smith@realtor.com',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            severity: 'success'
          },
          {
            id: '2',
            type: 'system_alert',
            description: 'High API response time detected (>500ms)',
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            severity: 'warning'
          },
          {
            id: '3',
            type: 'support_ticket',
            description: 'New support ticket: Integration issue with MLS',
            timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
            severity: 'info'
          },
          {
            id: '4',
            type: 'payment',
            description: 'Subscription payment processed: $497 (Team Pro)',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            severity: 'success'
          },
          {
            id: '5',
            type: 'content',
            description: 'Blog post published: "2025 Real Estate Market Trends"',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            severity: 'info'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'warning':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
    }
  };

  if (auth.isLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !metrics) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error || 'Failed to load dashboard metrics'}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {auth.user?.firstName}! Here's your business overview.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Export Report
            </button>
            <button 
              onClick={fetchDashboardMetrics}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* System Health Alert */}
        <div className={`rounded-xl p-4 border ${
          metrics.overview.systemHealth.status === 'healthy' 
            ? 'bg-green-50 border-green-200' 
            : metrics.overview.systemHealth.status === 'warning'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              metrics.overview.systemHealth.status === 'healthy' ? 'bg-green-500' :
              metrics.overview.systemHealth.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="font-medium text-gray-900">
              System Status: {metrics.overview.systemHealth.status.charAt(0).toUpperCase() + metrics.overview.systemHealth.status.slice(1)}
            </span>
            <span className="text-sm text-gray-600">
              {metrics.overview.systemHealth.uptime}% uptime • {metrics.overview.systemHealth.responseTime}ms avg response
            </span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="admin-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Users</p>
                <p className="stat-value">{metrics.overview.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">
                  {metrics.overview.activeUsers} active ({((metrics.overview.activeUsers / metrics.overview.totalUsers) * 100).toFixed(1)}%)
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Monthly Revenue</p>
                <p className="stat-value">${metrics.overview.monthlyRecurringRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">
                  Total: ${metrics.overview.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Support Tickets</p>
                <p className="stat-value">{metrics.overview.supportTickets.open}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {metrics.overview.supportTickets.inProgress} in progress
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">New Signups</p>
                <p className="stat-value">{metrics.userMetrics.newSignups}</p>
                <p className="text-xs text-red-600 mt-1">
                  {metrics.userMetrics.churnRate}% churn rate
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content & Business Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="admin-card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Management</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Blog Posts</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{metrics.contentMetrics.blogPosts.published}/{metrics.contentMetrics.blogPosts.total}</div>
                  <div className="text-xs text-gray-500">{metrics.contentMetrics.blogPosts.drafts} drafts</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Job Postings</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{metrics.contentMetrics.jobPostings.active}/{metrics.contentMetrics.jobPostings.total}</div>
                  <div className="text-xs text-gray-500">{metrics.contentMetrics.jobPostings.applications} applications</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Documentation</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{metrics.contentMetrics.documentation.pages} pages</div>
                  <div className="text-xs text-gray-500">Last updated today</div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Distribution</h2>
            <div className="space-y-3">
              {Object.entries(metrics.userMetrics.subscriptionDistribution).map(([tier, count]) => {
                const percentage = ((count / metrics.overview.totalUsers) * 100).toFixed(1);
                const displayTier = tier.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{displayTier}</span>
                      <span className="text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="admin-card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Geographic Distribution</h2>
            <div className="space-y-3">
              {metrics.userMetrics.geographicDistribution.map((location) => {
                const percentage = ((location.users / metrics.overview.totalUsers) * 100).toFixed(1);
                
                return (
                  <div key={location.country} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{location.country}</span>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">{location.users}</div>
                      <div className="text-xs text-gray-500">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {metrics.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-2 mt-1">
                  {getSeverityIcon(activity.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {activity.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Manage Users</h3>
                <p className="text-xs text-gray-500">User accounts & permissions</p>
              </div>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-100 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Create Blog Post</h3>
                <p className="text-xs text-gray-500">Content management</p>
              </div>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-yellow-100 transition-colors">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Support Queue</h3>
                <p className="text-xs text-gray-500">Customer support</p>
              </div>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-100 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">View Analytics</h3>
                <p className="text-xs text-gray-500">Business insights</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}