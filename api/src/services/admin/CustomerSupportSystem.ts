import { prisma } from '../../lib/database';
import { createLogger } from '../../utils/logger';
import { stripeService } from '../stripeService';
import Redis from 'ioredis';

const logger = createLogger();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface TicketCreateData {
  title: string;
  description: string;
  category: 'billing' | 'technical' | 'sales' | 'feature_request' | 'bug_report' | 'account' | 'data_quality' | 'integration';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  customerId?: string;
  customerEmail?: string;
  source: 'email' | 'live_chat' | 'phone' | 'in_app' | 'api';
  metadata?: Record<string, any>;
}

export interface TicketUpdateData {
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignedToId?: string;
  category?: string;
  tags?: string[];
  internalNotes?: string;
  customerResponse?: string;
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  content: string;
  isInternal: boolean;
  authorId: string;
  authorName: string;
  authorRole: 'CUSTOMER' | 'AGENT' | 'ADMIN';
  createdAt: Date;
  attachments?: string[];
}

export interface TicketFilter {
  status?: string[];
  priority?: string[];
  category?: string[];
  assignedToId?: string;
  customerId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
  viewCount: number;
  lastUpdated: Date;
  published: boolean;
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  useCount: number;
  lastUsed?: Date;
}

export class CustomerSupportSystem {
  /**
   * Create a new support ticket
   */
  async createTicket(ticketData: TicketCreateData, createdByUserId?: string): Promise<any> {
    try {
      // Auto-assign priority based on category and keywords
      const autoPriority = this.determinePriority(ticketData);
      
      // Auto-categorize if not provided
      const autoCategory = ticketData.category || this.categorizeTicket(ticketData.title, ticketData.description);

      // Find best agent to assign
      const assignedAgent = await this.findBestAgent(autoCategory, ticketData.priority);

      const ticket = await prisma.supportTicket.create({
        data: {
          title: ticketData.title,
          description: ticketData.description,
          category: autoCategory,
          priority: autoPriority || ticketData.priority,
          status: 'OPEN',
          source: ticketData.source,
          customerId: ticketData.customerId,
          customerEmail: ticketData.customerEmail,
          assignedToId: assignedAgent?.id,
          metadata: ticketData.metadata || {},
          slaDeadline: this.calculateSLADeadline(autoPriority || ticketData.priority),
          createdAt: new Date()
        },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              subscriptionTier: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Create initial activity log
      await this.logTicketActivity(ticket.id, 'CREATED', {
        createdBy: createdByUserId || 'system',
        source: ticketData.source,
        autoAssigned: !!assignedAgent
      });

      // Send notifications
      await this.sendTicketNotifications(ticket, 'created');

      // Update agent workload tracking
      if (assignedAgent) {
        await this.updateAgentWorkload(assignedAgent.id, 1);
      }

      logger.info(`Support ticket created: ${ticket.id} for customer: ${ticketData.customerEmail}`);

      return ticket;

    } catch (error) {
      logger.error('Error creating support ticket:', error);
      throw new Error('Failed to create support ticket');
    }
  }

  /**
   * Update an existing ticket
   */
  async updateTicket(ticketId: string, updateData: TicketUpdateData, updatedByUserId: string): Promise<any> {
    try {
      const existingTicket = await prisma.supportTicket.findUnique({
        where: { id: ticketId }
      });

      if (!existingTicket) {
        throw new Error('Ticket not found');
      }

      // Calculate new SLA deadline if priority changed
      let slaDeadline = existingTicket.slaDeadline;
      if (updateData.priority && updateData.priority !== existingTicket.priority) {
        slaDeadline = this.calculateSLADeadline(updateData.priority);
      }

      // Update resolved timestamp if status changed to resolved
      let resolvedAt = existingTicket.resolvedAt;
      if (updateData.status === 'RESOLVED' && existingTicket.status !== 'RESOLVED') {
        resolvedAt = new Date();
      }

      const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          ...updateData,
          slaDeadline,
          resolvedAt,
          updatedAt: new Date()
        },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              subscriptionTier: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Log activity
      await this.logTicketActivity(ticketId, 'UPDATED', {
        updatedBy: updatedByUserId,
        changes: updateData,
        previousStatus: existingTicket.status,
        newStatus: updateData.status
      });

      // Handle assignment changes
      if (updateData.assignedToId && updateData.assignedToId !== existingTicket.assignedToId) {
        // Update workload tracking
        if (existingTicket.assignedToId) {
          await this.updateAgentWorkload(existingTicket.assignedToId, -1);
        }
        if (updateData.assignedToId) {
          await this.updateAgentWorkload(updateData.assignedToId, 1);
        }

        // Send assignment notification
        await this.sendTicketNotifications(updatedTicket, 'assigned');
      }

      // Send status change notifications
      if (updateData.status && updateData.status !== existingTicket.status) {
        await this.sendTicketNotifications(updatedTicket, 'status_changed');
      }

      logger.info(`Support ticket updated: ${ticketId} by user: ${updatedByUserId}`);

      return updatedTicket;

    } catch (error) {
      logger.error('Error updating support ticket:', error);
      throw new Error('Failed to update support ticket');
    }
  }

  /**
   * Add response to ticket
   */
  async addTicketResponse(
    ticketId: string,
    content: string,
    authorId: string,
    isInternal: boolean = false,
    attachments: string[] = []
  ): Promise<TicketResponse> {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          customer: true,
          assignedTo: true
        }
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Get author details
      const author = await prisma.user.findUnique({
        where: { id: authorId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });

      if (!author) {
        throw new Error('Author not found');
      }

      const response = await prisma.ticketResponse.create({
        data: {
          ticketId,
          content,
          isInternal,
          authorId,
          authorName: `${author.firstName} ${author.lastName}`,
          authorRole: this.mapUserRoleToTicketRole(author.role),
          attachments,
          createdAt: new Date()
        }
      });

      // Update ticket's last activity
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          lastActivity: new Date(),
          status: ticket.status === 'RESOLVED' ? 'OPEN' : ticket.status // Reopen if resolved
        }
      });

      // Log activity
      await this.logTicketActivity(ticketId, 'RESPONSE_ADDED', {
        responseId: response.id,
        authorId,
        isInternal,
        hasAttachments: attachments.length > 0
      });

      // Send notifications for external responses
      if (!isInternal) {
        await this.sendTicketNotifications(ticket, 'response_added');
      }

      logger.info(`Response added to ticket: ${ticketId} by user: ${authorId}`);

      return response as TicketResponse;

    } catch (error) {
      logger.error('Error adding ticket response:', error);
      throw new Error('Failed to add ticket response');
    }
  }

  /**
   * Get tickets with filtering and pagination
   */
  async getTickets(
    filter: TicketFilter = {},
    page: number = 1,
    limit: number = 50,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ tickets: any[]; total: number; pages: number }> {
    try {
      const where: any = {};

      // Apply filters
      if (filter.status?.length) {
        where.status = { in: filter.status };
      }

      if (filter.priority?.length) {
        where.priority = { in: filter.priority };
      }

      if (filter.category?.length) {
        where.category = { in: filter.category };
      }

      if (filter.assignedToId) {
        where.assignedToId = filter.assignedToId;
      }

      if (filter.customerId) {
        where.customerId = filter.customerId;
      }

      if (filter.dateRange) {
        where.createdAt = {
          gte: filter.dateRange.from,
          lte: filter.dateRange.to
        };
      }

      if (filter.search) {
        where.OR = [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
          { customerEmail: { contains: filter.search, mode: 'insensitive' } }
        ];
      }

      const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                subscriptionTier: true
              }
            },
            assignedTo: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            _count: {
              select: {
                responses: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.supportTicket.count({ where })
      ]);

      return {
        tickets,
        total,
        pages: Math.ceil(total / limit)
      };

    } catch (error) {
      logger.error('Error fetching tickets:', error);
      throw new Error('Failed to fetch tickets');
    }
  }

  /**
   * Get ticket details with responses
   */
  async getTicketDetails(ticketId: string): Promise<any> {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              subscriptionTier: true,
              createdAt: true,
              lastLogin: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          responses: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              content: true,
              isInternal: true,
              authorId: true,
              authorName: true,
              authorRole: true,
              createdAt: true,
              attachments: true
            }
          },
          activities: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Get customer context (recent tickets, subscription info)
      const customerContext = await this.getCustomerContext(ticket.customerId);

      return {
        ...ticket,
        customerContext
      };

    } catch (error) {
      logger.error('Error fetching ticket details:', error);
      throw new Error('Failed to fetch ticket details');
    }
  }

  /**
   * Get support dashboard metrics
   */
  async getDashboardMetrics(dateRange?: { from: Date; to: Date }) {
    try {
      const where = dateRange ? {
        createdAt: {
          gte: dateRange.from,
          lte: dateRange.to
        }
      } : {};

      const [
        totalTickets,
        openTickets,
        resolvedTickets,
        avgResolutionTime,
        ticketsByCategory,
        ticketsByPriority,
        ticketsByStatus,
        slaBreaches
      ] = await Promise.all([
        prisma.supportTicket.count({ where }),
        prisma.supportTicket.count({ where: { ...where, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        prisma.supportTicket.count({ where: { ...where, status: 'RESOLVED' } }),
        this.calculateAverageResolutionTime(dateRange),
        this.getTicketsByCategory(dateRange),
        this.getTicketsByPriority(dateRange),
        this.getTicketsByStatus(dateRange),
        this.getSLABreaches(dateRange)
      ]);

      const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

      return {
        overview: {
          totalTickets,
          openTickets,
          resolvedTickets,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          avgResolutionTime,
          slaBreaches
        },
        distributions: {
          byCategory: ticketsByCategory,
          byPriority: ticketsByPriority,
          byStatus: ticketsByStatus
        }
      };

    } catch (error) {
      logger.error('Error fetching support dashboard metrics:', error);
      throw new Error('Failed to fetch support metrics');
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(dateRange?: { from: Date; to: Date }) {
    try {
      const where = dateRange ? {
        updatedAt: {
          gte: dateRange.from,
          lte: dateRange.to
        }
      } : {};

      const agentStats = await prisma.supportTicket.groupBy({
        by: ['assignedToId'],
        where: {
          ...where,
          assignedToId: { not: null }
        },
        _count: {
          id: true
        },
        _avg: {
          // Would need a resolutionTimeMinutes field
        }
      });

      const agentDetails = await Promise.all(
        agentStats
          .filter(stat => stat.assignedToId)
          .map(async (stat) => {
            const agent = await prisma.user.findUnique({
              where: { id: stat.assignedToId! },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            });

            const resolvedCount = await prisma.supportTicket.count({
              where: {
                assignedToId: stat.assignedToId,
                status: 'RESOLVED',
                ...where
              }
            });

            return {
              agent,
              totalTickets: stat._count.id,
              resolvedTickets: resolvedCount,
              resolutionRate: stat._count.id > 0 ? (resolvedCount / stat._count.id) * 100 : 0,
              avgResolutionTime: Math.round(Math.random() * 24 * 10) / 10 // Mock data
            };
          })
      );

      return agentDetails.sort((a, b) => b.resolvedTickets - a.resolvedTickets);

    } catch (error) {
      logger.error('Error fetching agent performance:', error);
      throw new Error('Failed to fetch agent performance');
    }
  }

  /**
   * Get knowledge base articles
   */
  async getKnowledgeBase(
    category?: string,
    search?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ articles: KnowledgeBaseArticle[]; total: number }> {
    try {
      const where: any = { published: true };

      if (category) {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } }
        ];
      }

      const [articles, total] = await Promise.all([
        prisma.knowledgeBaseArticle.findMany({
          where,
          orderBy: [
            { helpful: 'desc' },
            { viewCount: 'desc' }
          ],
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.knowledgeBaseArticle.count({ where })
      ]);

      return { articles: articles as KnowledgeBaseArticle[], total };

    } catch (error) {
      logger.error('Error fetching knowledge base:', error);
      throw new Error('Failed to fetch knowledge base');
    }
  }

  /**
   * Get canned responses
   */
  async getCannedResponses(category?: string): Promise<CannedResponse[]> {
    try {
      const where = category ? { category } : {};

      const responses = await prisma.cannedResponse.findMany({
        where,
        orderBy: [
          { useCount: 'desc' },
          { title: 'asc' }
        ]
      });

      return responses as CannedResponse[];

    } catch (error) {
      logger.error('Error fetching canned responses:', error);
      throw new Error('Failed to fetch canned responses');
    }
  }

  /**
   * Escalate ticket
   */
  async escalateTicket(ticketId: string, escalatedBy: string, reason: string): Promise<any> {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Find senior agent or manager
      const escalationTarget = await this.findEscalationTarget(ticket.category, ticket.priority);

      const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          priority: ticket.priority === 'LOW' ? 'MEDIUM' : 
                   ticket.priority === 'MEDIUM' ? 'HIGH' : 'CRITICAL',
          assignedToId: escalationTarget?.id,
          slaDeadline: this.calculateSLADeadline('HIGH'), // Escalated tickets get HIGH SLA
          updatedAt: new Date()
        },
        include: {
          customer: true,
          assignedTo: true
        }
      });

      // Log escalation
      await this.logTicketActivity(ticketId, 'ESCALATED', {
        escalatedBy,
        reason,
        previousAssignee: ticket.assignedToId,
        newAssignee: escalationTarget?.id,
        previousPriority: ticket.priority,
        newPriority: updatedTicket.priority
      });

      // Send escalation notifications
      await this.sendTicketNotifications(updatedTicket, 'escalated');

      logger.warn(`Ticket escalated: ${ticketId} by user: ${escalatedBy}, reason: ${reason}`);

      return updatedTicket;

    } catch (error) {
      logger.error('Error escalating ticket:', error);
      throw new Error('Failed to escalate ticket');
    }
  }

  // Private helper methods

  private determinePriority(ticketData: TicketCreateData): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null {
    const criticalKeywords = ['system down', 'cannot login', 'data loss', 'security breach', 'payment failed'];
    const highKeywords = ['cannot access', 'broken feature', 'urgent', 'billing issue'];
    
    const text = `${ticketData.title} ${ticketData.description}`.toLowerCase();
    
    if (criticalKeywords.some(keyword => text.includes(keyword))) {
      return 'CRITICAL';
    }
    
    if (highKeywords.some(keyword => text.includes(keyword))) {
      return 'HIGH';
    }
    
    return null; // Use provided priority
  }

  private categorizeTicket(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('payment') || text.includes('billing') || text.includes('subscription')) {
      return 'billing';
    }
    
    if (text.includes('bug') || text.includes('error') || text.includes('broken')) {
      return 'bug_report';
    }
    
    if (text.includes('feature') || text.includes('request') || text.includes('enhancement')) {
      return 'feature_request';
    }
    
    if (text.includes('api') || text.includes('integration') || text.includes('webhook')) {
      return 'integration';
    }
    
    return 'technical';
  }

  private async findBestAgent(category: string, priority: string): Promise<any> {
    // This would implement intelligent agent assignment based on:
    // - Agent availability and workload
    // - Category expertise
    // - Priority handling capability
    // - Current performance metrics
    
    const agents = await prisma.user.findMany({
      where: {
        role: { in: ['AGENT', 'ADMIN'] },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (agents.length === 0) return null;
    
    // Simple round-robin for now
    // In production, this would be much more sophisticated
    const randomIndex = Math.floor(Math.random() * agents.length);
    return agents[randomIndex];
  }

  private calculateSLADeadline(priority: string): Date {
    const now = new Date();
    const slaHours = {
      'CRITICAL': 2,
      'HIGH': 8,
      'MEDIUM': 24,
      'LOW': 72
    };

    const hours = slaHours[priority as keyof typeof slaHours] || 24;
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  private async logTicketActivity(ticketId: string, action: string, details: any): Promise<void> {
    try {
      await prisma.ticketActivity.create({
        data: {
          ticketId,
          action,
          details,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Error logging ticket activity:', error);
    }
  }

  private async sendTicketNotifications(ticket: any, event: string): Promise<void> {
    try {
      // This would integrate with your email/notification service
      logger.info(`Sending ${event} notification for ticket: ${ticket.id}`);
      
      // Send to customer
      if (ticket.customerEmail && !['internal_note'].includes(event)) {
        // await emailService.sendTicketNotification(ticket, event);
      }
      
      // Send to assigned agent
      if (ticket.assignedTo?.email) {
        // await emailService.sendAgentNotification(ticket, event);
      }
      
    } catch (error) {
      logger.error('Error sending ticket notifications:', error);
    }
  }

  private async updateAgentWorkload(agentId: string, change: number): Promise<void> {
    try {
      const currentWorkload = await redis.get(`agent:${agentId}:workload`) || '0';
      const newWorkload = Math.max(0, parseInt(currentWorkload) + change);
      await redis.set(`agent:${agentId}:workload`, newWorkload.toString());
    } catch (error) {
      logger.error('Error updating agent workload:', error);
    }
  }

  private mapUserRoleToTicketRole(userRole: string): 'CUSTOMER' | 'AGENT' | 'ADMIN' {
    switch (userRole) {
      case 'ADMIN':
        return 'ADMIN';
      case 'AGENT':
        return 'AGENT';
      default:
        return 'CUSTOMER';
    }
  }

  private async getCustomerContext(customerId?: string) {
    if (!customerId) return null;

    try {
      const [recentTickets, subscriptionInfo] = await Promise.all([
        prisma.supportTicket.findMany({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true
          }
        }),
        // Get subscription info from Stripe if available
        this.getCustomerSubscriptionInfo(customerId)
      ]);

      return {
        recentTickets,
        subscriptionInfo
      };

    } catch (error) {
      logger.error('Error getting customer context:', error);
      return null;
    }
  }

  private async getCustomerSubscriptionInfo(customerId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: customerId },
        select: {
          stripeCustomerId: true,
          subscriptionTier: true,
          subscriptionStatus: true
        }
      });

      if (!user?.stripeCustomerId) return null;

      const subscriptions = await stripeService.getCustomerSubscriptions(user.stripeCustomerId);
      return subscriptions[0] || null;

    } catch (error) {
      logger.error('Error getting subscription info:', error);
      return null;
    }
  }

  private async calculateAverageResolutionTime(dateRange?: { from: Date; to: Date }): Promise<number> {
    try {
      const where: any = {
        status: 'RESOLVED',
        resolvedAt: { not: null }
      };

      if (dateRange) {
        where.resolvedAt = {
          gte: dateRange.from,
          lte: dateRange.to,
          not: null
        };
      }

      const resolvedTickets = await prisma.supportTicket.findMany({
        where,
        select: {
          createdAt: true,
          resolvedAt: true
        }
      });

      if (resolvedTickets.length === 0) return 0;

      const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
        if (!ticket.resolvedAt) return sum;
        const resolutionTime = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
        return sum + resolutionTime;
      }, 0);

      // Return average in hours
      return totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60);

    } catch (error) {
      logger.error('Error calculating average resolution time:', error);
      return 0;
    }
  }

  private async getTicketsByCategory(dateRange?: { from: Date; to: Date }) {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to
      }
    } : {};

    return prisma.supportTicket.groupBy({
      by: ['category'],
      where,
      _count: { id: true }
    });
  }

  private async getTicketsByPriority(dateRange?: { from: Date; to: Date }) {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to
      }
    } : {};

    return prisma.supportTicket.groupBy({
      by: ['priority'],
      where,
      _count: { id: true }
    });
  }

  private async getTicketsByStatus(dateRange?: { from: Date; to: Date }) {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to
      }
    } : {};

    return prisma.supportTicket.groupBy({
      by: ['status'],
      where,
      _count: { id: true }
    });
  }

  private async getSLABreaches(dateRange?: { from: Date; to: Date }): Promise<number> {
    try {
      const where: any = {
        slaDeadline: { lt: new Date() },
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      };

      if (dateRange) {
        where.createdAt = {
          gte: dateRange.from,
          lte: dateRange.to
        };
      }

      return prisma.supportTicket.count({ where });

    } catch (error) {
      logger.error('Error calculating SLA breaches:', error);
      return 0;
    }
  }

  private async findEscalationTarget(category: string, priority: string) {
    // Find senior agents or managers for escalation
    const escalationTargets = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (escalationTargets.length === 0) return null;
    
    // Simple selection for now
    return escalationTargets[0];
  }
}

export const customerSupportSystem = new CustomerSupportSystem();