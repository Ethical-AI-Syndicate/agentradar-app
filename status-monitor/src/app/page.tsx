'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  Server, 
  Shield, 
  Zap,
  Brain,
  CreditCard,
  Home,
  RefreshCw
} from 'lucide-react';
import { 
  formatUptime, 
  formatResponseTime, 
  getStatusColor, 
  getStatusBadge, 
  getStatusIndicator,
  calculateOverallStatus,
  formatTimestamp 
} from '../lib/utils';

interface SystemStatus {
  status: string;
  timestamp: string;
  version: string;
  database: {
    status: string;
    response_time_ms: number;
  };
  services: {
    auth: string;
    ai: string;
    payments: string;
    mls: string;
    alerts: string;
    admin: string;
  };
  system: {
    uptime_seconds: number;
    memory_usage_mb: number;
    cpu_load_percent: number;
  };
  authentication?: {
    endpoints: Record<string, string>;
    status: string;
  };
  ai?: {
    endpoints: Record<string, string>;
    model: string;
    status: string;
  };
  payments?: {
    endpoints: Record<string, string>;
    provider: string;
    status: string;
  };
  mls?: {
    endpoints: Record<string, string>;
    provider: string;
    status: string;
    note?: string;
  };
}

const serviceIcons = {
  auth: Shield,
  ai: Brain,
  payments: CreditCard,
  mls: Home,
  alerts: AlertTriangle,
  admin: Server,
  database: Database
};

export default function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const response = await fetch('https://api.agentradar.app/api/health', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatus(data);
      setLastUpdate(new Date().toISOString());
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch system status');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading system status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-900 mb-2">Service Unavailable</h1>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchStatus}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No status data available</p>
        </div>
      </div>
    );
  }

  const overallStatus = calculateOverallStatus(status.services);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">AgentRadar Status</h1>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(overallStatus.status)}`}>
                <span className={getStatusIndicator(overallStatus.status)}></span>
                <span className="ml-2 capitalize">{overallStatus.status.replace('_', ' ')}</span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-slate-500">Last updated</p>
              <p className="text-sm font-mono text-slate-700">
                {lastUpdate ? formatTimestamp(lastUpdate) : 'Never'}
              </p>
            </div>
          </div>
          
          {/* Overall status message */}
          <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-lg text-slate-700">{overallStatus.message}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">System Status</p>
                <p className={`text-lg font-semibold ${getStatusColor(status.status)}`}>
                  {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                </p>
              </div>
              <CheckCircle className={`h-8 w-8 ${getStatusColor(status.status)}`} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">System Uptime</p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatUptime(status.system.uptime_seconds)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Response Time</p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatResponseTime(status.database.response_time_ms)}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </motion.div>
        </div>

        {/* Services Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow border border-slate-200 mb-8"
        >
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center">
              <Server className="h-5 w-5 mr-2" />
              Core Services
            </h2>
          </div>
          
          <div className="divide-y divide-slate-200">
            {/* Database */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">Database</p>
                  <p className="text-sm text-slate-500">PostgreSQL with Prisma ORM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-500">
                  {formatResponseTime(status.database.response_time_ms)}
                </span>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(status.database.status)}`}>
                  <span className={getStatusIndicator(status.database.status)}></span>
                  <span className="ml-2 capitalize">{status.database.status}</span>
                </div>
              </div>
            </div>

            {/* Core Services */}
            {Object.entries(status.services).map(([service, serviceStatus]) => {
              const Icon = serviceIcons[service as keyof typeof serviceIcons] || Server;
              const serviceNames: Record<string, string> = {
                auth: 'Authentication',
                ai: 'AI Intelligence',
                payments: 'Payment Processing',
                mls: 'MLS Integration',
                alerts: 'Alert System',
                admin: 'Admin Portal'
              };
              
              return (
                <div key={service} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">{serviceNames[service] || service}</p>
                      <p className="text-sm text-slate-500">
                        {service === 'ai' && status.ai ? `${status.ai.model} integration` : 
                         service === 'payments' && status.payments ? `${status.payments.provider} integration` :
                         service === 'mls' && status.mls ? `${status.mls.provider} integration` :
                         'Core platform service'}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(serviceStatus)}`}>
                    <span className={getStatusIndicator(serviceStatus)}></span>
                    <span className="ml-2 capitalize">{serviceStatus}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Service Details */}
        {status.authentication && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow border border-slate-200 mb-8"
          >
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Authentication Endpoints
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(status.authentication.endpoints).map(([name, endpoint]) => (
                  <div key={name} className="p-3 bg-slate-50 rounded-md">
                    <p className="font-mono text-xs text-slate-600">{endpoint}</p>
                    <p className="text-sm font-medium text-slate-900 capitalize">{name.replace('-', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* System Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow border border-slate-200"
        >
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              System Metrics
            </h3>
          </div>
          
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">Version</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{status.version}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Memory Usage</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{status.system.memory_usage_mb}MB</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">CPU Load</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{status.system.cpu_load_percent}%</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Last Check</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatTimestamp(status.timestamp)}</dd>
              </div>
            </dl>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-slate-500">
              AgentRadar Status Monitor • Real-time system health monitoring • 
              <a href="https://agentradar.app" className="text-blue-600 hover:text-blue-500 ml-1">
                Back to AgentRadar
              </a>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Auto-refreshes every 30 seconds • Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}