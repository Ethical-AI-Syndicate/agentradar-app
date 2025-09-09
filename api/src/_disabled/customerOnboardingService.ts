/**
 * Customer Onboarding Automation Service - Phase 6.3 Enterprise
 * Comprehensive brokerage client onboarding and lifecycle management
 */

import { PrismaClient } from "@prisma/client"
import { createLogger } from '../utils/logger';
import { sendEmail } from '../utils/email';

const prisma = new PrismaClient();
const logger = createLogger();

export interface BrokerageClientData {
  name: string;
  domain: string;
  contactEmail: string;
  contactPhone?: string;
  billingEmail?: string;
  logoUrl?: string;
  website?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  licenseNumber?: string;
  subscriptionTier: string;
}

export interface OnboardingStepData {
  stepName: string;
  stepType: string;
  title: string;
  description?: string;
  isRequired?: boolean;
  estimatedDuration?: number;
  validationRules?: Record<string, any>;
}

export class CustomerOnboardingService {
  
  /**
   * Create a new brokerage client and initiate onboarding
   */
  async createBrokerageClient(data: BrokerageClientData): Promise<any> {
    try {
      logger.info(`🏢 Creating new brokerage client: ${data.name}`);
      
      // Check if domain already exists
      const existingClient = await prisma.brokerageClient.findUnique({
        where: { domain: data.domain }
      });
      
      if (existingClient) {
        throw new Error(`Brokerage client with domain ${data.domain} already exists`);
      }
      
      // Create brokerage client
      const client = await prisma.brokerageClient.create({
        data: {
          name: data.name,
          domain: data.domain,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          billingEmail: data.billingEmail || data.contactEmail,
          logoUrl: data.logoUrl,
          website: data.website,
          addressLine1: data.address?.line1,
          addressLine2: data.address?.line2,
          city: data.address?.city,
          state: data.address?.state,
          zipCode: data.address?.zipCode,
          country: data.address?.country || 'US',
          licenseNumber: data.licenseNumber,
          subscriptionTier: data.subscriptionTier as any,
          onboardingStatus: 'INITIATED',
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
      
      // Initialize onboarding process
      await this.initializeOnboardingProcess(client.id, data.subscriptionTier as any);
      
      // Send welcome email
      await this.sendWelcomeEmail(client);
      
      // Create initial white-label configuration
      await this.createInitialWhiteLabelConfig(client.id, data);
      
      logger.info(`✅ Brokerage client created successfully: ${client.id}`);
      return client;
      
    } catch (error) {
      logger.error('❌ Error creating brokerage client:', error);
      throw error;
    }
  }
  
  /**
   * Initialize onboarding process with template-based steps
   */
  async initializeOnboardingProcess(clientId: string, subscriptionTier: any): Promise<void> {
    try {
      logger.info(`🚀 Initializing onboarding process for client: ${clientId}`);
      
      // Get onboarding template for subscription tier
      const template = await this.getOnboardingTemplate(subscriptionTier);
      const steps = template.steps as OnboardingStepData[];
      
      // Create onboarding steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await prisma.onboardingStep.create({
          data: {
            brokerageClientId: clientId,
            stepName: step.stepName,
            stepType: step.stepType,
            stepOrder: i + 1,
            title: step.title,
            description: step.description,
            isRequired: step.isRequired ?? true,
            estimatedDuration: step.estimatedDuration,
            validationRules: step.validationRules || {},
            status: i === 0 ? 'IN_PROGRESS' : 'PENDING'
          }
        });
      }
      
      // Update client onboarding progress
      await prisma.brokerageClient.update({
        where: { id: clientId },
        data: { 
          onboardingStatus: 'IN_PROGRESS',
          onboardingProgress: 0
        }
      });
      
      logger.info(`✅ Onboarding process initialized with ${steps.length} steps`);
      
    } catch (error) {
      logger.error('❌ Error initializing onboarding process:', error);
      throw error;
    }
  }
  
