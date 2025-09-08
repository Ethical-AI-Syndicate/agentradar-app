import { Alert, AlertType, Priority, AlertStatus, UserAlert } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export interface CreateAlertData {
  title: string;
  description: string;
  type: AlertType;
  priority: Priority;
  city: string;
  address?: string;
  propertyType?: string;
  estimatedValue?: number;
  bedrooms?: number;
  bathrooms?: number;
  opportunityScore?: number;
  metadata?: Record<string, any>;
  externalId?: string;
  sourceUrl?: string;
}

export interface AlertFilter {
  type?: AlertType;
  priority?: Priority;
  status?: AlertStatus;
  city?: string;
  propertyType?: string;
  minValue?: number;
  maxValue?: number;
  minScore?: number;
  maxScore?: number;
  search?: string;
  isBookmarked?: boolean;
  userId?: string;
}

export interface AlertWithUserData extends Alert {
  UserAlert?: UserAlert[];
  isBookmarked?: boolean;
  isViewed?: boolean;
}

export class AlertRepository extends BaseRepository {
  async create(alertData: CreateAlertData): Promise<Alert> {
    try {
      return await this.db.alert.create({
        data: {
          ...alertData,
          status: AlertStatus.ACTIVE
        }
      });
    } catch (error) {
      this.handleDatabaseError(error, 'create alert');
    }
  }

  async findById(id: string, userId?: string): Promise<AlertWithUserData | null> {
    try {
      const alert = await this.db.alert.findUnique({
        where: { id },
        include: userId ? {
          UserAlert: {
            where: { userId }
          }
        } : {}
      }) as AlertWithUserData | null;

      if (alert && userId && alert.UserAlert) {
        const userAlert = alert.UserAlert[0];
        alert.isBookmarked = userAlert?.isBookmarked || false;
        alert.isViewed = userAlert?.isViewed || false;
      }

      return alert;
    } catch (error) {
      this.handleDatabaseError(error, 'find alert by id');
    }
  }

  async findMany(
    filter: AlertFilter = {},
    page?: number,
    limit?: number
  ): Promise<{
    data: AlertWithUserData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const { take, skip, page: normalizedPage, limit: normalizedLimit } = 
        this.formatPaginationParams(page, limit);

      const where: any = {
        status: AlertStatus.ACTIVE
      };

      if (filter.type) {
        where.type = filter.type;
      }

      if (filter.priority) {
        where.priority = filter.priority;
      }

      if (filter.city) {
        where.city = { contains: filter.city, mode: 'insensitive' };
      }

      if (filter.propertyType) {
        where.propertyType = { contains: filter.propertyType, mode: 'insensitive' };
      }

      if (filter.minValue || filter.maxValue) {
        where.estimatedValue = {};
        if (filter.minValue) {
          where.estimatedValue.gte = filter.minValue;
        }
        if (filter.maxValue) {
          where.estimatedValue.lte = filter.maxValue;
        }
      }

      if (filter.minScore || filter.maxScore) {
        where.opportunityScore = {};
        if (filter.minScore) {
          where.opportunityScore.gte = filter.minScore;
        }
        if (filter.maxScore) {
          where.opportunityScore.lte = filter.maxScore;
        }
      }

      if (filter.search) {
        where.OR = [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
          { address: { contains: filter.search, mode: 'insensitive' } }
        ];
      }

      const include: any = {};
      if (filter.userId) {
        include.UserAlert = {
          where: { userId: filter.userId }
        };

        if (filter.isBookmarked !== undefined) {
          where.UserAlert = {
            some: {
              userId: filter.userId,
              isBookmarked: filter.isBookmarked
            }
          };
        }
      }

      const [alerts, total] = await Promise.all([
        this.db.alert.findMany({
          where,
          include,
          take,
          skip,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ]
        }) as Promise<AlertWithUserData[]>,
        this.db.alert.count({ where })
      ]);

      if (filter.userId) {
        alerts.forEach(alert => {
          const userAlert = alert.UserAlert?.[0];
          alert.isBookmarked = userAlert?.isBookmarked || false;
          alert.isViewed = userAlert?.isViewed || false;
        });
      }

