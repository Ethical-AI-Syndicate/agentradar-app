'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Home, 
  TrendingUp, 
  MapPin, 
  DollarSign,
  Search,
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { 
  alertsApi, 
  propertiesApi, 
  analyticsApi, 
  formatRelativeTime,
  type Alert as AlertType,
  type SavedProperty,
  type DashboardStats
} from '@/lib/api';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load dashboard data in parallel
        const [alertsResponse, propertiesResponse, statsResponse] = await Promise.allSettled([
          alertsApi.getPersonalizedAlerts({ limit: 5 }),
          propertiesApi.getSavedProperties({ limit: 5, isFavorite: true }),
          analyticsApi.getDashboardStats()
        ]);

        // Handle alerts
        if (alertsResponse.status === 'fulfilled' && alertsResponse.value.success) {
          setAlerts(alertsResponse.value.data);
        } else if (alertsResponse.status === 'rejected') {
          console.error('Failed to load alerts:', alertsResponse.reason);
          // Set empty array as fallback
          setAlerts([]);
        }

        // Handle properties
        if (propertiesResponse.status === 'fulfilled' && propertiesResponse.value.success) {
          setProperties(propertiesResponse.value.data);
        } else if (propertiesResponse.status === 'rejected') {
          console.error('Failed to load properties:', propertiesResponse.reason);
          // Set empty array as fallback
          setProperties([]);
        }

        // Handle stats
        if (statsResponse.status === 'fulfilled' && statsResponse.value.success && statsResponse.value.data) {
          setStats(statsResponse.value.data);
        } else if (statsResponse.status === 'rejected') {
          console.error('Failed to load stats:', statsResponse.reason);
          // Set default stats as fallback
          setStats({
            totalAlerts: 0,
            activeAlerts: 0,
            highPriorityAlerts: 0,
            savedProperties: 0,
            favoriteProperties: 0,
            totalValue: 0,
            averageROI: 0,
            marketTrend: 0,
            newAlertsThisWeek: 0,
            resolvedAlertsThisWeek: 0,
          });
        }

      } catch (err: unknown) {
        console.error('Dashboard loading error:', err);
        setError('Failed to load dashboard data');
        
        // Set fallback data
        setAlerts([]);
        setProperties([]);
        setStats({
          totalAlerts: 0,
          activeAlerts: 0,
          highPriorityAlerts: 0,
          savedProperties: 0,
          favoriteProperties: 0,
          totalValue: 0,
          averageROI: 0,
          marketTrend: 0,
          newAlertsThisWeek: 0,
          resolvedAlertsThisWeek: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Home className="h-5 w-5 text-white" />
                  </div>
                  <span className="ml-2 text-xl font-bold text-gray-900">AgentRadar</span>
                </div>
              </div>
              
              <nav className="hidden md:flex space-x-8">
                <Link href="/dashboard" className="text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                <Link href="/properties" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Properties</Link>
                <Link href="/alerts" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Alerts</Link>
                <Link href="/analytics" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Analytics</Link>
              </nav>

              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Here&apos;s what&apos;s happening with your property investments today.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alerts.length}</div>
                <p className="text-xs text-muted-foreground">
                  +2 from yesterday
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Properties Watched</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{properties.length}</div>
                <p className="text-xs text-muted-foreground">
                  Avg ROI: 10.4%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$2.34M</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Trend</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+5.2%</div>
                <p className="text-xs text-muted-foreground">
                  GTA average this quarter
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Recent Alerts
                </CardTitle>
                <CardDescription>
                  New opportunities matching your criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-gray-500">Loading alerts...</p>
                ) : alerts.length > 0 ? (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <Alert key={alert.id}>
                        <MapPin className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{alert.address}</p>
                              <p className="text-sm text-gray-600 capitalize">
                                {alert.type.replace('_', ' ')} • ${alert.estimatedValue?.toLocaleString()}
                              </p>
                              {alert.saleDate && (
                                <p className="text-sm text-orange-600">
                                  Sale Date: {new Date(alert.saleDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              alert.priority === 'HIGH' || alert.priority === 'URGENT'
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {alert.priority}
                            </span>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No new alerts</p>
                )}
              </CardContent>
            </Card>

            {/* Watched Properties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Watched Properties
                </CardTitle>
                <CardDescription>
                  Properties you&apos;re currently tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-gray-500">Loading properties...</p>
                ) : properties.length > 0 ? (
                  <div className="space-y-4">
                    {properties.map((property) => (
                      <div key={property.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{property.address}</p>
                            <p className="text-sm text-gray-600">
                              {property.propertyType || 'Property'} • ${property.price?.toLocaleString() || 'Price TBD'}
                            </p>
                            <p className="text-sm text-green-600">
                              {property.isFavorite ? '★ Favorite' : 'Saved Property'}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            Saved
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No properties being watched</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/search">
                  <Button className="h-20 flex-col space-y-2 w-full">
                    <Search className="h-6 w-6" />
                    <span className="text-sm">Search Properties</span>
                  </Button>
                </Link>
                <Link href="/alerts/create">
                  <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
                    <Bell className="h-6 w-6" />
                    <span className="text-sm">Create Alert</span>
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-sm">View Analytics</span>
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" className="h-20 flex-col space-y-2 w-full">
                    <Settings className="h-6 w-6" />
                    <span className="text-sm">Settings</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}