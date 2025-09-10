import { PrismaClient } from "../generated/prisma";
import { createLogger } from "../utils/logger";
import { sendEmail } from "../utils/email";

const logger = createLogger();
const prisma = new PrismaClient();

export interface OnboardingStepData {
  stepName: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  metadata?: Record<string, any>;
}

export interface BrokerageClientData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  subscriptionTier: string;
}

/**
 * Customer Onboarding Service - STUB IMPLEMENTATION
 *
 * This service would normally manage customer onboarding workflows but is currently stubbed
 * because the required database models (brokerageClient, onboardingStep, etc.)
 * are not yet implemented in the schema. All methods return mock data for TypeScript compilation.
 */
export class CustomerOnboardingService {
  private static instance: CustomerOnboardingService;

  private constructor() {}

  public static getInstance(): CustomerOnboardingService {
    if (!CustomerOnboardingService.instance) {
      CustomerOnboardingService.instance = new CustomerOnboardingService();
    }
    return CustomerOnboardingService.instance;
  }

  async createBrokerageClient(clientData: BrokerageClientData): Promise<any> {
    logger.info("🏢 Creating brokerage client (STUB)", clientData);

    // Stub: would create brokerageClient record
    const client = {
      id: "client-" + Date.now(),
      ...clientData,
      createdAt: new Date(),
      status: "ACTIVE",
    };

    // Stub: would create initial onboarding steps
    const defaultSteps = [
      "account_setup",
      "payment_configuration",
      "team_setup",
      "data_import",
      "training_completed",
    ];

    logger.info(
      `Would create ${defaultSteps.length} onboarding steps for client ${client.id}`,
    );

    return client;
  }

  async getBrokerageClient(clientId: string): Promise<any> {
    logger.info(`📋 Getting brokerage client ${clientId} (STUB)`);

    // Stub: would query brokerageClient
    const client = null;

    return client;
  }

  async updateOnboardingStep(
    clientId: string,
    stepData: OnboardingStepData,
  ): Promise<any> {
    logger.info(
      `✅ Updating onboarding step for client ${clientId} (STUB)`,
      stepData,
    );

    // Stub: would update onboarding step
    const updatedStep = {
      id: "step-" + Date.now(),
      clientId,
      ...stepData,
      updatedAt: new Date(),
    };

    // Stub: check if all steps completed
    if (stepData.status === "COMPLETED") {
      logger.info(
        `Would check if client ${clientId} has completed all onboarding steps`,
      );
    }

    return updatedStep;
  }

  async getOnboardingProgress(clientId: string): Promise<any> {
    logger.info(`📊 Getting onboarding progress for client ${clientId} (STUB)`);

    // Stub: would query onboarding steps
    const steps: any[] = [];

    const totalSteps = 5; // Default number of steps
    const completedSteps = 0;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return {
      clientId,
      totalSteps,
      completedSteps,
      progress,
      steps: steps.map((step) => ({
        stepName: step.stepName,
        status: step.status,
        completedAt: step.completedAt,
        metadata: step.metadata,
      })),
      isComplete: progress === 100,
      nextStep: progress < 100 ? "account_setup" : null,
    };
  }

  async createOnboardingTemplate(templateData: {
    name: string;
    description: string;
    steps: string[];
    targetTier: string;
  }): Promise<any> {
    logger.info("📝 Creating onboarding template (STUB)", templateData);

    // Stub: would create onboarding template
    const template = {
      id: "template-" + Date.now(),
      ...templateData,
      createdAt: new Date(),
      isActive: true,
    };

    return template;
  }

  async getOnboardingTemplates(): Promise<any[]> {
    logger.info("📚 Getting onboarding templates (STUB)");

    // Stub: would query templates
    const templates: any[] = [];

    return templates;
  }