  /**
   * Complete an onboarding step
   */
  async completeOnboardingStep(stepId: string, completionData: Record<string, any>): Promise<void> {
    try {
      logger.info(`✅ Completing onboarding step: ${stepId}`);
      
      const step = await prisma.onboardingStep.findUnique({
        where: { id: stepId },
        include: { brokerageClient: true }
      });
      
      if (!step) {
        throw new Error(`Onboarding step not found: ${stepId}`);
      }
      
      // Validate completion data against rules
      if (step.validationRules && Object.keys(step.validationRules).length > 0) {
        await this.validateStepCompletion(completionData, step.validationRules as Record<string, any>);
      }
      
      // Mark step as completed
      await prisma.onboardingStep.update({
        where: { id: stepId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          data: completionData
        }
      });
      
      // Update overall progress
      await this.updateOnboardingProgress(step.brokerageClientId);
      
      // Trigger next step if available
      await this.activateNextStep(step.brokerageClientId, step.stepOrder);
      
      // Record success metric
      await this.recordSuccessMetric(step.brokerageClientId, 'onboarding_step_completed', 1);
      
      logger.info(`✅ Onboarding step completed: ${stepId}`);
      
    } catch (error) {
      logger.error('❌ Error completing onboarding step:', error);
      throw error;
    }
  }
  
  /**
   * Get onboarding template for subscription tier
   */
  private async getOnboardingTemplate(subscriptionTier: any): Promise<any> {
    try {
      let template = await prisma.onboardingTemplate.findFirst({
        where: { 
          subscriptionTier,
          isActive: true 
        }
      });
      
      if (!template) {
        // Create default template if none exists
        template = await this.createDefaultOnboardingTemplate(subscriptionTier);
      }
      
      return template;
      
    } catch (error) {
      logger.error('❌ Error getting onboarding template:', error);
      throw error;
    }
  }
  
  /**
   * Create default onboarding template
   */
  private async createDefaultOnboardingTemplate(subscriptionTier: any): Promise<any> {
    const defaultSteps: OnboardingStepData[] = [
      {
        stepName: 'welcome',
        stepType: 'INFORMATION',
        title: 'Welcome to AgentRadar',
        description: 'Get familiar with your new real estate intelligence platform',
        isRequired: true,
        estimatedDuration: 5
      },
      {
        stepName: 'company_profile',
        stepType: 'DATA_COLLECTION',
        title: 'Complete Company Profile',
        description: 'Provide your brokerage information and branding',
        isRequired: true,
        estimatedDuration: 15,
        validationRules: {
          required: ['companyName', 'primaryContact', 'businessLicense']
        }
      },
      {
        stepName: 'team_setup',
        stepType: 'CONFIGURATION',
        title: 'Set Up Your Team',
        description: 'Add team members and configure roles',
        isRequired: false,
        estimatedDuration: 20
      },
      {
        stepName: 'alert_preferences',
        stepType: 'CONFIGURATION', 
        title: 'Configure Alert Preferences',
        description: 'Set up property alert filters and notifications',
        isRequired: true,
        estimatedDuration: 10
      },
      {
        stepName: 'integration_setup',
        stepType: 'INTEGRATION',
        title: 'Connect Your Tools',
        description: 'Integrate with your existing CRM and tools',
        isRequired: false,
        estimatedDuration: 25
      },
      {
        stepName: 'training_completion',
        stepType: 'TRAINING',
        title: 'Complete Platform Training',
        description: 'Learn how to maximize your AgentRadar investment',
        isRequired: true,
        estimatedDuration: 30
      },
      {
        stepName: 'go_live',
        stepType: 'ACTIVATION',
        title: 'Go Live',
        description: 'Activate your account and start receiving alerts',
        isRequired: true,
        estimatedDuration: 5
      }
    ];
    
    return await prisma.onboardingTemplate.create({
      data: {
        name: `${subscriptionTier} Onboarding Template`,
        description: `Default onboarding workflow for ${subscriptionTier} tier`,
        subscriptionTier,
        steps: defaultSteps,
        isActive: true
      }
    });
  }
  
