import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { contentManagementSystem } from '../services/admin/ContentManagementSystem';
import { createLogger } from '../utils/logger';
import rateLimit from 'express-rate-limit';

const router = Router();
const logger = createLogger();

// Rate limiting for content management
const contentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many content management requests',
    message: 'Please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
router.use(contentRateLimit);

// =============================================================================
// PUBLIC ROUTES (Blog posts, Pages for website)
// =============================================================================

/**
 * GET /api/content-management/blog/posts
 * Get published blog posts for public website
 */
router.get('/blog/posts', async (req: Request, res: Response) => {
  try {
    const { category, tag, limit = 10, offset = 0, search } = req.query;

    const result = await contentManagementSystem.getBlogPosts({
      published: true,
      category: category as string,
      tag: tag as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      search: search as string
    });

    res.json({
      success: true,
      data: result.posts,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.total > parseInt(offset as string) + parseInt(limit as string)
      }
    });

  } catch (error) {
    logger.error('Error fetching public blog posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/content-management/blog/posts/:slug
 * Get individual blog post by slug
 */
router.get('/blog/posts/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const post = await contentManagementSystem.getBlogPosts({ 
      published: true,
      limit: 1 
    });

    const foundPost = post.posts.find(p => p.slug === slug);

    if (!foundPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment view count (viewCount is handled by the CMS service)
    // We don't need to manually increment it here since the CMS already handles it

    res.json({
      success: true,
      data: foundPost
    });

  } catch (error) {
    logger.error('Error fetching blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/content-management/pages
 * Get published pages for public website
 */
router.get('/pages', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;

    const result = await contentManagementSystem.getPages({
      published: true,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      search: search as string
    });

    res.json({
      success: true,
      data: result.pages,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.total > parseInt(offset as string) + parseInt(limit as string)
      }
    });

  } catch (error) {
    logger.error('Error fetching public pages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pages',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/content-management/pages/:slug
 * Get individual page by slug
 */
router.get('/pages/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const result = await contentManagementSystem.getPages({ 
      published: true,
      limit: 1000 // Get all to search by slug
    });

    const foundPage = result.pages.find(p => p.slug === slug);

    if (!foundPage) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.json({
      success: true,
      data: foundPage
    });

  } catch (error) {
    logger.error('Error fetching page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch page',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// ADMIN ROUTES (Require authentication and admin privileges)
// =============================================================================

// Apply authentication to all admin routes
router.use('/admin/*', authenticateToken);
router.use('/admin/*', requireAdmin);

/**
 * GET /api/content-management/admin/dashboard
 * Get content management dashboard statistics
 */
router.get('/admin/dashboard', async (req: Request, res: Response) => {
  try {
    const stats = await contentManagementSystem.getContentStats();

    logger.info(`Content management dashboard accessed by user ${req.user?.id}`);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      generatedBy: req.user?.email
    });

  } catch (error) {
    logger.error('Error fetching content management dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content management dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// BLOG POST MANAGEMENT
// =============================================================================

/**
 * GET /api/content-management/admin/blog/posts
 * Get all blog posts (including drafts) for admin
 */
router.get('/admin/blog/posts', async (req: Request, res: Response) => {
  try {
    const { published, category, tag, authorId, limit = 50, offset = 0, search } = req.query;

    const result = await contentManagementSystem.getBlogPosts({
      published: published !== undefined ? published === 'true' : undefined,
      category: category as string,
      tag: tag as string,
      authorId: authorId as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      search: search as string
    });

    res.json({
      success: true,
      data: result.posts,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.total > parseInt(offset as string) + parseInt(limit as string)
      }
    });

  } catch (error) {
    logger.error('Error fetching admin blog posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/content-management/admin/blog/posts
 * Create a new blog post
 */
router.post('/admin/blog/posts', async (req: Request, res: Response) => {
  try {
    const postData = {
      ...req.body,
      authorId: req.user?.id
    };

    const post = await contentManagementSystem.createBlogPost(postData);

    logger.info(`Blog post created: ${post.title} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: post,
      message: 'Blog post created successfully'
    });

  } catch (error) {
    logger.error('Error creating blog post:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create blog post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/content-management/admin/blog/posts/:id
 * Update a blog post
 */
router.put('/admin/blog/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await contentManagementSystem.updateBlogPost({
      id,
      ...req.body
    });

    logger.info(`Blog post updated: ${post.title} by ${req.user?.email}`);

    res.json({
      success: true,
      data: post,
      message: 'Blog post updated successfully'
    });

  } catch (error) {
    logger.error('Error updating blog post:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update blog post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/content-management/admin/blog/posts/:id
 * Delete a blog post
 */
router.delete('/admin/blog/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await contentManagementSystem.deleteBlogPost(id);

    logger.info(`Blog post deleted: ${id} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting blog post:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to delete blog post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// PAGE MANAGEMENT
// =============================================================================

/**
 * GET /api/content-management/admin/pages
 * Get all pages (including drafts) for admin
 */
router.get('/admin/pages', async (req: Request, res: Response) => {
  try {
    const { published, limit = 50, offset = 0, search } = req.query;

    const result = await contentManagementSystem.getPages({
      published: published !== undefined ? published === 'true' : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      search: search as string
    });

    res.json({
      success: true,
      data: result.pages,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.total > parseInt(offset as string) + parseInt(limit as string)
      }
    });

  } catch (error) {
    logger.error('Error fetching admin pages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pages',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/content-management/admin/pages
 * Create a new page
 */
router.post('/admin/pages', async (req: Request, res: Response) => {
  try {
    const page = await contentManagementSystem.createPage(req.body);

    logger.info(`Page created: ${page.title} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: page,
      message: 'Page created successfully'
    });

  } catch (error) {
    logger.error('Error creating page:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create page',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/content-management/admin/pages/:id
 * Update a page
 */
router.put('/admin/pages/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const page = await contentManagementSystem.updatePage({
      id,
      ...req.body
    });

    logger.info(`Page updated: ${page.title} by ${req.user?.email}`);

    res.json({
      success: true,
      data: page,
      message: 'Page updated successfully'
    });

  } catch (error) {
    logger.error('Error updating page:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update page',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/content-management/admin/pages/:id
 * Delete a page
 */
router.delete('/admin/pages/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await contentManagementSystem.deletePage(id);

    logger.info(`Page deleted: ${id} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Page deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting page:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to delete page',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// EMAIL TEMPLATE MANAGEMENT
// =============================================================================

/**
 * GET /api/content-management/admin/email-templates
 * Get all email templates
 */
router.get('/admin/email-templates', async (req: Request, res: Response) => {
  try {
    const { active, category, limit = 50, offset = 0 } = req.query;

    const result = await contentManagementSystem.getEmailTemplates({
      active: active !== undefined ? active === 'true' : undefined,
      category: category as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: result.templates,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.total > parseInt(offset as string) + parseInt(limit as string)
      }
    });

  } catch (error) {
    logger.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/content-management/admin/email-templates
 * Create a new email template
 */
router.post('/admin/email-templates', async (req: Request, res: Response) => {
  try {
    const template = await contentManagementSystem.createEmailTemplate(req.body);

    logger.info(`Email template created: ${template.name} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Email template created successfully'
    });

  } catch (error) {
    logger.error('Error creating email template:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create email template',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/content-management/admin/email-templates/:id
 * Update an email template
 */
router.put('/admin/email-templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await contentManagementSystem.updateEmailTemplate({
      id,
      ...req.body
    });

    logger.info(`Email template updated: ${template.name} by ${req.user?.email}`);

    res.json({
      success: true,
      data: template,
      message: 'Email template updated successfully'
    });

  } catch (error) {
    logger.error('Error updating email template:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update email template',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/content-management/admin/email-templates/:id
 * Delete an email template
 */
router.delete('/admin/email-templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await contentManagementSystem.deleteEmailTemplate(id);

    logger.info(`Email template deleted: ${id} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Email template deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting email template:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to delete email template',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// EMAIL CAMPAIGN MANAGEMENT
// =============================================================================

/**
 * POST /api/content-management/admin/email-campaigns
 * Create a new email campaign
 */
router.post('/admin/email-campaigns', async (req: Request, res: Response) => {
  try {
    const campaignData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const campaign = await contentManagementSystem.createEmailCampaign(campaignData);

    logger.info(`Email campaign created: ${campaign.name} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Email campaign created successfully'
    });

  } catch (error) {
    logger.error('Error creating email campaign:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create email campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/content-management/admin/email-campaigns/:id/send
 * Send an email campaign
 */
router.post('/admin/email-campaigns/:id/send', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await contentManagementSystem.sendEmailCampaign(id);

    logger.info(`Email campaign sent: ${campaign.name} by ${req.user?.email}`);

    res.json({
      success: true,
      data: campaign,
      message: 'Email campaign sent successfully'
    });

  } catch (error) {
    logger.error('Error sending email campaign:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to send email campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/content-management/health
 * Content management system health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      service: 'content-management',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'content-management',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;