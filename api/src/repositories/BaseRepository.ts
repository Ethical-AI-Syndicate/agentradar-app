import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/database';

export abstract class BaseRepository {
  protected readonly db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  protected async executeTransaction<T>(
    operations: (tx: PrismaClient) => Promise<T>
  ): Promise<T> {
    return await this.db.$transaction(operations);
  }

  protected formatPaginationParams(page?: number, limit?: number) {
    const normalizedPage = Math.max(1, page || 1);
    const normalizedLimit = Math.min(100, Math.max(1, limit || 10));
    
    return {
      take: normalizedLimit,
      skip: (normalizedPage - 1) * normalizedLimit,
      page: normalizedPage,
      limit: normalizedLimit
    };
  }

  protected buildPaginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  protected handleDatabaseError(error: unknown, operation: string): never {
    console.error(`Database error during ${operation}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        throw new Error('Duplicate entry: A record with this data already exists');
      }
      
      if (error.message.includes('Foreign key constraint')) {
        throw new Error('Invalid reference: Related record not found');
      }
      
      if (error.message.includes('Record to update not found')) {
        throw new Error('Record not found');
      }
    }
    
    throw new Error(`Database operation failed: ${operation}`);
  }
}