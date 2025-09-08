import { PrismaClient, UserRole, SubscriptionTier } from '@prisma/client';
import { createLogger } from '../../utils/logger';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const logger = createLogger();

export interface UserManagementData {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  subscriptionTier?: SubscriptionTier;
  isActive?: boolean;
  metadata?: any;
}

export interface UserUpdateData extends Partial<UserManagementData> {
  id: string;
}

export interface FinancialOperation {
  type: 'subscription_change' | 'refund' | 'charge' | 'credit' | 'adjustment';
  userId: string;
  amount: number;
  currency: string;
  description: string;
  metadata?: any;
}

export interface TeamCreateData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface TeamUpdateData extends Partial<TeamCreateData> {
  id: string;
}

export interface UserTeamAssignment {
  userId: string;
  teamId: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  permissions?: string[];
}

export interface BusinessMetrics {
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    bySubscriptionTier: Record<string, number>;
    recentSignups: number;
    churnRate: number;
  };
  financial: {
    mrr: number;
    arr: number;
    totalRevenue: number;
    avgRevenuePerUser: number;
    outstandingInvoices: number;
    refundedAmount: number;
  };
  teams: {
    total: number;
    totalMembers: number;
    avgMembersPerTeam: number;
    activeTeams: number;
  };
  systemHealth: {
    apiCalls: number;
    errorRate: number;
    avgResponseTime: number;
    uptime: number;
  };
}

class BusinessOperations {
  // User Management
  async createUser(data: UserManagementData) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password if provided
      let hashedPassword;
      if (data.password) {
        hashedPassword = await bcrypt.hash(data.password, 10);
      }

      const user = await prisma.user.create({
        data: {
          firstName: data.name?.split(' ')[0] || '',
          lastName: data.name?.split(' ').slice(1).join(' ') || '',
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role || UserRole.USER,
          subscriptionTier: data.subscriptionTier || SubscriptionTier.FREE,
          isActive: data.isActive !== undefined ? data.isActive : true,
          metadata: data.metadata || {}
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true,
          role: true,
          subscriptionTier: true,
          isActive: true,
          metadata: true,
          createdAt: true,
          updatedAt: true
        }
      });

      logger.info(`User created: ${user.email} (ID: ${user.id})`);

      // Log admin action
      await this.logAdminAction({
        adminId: 'system',
        action: 'CREATE_USER',
        entityType: 'user',
        entityId: user.id,
        details: {
          userEmail: user.email,
          role: user.role,
          subscriptionTier: user.subscriptionTier
        }
      });

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(data: UserUpdateData) {
    try {
      const { id, password, ...updateData } = data;
      const finalUpdateData: any = { ...updateData };

      // Hash new password if provided
      if (password) {
        finalUpdateData.password = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { id },
        data: finalUpdateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true,
          role: true,
          subscriptionTier: true,
          isActive: true,
          metadata: true,
          createdAt: true,
          updatedAt: true
        }
      });

