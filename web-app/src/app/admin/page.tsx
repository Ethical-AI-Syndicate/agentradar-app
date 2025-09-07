'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  AlertTriangle, 
  HeadphonesIcon, 
  TrendingUp,
  UserCheck,
  UserPlus,
  Zap,
  Activity,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/auth';

interface DashboardAnalytics {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    growthRate: string;
  };
  alerts: {
    total: number;
    active: number;
    highPriority: number;
    newToday: number;
  };
  support: {
    totalTickets: number;
    openTickets: number;
    avgResolutionHours: number;
    responseRate: string;
  };
  subscriptions: {
    tier: string;
    count: number;
  }[];
  userGrowth: {
    date: string;
    users: number;
  }[];
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/admin/analytics/dashboard');
      setAnalytics(response.data);
    } catch (err: unknown) {
      console.error('Failed to fetch analytics:', err);
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const stats = [
    {
      name: 'Total Users',
      value: analytics.users.total.toLocaleString(),
      change: `+${analytics.users.growthRate}%`,
      changeType: 'positive',
      icon: Users,
      description: 'Active user accounts'
    },
    {
      name: 'Active Alerts',
      value: analytics.alerts.active.toLocaleString(),
      change: `${analytics.alerts.newToday} today`,
      changeType: 'neutral',
      icon: AlertTriangle,
      description: 'Live property alerts'
    },
    {
      name: 'Open Tickets',
      value: analytics.support.openTickets.toString(),
      change: `${analytics.support.responseRate}% resolved`,
      changeType: 'positive',
      icon: HeadphonesIcon,
      description: 'Support tickets pending'
    },
    {
      name: 'Weekly Active',
      value: analytics.users.active.toLocaleString(),
      change: `${((analytics.users.active / analytics.users.total) * 100).toFixed(1)}%`,
      changeType: 'positive',
      icon: UserCheck,
      description: 'Users active this week'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with AgentRadar.</p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="flex items-center space-x-1">
                <span className={`text-xs ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Subscription Tiers
            </CardTitle>
            <CardDescription>
              Distribution of user subscription levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.subscriptions.map((sub) => (
                <div key={sub.tier} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      sub.tier === 'WHITE_LABEL' ? 'default' :
                      sub.tier === 'TEAM_ENTERPRISE' ? 'secondary' :
                      sub.tier === 'PROFESSIONAL' ? 'outline' : 'secondary'
                    }>
                      {sub.tier.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className="font-medium">{sub.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <a href="/admin/users">
                <UserPlus className="h-4 w-4 mr-2" />
                Manage Users
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <a href="/admin/support">
                <HeadphonesIcon className="h-4 w-4 mr-2" />
                Support Queue
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <a href="/admin/settings">
                <Activity className="h-4 w-4 mr-2" />
                System Settings
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>
            Key metrics and system health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.alerts.total}</div>
              <div className="text-sm text-gray-600">Total Alerts Created</div>
              <div className="text-xs text-gray-500 mt-1">
                {analytics.alerts.highPriority} high priority
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.users.newThisMonth}</div>
              <div className="text-sm text-gray-600">New Users This Month</div>
              <div className="text-xs text-gray-500 mt-1">
                {analytics.users.growthRate}% growth rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.support.totalTickets}</div>
              <div className="text-sm text-gray-600">Support Tickets</div>
              <div className="text-xs text-gray-500 mt-1">
                {analytics.support.responseRate}% resolution rate
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}