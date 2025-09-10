import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else {
    return `${(ms / 1000).toFixed(1)}s`;
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'operational':
    case 'healthy':
    case 'connected':
    case 'configured':
      return 'text-green-600';
    case 'degraded':
    case 'partial':
      return 'text-yellow-600';
    case 'major':
    case 'error':
    case 'failed':
    case 'disconnected':
      return 'text-red-600';
    case 'maintenance':
      return 'text-blue-600';
    case 'unknown':
    case 'not_tested':
    case 'missing_key':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
}

export function getStatusBadge(status: string): string {
  switch (status.toLowerCase()) {
    case 'operational':
    case 'healthy':
    case 'connected':
    case 'configured':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'degraded':
    case 'partial':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'major':
    case 'error':
    case 'failed':
    case 'disconnected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'maintenance':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'unknown':
    case 'not_tested':
    case 'missing_key':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getStatusIndicator(status: string): string {
  switch (status.toLowerCase()) {
    case 'operational':
    case 'healthy':
    case 'connected':
    case 'configured':
      return 'status-indicator status-operational';
    case 'degraded':
      return 'status-indicator status-degraded';
    case 'partial':
      return 'status-indicator status-partial';
    case 'major':
    case 'error':
    case 'failed':
    case 'disconnected':
      return 'status-indicator status-major pulse-critical';
    case 'maintenance':
      return 'status-indicator status-maintenance';
    default:
      return 'status-indicator bg-gray-400';
  }
}

export function calculateOverallStatus(services: Record<string, any>): {
  status: string;
  level: number;
  message: string;
} {
  const serviceStatuses = Object.values(services);
  
  // Count different status types
  const statusCounts = serviceStatuses.reduce((acc: any, service: any) => {
    const status = typeof service === 'string' ? service : service.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Determine overall status based on priority
  if (statusCounts.error || statusCounts.failed || statusCounts.disconnected || statusCounts.major) {
    return {
      status: 'major_outage',
      level: 4,
      message: 'We are experiencing significant service disruptions'
    };
  }
  
  if (statusCounts.degraded || statusCounts.partial) {
    return {
      status: 'partial_outage',
      level: 3,
      message: 'Some services are experiencing issues'
    };
  }
  
  if (statusCounts.maintenance) {
    return {
      status: 'maintenance',
      level: 2,
      message: 'Scheduled maintenance is in progress'
    };
  }
  
  if (statusCounts.unknown || statusCounts.not_tested || statusCounts.missing_key) {
    return {
      status: 'investigating',
      level: 1,
      message: 'We are investigating potential issues'
    };
  }
  
  return {
    status: 'operational',
    level: 0,
    message: 'All systems are operational'
  };
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (seconds < 60) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}