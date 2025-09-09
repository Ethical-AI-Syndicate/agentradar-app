import { PrismaClient } from '@prisma/client';
import { createLogger } from '../../utils/logger';

const prisma = new PrismaClient();
const logger = createLogger();

export interface BlogPostCreateData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: string;
  tags?: string[];
  authorId: string;
  published?: boolean;
  publishedAt?: Date;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export interface BlogPostUpdateData extends Partial<BlogPostCreateData> {
  id: string;
}

export interface PageCreateData {
  title: string;
  slug: string;
  content: string;
  template?: string;
  published?: boolean;
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

export interface PageUpdateData extends Partial<PageCreateData> {
  id: string;
}

export interface EmailTemplateCreateData {
  name: string;
  subject: string;
  content: string;
  category: string;
  variables?: string[];
  active?: boolean;
}

export interface EmailTemplateUpdateData extends Partial<EmailTemplateCreateData> {
  id: string;
}

export interface EmailCampaignCreateData {
  name: string;
  subject: string;
  content: string;
  templateId?: string;
  segmentCriteria?: any;
  scheduledAt?: Date;
  createdBy: string;
}

export interface ContentStats {
  blogPosts: {
    total: number;
    published: number;
    draft: number;
    categories: Record<string, number>;
    topTags: Array<{ tag: string; count: number }>;
    recentPosts: number;
  };
  pages: {
    total: number;
    published: number;
    draft: number;
  };
  emailTemplates: {
    total: number;
    active: number;
    categories: Record<string, number>;
    mostUsed: Array<{ name: string; useCount: number }>;
  };
  emailCampaigns: {
    total: number;
    sent: number;
    scheduled: number;
    draft: number;
    totalRecipients: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
}

class ContentManagementSystem {
  // Blog Post Management
  async createBlogPost(data: BlogPostCreateData) {
    try {
      // Auto-generate slug if not provided
      if (!data.slug) {
        data.slug = this.generateSlug(data.title);
      }

      // Ensure slug is unique
      const existingPost = await prisma.blogPost.findUnique({
        where: { slug: data.slug }
      });

      if (existingPost) {
        throw new Error('Blog post with this slug already exists');
      }

      // Auto-generate excerpt from content if not provided
      if (!data.excerpt && data.content) {
        data.excerpt = this.generateExcerpt(data.content);
      }

      const blogPost = await prisma.blogPost.create({
        data: {
          ...data,
          publishedAt: data.published ? (data.publishedAt || new Date()) : null
        }
      });

      logger.info(`Blog post created: ${blogPost.title} (ID: ${blogPost.id})`);
      return blogPost;
    } catch (error) {
      logger.error('Error creating blog post:', error);
      throw error;
    }
  }

  async updateBlogPost(data: BlogPostUpdateData) {
    try {
      const { id, ...updateData } = data;

      // Handle publish/unpublish logic
      if (updateData.published !== undefined) {
        if (updateData.published && !updateData.publishedAt) {
          updateData.publishedAt = new Date();
        } else if (!updateData.published) {
          updateData.publishedAt = null;
        }
      }

      const blogPost = await prisma.blogPost.update({
        where: { id },
        data: updateData
      });

      logger.info(`Blog post updated: ${blogPost.title} (ID: ${blogPost.id})`);
      return blogPost;
    } catch (error) {
      logger.error('Error updating blog post:', error);
      throw error;
    }
  }

