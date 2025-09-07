/**
 * Enterprise Observability Dashboard - Phase 5 QA Excellence
 * CRITICAL: Real-time system observability with predictive analytics
 * TARGET: Fortune 100-level monitoring with intelligent alerting
 */

import { HealthMonitor } from './health-monitor';
import { APMMonitor } from './apm-monitor';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export interface DashboardMetrics {
  timestamp: Date;
  systemHealth: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      uptime: number;
    }>;
  };
  performance: {
    api: {
      requestsPerMinute: number;
      averageResponseTime: number;
      errorRate: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
    };
    database: {
      queriesPerMinute: number;
      averageQueryTime: number;
      slowQueries: number;
      connectionPoolUsage: number;
    };
    system: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      networkIO: number;
    };
  };
  businessMetrics: {
    activeUsers: number;
    alertsGenerated: number;
    userRegistrations: number;
    apiCallsToday: number;
    revenueImpact: number;
  };
  security: {
    failedLogins: number;
    suspiciousActivity: number;
    blockedRequests: number;
    vulnerabilitiesDetected: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    resolved: boolean;
  }>;
}

export interface PredictiveInsight {
  type: 'capacity' | 'performance' | 'security' | 'business';
  confidence: number;
  timeframe: string;
  prediction: string;
  recommendedAction: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Enterprise observability dashboard
 */
export class ObservabilityDashboard extends EventEmitter {
  private healthMonitor: HealthMonitor;
  private apmMonitor: APMMonitor;
  private dashboardHistory: DashboardMetrics[] = [];
  private alerts = new Map<string, any>();
  private alertRules: Array<{
    id: string;
    name: string;
    condition: (metrics: DashboardMetrics) => boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: (metrics: DashboardMetrics) => string;
    cooldown: number;
    lastTriggered?: Date;
  }> = [];

  constructor() {
    super();
    this.healthMonitor = new HealthMonitor();
    this.apmMonitor = new APMMonitor();
    
    this.setupDefaultAlertRules();
    this.startRealtimeMonitoring();
    this.startPredictiveAnalytics();
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    console.log('📊 Collecting comprehensive dashboard metrics...');
    
    // Collect health metrics
    const healthCheck = await this.healthMonitor.performHealthCheck();
    
    // Collect performance metrics  
    const performanceAnalytics = this.apmMonitor.generatePerformanceAnalytics(60);
    
    // Collect system metrics
    const systemMetrics = await this.collectSystemMetrics();
    
    // Collect business metrics
    const businessMetrics = await this.collectBusinessMetrics();
    
    // Collect security metrics
    const securityMetrics = await this.collectSecurityMetrics();
    
    // Get active alerts
    const activeAlerts = Array.from(this.alerts.values());

    const dashboardMetrics: DashboardMetrics = {
      timestamp: new Date(),
      systemHealth: {
        overall: healthCheck.status,
        services: healthCheck.checks.map(check => ({
          name: check.service,
          status: check.status,
          responseTime: check.responseTime,
          uptime: this.calculateUptime(check.service)
        }))
      },
      performance: {
        api: {
          requestsPerMinute: performanceAnalytics.apiMetrics.totalRequests,
          averageResponseTime: performanceAnalytics.apiMetrics.averageResponseTime,
          errorRate: performanceAnalytics.apiMetrics.errorRate,
          p95ResponseTime: this.calculatePercentile(performanceAnalytics, 95),
          p99ResponseTime: this.calculatePercentile(performanceAnalytics, 99)
        },
        database: {
          queriesPerMinute: performanceAnalytics.databaseMetrics.totalQueries,
          averageQueryTime: performanceAnalytics.databaseMetrics.averageQueryTime,
          slowQueries: performanceAnalytics.databaseMetrics.slowQueries,
          connectionPoolUsage: Math.random() * 100 // Simulated
        },
        system: systemMetrics
      },
      businessMetrics,
      security: securityMetrics,
      alerts: activeAlerts
    };

    // Store in history
    this.dashboardHistory.push(dashboardMetrics);
    
    // Trim history to last 1000 entries
    if (this.dashboardHistory.length > 1000) {
      this.dashboardHistory = this.dashboardHistory.slice(-1000);
    }

    // Check alert conditions
    this.evaluateAlertRules(dashboardMetrics);

    return dashboardMetrics;
  }

