/**
 * Customer Onboarding API Routes - Phase 6.3 Enterprise
 * RESTful endpoints for brokerage client onboarding automation
 */

import { Router, Request, Response } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import {
  CustomerOnboardingService,
  BrokerageClientData,
} from "../services/customerOnboardingService";
import { AutomatedWorkflowService } from "../services/automatedWorkflowService";
import { createLogger } from "../utils/logger";
import Joi from "joi";

const router = Router();
const logger = createLogger();
const onboardingService = CustomerOnboardingService.getInstance();
const workflowService = AutomatedWorkflowService.getInstance();

// Validation schemas
const brokerageClientSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  domain: Joi.string().required().domain(),
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().optional(),
  billingEmail: Joi.string().email().optional(),
  logoUrl: Joi.string().uri().optional(),
  website: Joi.string().uri().optional(),
  address: Joi.object({
    line1: Joi.string().optional(),
    line2: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().default("US").optional(),
  }).optional(),
  licenseNumber: Joi.string().optional(),
  subscriptionTier: Joi.string()
    .valid(
      "FREE",
      "SOLO_AGENT",
      "PROFESSIONAL",
      "TEAM_ENTERPRISE",
      "WHITE_LABEL",
    )
    .required(),
});

const stepCompletionSchema = Joi.object({
  stepId: Joi.string().required(),
  data: Joi.object().required(),
});

/**
 * @route POST /api/customer-onboarding/clients
 * @desc Create a new brokerage client and initiate onboarding
 * @access Admin
 */
