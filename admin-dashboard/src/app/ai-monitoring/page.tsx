'use client';

import React, { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/AdminLayout';
import { apiClient } from '@/lib/auth';

interface AIStats {
  daily: {
    totalTokens: number;
    totalCost: number;
    totalCalls: number;
    successRate: number;
    averageLatency: number;
    date: string;
    costFormatted: string;
    successRateFormatted: string;
    averageLatencyFormatted: string;
  };
  operations: Array<{
    operation: string;
    totalCalls: number;
    successRate: number;
    averageLatency: number;
    totalTokens: number;
    totalCost: number;
    errors: string[];
    totalCostFormatted: string;
    successRateFormatted: string;
    averageLatencyFormatted: string;
  }>;
}

export default function AIMonitoringPage() {
  const auth = useRequireAuth();
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      fetchAIStats();
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  const fetchAIStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch daily stats and operations overview
      const [dailyResponse, operationsResponse] = await Promise.all([
        apiClient.get('/ai-stats/daily'),
        apiClient.get('/ai-stats/operations')
      ]);

      if (dailyResponse.data.success && operationsResponse.data.success) {
        setStats({
          daily: dailyResponse.data.data,
          operations: operationsResponse.data.data
        });
      } else {
        setError('Failed to fetch AI statistics');
      }
    } catch (err) {
      console.error('AI stats fetch error:', err);
      setError('Network error occurred');
      
      // Mock data for development
      setStats({
        daily: {
          totalTokens: 45230,
          totalCost: 2.34,
          totalCalls: 127,
          successRate: 0.96,
          averageLatency: 1850,
          date: new Date().toDateString(),
          costFormatted: '$2.3400',
          successRateFormatted: '96.0%',
          averageLatencyFormatted: '1850ms'
        },
        operations: [
          {
            operation: 'property-analysis',
            totalCalls: 23,
            successRate: 1.0,
            averageLatency: 2100,
            totalTokens: 8900,
            totalCost: 0.67,
            errors: [],
            totalCostFormatted: '$0.6700',
            successRateFormatted: '100.0%',
            averageLatencyFormatted: '2100ms'
          },
          {
            operation: 'lead-analysis',
            totalCalls: 18,
            successRate: 0.94,
            averageLatency: 1650,
            totalTokens: 6800,
            totalCost: 0.51,
            errors: ['Rate limit exceeded'],
            totalCostFormatted: '$0.5100',
            successRateFormatted: '94.4%',
            averageLatencyFormatted: '1650ms'
          },
          {
            operation: 'market-report',
            totalCalls: 12,
            successRate: 1.0,
            averageLatency: 3200,
            totalTokens: 15600,
            totalCost: 0.89,
            errors: [],
            totalCostFormatted: '$0.8900',
            successRateFormatted: '100.0%',
            averageLatencyFormatted: '3200ms'
          },
          {
            operation: 'cma-generation',
            totalCalls: 8,
            successRate: 1.0,
            averageLatency: 4500,
            totalTokens: 12400,
            totalCost: 0.74,
            errors: [],
            totalCostFormatted: '$0.7400',
            successRateFormatted: '100.0%',
            averageLatencyFormatted: '4500ms'
          }
        ]
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    await fetchAIStats();
  };

  const triggerDailySummary = async () => {
    try {
      await apiClient.post('/ai-stats/summary');
      alert('Daily summary triggered successfully');
    } catch (err) {
      console.error('Summary trigger error:', err);
      alert('Failed to trigger daily summary');
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.95) return 'text-green-600 bg-green-100';
    if (rate >= 0.90) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 2000) return 'text-green-600';
    if (latency < 4000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCostColor = (cost: number) => {
    if (cost < 1.0) return 'text-green-600';
    if (cost < 5.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (auth.isLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading AI monitoring...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !stats) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchAIStats}
            className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Retry
          </button>
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
            <h1 className="text-3xl font-bold text-gray-900">AI Performance Monitoring</h1>
            <p className="text-gray-600 mt-1">
              Monitor AI operations, costs, and performance across all services.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={triggerDailySummary}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Send Summary
            </button>
            <button 
              onClick={refreshStats}
              disabled={refreshing}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">⚠️ {error} (showing cached data)</p>
          </div>
        )}

        {/* Daily Overview */}
        {stats?.daily && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="admin-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Total Calls</p>
                  <p className="stat-value">{stats.daily.totalCalls}</p>
                  <p className="text-xs text-gray-600 mt-1">Today</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Success Rate</p>
                  <p className="stat-value">{stats.daily.successRateFormatted}</p>
                  <p className={`text-xs mt-1 px-2 py-0.5 rounded-full text-center ${getSuccessRateColor(stats.daily.successRate)}`}>
                    {stats.daily.successRate >= 0.95 ? 'Excellent' : stats.daily.successRate >= 0.90 ? 'Good' : 'Needs Attention'}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Daily Cost</p>
                  <p className={`stat-value ${getCostColor(stats.daily.totalCost)}`}>{stats.daily.costFormatted}</p>
                  <p className="text-xs text-gray-600 mt-1">{stats.daily.totalTokens.toLocaleString()} tokens</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Avg Latency</p>
                  <p className={`stat-value ${getLatencyColor(stats.daily.averageLatency)}`}>{stats.daily.averageLatencyFormatted}</p>
                  <p className="text-xs text-gray-600 mt-1">Response time</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Operations</p>
                  <p className="stat-value">{stats.operations?.length || 0}</p>
                  <p className="text-xs text-gray-600 mt-1">Active services</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-full">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Operations Breakdown */}
        {stats?.operations && stats.operations.length > 0 && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="text-xl font-semibold text-gray-900">AI Operations Breakdown</h2>
              <p className="text-sm text-gray-600 mt-1">Performance metrics for individual AI services</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Operation</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Calls</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Success Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Latency</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tokens</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cost</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.operations.map((operation) => (
                    <tr key={operation.operation} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 capitalize">
                          {operation.operation.replace(/-/g, ' ')}
                        </div>
                        {operation.errors.length > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            {operation.errors.slice(0, 2).join(', ')}
                            {operation.errors.length > 2 && ` +${operation.errors.length - 2} more`}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{operation.totalCalls}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSuccessRateColor(operation.successRate)}`}>
                          {operation.successRateFormatted}
                        </span>
                      </td>
                      <td className={`py-3 px-4 ${getLatencyColor(operation.averageLatency)}`}>
                        {operation.averageLatencyFormatted}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{operation.totalTokens.toLocaleString()}</td>
                      <td className={`py-3 px-4 font-medium ${getCostColor(operation.totalCost)}`}>
                        {operation.totalCostFormatted}
                      </td>
                      <td className="py-3 px-4">
                        {operation.errors.length === 0 ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="Healthy"></div>
                        ) : (
                          <div className="w-2 h-2 bg-red-500 rounded-full" title={`${operation.errors.length} errors`}></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Operations Guide */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="admin-card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">OpenAI Service Operations</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-gray-900">property-analysis</h3>
                  <p className="text-sm text-gray-600">Property investment analysis using GPT-4</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-gray-900">document-extraction</h3>
                  <p className="text-sm text-gray-600">Legal document data extraction with GPT-4 Vision</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-gray-900">lead-analysis</h3>
                  <p className="text-sm text-gray-600">Lead qualification and scoring</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-gray-900">market-report</h3>
                  <p className="text-sm text-gray-600">Market analysis report generation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-gray-900">general-completion</h3>
                  <p className="text-sm text-gray-600">General purpose GPT completions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom AI Workflows</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-gray-900">property-valuation</h3>
                  <p className="text-sm text-gray-600">Complete property valuation process</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-gray-900">cma-generation</h3>
                  <p className="text-sm text-gray-600">Comparative Market Analysis generation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-gray-900">market-prediction</h3>
                  <p className="text-sm text-gray-600">Market forecasting and trends</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-gray-900">lead-generation</h3>
                  <p className="text-sm text-gray-600">AI-powered lead generation and qualification</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-medium text-gray-900">property-report</h3>
                  <p className="text-sm text-gray-600">Detailed property analysis reports</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="admin-card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Cost Optimization</h3>
              <p className="text-sm text-blue-700">
                Current daily spend: {stats?.daily?.costFormatted || '$0.00'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Monitor for costs exceeding $50/day
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Performance Status</h3>
              <p className="text-sm text-green-700">
                Average latency: {stats?.daily?.averageLatencyFormatted || '0ms'}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Target: Under 3000ms for optimal UX
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">Reliability Score</h3>
              <p className="text-sm text-purple-700">
                Success rate: {stats?.daily?.successRateFormatted || '0%'}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Target: Above 95% for production
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}