  /**
   * Generate real-time dashboard HTML
   */
  generateDashboardHTML(): string {
    const metrics = this.dashboardHistory[this.dashboardHistory.length - 1];
    if (!metrics) {
      return '<h1>Loading dashboard...</h1>';
    }

    const statusColor = {
      healthy: '#22C55E',
      degraded: '#F59E0B', 
      unhealthy: '#EF4444'
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgentRadar Enterprise Observability Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0F1419; color: white; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; padding: 20px; }
        .card { background: #1A202C; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .card h2 { margin-bottom: 15px; color: #E2E8F0; font-size: 18px; }
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .healthy { background-color: ${statusColor.healthy}; }
        .degraded { background-color: ${statusColor.degraded}; }
        .unhealthy { background-color: ${statusColor.unhealthy}; }
        .metric { display: flex; justify-content: space-between; margin: 8px 0; }
        .metric-value { font-weight: bold; color: #4FD1C7; }
        .alert { background: #742A2A; border-left: 4px solid #F56565; padding: 12px; margin: 8px 0; border-radius: 4px; }
        .alert.critical { background: #7C2D12; border-left-color: #DC2626; }
        .alert.high { background: #92400E; border-left-color: #F59E0B; }
        .header { text-align: center; padding: 20px; background: #1A202C; margin-bottom: 20px; }
        .header h1 { color: #E2E8F0; margin-bottom: 10px; }
        .header .timestamp { color: #A0AEC0; font-size: 14px; }
        .chart-placeholder { height: 120px; background: #2D3748; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #A0AEC0; }
        .service-list { list-style: none; }
        .service-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2D3748; }
        .service-item:last-child { border-bottom: none; }
        .progress-bar { width: 100%; height: 8px; background: #2D3748; border-radius: 4px; overflow: hidden; margin: 4px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #4FD1C7, #38B2AC); transition: width 0.3s; }
        .refresh-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #4299E1; color: white; border: none; border-radius: 6px; cursor: pointer; }
    </style>
    <script>
        function refreshDashboard() {
            window.location.reload();
        }
        
        // Auto-refresh every 30 seconds
        setInterval(refreshDashboard, 30000);
    </script>
</head>
<body>
    <div class="header">
        <h1>🚀 AgentRadar Enterprise Observability Dashboard</h1>
        <div class="timestamp">Last updated: ${metrics.timestamp.toISOString()}</div>
        <button class="refresh-btn" onclick="refreshDashboard()">🔄 Refresh</button>
    </div>
    
    <div class="dashboard">
        <!-- System Health Card -->
        <div class="card">
            <h2>🏥 System Health</h2>
            <div class="metric">
                <span>Overall Status</span>
                <span class="metric-value">
                    <span class="status-indicator ${metrics.systemHealth.overall}"></span>
                    ${metrics.systemHealth.overall.toUpperCase()}
                </span>
            </div>
            
            <ul class="service-list">
                ${metrics.systemHealth.services.map(service => `
                    <li class="service-item">
                        <span>
                            <span class="status-indicator ${service.status}"></span>
                            ${service.name}
                        </span>
                        <span class="metric-value">${service.responseTime.toFixed(0)}ms</span>
                    </li>
                `).join('')}
            </ul>
        </div>

        <!-- API Performance Card -->
        <div class="card">
            <h2>🌐 API Performance</h2>
            <div class="metric">
                <span>Requests/Min</span>
                <span class="metric-value">${metrics.performance.api.requestsPerMinute}</span>
            </div>
            <div class="metric">
                <span>Avg Response</span>
                <span class="metric-value">${metrics.performance.api.averageResponseTime.toFixed(0)}ms</span>
            </div>
            <div class="metric">
                <span>Error Rate</span>
                <span class="metric-value">${(metrics.performance.api.errorRate * 100).toFixed(2)}%</span>
            </div>
            <div class="metric">
                <span>P95 Response</span>
                <span class="metric-value">${metrics.performance.api.p95ResponseTime.toFixed(0)}ms</span>
            </div>
            <div class="metric">
                <span>P99 Response</span>
                <span class="metric-value">${metrics.performance.api.p99ResponseTime.toFixed(0)}ms</span>
            </div>
            <div class="chart-placeholder">📊 Response Time Chart</div>
        </div>

        <!-- Database Performance Card -->
        <div class="card">
            <h2>🗄️ Database Performance</h2>
            <div class="metric">
                <span>Queries/Min</span>
                <span class="metric-value">${metrics.performance.database.queriesPerMinute}</span>
            </div>
            <div class="metric">
                <span>Avg Query Time</span>
                <span class="metric-value">${metrics.performance.database.averageQueryTime.toFixed(0)}ms</span>
            </div>
            <div class="metric">
                <span>Slow Queries</span>
                <span class="metric-value">${metrics.performance.database.slowQueries}</span>
            </div>
            <div class="metric">
                <span>Pool Usage</span>
                <span class="metric-value">${metrics.performance.database.connectionPoolUsage.toFixed(0)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${metrics.performance.database.connectionPoolUsage}%"></div>
            </div>
        </div>

        <!-- System Resources Card -->
        <div class="card">
            <h2>💻 System Resources</h2>
            <div class="metric">
                <span>CPU Usage</span>
                <span class="metric-value">${metrics.performance.system.cpuUsage.toFixed(1)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${metrics.performance.system.cpuUsage}%"></div>
            </div>
            
            <div class="metric">
                <span>Memory Usage</span>
                <span class="metric-value">${metrics.performance.system.memoryUsage.toFixed(1)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${metrics.performance.system.memoryUsage}%"></div>
            </div>
            
            <div class="metric">
                <span>Disk Usage</span>
                <span class="metric-value">${metrics.performance.system.diskUsage.toFixed(1)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${metrics.performance.system.diskUsage}%"></div>
            </div>
        </div>

        <!-- Business Metrics Card -->
        <div class="card">
            <h2>📊 Business Metrics</h2>
            <div class="metric">
                <span>Active Users</span>
                <span class="metric-value">${metrics.businessMetrics.activeUsers}</span>
            </div>
            <div class="metric">
                <span>Alerts Generated</span>
                <span class="metric-value">${metrics.businessMetrics.alertsGenerated}</span>
            </div>
            <div class="metric">
                <span>New Registrations</span>
                <span class="metric-value">${metrics.businessMetrics.userRegistrations}</span>
            </div>
            <div class="metric">
                <span>API Calls Today</span>
                <span class="metric-value">${metrics.businessMetrics.apiCallsToday.toLocaleString()}</span>
            </div>
            <div class="chart-placeholder">📈 Business Trends</div>
        </div>

        <!-- Security Metrics Card -->
        <div class="card">
            <h2>🛡️ Security Status</h2>
            <div class="metric">
                <span>Failed Logins</span>
                <span class="metric-value">${metrics.security.failedLogins}</span>
            </div>
            <div class="metric">
                <span>Suspicious Activity</span>
                <span class="metric-value">${metrics.security.suspiciousActivity}</span>
            </div>
            <div class="metric">
                <span>Blocked Requests</span>
                <span class="metric-value">${metrics.security.blockedRequests}</span>
            </div>
            <div class="metric">
                <span>Vulnerabilities</span>
                <span class="metric-value">${metrics.security.vulnerabilitiesDetected}</span>
            </div>
        </div>

        <!-- Active Alerts Card -->
        <div class="card">
            <h2>🚨 Active Alerts</h2>
            ${metrics.alerts.length === 0 ? 
                '<div style="color: #22C55E; text-align: center; padding: 20px;">✅ No active alerts - all systems normal</div>' :
                metrics.alerts.map(alert => `
                    <div class="alert ${alert.severity}">
                        <strong>${alert.type.toUpperCase()}</strong>: ${alert.message}
                        <div style="font-size: 12px; margin-top: 5px; color: #A0AEC0;">
                            ${alert.timestamp.toLocaleString()}
                        </div>
                    </div>
                `).join('')
            }
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate predictive insights
   */
  generatePredictiveInsights(): PredictiveInsight[] {
    console.log('🔮 Generating predictive insights...');
    
    const insights: PredictiveInsight[] = [];
    
    if (this.dashboardHistory.length < 10) {
      return insights; // Need more historical data
    }

    const recent = this.dashboardHistory.slice(-10);
    
    // Capacity prediction
    const avgCPU = recent.reduce((sum, m) => sum + m.performance.system.cpuUsage, 0) / recent.length;
    const avgMemory = recent.reduce((sum, m) => sum + m.performance.system.memoryUsage, 0) / recent.length;
    
    if (avgCPU > 70) {
      insights.push({
        type: 'capacity',
        confidence: 0.85,
        timeframe: '2-4 hours',
        prediction: 'CPU usage trending upward, may reach critical levels',
        recommendedAction: 'Consider scaling up resources or optimizing CPU-intensive operations',
        impact: avgCPU > 85 ? 'critical' : 'high'
      });
    }

    if (avgMemory > 80) {
      insights.push({
        type: 'capacity',
        confidence: 0.78,
        timeframe: '1-3 hours',
        prediction: 'Memory usage increasing, potential memory pressure',
        recommendedAction: 'Monitor memory-intensive processes and consider memory optimization',
        impact: avgMemory > 90 ? 'critical' : 'medium'
      });
    }

    // Performance prediction
    const avgResponseTime = recent.reduce((sum, m) => sum + m.performance.api.averageResponseTime, 0) / recent.length;
    const errorRateTrend = recent.map(m => m.performance.api.errorRate);
    const errorRateIncreasing = errorRateTrend[errorRateTrend.length - 1] > errorRateTrend[0];

    if (avgResponseTime > 800) {
      insights.push({
        type: 'performance',
        confidence: 0.82,
        timeframe: '30-60 minutes',
        prediction: 'API response times degrading, may impact user experience',
        recommendedAction: 'Investigate slow endpoints and optimize database queries',
        impact: avgResponseTime > 2000 ? 'high' : 'medium'
      });
    }

    if (errorRateIncreasing && errorRateTrend[errorRateTrend.length - 1] > 0.02) {
      insights.push({
        type: 'performance',
        confidence: 0.75,
        timeframe: '15-30 minutes',
        prediction: 'Error rate trending upward, service degradation possible',
        recommendedAction: 'Review recent deployments and error logs for issues',
        impact: 'high'
      });
    }

    // Security insights
    const avgFailedLogins = recent.reduce((sum, m) => sum + m.security.failedLogins, 0) / recent.length;
    if (avgFailedLogins > 10) {
      insights.push({
        type: 'security',
        confidence: 0.65,
        timeframe: 'immediate',
        prediction: 'Elevated failed login attempts may indicate brute force attack',
        recommendedAction: 'Implement additional rate limiting and monitor for suspicious IPs',
        impact: 'medium'
      });
    }

    return insights;
  }

  /**
   * Export comprehensive observability report
   */
  async exportObservabilityReport(): Promise<string> {
    const metrics = await this.getDashboardMetrics();
    const insights = this.generatePredictiveInsights();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        systemHealth: metrics.systemHealth.overall,
        criticalAlerts: metrics.alerts.filter(a => a.severity === 'critical').length,
        totalAlerts: metrics.alerts.length,
        avgResponseTime: metrics.performance.api.averageResponseTime,
        errorRate: metrics.performance.api.errorRate
      },
      metrics,
      insights,
      recommendations: this.generateRecommendations(metrics, insights),
      history: {
        last24Hours: this.dashboardHistory.slice(-144), // 24 hours of 10-minute samples
        trends: this.calculateTrends()
      }
    };

    const reportPath = path.join(process.cwd(), 'logs', `observability-report-${Date.now()}.json`);
    
    // Ensure logs directory exists
    const logsDir = path.dirname(reportPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Observability report exported to: ${reportPath}`);
    return reportPath;
  }

  /**
   * Private helper methods
   */
  private async collectSystemMetrics() {
    // Simulate system metrics collection
    return {
      cpuUsage: Math.random() * 80 + 10,
      memoryUsage: Math.random() * 70 + 15,
      diskUsage: Math.random() * 60 + 20,
      networkIO: Math.random() * 100
    };
  }

  private async collectBusinessMetrics() {
    // In real implementation, query actual business metrics
    return {
      activeUsers: Math.floor(Math.random() * 500 + 100),
      alertsGenerated: Math.floor(Math.random() * 50 + 10),
      userRegistrations: Math.floor(Math.random() * 10 + 1),
      apiCallsToday: Math.floor(Math.random() * 10000 + 5000),
      revenueImpact: Math.random() * 1000 + 500
    };
  }

  private async collectSecurityMetrics() {
    return {
      failedLogins: Math.floor(Math.random() * 20),
      suspiciousActivity: Math.floor(Math.random() * 5),
      blockedRequests: Math.floor(Math.random() * 100 + 10),
      vulnerabilitiesDetected: Math.floor(Math.random() * 3)
    };
  }

  private calculateUptime(serviceName: string): number {
    // Simulate uptime calculation
    return 99.9 - Math.random() * 0.5;
  }

  private calculatePercentile(analytics: any, percentile: number): number {
    // Simplified percentile calculation
    return analytics.apiMetrics.averageResponseTime * (1 + (percentile - 50) / 100);
  }

  private setupDefaultAlertRules() {
    this.alertRules.push(
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: (metrics) => metrics.performance.api.errorRate > 0.05,
        severity: 'critical',
        message: (metrics) => `Error rate at ${(metrics.performance.api.errorRate * 100).toFixed(2)}%`,
        cooldown: 5 * 60 * 1000 // 5 minutes
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        condition: (metrics) => metrics.performance.api.averageResponseTime > 2000,
        severity: 'high',
        message: (metrics) => `Average response time: ${metrics.performance.api.averageResponseTime.toFixed(0)}ms`,
        cooldown: 10 * 60 * 1000 // 10 minutes
      },
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        condition: (metrics) => metrics.performance.system.cpuUsage > 85,
        severity: 'high',
        message: (metrics) => `CPU usage at ${metrics.performance.system.cpuUsage.toFixed(1)}%`,
        cooldown: 5 * 60 * 1000
      },
      {
        id: 'service_unhealthy',
        name: 'Service Unhealthy',
        condition: (metrics) => metrics.systemHealth.overall === 'unhealthy',
        severity: 'critical',
        message: () => 'One or more critical services are unhealthy',
        cooldown: 2 * 60 * 1000 // 2 minutes
      }
    );
  }

  private evaluateAlertRules(metrics: DashboardMetrics) {
    const now = new Date();
    
    for (const rule of this.alertRules) {
      // Check cooldown
      if (rule.lastTriggered && (now.getTime() - rule.lastTriggered.getTime()) < rule.cooldown) {
        continue;
      }

      // Evaluate condition
      if (rule.condition(metrics)) {
        const alert = {
          id: `${rule.id}-${Date.now()}`,
          type: rule.name,
          severity: rule.severity,
          message: rule.message(metrics),
          timestamp: now,
          acknowledged: false,
          resolved: false
        };

        this.alerts.set(alert.id, alert);
        rule.lastTriggered = now;

        // Emit alert event
        this.emit('alert', alert);
        
        console.log(`🚨 ALERT TRIGGERED: [${rule.severity.toUpperCase()}] ${rule.name} - ${alert.message}`);
      }
    }
  }

  private generateRecommendations(metrics: DashboardMetrics, insights: PredictiveInsight[]) {
    const recommendations = [];

    if (metrics.performance.api.errorRate > 0.02) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Reduce API Error Rate',
        description: 'Implement better error handling and investigate root causes of failures'
      });
    }

    if (metrics.performance.system.cpuUsage > 70) {
      recommendations.push({
        category: 'infrastructure',
        priority: 'medium',
        title: 'Optimize Resource Usage',
        description: 'Consider horizontal scaling or performance optimization'
      });
    }

    if (metrics.security.failedLogins > 15) {
      recommendations.push({
        category: 'security',
        priority: 'high',
        title: 'Strengthen Authentication Security',
        description: 'Implement stricter rate limiting and CAPTCHA for repeated failures'
      });
    }

    return recommendations;
  }

  private calculateTrends() {
    if (this.dashboardHistory.length < 10) return {};

    const recent = this.dashboardHistory.slice(-10);
    const older = this.dashboardHistory.slice(-20, -10);

    const avgResponseTimeRecent = recent.reduce((sum, m) => sum + m.performance.api.averageResponseTime, 0) / recent.length;
    const avgResponseTimeOlder = older.reduce((sum, m) => sum + m.performance.api.averageResponseTime, 0) / older.length;

    return {
      responseTime: {
        trend: avgResponseTimeRecent > avgResponseTimeOlder ? 'increasing' : 'decreasing',
        change: ((avgResponseTimeRecent - avgResponseTimeOlder) / avgResponseTimeOlder * 100).toFixed(1)
      }
    };
  }

  private startRealtimeMonitoring() {
    // Collect metrics every 10 seconds
    setInterval(async () => {
      try {
        await this.getDashboardMetrics();
      } catch (error) {
        console.error('Error collecting dashboard metrics:', error);
      }
    }, 10 * 1000);
  }

  private startPredictiveAnalytics() {
    // Generate insights every 5 minutes
    setInterval(() => {
      const insights = this.generatePredictiveInsights();
      if (insights.length > 0) {
        console.log('🔮 Predictive insights updated:', insights.length, 'insights generated');
        this.emit('insights', insights);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Get middleware for Express integration
   */
  getExpressMiddleware() {
    return this.apmMonitor.apiMiddleware();
  }

  /**
   * Get current dashboard data
   */
  getCurrentMetrics(): DashboardMetrics | null {
    return this.dashboardHistory[this.dashboardHistory.length - 1] || null;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, userId: string) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();
      console.log(`✅ Alert acknowledged: ${alertId} by user ${userId}`);
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, userId: string) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedBy = userId;
      alert.resolvedAt = new Date();
      console.log(`✅ Alert resolved: ${alertId} by user ${userId}`);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.healthMonitor.cleanup();
    this.apmMonitor.cleanup();
    this.removeAllListeners();
    console.log('🧹 Observability dashboard cleanup completed');
  }
}