  async assignTemplate(clientId: string, templateId: string): Promise<void> {
    logger.info(
      `🎯 Assigning template ${templateId} to client ${clientId} (STUB)`,
    );

    // Stub: would get template and create steps
    const template = null;

    if (template) {
      logger.info(
        `Would create onboarding steps from template for client ${clientId}`,
      );
    }

    // Stub: would update client record
    logger.info(`Would update client ${clientId} with assigned template`);
  }

  async completeOnboarding(clientId: string): Promise<any> {
    logger.info(`🎉 Completing onboarding for client ${clientId} (STUB)`);

    // Stub: would mark all steps as complete and client as onboarded
    const completedSteps: any[] = [];

    // Stub: would update client status
    logger.info(`Would mark client ${clientId} as fully onboarded`);

    // Stub: would trigger welcome communication
    logger.info(`Would send welcome communication to client ${clientId}`);

    return {
      clientId,
      completedAt: new Date(),
      completedSteps: completedSteps.length,
      status: "ONBOARDED",
    };
  }

  async getOnboardingMetrics(): Promise<any> {
    logger.info("📈 Getting onboarding metrics (STUB)");

    // Stub: would query client and step data
    const clients: any[] = [];

    const totalClients = clients.length;
    const onboardedClients = 0;
    const inProgressClients = 0;
    const averageCompletionTime = 0;

    return {
      totalClients,
      onboardedClients,
      inProgressClients,
      onboardingRate:
        totalClients > 0 ? (onboardedClients / totalClients) * 100 : 0,
      averageCompletionTime,
      clientsByStatus: {
        pending: 0,
        in_progress: inProgressClients,
        completed: onboardedClients,
        stalled: 0,
      },
    };
  }

  async createWhiteLabelConfig(
    clientId: string,
    config: {
      brandName: string;
      primaryColor: string;
      secondaryColor: string;
      logoUrl?: string;
      customDomain?: string;
    },
  ): Promise<any> {
    logger.info(
      `🎨 Creating white-label config for client ${clientId} (STUB)`,
      config,
    );

    // Stub: would create white label configuration
    const whiteLabelConfig = {
      id: "config-" + Date.now(),
      clientId,
      ...config,
      createdAt: new Date(),
      isActive: true,
    };

    return whiteLabelConfig;
  }

  async trackCustomerSuccess(
    clientId: string,
    metric: string,
    value: number,
  ): Promise<void> {
    logger.info(
      `📊 Tracking customer success metric for client ${clientId} (STUB)`,
      { metric, value },
    );

    // Stub: would create customer success metric record
    logger.info(`Would record ${metric}: ${value} for client ${clientId}`);
  }

  async sendOnboardingCommunication(
    clientId: string,
    type: "welcome" | "progress" | "completion",
  ): Promise<void> {
    logger.info(
      `📧 Sending ${type} communication to client ${clientId} (STUB)`,
    );

    // Stub: would create communication record and send email
    logger.info(`Would send ${type} email to client ${clientId}`);
  }

  async calculateHealthScore(clientId: string): Promise<any> {
    logger.info(`💗 Calculating health score for client ${clientId} (STUB)`);

    // Stub: would analyze client activity and engagement
    const healthScore = {
      clientId,
      score: 85, // Mock score
      factors: {
        engagement: 80,
        adoption: 90,
        satisfaction: 85,
        growth: 88,
      },
      calculatedAt: new Date(),
      trend: "IMPROVING",
    };

    // Stub: would save health score
    logger.info(
      `Would save health score ${healthScore.score} for client ${clientId}`,
    );

    return healthScore;
  }

  // Utility methods
  private async scheduleFollowUp(
    clientId: string,
    days: number,
  ): Promise<void> {
    logger.info(
      `⏰ Scheduling follow-up for client ${clientId} in ${days} days (STUB)`,
    );
    // Stub implementation
  }

  private async notifyCSM(clientId: string, message: string): Promise<void> {
    logger.info(`🔔 Notifying CSM about client ${clientId}: ${message} (STUB)`);
    // Stub implementation
  }
}

export const customerOnboardingService =
  CustomerOnboardingService.getInstance();