  /**
   * Update onboarding progress
   */
  private async updateOnboardingProgress(clientId: string): Promise<void> {
    try {
      // Get all steps for client
      const allSteps = await prisma.onboardingStep.count({
        where: { brokerageClientId: clientId }
      });
      
      const completedSteps = await prisma.onboardingStep.count({
        where: { 
          brokerageClientId: clientId,
          status: 'COMPLETED'
        }
      });
      
      const progress = allSteps > 0 ? Math.round((completedSteps / allSteps) * 100) : 0;
      const status = progress === 100 ? 'COMPLETED' : 'IN_PROGRESS';
      
      await prisma.brokerageClient.update({
        where: { id: clientId },
        data: {
          onboardingProgress: progress,
          onboardingStatus: status,
          lastActivityAt: new Date(),
          ...(status === 'COMPLETED' && {
            subscriptionStartDate: new Date()
          })
        }
      });
      
      // Trigger completion workflow if done
      if (status === 'COMPLETED') {
        await this.triggerOnboardingCompletion(clientId);
      }
      
    } catch (error) {
      logger.error('❌ Error updating onboarding progress:', error);
      throw error;
    }
  }
  
  /**
   * Activate next onboarding step
   */
  private async activateNextStep(clientId: string, currentStepOrder: number): Promise<void> {
    try {
      const nextStep = await prisma.onboardingStep.findFirst({
        where: {
          brokerageClientId: clientId,
          stepOrder: currentStepOrder + 1,
          status: 'PENDING'
        }
      });
      
      if (nextStep) {
        await prisma.onboardingStep.update({
          where: { id: nextStep.id },
          data: { 
            status: 'IN_PROGRESS',
            startedAt: new Date()
          }
        });
        
        // Send step activation notification
        await this.sendStepNotification(nextStep);
      }
      
    } catch (error) {
      logger.error('❌ Error activating next step:', error);
      throw error;
    }
  }
  
  /**
   * Validate step completion data
   */
  private async validateStepCompletion(data: Record<string, any>, rules: Record<string, any>): Promise<void> {
    if (rules.required) {
      for (const field of rules.required) {
        if (!data[field]) {
          throw new Error(`Required field missing: ${field}`);
        }
      }
    }
    
    if (rules.minLength) {
      for (const [field, minLen] of Object.entries(rules.minLength)) {
        if (data[field] && data[field].length < minLen) {
          throw new Error(`Field ${field} must be at least ${minLen} characters`);
        }
      }
    }
  }
  
  /**
   * Send welcome email to new client
   */
  private async sendWelcomeEmail(client: any): Promise<void> {
    try {
      const emailContent = `
        <h2>Welcome to AgentRadar, ${client.name}!</h2>
        <p>We're excited to help you discover real estate opportunities before they hit the market.</p>
        <p>Your account has been created and your 30-day trial has begun.</p>
        <p>Next steps:</p>
        <ul>
          <li>Complete your company profile</li>
          <li>Set up your alert preferences</li>
          <li>Invite your team members</li>
        </ul>
        <p>If you have any questions, our customer success team is here to help.</p>
        <p>Best regards,<br>The AgentRadar Team</p>
      `;
      
      await sendEmail({
        to: client.contactEmail,
        subject: `Welcome to AgentRadar - Let's get started!`,
        html: emailContent,
        from: 'Customer Success <success@agentradar.app>'
      });
      
      // Log communication
      await this.logCommunication(client.id, 'WELCOME_EMAIL', 'EMAIL', emailContent, client.contactEmail);
      
    } catch (error) {
      logger.error('❌ Error sending welcome email:', error);
      // Don't throw - this shouldn't block onboarding
    }
  }
  
