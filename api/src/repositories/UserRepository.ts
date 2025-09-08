import { User, UserRole, SubscriptionTier } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  subscriptionTier?: SubscriptionTier;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  subscriptionTier?: SubscriptionTier;
  isActive?: boolean;
}

export interface UserFilter {
  role?: UserRole;
  subscriptionTier?: SubscriptionTier;
  isActive?: boolean;
  search?: string;
}

export class UserRepository extends BaseRepository {
  async create(userData: CreateUserData): Promise<User> {
    try {
      return await this.db.user.create({
        data: {
          ...userData,
          role: userData.role || UserRole.USER,
          subscriptionTier: userData.subscriptionTier || SubscriptionTier.FREE
        }
      });
    } catch (error) {
      this.handleDatabaseError(error, 'create user');
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.db.user.findUnique({
        where: { id }
      });
    } catch (error) {
      this.handleDatabaseError(error, 'find user by id');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.db.user.findUnique({
        where: { email }
      });
    } catch (error) {
      this.handleDatabaseError(error, 'find user by email');
    }
  }

  async findMany(
    filter: UserFilter = {},
    page?: number,
    limit?: number
  ): Promise<{
    data: User[];
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

      const where: any = {};

      if (filter.role) {
        where.role = filter.role;
      }

      if (filter.subscriptionTier) {
        where.subscriptionTier = filter.subscriptionTier;
      }

      if (filter.isActive !== undefined) {
        where.isActive = filter.isActive;
      }

      if (filter.search) {
        where.OR = [
          { firstName: { contains: filter.search, mode: 'insensitive' } },
          { lastName: { contains: filter.search, mode: 'insensitive' } },
          { email: { contains: filter.search, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        this.db.user.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' }
        }),
        this.db.user.count({ where })
      ]);

      return this.buildPaginatedResponse(users, normalizedPage, normalizedLimit, total);
    } catch (error) {
      this.handleDatabaseError(error, 'find users');
    }
  }

  async update(id: string, userData: UpdateUserData): Promise<User> {
    try {
      return await this.db.user.update({
        where: { id },
        data: userData
      });
    } catch (error) {
      this.handleDatabaseError(error, 'update user');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.user.delete({
        where: { id }
      });
    } catch (error) {
      this.handleDatabaseError(error, 'delete user');
    }
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    byRole: Record<UserRole, number>;
    bySubscriptionTier: Record<SubscriptionTier, number>;
  }> {
    try {
      const [
        total,
        active,
        roleStats,
        tierStats
      ] = await Promise.all([
        this.db.user.count(),
        this.db.user.count({ where: { isActive: true } }),
        this.db.user.groupBy({
          by: ['role'],
          _count: { role: true }
        }),
        this.db.user.groupBy({
          by: ['subscriptionTier'],
          _count: { subscriptionTier: true }
        })
      ]);

      const byRole = roleStats.reduce((acc, stat) => {
        acc[stat.role] = stat._count.role;
        return acc;
      }, {} as Record<UserRole, number>);

      const bySubscriptionTier = tierStats.reduce((acc, stat) => {
        acc[stat.subscriptionTier] = stat._count.subscriptionTier;
        return acc;
      }, {} as Record<SubscriptionTier, number>);

      return {
        total,
        active,
        byRole,
        bySubscriptionTier
      };
    } catch (error) {
      this.handleDatabaseError(error, 'get user stats');
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      await this.db.user.update({
        where: { id },
        data: { lastLoginAt: new Date() }
      });
    } catch (error) {
      this.handleDatabaseError(error, 'update last login');
    }
  }
}