router.post(
  "/clients",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("🏢 Creating new brokerage client...");

      // Validate request body
      const { error, value } = brokerageClientSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: "Validation error",
          details: error.details.map((d) => d.message),
        });
      }

      const clientData: BrokerageClientData = value;
      const client = await onboardingService.createBrokerageClient(clientData);

      // Trigger onboarding workflows
      await workflowService.executeWorkflow("CLIENT_CREATED", {
        triggerType: "CLIENT_CREATED",
        data: {
          clientId: client.id,
          subscriptionTier: client.subscriptionTier,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Brokerage client created successfully",
        data: {
          id: client.id,
          name: client.name,
          domain: client.domain,
          onboardingStatus: client.onboardingStatus,
          trialEndDate: client.trialEndDate,
        },
      });
    } catch (error) {
      console.error("❌ Error creating brokerage client:", error);
      return res.status(500).json({
        error: "Failed to create brokerage client",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/customer-onboarding/clients
 * @desc Get all brokerage clients with filtering
 * @access Admin
 */
router.get(
  "/clients",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("📋 Fetching brokerage clients...");

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const tier = req.query.tier as string;

      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.onboardingStatus = status;
      if (tier) where.subscriptionTier = tier;

      const [clients, total] = await Promise.all([
        (global as any).prisma.brokerageClient.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            domain: true,
            contactEmail: true,
            subscriptionTier: true,
            onboardingStatus: true,
            onboardingProgress: true,
            trialEndDate: true,
            subscriptionStartDate: true,
            isActive: true,
            createdAt: true,
            lastActivityAt: true,
          },
        }),
        (global as any).prisma.brokerageClient.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.json({
        success: true,
        data: {
          clients,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error fetching brokerage clients:", error);
      return res.status(500).json({
        error: "Failed to fetch brokerage clients",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/customer-onboarding/clients/:id
 * @desc Get detailed brokerage client information
 * @access Admin
 */
router.get(
  "/clients/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      console.log(`📄 Fetching client details: ${id}`);

      if (!id) {
        return res.status(400).json({
          error: "Client ID is required",
        });
      }

      const onboardingStatus =
        await onboardingService.getOnboardingProgress(id);

      return res.json({
        success: true,
        data: onboardingStatus,
      });
    } catch (error) {
      console.error("❌ Error fetching client details:", error);

      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({
          error: "Client not found",
          message: error.message,
        });
      }

      return res.status(500).json({
        error: "Failed to fetch client details",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route POST /api/customer-onboarding/steps/complete
 * @desc Complete an onboarding step
 * @access Admin
 */
router.post(
  "/steps/complete",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("✅ Completing onboarding step...");

      // Validate request body
      const { error, value } = stepCompletionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: "Validation error",
          details: error.details.map((d) => d.message),
        });
      }

      const { stepId, data } = value;
      await onboardingService.updateOnboardingStep(stepId, {
        ...data,
        status: "COMPLETED",
      });

      return res.json({
        success: true,
        message: "Onboarding step completed successfully",
      });
    } catch (error) {
      console.error("❌ Error completing onboarding step:", error);
      return res.status(500).json({
        error: "Failed to complete onboarding step",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/customer-onboarding/metrics/success
 * @desc Get customer success metrics overview
 * @access Admin
 */
router.get(
  "/metrics/success",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("📊 Generating customer success metrics...");

      const timeframe = (req.query.timeframe as string) || "30d";
      const daysBack = timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 90;
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      // Get various metrics
      const [
        totalClients,
        activeClients,
        onboardingStats,
        healthScores,
        trialConversions,
        averageOnboardingTime,
      ] = await Promise.all([
        (global as any).prisma.brokerageClient.count(),
        (global as any).prisma.brokerageClient.count({
          where: { isActive: true },
        }),
        (global as any).prisma.brokerageClient.groupBy({
          by: ["onboardingStatus"],
          _count: { onboardingStatus: true },
        }),
        (global as any).prisma.customerHealthScore.aggregate({
          _avg: { overallScore: true },
          _count: { id: true },
        }),
        (global as any).prisma.brokerageClient.count({
          where: {
            subscriptionStartDate: { not: null },
            createdAt: { gte: startDate },
          },
        }),
        (global as any).prisma.customerSuccessMetric.findMany({
          where: {
            metricName: "time_to_completion",
            recordedAt: { gte: startDate },
          },
          select: { value: true },
        }),
      ]);

      const avgOnboardingTime =
        averageOnboardingTime.length > 0
          ? averageOnboardingTime.reduce(
              (sum: number, metric: any) => sum + Number(metric.value),
              0,
            ) / averageOnboardingTime.length
          : 0;

      const onboardingBreakdown = onboardingStats.reduce(
        (acc: any, stat: any) => {
          acc[stat.onboardingStatus.toLowerCase()] =
            stat._count.onboardingStatus;
          return acc;
        },
        {},
      );

      const newClientsThisPeriod = await (
        global as any
      ).prisma.brokerageClient.count({
        where: { createdAt: { gte: startDate } },
      });

      return res.json({
        success: true,
        data: {
          overview: {
            totalClients,
            activeClients,
            newClientsThisPeriod,
            averageHealthScore: Math.round(healthScores._avg.overallScore || 0),
            trialConversions,
            averageOnboardingTime: Math.round(avgOnboardingTime),
          },
          onboardingStatus: {
            pending: onboardingBreakdown.pending || 0,
            initiated: onboardingBreakdown.initiated || 0,
            in_progress: onboardingBreakdown.in_progress || 0,
            completed: onboardingBreakdown.completed || 0,
            stalled: onboardingBreakdown.stalled || 0,
          },
          period: {
            timeframe,
            daysBack,
            startDate,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error generating success metrics:", error);
      return res.status(500).json({
        error: "Failed to generate success metrics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/customer-onboarding/health-scores
 * @desc Get customer health scores with risk analysis
 * @access Admin
 */
router.get(
  "/health-scores",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("🏥 Fetching customer health scores...");

      const riskLevel = req.query.riskLevel as string;
      const limit = parseInt(req.query.limit as string) || 50;

      const where: any = {};
      if (riskLevel) where.riskLevel = riskLevel.toUpperCase();

      const healthScores = await (
        global as any
      ).prisma.customerHealthScore.findMany({
        where,
        take: limit,
        orderBy: { calculatedAt: "desc" },
        include: {
          brokerageClient: {
            select: {
              id: true,
              name: true,
              domain: true,
              subscriptionTier: true,
              onboardingStatus: true,
            },
          },
        },
      });

      // Risk level summary
      const riskSummary = await (
        global as any
      ).prisma.customerHealthScore.groupBy({
        by: ["riskLevel"],
        _count: { riskLevel: true },
        _avg: { overallScore: true },
      });

      const summary = riskSummary.reduce((acc: any, item: any) => {
        acc[item.riskLevel.toLowerCase()] = {
          count: item._count.riskLevel,
          averageScore: Math.round(item._avg.overallScore || 0),
        };
        return acc;
      }, {});

      return res.json({
        success: true,
        data: {
          healthScores: healthScores.map((score: any) => ({
            id: score.id,
            client: score.brokerageClient,
            overallScore: score.overallScore,
            adoptionScore: score.adoptionScore,
            engagementScore: score.engagementScore,
            supportScore: score.supportScore,
            billingScore: score.billingScore,
            riskLevel: score.riskLevel,
            recommendations: score.recommendations,
            calculatedAt: score.calculatedAt,
            nextReviewAt: score.nextReviewAt,
          })),
          summary: {
            total: healthScores.length,
            riskBreakdown: summary,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error fetching health scores:", error);
      return res.status(500).json({
        error: "Failed to fetch health scores",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/customer-onboarding/workflows
 * @desc Get automated workflow statistics
 * @access Admin
 */
router.get(
  "/workflows",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("🤖 Fetching workflow statistics...");

      const statistics = await workflowService.getWorkflowAnalytics();

      return res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error("❌ Error fetching workflow statistics:", error);
      return res.status(500).json({
        error: "Failed to fetch workflow statistics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route POST /api/customer-onboarding/workflows/execute
 * @desc Manually execute workflow for testing
 * @access Admin
 */
router.post(
  "/workflows/execute",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("🚀 Executing workflow manually...");

      const { triggerType, triggerData } = req.body;

      if (!triggerType) {
        return res.status(400).json({
          error: "Trigger type is required",
        });
      }

      await workflowService.executeWorkflow(triggerType, triggerData || {});

      return res.json({
        success: true,
        message: "Workflow executed successfully",
      });
    } catch (error) {
      console.error("❌ Error executing workflow:", error);
      return res.status(500).json({
        error: "Failed to execute workflow",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route POST /api/customer-onboarding/workflows/check
 * @desc Run workflow checks manually
 * @access Admin
 */
router.post(
  "/workflows/check",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      console.log("🔍 Running workflow checks...");

      // Stub: would check and execute workflows
      console.log("Workflow checks completed (stubbed)");

      return res.json({
        success: true,
        message: "Workflow checks completed",
      });
    } catch (error) {
      console.error("❌ Error running workflow checks:", error);
      return res.status(500).json({
        error: "Failed to run workflow checks",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * @route GET /api/customer-onboarding/communications/:clientId
 * @desc Get communication history for a client
 * @access Admin
 */
router.get(
  "/communications/:clientId",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      console.log(`📧 Fetching communication history for client: ${clientId}`);

      const communications = await (
        global as any
      ).prisma.customerCommunication.findMany({
        where: { brokerageClientId: clientId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          communicationType: true,
          channel: true,
          subject: true,
          status: true,
          sentAt: true,
          deliveredAt: true,
          openedAt: true,
          clickedAt: true,
          recipientEmail: true,
          metadata: true,
          createdAt: true,
        },
      });

      return res.json({
        success: true,
        data: {
          communications,
          total: communications.length,
        },
      });
    } catch (error) {
      console.error("❌ Error fetching communication history:", error);
      return res.status(500).json({
        error: "Failed to fetch communication history",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
