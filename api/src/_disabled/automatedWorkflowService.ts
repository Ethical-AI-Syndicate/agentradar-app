/**
 * Automated Workflow Service - Phase 6.3 Enterprise
 * Intelligent automation for customer lifecycle management
 */

import { PrismaClient } from "@prisma/client"
import { createLogger } from '../utils/logger';
import { sendEmail } from '../utils/email';
import { CustomerOnboardingService } from './customerOnboardingService';

const prisma = new PrismaClient();
const logger = createLogger();

export interface WorkflowTrigger {
  type: string;
  conditions: Record<string, any>;
}

export interface WorkflowAction {
  type: string;
  config: Record<string, any>;
}

export class AutomatedWorkflowService {
  private onboardingService: CustomerOnboardingService;
  
  constructor() {
    this.onboardingService = new CustomerOnboardingService();
  }
  
  /**
   * Initialize default workflows
   */
  async initializeDefaultWorkflows(): Promise<void> {
    try {
      logger.info('🤖 Initializing automated workflows...');
      
      const defaultWorkflows = [
        {
          name: 'New Client Welcome Sequence',
          description: 'Automated welcome and onboarding sequence for new brokerage clients',
          triggerType: 'CLIENT_CREATED',
          triggerConditions: {},
          actions: [
            {
              type: 'SEND_EMAIL',
              config: {
                template: 'welcome_sequence',
                delay: 0
              }
            },
            {
              type: 'SCHEDULE_FOLLOW_UP',
              config: {
                delay: 24, // hours
                type: 'onboarding_check_in'
              }
            },
            {
              type: 'CREATE_TASK',
              config: {
                assignTo: 'customer_success',
                title: 'New client onboarding started',
                priority: 'HIGH'
              }
            }
          ]
        },
        {
          name: 'Onboarding Stalled Detection',
          description: 'Detect and respond to stalled onboarding processes',
          triggerType: 'ONBOARDING_STALLED',
          triggerConditions: {
            daysSinceLastActivity: 3,
            progressLessThan: 50
          },
          actions: [
            {
              type: 'SEND_EMAIL',
              config: {
                template: 'onboarding_nudge',
                delay: 0
              }
            },
            {
              type: 'CREATE_SUPPORT_TICKET',
              config: {
                priority: 'MEDIUM',
                category: 'ONBOARDING_ASSISTANCE'
              }
            }
          ]
        },
        {
          name: 'Trial Expiration Warning',
          description: 'Notify clients approaching trial expiration',
          triggerType: 'TRIAL_EXPIRING',
          triggerConditions: {
            daysUntilExpiration: 7
          },
          actions: [
            {
              type: 'SEND_EMAIL',
              config: {
                template: 'trial_expiring',
                delay: 0
              }
            },
            {
              type: 'CREATE_TASK',
              config: {
                assignTo: 'sales',
                title: 'Trial expiring - conversion opportunity',
                priority: 'HIGH'
              }
            }
          ]
        },
        {
          name: 'Customer Success Check-in',
          description: 'Regular check-ins with active customers',
          triggerType: 'PERIODIC_CHECKIN',
          triggerConditions: {
            frequency: 'weekly',
            healthScore: { lessThan: 70 }
          },
          actions: [
            {
              type: 'CALCULATE_HEALTH_SCORE',
              config: {}
            },
            {
              type: 'SEND_EMAIL',
              config: {
                template: 'customer_success_checkin',
                delay: 0
              }
            }
          ]
        },
        {
          name: 'High-Value Client Escalation',
          description: 'Escalate issues for high-value clients',
          triggerType: 'SUPPORT_TICKET_CREATED',
          triggerConditions: {
            subscriptionTier: ['TEAM_ENTERPRISE', 'WHITE_LABEL'],
            priority: ['HIGH', 'URGENT']
          },
          actions: [
            {
              type: 'SEND_NOTIFICATION',
              config: {
                to: 'management',
                message: 'High-value client support ticket created'
              }
            },
            {
              type: 'ASSIGN_TO_SENIOR_SUPPORT',
              config: {}
            }
          ]
        }
      ];
      
      for (const workflow of defaultWorkflows) {
        const existing = await prisma.automatedWorkflow.findFirst({
          where: { name: workflow.name }
        });
        
        if (!existing) {
          await prisma.automatedWorkflow.create({
            data: workflow
          });
          logger.info(`✅ Created workflow: ${workflow.name}`);
        }
      }
      
      logger.info('✅ Default workflows initialized');
      
    } catch (error) {
      logger.error('❌ Error initializing workflows:', error);
      throw error;
    }
  }
  