      logger.info(`User updated: ${user.email} (ID: ${user.id})`);

      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      // Get the user first
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Soft delete by deactivating
      const user = await prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: false,
          email: `deleted_${Date.now()}_${existingUser.email}` // Prevent email conflicts
        }
      });

      logger.info(`User soft deleted: ${userId}`);

      return { success: true, message: 'User deactivated successfully' };
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async getUsers(filters: {
    role?: UserRole;
    subscriptionTier?: SubscriptionTier;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const where: any = {};

      if (filters.role) {
        where.role = filters.role;
      }

      if (filters.subscriptionTier) {
        where.subscriptionTier = filters.subscriptionTier;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            subscriptionTier: true,
            isActive: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        prisma.user.count({ where })
      ]);

      return { users, total };
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  async changeUserSubscription(userId: string, newTier: SubscriptionTier, adminId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const oldTier = user.subscriptionTier;

      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: newTier }
      });

      // Log the subscription change
      await this.logAdminAction({
        adminId,
        action: 'CHANGE_SUBSCRIPTION',
        entityType: 'user',
        entityId: userId,
        details: {
          userEmail: user.email,
          oldTier,
          newTier
        }
      });

      logger.info(`Subscription changed for user ${user.email}: ${oldTier} -> ${newTier}`);

      return { success: true, message: 'Subscription tier updated successfully' };
    } catch (error) {
      logger.error('Error changing user subscription:', error);
      throw error;
    }
  }

  // Financial Operations
  async processFinancialOperation(operation: FinancialOperation, adminId: string) {
    try {
      // This would integrate with your payment processor (Stripe, etc.)
      // For now, we'll log the operation and update user data as needed

      const user = await prisma.user.findUnique({
        where: { id: operation.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Log the financial operation
      await this.logAdminAction({
        adminId,
        action: 'FINANCIAL_OPERATION',
        entityType: 'user',
        entityId: operation.userId,
        details: {
          operationType: operation.type,
          amount: operation.amount,
          currency: operation.currency,
          description: operation.description,
          userEmail: user.email,
          metadata: operation.metadata
        }
      });

      logger.info(`Financial operation processed: ${operation.type} for user ${user.email}, amount: ${operation.amount} ${operation.currency}`);

      return { 
        success: true, 
        message: 'Financial operation processed successfully',
        operation: {
          id: `fin_${Date.now()}`,
          ...operation,
          processedAt: new Date(),
          processedBy: adminId
        }
      };
    } catch (error) {
      logger.error('Error processing financial operation:', error);
      throw error;
    }
  }

  // Team Management
  async createTeam(data: TeamCreateData) {
    try {
      const team = await prisma.team.create({
        data
      });

      logger.info(`Team created: ${team.name} (ID: ${team.id})`);

      return team;
    } catch (error) {
      logger.error('Error creating team:', error);
      throw error;
    }
  }

  async updateTeam(data: TeamUpdateData) {
    try {
      const { id, ...updateData } = data;

      const team = await prisma.team.update({
        where: { id },
        data: updateData
      });

      logger.info(`Team updated: ${team.name} (ID: ${team.id})`);

      return team;
    } catch (error) {
      logger.error('Error updating team:', error);
      throw error;
    }
  }

  async deleteTeam(teamId: string) {
    try {
      // Remove all team memberships first
      await prisma.userTeam.deleteMany({
        where: { teamId }
      });

      // Delete the team
      await prisma.team.delete({
        where: { id: teamId }
      });

      logger.info(`Team deleted: ${teamId}`);

      return { success: true, message: 'Team deleted successfully' };
    } catch (error) {
      logger.error('Error deleting team:', error);
      throw error;
    }
  }

  async getTeams(filters: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}) {
    try {
      const where: any = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [teams, total] = await Promise.all([
        prisma.team.findMany({
          where,
          include: {
            _count: {
              select: { UserTeam: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        prisma.team.count({ where })
      ]);

      return { teams, total };
    } catch (error) {
      logger.error('Error getting teams:', error);
      throw error;
    }
  }

  async assignUserToTeam(assignment: UserTeamAssignment) {
    try {
      // Check if assignment already exists
      const existing = await prisma.userTeam.findFirst({
        where: {
          userId: assignment.userId,
          teamId: assignment.teamId
        }
      });

      if (existing) {
        // Update existing assignment
        const userTeam = await prisma.userTeam.update({
          where: { id: existing.id },
          data: {
            role: assignment.role,
            permissions: assignment.permissions || []
          },
          include: {
            user: { select: { name: true, email: true } },
            team: { select: { name: true } }
          }
        });

        logger.info(`User team assignment updated: ${userTeam.user.email} -> ${userTeam.team.name}`);
        return userTeam;
      } else {
        // Create new assignment
        const userTeam = await prisma.userTeam.create({
          data: assignment,
          include: {
            user: { select: { name: true, email: true } },
            team: { select: { name: true } }
          }
        });

        logger.info(`User assigned to team: ${userTeam.user.email} -> ${userTeam.team.name}`);
        return userTeam;
      }
    } catch (error) {
      logger.error('Error assigning user to team:', error);
      throw error;
    }
  }

  async removeUserFromTeam(userId: string, teamId: string) {
    try {
      await prisma.userTeam.deleteMany({
        where: {
          userId,
          teamId
        }
      });

      logger.info(`User removed from team: ${userId} -> ${teamId}`);

      return { success: true, message: 'User removed from team successfully' };
    } catch (error) {
      logger.error('Error removing user from team:', error);
      throw error;
    }
  }

  // Business Analytics
  async getBusinessMetrics(): Promise<BusinessMetrics> {
    try {
      const [
        userStats,
        financialStats,
        teamStats,
        systemStats
      ] = await Promise.all([
        this.getUserMetrics(),
        this.getFinancialMetrics(),
        this.getTeamMetrics(),
        this.getSystemMetrics()
      ]);

      return {
        users: userStats,
        financial: financialStats,
        teams: teamStats,
        systemHealth: systemStats
      };
    } catch (error) {
      logger.error('Error getting business metrics:', error);
      throw error;
    }
  }

  private async getUserMetrics() {
    const [total, active, roleStats, tierStats, recentSignups] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      prisma.user.groupBy({
        by: ['subscriptionTier'],
        _count: { subscriptionTier: true }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    const byRole = roleStats.reduce((acc, stat) => {
      acc[stat.role] = stat._count.role;
      return acc;
    }, {} as Record<string, number>);

    const bySubscriptionTier = tierStats.reduce((acc, stat) => {
      acc[stat.subscriptionTier] = stat._count.subscriptionTier;
      return acc;
    }, {} as Record<string, number>);

    // Calculate churn rate (simplified)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const churnedUsers = await prisma.user.count({
      where: {
        isActive: false,
        updatedAt: { gte: thirtyDaysAgo }
      }
    });
    const churnRate = total > 0 ? (churnedUsers / total) * 100 : 0;

    return {
      total,
      active,
      inactive: total - active,
      byRole,
      bySubscriptionTier,
      recentSignups,
      churnRate: Math.round(churnRate * 100) / 100
    };
  }

  private async getFinancialMetrics() {
    // This would integrate with your billing system
    // For now, returning mock data based on subscription tiers
    const paidUsers = await prisma.user.count({
      where: {
        subscriptionTier: { not: SubscriptionTier.FREE }
      }
    });

    // Simplified revenue calculation
    const tierMultipliers = {
      FREE: 0,
      SOLO_AGENT: 49,
      PROFESSIONAL: 99,
      TEAM_ENTERPRISE: 199,
      WHITE_LABEL: 499
    };

    const tierCounts = await prisma.user.groupBy({
      by: ['subscriptionTier'],
      _count: { subscriptionTier: true }
    });

    const mrr = tierCounts.reduce((total, tier) => {
      const multiplier = tierMultipliers[tier.subscriptionTier] || 0;
      return total + (tier._count.subscriptionTier * multiplier);
    }, 0);

    const arr = mrr * 12;
    const avgRevenuePerUser = paidUsers > 0 ? mrr / paidUsers : 0;

    return {
      mrr,
      arr,
      totalRevenue: arr, // Simplified
      avgRevenuePerUser: Math.round(avgRevenuePerUser * 100) / 100,
      outstandingInvoices: 0, // Would come from billing system
      refundedAmount: 0 // Would come from billing system
    };
  }

  private async getTeamMetrics() {
    const [total, membershipStats] = await Promise.all([
      prisma.team.count(),
      prisma.userTeam.groupBy({
        by: ['teamId'],
        _count: { teamId: true }
      })
    ]);

    const totalMembers = membershipStats.reduce((sum, stat) => sum + stat._count.teamId, 0);
    const avgMembersPerTeam = total > 0 ? totalMembers / total : 0;
    const activeTeams = membershipStats.length;

    return {
      total,
      totalMembers,
      avgMembersPerTeam: Math.round(avgMembersPerTeam * 100) / 100,
      activeTeams
    };
  }

  private async getSystemMetrics() {
    // This would come from your monitoring system
    // For now, returning mock data
    return {
      apiCalls: 50000,
      errorRate: 0.2,
      avgResponseTime: 150,
      uptime: 99.9
    };
  }

  private async logAdminAction(action: {
    adminId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await prisma.adminAction.create({
        data: {
          adminId: action.adminId,
          action: action.action,
          targetType: action.entityType || 'unknown',
          targetId: action.entityId,
          description: `${action.action} - ${JSON.stringify(action.details)}`,
          metadata: action.details
        }
      });
    } catch (error) {
      logger.error('Error logging admin action:', error);
    }
  }
}

export const businessOperations = new BusinessOperations();