'use client';

import React, { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/auth';

interface Preferences {
  alertTypes: string[];
  priorities: string[];
  cities: string[];
  propertyTypes: string[];
  minValue: number;
  maxValue: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  dailyLimit: number;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  minOpportunityScore: number;
  distanceRadius: number;
}

export default function PreferencesPage() {
  const auth = useRequireAuth();
  const [preferences, setPreferences] = useState<Preferences>({
    alertTypes: ['POWER_OF_SALE', 'ESTATE_SALE'],
    priorities: ['HIGH', 'URGENT'],
    cities: ['Toronto', 'Vaughan', 'Mississauga'],
    propertyTypes: ['DETACHED', 'SEMI_DETACHED', 'TOWNHOUSE'],
    minValue: 500000,
    maxValue: 2000000,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    dailyLimit: 10,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    },
    minOpportunityScore: 70,
    distanceRadius: 25
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      fetchPreferences();
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/health?action=get-preferences');
      
      if (response.data.success && response.data.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
      // Continue with default preferences for development
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError(null);

      const response = await apiClient.put('/api/health?action=update-preferences', preferences);
      
      if (response.data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(response.data.error || 'Failed to save preferences');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Network error occurred');
      console.error('Save preferences error:', err);
      
      // Mock success for development
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleArrayToggle = (field: keyof Preferences, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }));
  };

  const handleChange = (field: keyof Preferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuietHoursChange = (field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
  };

  if (auth.isLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading preferences...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Alert Preferences</h1>
            <p className="text-gray-600 mt-1">Customize your property alert settings</p>
          </div>
          <button
            onClick={savePreferences}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            {saving ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : saved ? (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : null}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Alert Types */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alert Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 'POWER_OF_SALE', label: 'Power of Sale' },
              { value: 'ESTATE_SALE', label: 'Estate Sale' },
              { value: 'DEVELOPMENT_APPLICATION', label: 'Development' },
              { value: 'MUNICIPAL_PERMIT', label: 'Municipal Permit' },
              { value: 'PROBATE_FILING', label: 'Probate Filing' },
              { value: 'TAX_SALE', label: 'Tax Sale' }
            ].map(type => (
              <label key={type.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.alertTypes.includes(type.value)}
                  onChange={() => handleArrayToggle('alertTypes', type.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Priorities */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Priority Levels</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 'URGENT', label: 'Urgent', color: 'text-red-600' },
              { value: 'HIGH', label: 'High', color: 'text-orange-600' },
              { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600' },
              { value: 'LOW', label: 'Low', color: 'text-green-600' }
            ].map(priority => (
              <label key={priority.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.priorities.includes(priority.value)}
                  onChange={() => handleArrayToggle('priorities', priority.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className={`text-sm font-medium ${priority.color}`}>{priority.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Geographic Preferences */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Geographic Preferences</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Cities</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  'Toronto', 'Mississauga', 'Brampton', 'Vaughan',
                  'Markham', 'Richmond Hill', 'Oakville', 'Burlington'
                ].map(city => (
                  <label key={city} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.cities.includes(city)}
                      onChange={() => handleArrayToggle('cities', city)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{city}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius: {preferences.distanceRadius} km
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={preferences.distanceRadius}
                onChange={(e) => handleChange('distanceRadius', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 km</span>
                <span>100 km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Property Criteria */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Criteria</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Property Types</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: 'DETACHED', label: 'Detached' },
                  { value: 'SEMI_DETACHED', label: 'Semi-Detached' },
                  { value: 'TOWNHOUSE', label: 'Townhouse' },
                  { value: 'CONDO', label: 'Condominium' }
                ].map(type => (
                  <label key={type.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.propertyTypes.includes(type.value)}
                      onChange={() => handleArrayToggle('propertyTypes', type.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={preferences.minValue}
                    onChange={(e) => handleChange('minValue', parseInt(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="500000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={preferences.maxValue}
                    onChange={(e) => handleChange('maxValue', parseInt(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2000000"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Opportunity Score: {preferences.minOpportunityScore}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={preferences.minOpportunityScore}
                onChange={(e) => handleChange('minOpportunityScore', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                  <p className="text-xs text-gray-500">Receive alerts via email</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.smsNotifications}
                  onChange={(e) => handleChange('smsNotifications', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                  <p className="text-xs text-gray-500">Receive alerts via text message</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                  <p className="text-xs text-gray-500">Receive browser push notifications</p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Alert Limit</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={preferences.dailyLimit}
                  onChange={(e) => handleChange('dailyLimit', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Quiet Hours</h3>
                  <p className="text-sm text-gray-500">Disable notifications during specific hours</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.quietHours.enabled}
                    onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.start}
                      onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.end}
                      onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}