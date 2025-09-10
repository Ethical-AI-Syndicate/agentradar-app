'use client';

import React, { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/auth';

interface Alert {
  id: string;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  description: string;
  address: string;
  city: string;
  opportunityScore: number;
  estimatedValue: number;
  status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED';
  createdAt: string;
  isBookmarked?: boolean;
  isViewed?: boolean;
}

export default function AlertsPage() {
  const auth = useRequireAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    type: 'all',
    priority: 'all',
    status: 'ACTIVE',
    bookmarked: false
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.priority !== 'all') params.append('priority', filter.priority);
      if (filter.status !== 'all') params.append('status', filter.status);
      if (filter.bookmarked) params.append('bookmarked', 'true');
      
      const response = await apiClient.get(`/api/health?action=get-alerts&${params.toString()}`);
      
      if (response.data.success) {
        setAlerts(response.data.alerts || []);
      } else {
        setError('Failed to fetch alerts');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Alerts fetch error:', err);
      
      // Mock data for development
      setAlerts([
        {
          id: '1',
          type: 'POWER_OF_SALE',
          priority: 'HIGH',
          title: 'Power of Sale - Vaughan',
          description: 'Detached home in prime location with potential for renovation',
          address: '123 Main Street, Vaughan, ON',
          city: 'Vaughan',
          opportunityScore: 85,
          estimatedValue: 850000,
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isBookmarked: true,
          isViewed: true
        },
        {
          id: '2',
          type: 'ESTATE_SALE',
          priority: 'MEDIUM',
          title: 'Estate Sale - Toronto',
          description: 'Estate sale property requiring immediate attention',
          address: '456 Oak Avenue, Toronto, ON',
          city: 'Toronto',
          opportunityScore: 72,
          estimatedValue: 1250000,
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          isBookmarked: false,
          isViewed: false
        },
        {
          id: '3',
          type: 'DEVELOPMENT_APPLICATION',
          priority: 'URGENT',
          title: 'Development Application - Mississauga',
          description: 'New residential development application filed',
          address: '789 Pine Street, Mississauga, ON',
          city: 'Mississauga',
          opportunityScore: 92,
          estimatedValue: 2100000,
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          isBookmarked: false,
          isViewed: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      fetchAlerts();
    }
  }, [auth.isLoading, auth.isAuthenticated, filter]);

  const handleBookmark = async (alertId: string, isBookmarked: boolean) => {
    try {
      const action = isBookmarked ? 'remove-bookmark' : 'add-bookmark';
      await apiClient.post(`/api/health?action=${action}`, { alertId });
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isBookmarked: !isBookmarked } : alert
      ));
    } catch (error) {
      console.error('Bookmark error:', error);
      
      // Mock update for development
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isBookmarked: !isBookmarked } : alert
      ));
    }
  };

  const handleMarkViewed = async (alertId: string) => {
    try {
      await apiClient.post(`/api/health?action=mark-viewed`, { alertId });
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isViewed: true } : alert
      ));
    } catch (error) {
      console.error('Mark viewed error:', error);
      
      // Mock update for development
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isViewed: true } : alert
      ));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertTypeDisplay = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (auth.isLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading alerts...</p>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Property Alerts</h1>
            <p className="text-gray-600 mt-1">Stay informed about new opportunities</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Create Alert
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
              <select 
                value={filter.type} 
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="POWER_OF_SALE">Power of Sale</option>
                <option value="ESTATE_SALE">Estate Sale</option>
                <option value="DEVELOPMENT_APPLICATION">Development</option>
                <option value="MUNICIPAL_PERMIT">Municipal Permit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select 
                value={filter.priority} 
                onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                value={filter.status} 
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ACTIVE">Active</option>
                <option value="RESOLVED">Resolved</option>
                <option value="EXPIRED">Expired</option>
                <option value="all">All Status</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filter.bookmarked}
                  onChange={(e) => setFilter(prev => ({ ...prev, bookmarked: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Bookmarked only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Alerts list */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          {alerts.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19H6.931l1.99-8.637a2 2 0 011.929-1.495h.388a2 2 0 011.928 1.495L11 19z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-500">Try adjusting your filters or create a new alert.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-6 hover:bg-gray-50 transition-colors ${!alert.isViewed ? 'bg-blue-50/30' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {!alert.isViewed && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                        <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getAlertTypeDisplay(alert.type)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{alert.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {alert.address}
                        </span>
                        <span>Score: {alert.opportunityScore}</span>
                        <span>Value: ${alert.estimatedValue.toLocaleString()}</span>
                        <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleBookmark(alert.id, alert.isBookmarked || false)}
                        className={`p-2 rounded-lg transition-colors ${
                          alert.isBookmarked 
                            ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                            : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                        }`}
                        title={alert.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                      >
                        <svg className="w-4 h-4" fill={alert.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                      
                      {!alert.isViewed && (
                        <button
                          onClick={() => handleMarkViewed(alert.id)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as viewed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                      
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}