  /**
   * Check and execute workflows based on triggers
   */
  async checkAndExecuteWorkflows(): Promise<void> {
    try {
      logger.info('🔄 Checking workflow triggers...');
      
      // Check different trigger types
      await this.checkOnboardingStalled();
      await this.checkTrialExpiring();
      await this.checkPeriodicCheckins();
      await this.checkHealthScoreAlerts();
      
    } catch (error) {
      logger.error('❌ Error checking workflows:', error);
    }
  }
  
  /**
   * Execute workflow for specific trigger
   */
  async executeWorkflow(triggerType: string, triggerData: Record<string, any>): Promise<void> {
    try {
      logger.info(`🎯 Executing workflows for trigger: ${triggerType}`);
      
      const workflows = await prisma.automatedWorkflow.findMany({
        where: {
          triggerType,
          isActive: true
        }
      });
      
      for (const workflow of workflows) {
        if (this.evaluateTriggerConditions(workflow.triggerConditions as Record<string, any>, triggerData)) {
          await this.executeWorkflowActions(workflow, triggerData);
        }
      }
      
    } catch (error) {
      logger.error('❌ Error executing workflow:', error);
    }
  }
  
  /**
   * Execute individual workflow
   */
  private async executeWorkflowActions(workflow: any, triggerData: Record<string, any>): Promise<void> {
    try {
      logger.info(`🚀 Executing workflow: ${workflow.name}`);
      
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          brokerageClientId: triggerData.clientId,
          triggerData,
          status: 'RUNNING'
        }
      });
      
      const actions = workflow.actions as WorkflowAction[];
      const executionLog: any[] = [];
      
      try {
        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          const actionResult = await this.executeAction(action, triggerData, workflow);
          
          executionLog.push({
            step: i + 1,
            action: action.type,
            status: 'SUCCESS',
            timestamp: new Date().toISOString(),
            result: actionResult
          });
          
          // Handle delays
          if (action.config.delay && action.config.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, action.config.delay * 1000));
          }
        }
        
        // Update workflow statistics
        await prisma.automatedWorkflow.update({
          where: { id: workflow.id },
          data: {
            lastTriggeredAt: new Date(),
            executionCount: { increment: 1 },
            successCount: { increment: 1 }
          }
        });
        
        // Complete execution
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            executionLog
          }
        });
        
        logger.info(`✅ Workflow executed successfully: ${workflow.name}`);
        
      } catch (actionError) {
        // Log error and update execution
        executionLog.push({
          step: executionLog.length + 1,
          action: 'ERROR',
          status: 'FAILED',
          timestamp: new Date().toISOString(),
          error: actionError instanceof Error ? actionError.message : 'Unknown error'
        });
        
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errorMessage: actionError instanceof Error ? actionError.message : 'Unknown error',
            executionLog
          }
        });
        
        await prisma.automatedWorkflow.update({
          where: { id: workflow.id },
          data: {
            errorCount: { increment: 1 }
          }
        });
        
        throw actionError;
      }
      
    } catch (error) {
      logger.error(`❌ Error executing workflow ${workflow.name}:`, error);
    }
  }
  
  /**
   * Execute individual workflow action
   */
  private async executeAction(action: WorkflowAction, triggerData: Record<string, any>, workflow: any): Promise<any> {
    switch (action.type) {
      case 'SEND_EMAIL':
        return await this.executeEmailAction(action, triggerData);
        
      case 'CREATE_SUPPORT_TICKET':
        return await this.createSupportTicketAction(action, triggerData);
        
      case 'CALCULATE_HEALTH_SCORE':
        return await this.calculateHealthScoreAction(triggerData);
        
      case 'SEND_NOTIFICATION':
        return await this.sendNotificationAction(action, triggerData);
        
      case 'CREATE_TASK':
        return await this.createTaskAction(action, triggerData);
        
      case 'SCHEDULE_FOLLOW_UP':
        return await this.scheduleFollowUpAction(action, triggerData);
        
      default:
        logger.warn(`Unknown action type: ${action.type}`);
        return null;
    }
  }
  
  /**
   * Execute email action
   */
  private async executeEmailAction(action: WorkflowAction, triggerData: Record<string, any>): Promise<any> {
    try {
      if (!triggerData.clientId) return;
      
      const client = await prisma.brokerageClient.findUnique({
        where: { id: triggerData.clientId }
      });
      
      if (!client) return;
      
      const template = action.config.template;
      const emailContent = await this.getEmailTemplate(template, client, triggerData);
      
      await sendEmail({
        to: client.contactEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        from: 'AgentRadar <noreply@agentradar.app>'
      });
      
      // Log communication
      await prisma.customerCommunication.create({
        data: {
          brokerageClientId: client.id,
          communicationType: `AUTOMATED_${template.toUpperCase()}`,
          channel: 'EMAIL',
          content: emailContent.html,
          recipientEmail: client.contactEmail,
          status: 'SENT',
          sentAt: new Date(),
          metadata: {
            workflowId: triggerData.workflowId,
            template
          }
        }
      });
      
      return { emailSent: true, recipient: client.contactEmail };
      
    } catch (error) {
      logger.error('❌ Error executing email action:', error);
      throw error;
    }
  }
  
  /**
   * Create support ticket action
   */
  private async createSupportTicketAction(action: WorkflowAction, triggerData: Record<string, any>): Promise<any> {
    try {
      if (!triggerData.clientId) return;
      
      const client = await prisma.brokerageClient.findUnique({
        where: { id: triggerData.clientId }
      });
      
      if (!client) return;
      
      const ticketNumber = `CS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const ticket = await prisma.customerSupportTicket.create({
        data: {
          brokerageClientId: client.id,
          ticketNumber,
          subject: `Automated: ${action.config.category || 'Customer Success Check'}`,
          description: `Automated ticket created for ${client.name}\n\nTrigger: ${JSON.stringify(triggerData, null, 2)}`,
          category: action.config.category || 'GENERAL',
          priority: action.config.priority || 'MEDIUM',
          metadata: {
            automated: true,
            workflowTriggered: true
          }
        }
      });
      
      return { ticketCreated: true, ticketId: ticket.id, ticketNumber };
      
    } catch (error) {
      logger.error('❌ Error creating support ticket:', error);
      throw error;
    }
  }
  
  /**
   * Calculate health score action
   */
  private async calculateHealthScoreAction(triggerData: Record<string, any>): Promise<any> {
    try {
      if (!triggerData.clientId) return;
      
      await this.onboardingService.calculateCustomerHealthScore(triggerData.clientId);
      
      return { healthScoreCalculated: true };
      
    } catch (error) {
      logger.error('❌ Error calculating health score:', error);
      throw error;
    }
  }
  
  /**
   * Send notification action
   */
  private async sendNotificationAction(action: WorkflowAction, triggerData: Record<string, any>): Promise<any> {
    try {
      // In a real implementation, this would send to Slack, Teams, etc.
      logger.info(`📢 Notification: ${action.config.message} - ${JSON.stringify(triggerData)}`);
      
      return { notificationSent: true };
      
    } catch (error) {
      logger.error('❌ Error sending notification:', error);
      throw error;
    }
  }
  
  /**
   * Create task action
   */
  private async createTaskAction(action: WorkflowAction, triggerData: Record<string, any>): Promise<any> {
    try {
      // In a real implementation, this would create tasks in project management tools
      logger.info(`📋 Task created: ${action.config.title} assigned to ${action.config.assignTo}`);
      
      return { taskCreated: true, title: action.config.title };
      
    } catch (error) {
      logger.error('❌ Error creating task:', error);
      throw error;
    }
  }
  
  /**
   * Schedule follow-up action
   */
  private async scheduleFollowUpAction(action: WorkflowAction, triggerData: Record<string, any>): Promise<any> {
    try {
      // In a real implementation, this would schedule future workflow executions
      const followUpTime = new Date(Date.now() + (action.config.delay * 60 * 60 * 1000));
      
      logger.info(`📅 Follow-up scheduled for: ${followUpTime.toISOString()}`);
      
      return { followUpScheduled: true, scheduledFor: followUpTime };
      
    } catch (error) {
      logger.error('❌ Error scheduling follow-up:', error);
      throw error;
    }
  }
  
  /**
   * Check for stalled onboarding
   */
  private async checkOnboardingStalled(): Promise<void> {
    try {
      const stalledClients = await prisma.brokerageClient.findMany({
        where: {
          onboardingStatus: 'IN_PROGRESS',
          onboardingProgress: { lt: 50 },
          lastActivityAt: {
            lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          }
        }
      });
      
      for (const client of stalledClients) {
        await this.executeWorkflow('ONBOARDING_STALLED', {
          clientId: client.id,
          daysSinceLastActivity: Math.floor((Date.now() - (client.lastActivityAt?.getTime() || 0)) / (1000 * 60 * 60 * 24)),
          progressLessThan: client.onboardingProgress
        });
      }
      
    } catch (error) {
      logger.error('❌ Error checking stalled onboarding:', error);
    }
  }
  
  /**
   * Check for expiring trials
   */
  private async checkTrialExpiring(): Promise<void> {
    try {
      const expiringClients = await prisma.brokerageClient.findMany({
        where: {
          trialEndDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          },
          subscriptionStartDate: null
        }
      });
      
      for (const client of expiringClients) {
        const daysUntilExpiration = Math.floor((client.trialEndDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        await this.executeWorkflow('TRIAL_EXPIRING', {
          clientId: client.id,
          daysUntilExpiration
        });
      }
      
    } catch (error) {
      logger.error('❌ Error checking trial expiration:', error);
    }
  }
  
  /**
   * Check for periodic health score updates
   */
  private async checkPeriodicCheckins(): Promise<void> {
    try {
      const clientsForCheckIn = await prisma.brokerageClient.findMany({
        where: {
          isActive: true,
          subscriptionStartDate: { not: null }
        },
        include: {
          healthScores: {
            orderBy: { calculatedAt: 'desc' },
            take: 1
          }
        }
      });
      
      for (const client of clientsForCheckIn) {
        const lastHealthScore = client.healthScores[0];
        const daysSinceLastCheck = lastHealthScore 
          ? Math.floor((Date.now() - lastHealthScore.calculatedAt.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
          
        // Check weekly for clients with health scores < 70 or no recent check
        if (daysSinceLastCheck >= 7 || (lastHealthScore && lastHealthScore.overallScore < 70)) {
          await this.executeWorkflow('PERIODIC_CHECKIN', {
            clientId: client.id,
            healthScore: lastHealthScore?.overallScore || 0,
            daysSinceLastCheck
          });
        }
      }
      
    } catch (error) {
      logger.error('❌ Error checking periodic checkins:', error);
    }
  }
  
  /**
   * Check for health score alerts
   */
  private async checkHealthScoreAlerts(): Promise<void> {
    try {
      const unhealthyClients = await prisma.customerHealthScore.findMany({
        where: {
          overallScore: { lt: 60 },
          riskLevel: { in: ['MEDIUM', 'HIGH'] },
          calculatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        },
        include: {
          brokerageClient: true
        }
      });
      
      for (const healthScore of unhealthyClients) {
        await this.executeWorkflow('HEALTH_SCORE_ALERT', {
          clientId: healthScore.brokerageClientId,
          healthScore: healthScore.overallScore,
          riskLevel: healthScore.riskLevel,
          recommendations: healthScore.recommendations
        });
      }
      
    } catch (error) {
      logger.error('❌ Error checking health score alerts:', error);
    }
  }
  
  /**
   * Evaluate trigger conditions
   */
  private evaluateTriggerConditions(conditions: Record<string, any>, triggerData: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (!this.evaluateCondition(key, value, triggerData)) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Evaluate individual condition
   */
  private evaluateCondition(key: string, value: any, data: Record<string, any>): boolean {
    if (typeof value === 'object' && value !== null) {
      if (value.lessThan !== undefined) {
        return (data[key] || 0) < value.lessThan;
      }
      if (value.greaterThan !== undefined) {
        return (data[key] || 0) > value.greaterThan;
      }
      if (Array.isArray(value)) {
        return value.includes(data[key]);
      }
    }
    
    return data[key] === value;
  }
  
  /**
   * Get email template
   */
  private async getEmailTemplate(template: string, client: any, triggerData: Record<string, any>): Promise<{subject: string, html: string}> {
    const templates = {
      welcome_sequence: {
        subject: `Welcome to AgentRadar, ${client.name}!`,
        html: `
          <h2>Welcome to AgentRadar!</h2>
          <p>We're excited to help ${client.name} discover real estate opportunities before they hit the market.</p>
          <p>Your trial is active until ${client.trialEndDate?.toDateString()}.</p>
          <p>Let's get you set up for success!</p>
        `
      },
      onboarding_nudge: {
        subject: `Let's finish setting up your AgentRadar account`,
        html: `
          <h2>Don't let opportunities slip away, ${client.name}!</h2>
          <p>You're ${client.onboardingProgress}% through your setup. Let's finish strong!</p>
          <p>Complete your setup to start receiving exclusive property alerts.</p>
        `
      },
      trial_expiring: {
        subject: `Your AgentRadar trial expires in ${triggerData.daysUntilExpiration} days`,
        html: `
          <h2>Don't miss out on exclusive opportunities!</h2>
          <p>${client.name}, your trial expires in ${triggerData.daysUntilExpiration} days.</p>
          <p>Continue your access to pre-market real estate intelligence.</p>
        `
      },
      customer_success_checkin: {
        subject: `How is your AgentRadar experience going?`,
        html: `
          <h2>We're here to help, ${client.name}!</h2>
          <p>Your customer success team wants to ensure you're getting maximum value from AgentRadar.</p>
          <p>Schedule a 15-minute check-in to optimize your setup.</p>
        `
      }
    };
    
    return templates[template as keyof typeof templates] || {
      subject: 'AgentRadar Update',
      html: `<p>Update for ${client.name}</p>`
    };
  }
  
  /**
   * Get workflow statistics
   */
  async getWorkflowStatistics(): Promise<any> {
    try {
      const workflows = await prisma.automatedWorkflow.findMany({
        include: {
          _count: {
            select: { executions: true }
          }
        }
      });
      
      const totalExecutions = await prisma.workflowExecution.count();
      const successfulExecutions = await prisma.workflowExecution.count({
        where: { status: 'COMPLETED' }
      });
      const failedExecutions = await prisma.workflowExecution.count({
        where: { status: 'FAILED' }
      });
      
      return {
        totalWorkflows: workflows.length,
        activeWorkflows: workflows.filter(w => w.isActive).length,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0,
        workflows: workflows.map(w => ({
          id: w.id,
          name: w.name,
          triggerType: w.triggerType,
          isActive: w.isActive,
          executionCount: w.executionCount,
          successCount: w.successCount,
          errorCount: w.errorCount,
          lastTriggeredAt: w.lastTriggeredAt,
          successRate: w.executionCount > 0 ? Math.round((w.successCount / w.executionCount) * 100) : 0
        }))
      };
      
    } catch (error) {
      logger.error('❌ Error getting workflow statistics:', error);
      throw error;
    }
  }
}