  /**
   * Create initial white-label configuration
   */
  private async createInitialWhiteLabelConfig(clientId: string, data: BrokerageClientData): Promise<void> {
    try {
      await prisma.whiteLabelConfig.create({
        data: {
          brokerageClientId: clientId,
          brandName: data.name,
          logoUrl: data.logoUrl,
          emailTemplate: {
            header: data.name,
            footer: `${data.name} | Powered by AgentRadar`,
            primaryColor: '#1f4788',
            secondaryColor: '#f8f9fa'
          },
          dashboardConfig: {
            showBranding: true,
            customWelcomeMessage: `Welcome to ${data.name}'s Real Estate Intelligence Platform`
          },
          featureFlags: {
            enableWhiteLabel: true,
            enableCustomDomain: false,
            enableAdvancedBranding: false
          }
        }
      });
      
    } catch (error) {
      logger.error('❌ Error creating white-label config:', error);
      // Don't throw - this shouldn't block onboarding
    }
  }
  
  /**
   * Trigger onboarding completion workflow
   */
  private async triggerOnboardingCompletion(clientId: string): Promise<void> {
    try {
      logger.info(`🎉 Onboarding completed for client: ${clientId}`);
      
      const client = await prisma.brokerageClient.findUnique({
        where: { id: clientId }
      });
      
      if (!client) return;
      
      // Send completion email
      const completionEmail = `
        <h2>Congratulations! Your AgentRadar setup is complete.</h2>
        <p>Welcome to the future of real estate intelligence, ${client.name}!</p>
        <p>You're now ready to:</p>
        <ul>
          <li>Receive exclusive property alerts</li>
          <li>Access market intelligence reports</li>
          <li>Manage your team and preferences</li>
        </ul>
        <p>Your customer success manager will be in touch within 24 hours.</p>
        <p>Get started: <a href="https://${client.domain}.agentradar.app">Access Your Dashboard</a></p>
      `;
      
      await sendEmail({
        to: client.contactEmail,
        subject: '🎉 Your AgentRadar setup is complete!',
        html: completionEmail,
        from: 'Customer Success <success@agentradar.app>'
      });
      
      // Record completion metrics
      await this.recordSuccessMetric(clientId, 'onboarding_completed', 1);
      await this.recordSuccessMetric(clientId, 'time_to_completion', this.calculateOnboardingDuration(client.createdAt));
      
      // Calculate initial health score
      await this.calculateCustomerHealthScore(clientId);
      
    } catch (error) {
      logger.error('❌ Error triggering onboarding completion:', error);
    }
  }
  
  /**
   * Send step notification
   */
  private async sendStepNotification(step: any): Promise<void> {
    try {
      // Implementation would send step-specific notifications
      logger.info(`📧 Sending step notification for: ${step.stepName}`);
    } catch (error) {
      logger.error('❌ Error sending step notification:', error);
    }
  }
  
  /**
   * Record customer success metric
   */
  async recordSuccessMetric(clientId: string, metricName: string, value: number, unit?: string): Promise<void> {
    try {
      await prisma.customerSuccessMetric.create({
        data: {
          brokerageClientId: clientId,
          metricType: 'ONBOARDING',
          metricName,
          value,
          unit,
          period: 'DAILY',
          metadata: {
            recordedBy: 'system',
            source: 'onboarding_service'
          }
        }
      });
    } catch (error) {
      logger.error('❌ Error recording success metric:', error);
    }
  }
  
  /**
   * Log customer communication
   */
  private async logCommunication(clientId: string, type: string, channel: string, content: string, recipient?: string): Promise<void> {
    try {
      await prisma.customerCommunication.create({
        data: {
          brokerageClientId: clientId,
          communicationType: type,
          channel,
          content,
          recipientEmail: recipient,
          status: 'SENT',
          sentAt: new Date()
        }
      });
    } catch (error) {
      logger.error('❌ Error logging communication:', error);
    }
  }
  
  /**
   * Calculate onboarding duration in hours
   */
  private calculateOnboardingDuration(startDate: Date): number {
    return Math.round((Date.now() - startDate.getTime()) / (1000 * 60 * 60));
  }
  
