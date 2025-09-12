'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import aiMetricsService from '@/services/aiMetricsService';

interface ChartData {
  date: string;
  cost: number;
  tokens: number;
  calls: number;
  successRate: number;
  latency: number;
}

interface AIPerformanceChartsProps {
  period?: 7 | 30 | 90;
}

export default function AIPerformanceCharts({ period = 30 }: AIPerformanceChartsProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<'cost' | 'usage' | 'performance'>('cost');

  useEffect(() => {
    fetchChartData();
  }, [period]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const historicalData = await aiMetricsService.getHistoricalStats(period);
      
      // Transform data for charts
      const transformedData: ChartData[] = historicalData.dates.map((date, index) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cost: historicalData.costs[index],
        tokens: Math.round(historicalData.tokens[index] / 1000), // Convert to thousands
        calls: historicalData.calls[index],
        successRate: Math.round(historicalData.successRates[index] * 100),
        latency: historicalData.latencies[index]
      }));
      
      setChartData(transformedData);
    } catch (err) {
      console.error('Chart data fetch error:', err);
      setError('Failed to load chart data');
      
      // Generate fallback data
      const fallbackData: ChartData[] = [];
      for (let i = period - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        fallbackData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          cost: Math.round((Math.random() * 5 + 2) * 100) / 100,
          tokens: Math.round((Math.random() * 60 + 20)),
          calls: Math.floor(Math.random() * 100 + 50),
          successRate: Math.round((Math.random() * 10 + 90)),
          latency: Math.floor(Math.random() * 1000 + 1500)
        });
      }
      setChartData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value}${getUnitForMetric(entry.dataKey)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getUnitForMetric = (metric: string): string => {
    switch (metric) {
      case 'cost': return '$';
      case 'tokens': return 'k';
      case 'successRate': return '%';
      case 'latency': return 'ms';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="admin-card">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading performance charts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Performance Trends</h2>
            <p className="text-sm text-gray-600 mt-1">Historical performance data over the last {period} days</p>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={selectedChart} 
              onChange={(e) => setSelectedChart(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="cost">Cost Analysis</option>
              <option value="usage">Usage Metrics</option>
              <option value="performance">Performance Metrics</option>
            </select>
            <button 
              onClick={fetchChartData}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-2 text-yellow-600 text-sm">
            ⚠️ {error} (showing sample data)
          </div>
        )}
      </div>

      <div className="h-96">
        {selectedChart === 'cost' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
                name="Daily Cost"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {selectedChart === 'usage' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{ value: 'Usage', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{ value: 'Tokens (k)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="calls"
                stroke="#10b981"
                strokeWidth={2}
                name="API Calls"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="tokens"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Tokens (k)"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {selectedChart === 'performance' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
                domain={[85, 100]}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{ value: 'Latency (ms)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="successRate"
                stroke="#059669"
                strokeWidth={2}
                name="Success Rate"
                dot={{ fill: '#059669', strokeWidth: 2, r: 3 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="latency"
                stroke="#dc2626"
                strokeWidth={2}
                name="Avg Latency"
                dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-sm text-gray-600">Avg Daily Cost</div>
          <div className="text-lg font-semibold text-gray-900">
            ${(chartData.reduce((sum, d) => sum + d.cost, 0) / chartData.length || 0).toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Total Calls</div>
          <div className="text-lg font-semibold text-gray-900">
            {chartData.reduce((sum, d) => sum + d.calls, 0).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Avg Success Rate</div>
          <div className="text-lg font-semibold text-gray-900">
            {(chartData.reduce((sum, d) => sum + d.successRate, 0) / chartData.length || 0).toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Avg Latency</div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(chartData.reduce((sum, d) => sum + d.latency, 0) / chartData.length || 0)}ms
          </div>
        </div>
      </div>
    </div>
  );
}