      return this.buildPaginatedResponse(alerts, normalizedPage, normalizedLimit, total);
    } catch (error) {
      this.handleDatabaseError(error, 'find alerts');
    }
  }

  async update(id: string, updateData: Partial<CreateAlertData>): Promise<Alert> {
    try {
      return await this.db.alert.update({
        where: { id },
        data: updateData
      });
    } catch (error) {
      this.handleDatabaseError(error, 'update alert');
    }
  }

  async updateStatus(id: string, status: AlertStatus): Promise<Alert> {
    try {
      return await this.db.alert.update({
        where: { id },
        data: { 
          status,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      this.handleDatabaseError(error, 'update alert status');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.executeTransaction(async (tx) => {
        await tx.userAlert.deleteMany({
          where: { alertId: id }
        });
        
        await tx.alert.delete({
          where: { id }
        });
      });
    } catch (error) {
      this.handleDatabaseError(error, 'delete alert');
    }
  }

  async bookmarkAlert(alertId: string, userId: string): Promise<void> {
    try {
      await this.db.userAlert.upsert({
        where: {
          userId_alertId: {
            userId,
            alertId
          }
        },
        create: {
          userId,
          alertId,
          isBookmarked: true
        },
        update: {
          isBookmarked: true
        }
      });
    } catch (error) {
      this.handleDatabaseError(error, 'bookmark alert');
    }
  }

  async unbookmarkAlert(alertId: string, userId: string): Promise<void> {
    try {
      await this.db.userAlert.upsert({
        where: {
          userId_alertId: {
            userId,
            alertId
          }
        },
        create: {
          userId,
          alertId,
          isBookmarked: false
        },
        update: {
          isBookmarked: false
        }
      });
    } catch (error) {
      this.handleDatabaseError(error, 'unbookmark alert');
    }
  }

  async markAsViewed(alertId: string, userId: string): Promise<void> {
    try {
      await this.db.userAlert.upsert({
        where: {
          userId_alertId: {
            userId,
            alertId
          }
        },
        create: {
          userId,
          alertId,
          isViewed: true,
          viewedAt: new Date()
        },
        update: {
          isViewed: true,
          viewedAt: new Date()
        }
      });
    } catch (error) {
      this.handleDatabaseError(error, 'mark alert as viewed');
    }
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    byType: Record<AlertType, number>;
    byPriority: Record<Priority, number>;
    byStatus: Record<AlertStatus, number>;
  }> {
    try {
      const [
        total,
        active,
        typeStats,
        priorityStats,
        statusStats
      ] = await Promise.all([
        this.db.alert.count(),
        this.db.alert.count({ where: { status: AlertStatus.ACTIVE } }),
        this.db.alert.groupBy({
          by: ['type'],
          _count: { type: true }
        }),
        this.db.alert.groupBy({
          by: ['priority'],
          _count: { priority: true }
        }),
        this.db.alert.groupBy({
          by: ['status'],
          _count: { status: true }
        })
      ]);

      const byType = typeStats.reduce((acc, stat) => {
        acc[stat.type] = stat._count.type;
        return acc;
      }, {} as Record<AlertType, number>);

      const byPriority = priorityStats.reduce((acc, stat) => {
        acc[stat.priority] = stat._count.priority;
        return acc;
      }, {} as Record<Priority, number>);

      const byStatus = statusStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as Record<AlertStatus, number>);

      return {
        total,
        active,
        byType,
        byPriority,
        byStatus
      };
    } catch (error) {
      this.handleDatabaseError(error, 'get alert stats');
    }
  }

  async getPersonalizedAlerts(
    userId: string,
    userPreferences: any,
    limit: number = 10
  ): Promise<AlertWithUserData[]> {
    try {
      const where: any = {
        status: AlertStatus.ACTIVE
      };

      if (userPreferences.alertTypes?.length) {
        where.type = { in: userPreferences.alertTypes };
      }

      if (userPreferences.priorities?.length) {
        where.priority = { in: userPreferences.priorities };
      }

      if (userPreferences.cities?.length) {
        where.city = { in: userPreferences.cities };
      }

      if (userPreferences.propertyTypes?.length) {
        where.propertyType = { in: userPreferences.propertyTypes };
      }

      if (userPreferences.minValue || userPreferences.maxValue) {
        where.estimatedValue = {};
        if (userPreferences.minValue) {
          where.estimatedValue.gte = userPreferences.minValue;
        }
        if (userPreferences.maxValue) {
          where.estimatedValue.lte = userPreferences.maxValue;
        }
      }

      const alerts = await this.db.alert.findMany({
        where,
        include: {
          UserAlert: {
            where: { userId }
          }
        },
        take: limit,
        orderBy: [
          { opportunityScore: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      }) as AlertWithUserData[];

      alerts.forEach(alert => {
        const userAlert = alert.UserAlert?.[0];
        alert.isBookmarked = userAlert?.isBookmarked || false;
        alert.isViewed = userAlert?.isViewed || false;
      });

      return alerts;
    } catch (error) {
      this.handleDatabaseError(error, 'get personalized alerts');
    }
  }

  async bulkUpdateStatus(alertIds: string[], status: AlertStatus): Promise<void> {
    try {
      await this.db.alert.updateMany({
        where: {
          id: { in: alertIds }
        },
        data: {
          status,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      this.handleDatabaseError(error, 'bulk update alert status');
    }
  }
}