  async deleteBlogPost(id: string) {
    try {
      await prisma.blogPost.delete({
        where: { id }
      });

      logger.info(`Blog post deleted: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting blog post:', error);
      throw error;
    }
  }

  async getBlogPosts(filters: {
    published?: boolean;
    category?: string;
    tag?: string;
    authorId?: string;
    limit?: number;
    offset?: number;
    search?: string;
  } = {}) {
    try {
      const where: any = {};

      if (filters.published !== undefined) {
        where.published = filters.published;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.tag) {
        where.tags = { has: filters.tag };
      }

      if (filters.authorId) {
        where.authorId = filters.authorId;
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } },
          { excerpt: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          orderBy: [
            { publishedAt: 'desc' },
            { createdAt: 'desc' }
          ],
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        prisma.blogPost.count({ where })
      ]);

      return { posts, total };
    } catch (error) {
      logger.error('Error getting blog posts:', error);
      throw error;
    }
  }

  // Page Management
  async createPage(data: PageCreateData) {
    try {
      if (!data.slug) {
        data.slug = this.generateSlug(data.title);
      }

      const existingPage = await prisma.page.findUnique({
        where: { slug: data.slug }
      });

      if (existingPage) {
        throw new Error('Page with this slug already exists');
      }

      const page = await prisma.page.create({
        data: {
          ...data,
          publishedAt: data.published ? (data.publishedAt || new Date()) : null
        }
      });

      logger.info(`Page created: ${page.title} (ID: ${page.id})`);
      return page;
    } catch (error) {
      logger.error('Error creating page:', error);
      throw error;
    }
  }

  async updatePage(data: PageUpdateData) {
    try {
      const { id, ...updateData } = data;

      if (updateData.published !== undefined) {
        if (updateData.published && !updateData.publishedAt) {
          updateData.publishedAt = new Date();
        } else if (!updateData.published) {
          updateData.publishedAt = null;
        }
      }

      const page = await prisma.page.update({
        where: { id },
        data: updateData
      });

      logger.info(`Page updated: ${page.title} (ID: ${page.id})`);
      return page;
    } catch (error) {
      logger.error('Error updating page:', error);
      throw error;
    }
  }

  async deletePage(id: string) {
    try {
      await prisma.page.delete({
        where: { id }
      });

      logger.info(`Page deleted: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting page:', error);
      throw error;
    }
  }

  async getPages(filters: {
    published?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
  } = {}) {
    try {
      const where: any = {};

      if (filters.published !== undefined) {
        where.published = filters.published;
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [pages, total] = await Promise.all([
        prisma.page.findMany({
          where,
          orderBy: [
            { publishedAt: 'desc' },
            { createdAt: 'desc' }
          ],
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        prisma.page.count({ where })
      ]);

      return { pages, total };
    } catch (error) {
      logger.error('Error getting pages:', error);
      throw error;
    }
  }

  // Email Template Management
  async createEmailTemplate(data: EmailTemplateCreateData) {
    try {
      const template = await prisma.emailTemplate.create({
        data
      });

      logger.info(`Email template created: ${template.name} (ID: ${template.id})`);
      return template;
    } catch (error) {
      logger.error('Error creating email template:', error);
      throw error;
    }
  }

  async updateEmailTemplate(data: EmailTemplateUpdateData) {
    try {
      const { id, ...updateData } = data;

      const template = await prisma.emailTemplate.update({
        where: { id },
        data: updateData
      });

      logger.info(`Email template updated: ${template.name} (ID: ${template.id})`);
      return template;
    } catch (error) {
      logger.error('Error updating email template:', error);
      throw error;
    }
  }

  async deleteEmailTemplate(id: string) {
    try {
      await prisma.emailTemplate.delete({
        where: { id }
      });

      logger.info(`Email template deleted: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting email template:', error);
      throw error;
    }
  }

  async getEmailTemplates(filters: {
    active?: boolean;
    category?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const where: any = {};

      if (filters.active !== undefined) {
        where.active = filters.active;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      const [templates, total] = await Promise.all([
        prisma.emailTemplate.findMany({
          where,
          orderBy: [
            { useCount: 'desc' },
            { createdAt: 'desc' }
          ],
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        prisma.emailTemplate.count({ where })
      ]);

      return { templates, total };
    } catch (error) {
      logger.error('Error getting email templates:', error);
      throw error;
    }
  }

  // Email Campaign Management
  async createEmailCampaign(data: EmailCampaignCreateData) {
    try {
      const campaign = await prisma.emailCampaign.create({
        data
      });

      logger.info(`Email campaign created: ${campaign.name} (ID: ${campaign.id})`);
      return campaign;
    } catch (error) {
      logger.error('Error creating email campaign:', error);
      throw error;
    }
  }

  async updateEmailCampaign(campaignId: string, data: Partial<EmailCampaignCreateData>) {
    try {
      const campaign = await prisma.emailCampaign.update({
        where: { id: campaignId },
        data
      });

      logger.info(`Email campaign updated: ${campaign.name} (ID: ${campaign.id})`);
      return campaign;
    } catch (error) {
      logger.error('Error updating email campaign:', error);
      throw error;
    }
  }

  async sendEmailCampaign(campaignId: string) {
    try {
      // Here you would integrate with your email service (SendGrid, etc.)
      // For now, we'll just update the campaign status
      const campaign = await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      });

      logger.info(`Email campaign sent: ${campaign.name} (ID: ${campaign.id})`);
      return campaign;
    } catch (error) {
      logger.error('Error sending email campaign:', error);
      throw error;
    }
  }

  // Content Analytics
  async getContentStats(): Promise<ContentStats> {
    try {
      const [
        blogPostStats,
        pageStats,
        emailTemplateStats,
        emailCampaignStats
      ] = await Promise.all([
        this.getBlogPostStats(),
        this.getPageStats(),
        this.getEmailTemplateStats(),
        this.getEmailCampaignStats()
      ]);

      return {
        blogPosts: blogPostStats,
        pages: pageStats,
        emailTemplates: emailTemplateStats,
        emailCampaigns: emailCampaignStats
      };
    } catch (error) {
      logger.error('Error getting content stats:', error);
      throw error;
    }
  }

  private async getBlogPostStats() {
    const [total, published, draft, categoryStats, tagStats, recentCount] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.blogPost.count({ where: { published: false } }),
      prisma.blogPost.groupBy({
        by: ['category'],
        _count: { category: true }
      }),
      prisma.$queryRaw`
        SELECT unnest(tags) as tag, COUNT(*) as count 
        FROM "BlogPost" 
        WHERE tags IS NOT NULL 
        GROUP BY tag 
        ORDER BY count DESC 
        LIMIT 10
      ` as Array<{ tag: string; count: bigint }>,
      prisma.blogPost.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    const categories = categoryStats.reduce((acc, stat) => {
      acc[stat.category] = stat._count.category;
      return acc;
    }, {} as Record<string, number>);

    const topTags = tagStats.map(stat => ({
      tag: stat.tag,
      count: Number(stat.count)
    }));

    return {
      total,
      published,
      draft,
      categories,
      topTags,
      recentPosts: recentCount
    };
  }

  private async getPageStats() {
    const [total, published, draft] = await Promise.all([
      prisma.page.count(),
      prisma.page.count({ where: { published: true } }),
      prisma.page.count({ where: { published: false } })
    ]);

    return { total, published, draft };
  }

  private async getEmailTemplateStats() {
    const [total, active, categoryStats, mostUsed] = await Promise.all([
      prisma.emailTemplate.count(),
      prisma.emailTemplate.count({ where: { active: true } }),
      prisma.emailTemplate.groupBy({
        by: ['category'],
        _count: { category: true }
      }),
      prisma.emailTemplate.findMany({
        select: { name: true, useCount: true },
        orderBy: { useCount: 'desc' },
        take: 5
      })
    ]);

    const categories = categoryStats.reduce((acc, stat) => {
      acc[stat.category] = stat._count.category;
      return acc;
    }, {} as Record<string, number>);

    return { total, active, categories, mostUsed };
  }

  private async getEmailCampaignStats() {
    const [total, sent, scheduled, draft, campaignMetrics] = await Promise.all([
      prisma.emailCampaign.count(),
      prisma.emailCampaign.count({ where: { status: 'SENT' } }),
      prisma.emailCampaign.count({ where: { status: 'SCHEDULED' } }),
      prisma.emailCampaign.count({ where: { status: 'DRAFT' } }),
      prisma.emailCampaign.aggregate({
        _sum: {
          recipientCount: true,
          deliveredCount: true,
          openedCount: true,
          clickedCount: true
        }
      })
    ]);

    const totalRecipients = campaignMetrics._sum.recipientCount || 0;
    const totalDelivered = campaignMetrics._sum.deliveredCount || 0;
    const totalOpened = campaignMetrics._sum.openedCount || 0;
    const totalClicked = campaignMetrics._sum.clickedCount || 0;

    const avgOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

    return {
      total,
      sent,
      scheduled,
      draft,
      totalRecipients,
      avgOpenRate: Math.round(avgOpenRate * 100) / 100,
      avgClickRate: Math.round(avgClickRate * 100) / 100
    };
  }

  // Utility methods
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  private generateExcerpt(content: string, maxLength: number = 160): string {
    // Strip HTML tags and truncate
    const stripped = content.replace(/<[^>]*>/g, '');
    return stripped.length > maxLength 
      ? stripped.substring(0, maxLength).trim() + '...' 
      : stripped;
  }
}

export const contentManagementSystem = new ContentManagementSystem();