'use client';

import React, { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/auth';

interface AnalyticsData {
  alertStats: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    bookmarked: number;
    viewed: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  };
  marketTrends: {
    averageOpportunityScore: number;
    averagePropertyValue: number;
    topCities: Array<{ city: string; count: number; avgValue: number }>;
    priceChangePercent: number;
    volumeChangePercent: number;
  };
  userActivity: {
    loginCount: number;
    lastLogin: string;
    alertsViewed: number;
    alertsBookmarked: number;
    searchCount: number;
  };
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    type: 'adjustment' | 'opportunity' | 'insight';
    priority: 'low' | 'medium' | 'high';
  }>;
}

export default function AnalyticsPage() {
  const auth = useRequireAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      fetchAnalytics();
    }
  }, [auth.isLoading, auth.isAuthenticated, timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/health?action=get-analytics&timeframe=${timeframe}`);
      
      if (response.data.success) {
        setData(response.data.analytics);
      } else {
        setError('Failed to fetch analytics');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Analytics fetch error:', err);
      
      // Mock data for development
      setData({
        alertStats: {
          total: 156,
          thisWeek: 24,
          thisMonth: 89,
          bookmarked: 12,
          viewed: 134,
          byType: {
            'POWER_OF_SALE': 78,
            'ESTATE_SALE': 34,
            'DEVELOPMENT_APPLICATION': 22,
            'MUNICIPAL_PERMIT': 22
          },
          byPriority: {
            'URGENT': 15,
            'HIGH': 45,
            'MEDIUM': 67,
            'LOW': 29
          }
        },
        marketTrends: {
          averageOpportunityScore: 76.8,
          averagePropertyValue: 1250000,
          topCities: [
            { city: 'Toronto', count: 45, avgValue: 1450000 },
            { city: 'Vaughan', count: 32, avgValue: 1120000 },
            { city: 'Mississauga', count: 28, avgValue: 980000 },
            { city: 'Brampton', count: 24, avgValue: 850000 }
          ],
          priceChangePercent: 8.2,
          volumeChangePercent: -5.3
        },
        userActivity: {
          loginCount: 47,
          lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          alertsViewed: 134,
          alertsBookmarked: 12,
          searchCount: 89
        },
        recommendations: [
          {
            id: '1',
            title: 'Expand Toronto Coverage',
            description: 'Toronto shows 67% higher opportunity scores than your current preferences',
            type: 'opportunity',
            priority: 'high'
          },
          {
            id: '2',
            title: 'Adjust Value Range',
            description: 'Consider increasing max value to $1.5M to capture 23% more opportunities',
            type: 'adjustment',
            priority: 'medium'
          },
          {
            id: '3',
            title: 'Power of Sale Trend',
            description: 'Power of Sale alerts increased 15% this month in your preferred areas',
            type: 'insight',
            priority: 'medium'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'bg-green-100 text-green-800 border-green-200';
      case 'adjustment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'insight': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'low':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  if (auth.isLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error || 'Failed to load analytics'}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Insights into your property intelligence</p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{data.alertStats.total}</p>
                <p className="text-xs text-green-600 mt-1">+{data.alertStats.thisWeek} this week</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19H6.931l1.99-8.637a2 2 0 011.929-1.495h.388a2 2 0 011.928 1.495L11 19z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Opportunity Score</p>
                <p className="text-2xl font-bold text-gray-900">{data.marketTrends.averageOpportunityScore}</p>
                <p className="text-xs text-green-600 mt-1">Above average</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Bookmarked</p>
                <p className="text-2xl font-bold text-gray-900">{data.alertStats.bookmarked}</p>
                <p className="text-xs text-gray-500 mt-1">{((data.alertStats.bookmarked / data.alertStats.total) * 100).toFixed(1)}% of total</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Property Value</p>
                <p className="text-2xl font-bold text-gray-900">${(data.marketTrends.averagePropertyValue / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-green-600 mt-1">+{data.marketTrends.priceChangePercent}% vs last period</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert Types Distribution */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Alert Types Distribution</h2>
            <div className="space-y-4">
              {Object.entries(data.alertStats.byType).map(([type, count]) => {
                const percentage = (count / data.alertStats.total * 100).toFixed(1);
                const displayType = type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{displayType}</span>
                      <span className="text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Priority Distribution</h2>
            <div className="space-y-4">
              {Object.entries(data.alertStats.byPriority).map(([priority, count]) => {
                const percentage = (count / data.alertStats.total * 100).toFixed(1);
                const colors = {
                  URGENT: 'bg-red-500',
                  HIGH: 'bg-orange-500',
                  MEDIUM: 'bg-yellow-500',
                  LOW: 'bg-green-500'
                };
                
                return (
                  <div key={priority}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 capitalize">{priority.toLowerCase()}</span>
                      <span className="text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${colors[priority as keyof typeof colors]} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Market Trends */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Markets</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">City</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Alert Count</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Avg. Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Market Share</th>
                </tr>
              </thead>
              <tbody>
                {data.marketTrends.topCities.map((city, index) => {
                  const totalCount = data.marketTrends.topCities.reduce((sum, c) => sum + c.count, 0);
                  const marketShare = ((city.count / totalCount) * 100).toFixed(1);
                  
                  return (
                    <tr key={city.city} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900">{city.city}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{city.count}</td>
                      <td className="py-3 px-4 text-gray-600">${city.avgValue.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${marketShare}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-600 text-xs">{marketShare}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Recommendations</h2>
          <div className="space-y-4">
            {data.recommendations.map((rec) => (
              <div key={rec.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-2 mt-1">
                  {getPriorityIcon(rec.priority)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900">{rec.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(rec.type)}`}>
                      {rec.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* User Activity Summary */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.userActivity.loginCount}</div>
              <div className="text-sm text-gray-500">Total Logins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.userActivity.alertsViewed}</div>
              <div className="text-sm text-gray-500">Alerts Viewed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.userActivity.alertsBookmarked}</div>
              <div className="text-sm text-gray-500">Bookmarks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.userActivity.searchCount}</div>
              <div className="text-sm text-gray-500">Searches</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last login: {new Date(data.userActivity.lastLogin).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}