  /**
   * Calculate customer health score
   */
  async calculateCustomerHealthScore(clientId: string): Promise<void> {
    try {
      // Get client data
      const client = await prisma.brokerageClient.findUnique({
        where: { id: clientId },
        include: {
          onboardingSteps: true,
          successMetrics: true,
          supportTickets: true
        }
      });
      
      if (!client) return;
      
      // Calculate scores (0-100)
      const adoptionScore = this.calculateAdoptionScore(client);
      const engagementScore = this.calculateEngagementScore(client);
      const supportScore = this.calculateSupportScore(client);
      const billingScore = 100; // Default to 100 for new clients
      
      const overallScore = Math.round((adoptionScore + engagementScore + supportScore + billingScore) / 4);
      const riskLevel = overallScore >= 80 ? 'LOW' : overallScore >= 60 ? 'MEDIUM' : 'HIGH';
      
      await prisma.customerHealthScore.create({
        data: {
          brokerageClientId: clientId,
          overallScore,
          adoptionScore,
          engagementScore,
          supportScore,
          billingScore,
          riskLevel,
          factors: {
            onboardingProgress: client.onboardingProgress,
            daysSinceCreated: Math.floor((Date.now() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          },
          recommendations: this.generateRecommendations(overallScore, adoptionScore, engagementScore, supportScore),
          nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });
      
    } catch (error) {
      logger.error('❌ Error calculating customer health score:', error);
    }
  }
  
  /**
   * Calculate adoption score based on onboarding progress
   */
  private calculateAdoptionScore(client: any): number {
    return Math.min(client.onboardingProgress, 100);
  }
  
  /**
   * Calculate engagement score based on activity
   */
  private calculateEngagementScore(client: any): number {
    const daysSinceLastActivity = client.lastActivityAt 
      ? Math.floor((Date.now() - client.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
      
    if (daysSinceLastActivity <= 1) return 100;
    if (daysSinceLastActivity <= 3) return 80;
    if (daysSinceLastActivity <= 7) return 60;
    if (daysSinceLastActivity <= 14) return 40;
    return 20;
  }
  
  /**
   * Calculate support score based on ticket history
   */
  private calculateSupportScore(client: any): number {
    const openTickets = client.supportTickets?.filter((t: any) => t.status === 'OPEN')?.length || 0;
    const totalTickets = client.supportTickets?.length || 0;
    
    if (totalTickets === 0) return 100;
    if (openTickets === 0) return 90;
    if (openTickets === 1) return 70;
    if (openTickets === 2) return 50;
    return 30;
  }
  
  /**
   * Generate health score recommendations
   */
  private generateRecommendations(overall: number, adoption: number, engagement: number, support: number): string[] {
    const recommendations: string[] = [];
    
    if (adoption < 80) {
      recommendations.push('Complete remaining onboarding steps to unlock full platform value');
    }
    
    if (engagement < 60) {
      recommendations.push('Schedule training session to improve platform utilization');
    }
    
    if (support < 70) {
      recommendations.push('Follow up on open support tickets to resolve issues');
    }
    
    if (overall < 60) {
      recommendations.push('Schedule customer success check-in to address concerns');
    }
    
    return recommendations;
  }
  
  /**
   * Get client onboarding status
   */
  async getOnboardingStatus(clientId: string): Promise<any> {
    try {
      const client = await prisma.brokerageClient.findUnique({
        where: { id: clientId },
        include: {
          onboardingSteps: {
            orderBy: { stepOrder: 'asc' }
          },
          healthScores: {
            orderBy: { calculatedAt: 'desc' },
            take: 1
          }
        }
      });
      
      if (!client) {
        throw new Error(`Brokerage client not found: ${clientId}`);
      }
      
      return {
        client: {
          id: client.id,
          name: client.name,
          domain: client.domain,
          onboardingStatus: client.onboardingStatus,
          onboardingProgress: client.onboardingProgress,
          subscriptionTier: client.subscriptionTier,
          trialEndDate: client.trialEndDate
        },
        steps: client.onboardingSteps.map(step => ({
          id: step.id,
          title: step.title,
          description: step.description,
          status: step.status,
          stepOrder: step.stepOrder,
          isRequired: step.isRequired,
          estimatedDuration: step.estimatedDuration,
          completedAt: step.completedAt
        })),
        healthScore: client.healthScores[0] || null
      };
      
    } catch (error) {
      logger.error('❌ Error getting onboarding status:', error);
      throw error;
    }
  }
}