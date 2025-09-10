import {
  PrismaClient,
  SupportTicketStatus,
  SupportTicketPriority,
  UserRole,
} from "../../generated/prisma";
import { createLogger } from "../../utils/logger";
import { sendEmail } from "../../utils/email";

const logger = createLogger();

export interface TicketCreateData {
  title: string;
  description: string;
  category:
    | "billing"
    | "technical"
    | "sales"
    | "feature_request"
    | "bug_report"
    | "account"
    | "data_quality"
    | "integration";
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  customerId?: string;
  customerEmail?: string;
  source: "email" | "live_chat" | "phone" | "in_app" | "api";
  metadata?: Record<string, any>;
}

export interface TicketUpdateData {
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority?: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  assignedToId?: string;
  category?: string;
  tags?: string[];
  internalNotes?: string;
  resolutionNotes?: string;
}

export class CustomerSupportSystem {
  private static instance: CustomerSupportSystem;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): CustomerSupportSystem {
    if (!CustomerSupportSystem.instance) {
      CustomerSupportSystem.instance = new CustomerSupportSystem();
    }
    return CustomerSupportSystem.instance;
  }

  async createTicket(
    ticketData: TicketCreateData,
    userId?: string,
  ): Promise<any> {
    try {
      // Stub implementation - would normally create ticket in database
      logger.info("Creating support ticket stub", ticketData);

      return {
        id: "stub-ticket-" + Date.now(),
        title: ticketData.title,
        description: ticketData.description,
        status: "OPEN",
        priority: ticketData.priority || "MEDIUM",
        category: ticketData.category,
        userId: userId || null,
        assignedToId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        internalNotes: null,
        resolutionNotes: null,
        resolvedAt: null,
        resolvedBy: null,
      };
    } catch (error) {
      logger.error("Error creating support ticket:", error);
      throw error;
    }
  }

  async updateTicket(
    ticketId: string,
    updateData: TicketUpdateData,
    updatedBy?: string,
  ): Promise<any> {
    try {
      logger.info(`Updating ticket ${ticketId}`, updateData);

      // Stub implementation
      return {
        id: ticketId,
        ...updateData,
        updatedAt: new Date(),
        updatedBy,
      };
    } catch (error) {
      logger.error(`Error updating ticket ${ticketId}:`, error);
      throw error;
    }
  }

  async getTicket(ticketId: string): Promise<any> {
    try {
      const ticket = await this.prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return ticket;
    } catch (error) {
      logger.error(`Error fetching ticket ${ticketId}:`, error);
      throw error;
    }
  }

  async getTickets(filters?: {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    assignedToId?: string;
    category?: string;
    customerId?: string;
  }): Promise<any[]> {
    try {
      const where: any = {};

      if (filters?.status) where.status = filters.status;
      if (filters?.priority) where.priority = filters.priority;
      if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
      if (filters?.category) where.category = filters.category;

      const tickets = await this.prisma.supportTicket.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return tickets;
    } catch (error) {
      logger.error("Error fetching tickets:", error);
      throw error;
    }
  }

  async assignTicket(
    ticketId: string,
    assignedToId: string,
    assignedBy?: string,
  ): Promise<any> {
    try {
      const updatedTicket = await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          assignedToId,
          status: "IN_PROGRESS",
          updatedAt: new Date(),
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      logger.info(`Ticket ${ticketId} assigned to ${assignedToId}`);
      return updatedTicket;
    } catch (error) {
      logger.error(`Error assigning ticket ${ticketId}:`, error);
      throw error;
    }
  }

  async resolveTicket(
    ticketId: string,
    resolutionData: {
      resolutionNotes: string;
      resolvedBy: string;
    },
  ): Promise<any> {
    try {
      const updatedTicket = await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: "RESOLVED",
          resolution: resolutionData.resolutionNotes,
          resolvedBy: resolutionData.resolvedBy,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info(
        `Ticket ${ticketId} resolved by ${resolutionData.resolvedBy}`,
      );
      return updatedTicket;
    } catch (error) {
      logger.error(`Error resolving ticket ${ticketId}:`, error);
      throw error;
    }
  }

  async getSupportMetrics(): Promise<any> {
    try {
      // Return mock metrics
      return {
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        averageResolutionTime: 0,
        satisfactionScore: 0,
      };
    } catch (error) {
      logger.error("Error fetching support metrics:", error);
      throw error;
    }
  }

  // Mock methods for features that require additional models
  async escalateTicket(ticketId: string, escalatedBy: string): Promise<any> {
    logger.info(`Escalating ticket ${ticketId} by ${escalatedBy}`);
    return { success: true, message: "Ticket escalated (stub)" };
  }

  async addTicketResponse(ticketId: string, responseData: any): Promise<any> {
    logger.info(`Adding response to ticket ${ticketId}`, responseData);
    return { success: true, message: "Response added (stub)" };
  }

  async getKnowledgeBaseArticles(): Promise<any[]> {
    return [];
  }

  async searchKnowledgeBase(query: string): Promise<any[]> {
    logger.info(`Searching knowledge base for: ${query}`);
    return [];
  }

  async getCannedResponses(): Promise<any[]> {
    return [];
  }

  async autoAssignTicket(ticketData: TicketCreateData): Promise<string | null> {
    logger.info("Auto-assigning ticket (stub)", ticketData);
    return null;
  }

  async updateAgentWorkload(agentId: string, increment: number): Promise<void> {
    logger.info(`Updating agent ${agentId} workload by ${increment}`);
  }

  async getAgentWorkload(agentId: string): Promise<number> {
    return 0;
  }

  async getAvailableAgents(): Promise<any[]> {
    const agents = await this.prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return agents;
  }

  async getEscalationTarget(priority: string): Promise<any> {
    const agents = await this.getAvailableAgents();
    return agents[0] || null;
  }

  private determinePriority(
    ticketData: TicketCreateData,
  ): "URGENT" | "HIGH" | "MEDIUM" | "LOW" | null {
    const criticalKeywords = [
      "system down",
      "cannot login",
      "data loss",
      "security breach",
      "payment failed",
    ];
    const highKeywords = [
      "cannot access",
      "broken feature",
      "urgent",
      "billing issue",
    ];

    const text = `${ticketData.title} ${ticketData.description}`.toLowerCase();

    if (criticalKeywords.some((keyword) => text.includes(keyword))) {
      return "URGENT";
    }

    if (highKeywords.some((keyword) => text.includes(keyword))) {
      return "HIGH";
    }

    return "MEDIUM";
  }

  private calculateSLADeadline(priority: string): Date {
    const now = new Date();
    const slaHours = {
      URGENT: 2,
      HIGH: 8,
      MEDIUM: 24,
      LOW: 72,
    };

    const hours = slaHours[priority as keyof typeof slaHours] || 24;
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }
}

export const customerSupportSystem = CustomerSupportSystem.getInstance();
