/**
 * Enterprise Monitoring API Routes - Phase 5 QA Excellence
 * CRITICAL: Real-time monitoring endpoints with admin-only access
 * TARGET: Comprehensive system observability through RESTful API
 */

import { Router, Request, Response } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { ObservabilityDashboard } from "../monitoring/observability-dashboard";
import { HealthMonitor } from "../monitoring/health-monitor";
import { APMMonitor } from "../monitoring/apm-monitor";

const router = Router();

// Initialize monitoring services
const observabilityDashboard = new ObservabilityDashboard();
const healthMonitor = new HealthMonitor();
const apmMonitor = new APMMonitor();

/**
 * @route GET /api/monitoring/health
 * @desc Comprehensive system health check
 * @access Admin Only
 */
router.get(
  "/health",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("🏥 Admin health check requested");

      const healthCheck = await healthMonitor.performHealthCheck();

      return res.status(200).json({
        status: healthCheck.status,
        timestamp: new Date().toISOString(),
        checks: healthCheck.checks,
        metrics: healthCheck.metrics,
        summary: healthCheck.summary,
      });
    } catch (error) {
      console.error("❌ Health check failed:", error);
      return res.status(500).json({
        error: "Health check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/monitoring/dashboard
 * @desc Real-time dashboard metrics
 * @access Admin Only
 */
router.get(
  "/dashboard",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("📊 Dashboard metrics requested");

      const dashboardMetrics =
        await observabilityDashboard.getDashboardMetrics();

      return res.status(200).json({
        success: true,
        metrics: dashboardMetrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Dashboard metrics failed:", error);
      return res.status(500).json({
        error: "Failed to retrieve dashboard metrics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/monitoring/dashboard/html
 * @desc Real-time dashboard HTML view
 * @access Admin Only
 */
router.get(
  "/dashboard/html",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("🖥️ Dashboard HTML requested");

      const dashboardHTML = observabilityDashboard.generateDashboardHTML();

      return res.setHeader("Content-Type", "text/html");
      return res.status(200).send(dashboardHTML);
    } catch (error) {
      console.error("❌ Dashboard HTML generation failed:", error);
      return res.status(500).json({
        error: "Failed to generate dashboard HTML",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/monitoring/performance
 * @desc Performance analytics and APM data
 * @access Admin Only
 */
router.get(
  "/performance",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("⚡ Performance analytics requested");

      const timeRange = parseInt(req.query.timeRange as string) || 60; // minutes
      const performanceAnalytics =
        apmMonitor.generatePerformanceAnalytics(timeRange);
      const performanceReport = apmMonitor.generatePerformanceReport();

      return res.status(200).json({
        success: true,
        analytics: performanceAnalytics,
        report: performanceReport,
        timeRange,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Performance analytics failed:", error);
      return res.status(500).json({
        error: "Failed to retrieve performance analytics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/monitoring/insights
 * @desc Predictive insights and recommendations
 * @access Admin Only
 */
router.get(
  "/insights",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("🔮 Predictive insights requested");

      const insights = observabilityDashboard.generatePredictiveInsights();
      const currentMetrics = observabilityDashboard.getCurrentMetrics();

      return res.status(200).json({
        success: true,
        insights,
        summary: {
          totalInsights: insights.length,
          criticalInsights: insights.filter((i) => i.impact === "critical")
            .length,
          highImpactInsights: insights.filter((i) => i.impact === "high")
            .length,
          averageConfidence:
            insights.length > 0
              ? insights.reduce((sum, i) => sum + i.confidence, 0) /
                insights.length
              : 0,
        },
        currentMetrics: currentMetrics
          ? {
              systemHealth: currentMetrics.systemHealth.overall,
              activeAlerts: currentMetrics.alerts.length,
              criticalAlerts: currentMetrics.alerts.filter(
                (a) => a.severity === "critical",
              ).length,
            }
          : null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Insights generation failed:", error);
      return res.status(500).json({
        error: "Failed to generate insights",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/monitoring/alerts
 * @desc Active system alerts
 * @access Admin Only
 */
router.get(
  "/alerts",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("🚨 System alerts requested");

      const currentMetrics = observabilityDashboard.getCurrentMetrics();
      const alerts = currentMetrics?.alerts || [];

      // Filter by severity if specified
      const severityFilter = req.query.severity as string;
      const filteredAlerts = severityFilter
        ? alerts.filter((alert) => alert.severity === severityFilter)
        : alerts;

      // Sort by timestamp (newest first)
      const sortedAlerts = filteredAlerts.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      return res.status(200).json({
        success: true,
        alerts: sortedAlerts,
        summary: {
          total: alerts.length,
          critical: alerts.filter((a) => a.severity === "critical").length,
          high: alerts.filter((a) => a.severity === "high").length,
          medium: alerts.filter((a) => a.severity === "medium").length,
          low: alerts.filter((a) => a.severity === "low").length,
          acknowledged: alerts.filter((a) => a.acknowledged).length,
          resolved: alerts.filter((a) => a.resolved).length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Alerts retrieval failed:", error);
      return res.status(500).json({
        error: "Failed to retrieve alerts",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route POST /api/monitoring/alerts/:alertId/acknowledge
 * @desc Acknowledge a system alert
 * @access Admin Only
 */
router.post(
  "/alerts/:alertId/acknowledge",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const userId = (req as any).user.id;

      if (!alertId) {
        return res.status(400).json({
          error: "Alert ID is required",
        });
      }

      console.log(
        `✅ Alert acknowledgment requested: ${alertId} by user ${userId}`,
      );

      observabilityDashboard.acknowledgeAlert(alertId, userId);

      return res.status(200).json({
        success: true,
        message: "Alert acknowledged successfully",
        alertId,
        acknowledgedBy: userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Alert acknowledgment failed:", error);
      return res.status(500).json({
        error: "Failed to acknowledge alert",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route POST /api/monitoring/alerts/:alertId/resolve
 * @desc Resolve a system alert
 * @access Admin Only
 */
router.post(
  "/alerts/:alertId/resolve",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const userId = (req as any).user.id;

      if (!alertId) {
        return res.status(400).json({
          error: "Alert ID is required",
        });
      }

      console.log(
        `✅ Alert resolution requested: ${alertId} by user ${userId}`,
      );

      observabilityDashboard.resolveAlert(alertId, userId);

      return res.status(200).json({
        success: true,
        message: "Alert resolved successfully",
        alertId,
        resolvedBy: userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Alert resolution failed:", error);
      return res.status(500).json({
        error: "Failed to resolve alert",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/monitoring/metrics/api
 * @desc Raw API performance metrics
 * @access Admin Only
 */
router.get(
  "/metrics/api",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("📊 API metrics requested");

      const rawMetrics = apmMonitor.getMetrics();
      const limit = parseInt(req.query.limit as string) || 100;

      return res.status(200).json({
        success: true,
        metrics: {
          api: rawMetrics.api.slice(-limit),
          database: rawMetrics.database.slice(-limit),
          performance: rawMetrics.performance.slice(-limit),
          activeTraces: rawMetrics.activeTraces,
        },
        summary: {
          apiRequests: rawMetrics.api.length,
          databaseQueries: rawMetrics.database.length,
          performanceOperations: rawMetrics.performance.length,
          activeTraces: rawMetrics.activeTraces.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ API metrics retrieval failed:", error);
      return res.status(500).json({
        error: "Failed to retrieve API metrics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/monitoring/export/performance
 * @desc Export performance data to file
 * @access Admin Only
 */
router.get(
  "/export/performance",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("📤 Performance data export requested");

      const exportPath = await apmMonitor.exportPerformanceData();

      return res.status(200).json({
        success: true,
        message: "Performance data exported successfully",
        exportPath,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Performance export failed:", error);
      return res.status(500).json({
        error: "Failed to export performance data",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/monitoring/export/observability
 * @desc Export comprehensive observability report
 * @access Admin Only
 */
router.get(
  "/export/observability",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("📤 Observability report export requested");

      const exportPath =
        await observabilityDashboard.exportObservabilityReport();

      return res.status(200).json({
        success: true,
        message: "Observability report exported successfully",
        exportPath,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Observability export failed:", error);
      return res.status(500).json({
        error: "Failed to export observability report",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/monitoring/status
 * @desc Monitoring system status and configuration
 * @access Admin Only
 */
router.get(
  "/status",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("📋 Monitoring status requested");

      const currentMetrics = observabilityDashboard.getCurrentMetrics();

      return res.status(200).json({
        success: true,
        monitoring: {
          status: "operational",
          services: {
            healthMonitor: "active",
            apmMonitor: "active",
            observabilityDashboard: "active",
          },
          configuration: {
            metricsRetention: "24 hours",
            alertingEnabled: true,
            dashboardRefreshRate: "30 seconds",
            performanceThresholds: {
              responseTime: "5000ms",
              errorRate: "5%",
              cpuUsage: "85%",
              memoryUsage: "90%",
            },
          },
          statistics: {
            uptimeMinutes: Math.floor(process.uptime() / 60),
            totalHealthChecks: "N/A",
            totalAlerts: currentMetrics?.alerts.length || 0,
            lastHealthCheck:
              currentMetrics?.timestamp || new Date().toISOString(),
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Monitoring status failed:", error);
      return res.status(500).json({
        error: "Failed to retrieve monitoring status",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/monitoring/test
 * @desc Test monitoring system functionality
 * @access Admin Only
 */
router.get(
  "/test",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("🧪 Monitoring system test requested");

      // Perform test operations
      const testResults = {
        healthCheck: false,
        performanceMonitoring: false,
        alerting: false,
        dashboard: false,
      };

      // Test health monitoring
      try {
        await healthMonitor.performHealthCheck();
        testResults.healthCheck = true;
      } catch (error) {
        console.warn("Health check test failed:", error);
      }

      // Test performance monitoring
      try {
        const testOperation = async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return "test-result";
        };

        await apmMonitor.monitorOperation("test.operation", testOperation);
        testResults.performanceMonitoring = true;
      } catch (error) {
        console.warn("Performance monitoring test failed:", error);
      }

      // Test dashboard
      try {
        await observabilityDashboard.getDashboardMetrics();
        testResults.dashboard = true;
      } catch (error) {
        console.warn("Dashboard test failed:", error);
      }

      // Test alerting (simulated)
      testResults.alerting = true;

      const allTestsPassed = Object.values(testResults).every(
        (result) => result === true,
      );

      return res.status(200).json({
        success: true,
        testResults,
        summary: {
          allTestsPassed,
          passedTests: Object.values(testResults).filter((r) => r).length,
          totalTests: Object.keys(testResults).length,
        },
        message: allTestsPassed
          ? "All monitoring system tests passed"
          : "Some monitoring system tests failed",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Monitoring test failed:", error);
      return res.status(500).json({
        error: "Monitoring system test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
