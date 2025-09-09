import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { emailService } from '../services/notifications/EmailService';
import { createLogger } from '../utils/logger';
import rateLimit from 'express-rate-limit';

const router = Router();
const logger = createLogger();

// Rate limiting for email notifications
const emailRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 email requests per minute
  message: {
    error: 'Too many email requests',
    message: 'Email rate limit exceeded, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Bulk email rate limiting (more restrictive)
const bulkEmailRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 bulk email operations per 5 minutes
  message: {
    error: 'Too many bulk email requests',
    message: 'Bulk email rate limit exceeded, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
router.use(emailRateLimit);

// =============================================================================
// ADMIN EMAIL ROUTES (Require authentication and admin privileges)
// =============================================================================

// Apply authentication to all admin routes
router.use('/admin', authenticateToken);
router.use('/admin', requireAdmin);

/**
 * POST /api/email-notifications/admin/send
 * Send a custom email notification (admin only)
 */
router.post('/admin/send', async (req: Request, res: Response) => {
  try {
    const {
      to,
      subject,
      html,
      text,
      categories,
      customArgs,
      sendAt
    } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, subject, and content (html or text) are required'
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text,
      categories: categories || ['admin-custom'],
      customArgs: {
        ...customArgs,
        sentBy: req.user?.id,
        sentByEmail: req.user?.email
      },
      sendAt
    });

    logger.info(`Custom email sent by admin ${req.user?.email}:`, {
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      success: result.success
    });

    res.json({
      success: result.success,
      message: result.success ? 'Email sent successfully' : 'Failed to send email',
      data: {
        messageId: result.messageId,
        error: result.error
      }
    });

  } catch (error) {
    logger.error('Error sending custom admin email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/email-notifications/admin/bulk-send
 * Send bulk email notifications (admin only)
 */
router.post('/admin/bulk-send', bulkEmailRateLimit, async (req: Request, res: Response) => {
  try {
    const {
      templateId,
      subject,
      recipients,
      categories,
      customArgs,
      sendAt
    } = req.body;

    if (!templateId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Template ID and recipients array are required'
      });
    }

    if (recipients.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 1000 recipients allowed per bulk email'
      });
    }

    const result = await emailService.sendBulkEmails({
      templateId,
      subject,
      recipients,
      categories: categories || ['admin-bulk'],
      customArgs: {
        ...customArgs,
        sentBy: req.user?.id,
        sentByEmail: req.user?.email
      },
      sendAt
    });

    logger.info(`Bulk email sent by admin ${req.user?.email}:`, {
      templateId,
      recipientCount: recipients.length,
      success: result.success
    });

    res.json({
      success: result.success,
      message: result.success ? 'Bulk email sent successfully' : 'Failed to send bulk email',
      data: {
        messageId: result.messageId,
        recipientCount: recipients.length,
        error: result.error
      }
    });

  } catch (error) {
    logger.error('Error sending bulk admin email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/email-notifications/admin/send-admin-notification
 * Send notification to all admin users
 */
router.post('/admin/send-admin-notification', async (req: Request, res: Response) => {
  try {
    const {
      subject,
      message,
      severity = 'medium',
      actionRequired = false,
      dashboardLink,
      metadata
    } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid severity level'
      });
    }

    // Get all admin emails (this would typically come from your user service)
    const adminEmails = ['admin@agentradar.app']; // Placeholder

    const result = await emailService.sendAdminNotificationEmail(adminEmails, {
      subject,
      message,
      severity,
      actionRequired,
      dashboardLink,
      metadata: {
        ...metadata,
        sentBy: req.user?.email,
        timestamp: new Date().toISOString()
      }
    });

    logger.info(`Admin notification sent by ${req.user?.email}:`, {
      subject,
      severity,
      actionRequired,
      success: result.success
    });

    res.json({
      success: result.success,
      message: result.success ? 'Admin notification sent successfully' : 'Failed to send admin notification',
      data: {
        messageId: result.messageId,
        adminCount: adminEmails.length,
        error: result.error
      }
    });

  } catch (error) {
    logger.error('Error sending admin notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send admin notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =============================================================================
// SYSTEM NOTIFICATION ROUTES (Internal use - no authentication required)
// =============================================================================

/**
 * POST /api/email-notifications/system/welcome
 * Send welcome email to new user (internal system use)
 */
router.post('/system/welcome', async (req: Request, res: Response) => {
  try {
    const { userEmail, userData } = req.body;

    if (!userEmail || !userData?.name) {
      return res.status(400).json({
        success: false,
        message: 'User email and name are required'
      });
    }

    const result = await emailService.sendWelcomeEmail(userEmail, userData);

    logger.info(`Welcome email sent to: ${userEmail}`);

    res.json({
      success: result.success,
      message: result.success ? 'Welcome email sent successfully' : 'Failed to send welcome email',
      data: {
        messageId: result.messageId,
        error: result.error
      }
    });

  } catch (error) {
    logger.error('Error sending welcome email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/email-notifications/system/password-reset
 * Send password reset email (internal system use)
 */
router.post('/system/password-reset', async (req: Request, res: Response) => {
  try {
    const { userEmail, userData } = req.body;

    if (!userEmail || !userData?.name || !userData?.resetLink) {
      return res.status(400).json({
        success: false,
        message: 'User email, name, and reset link are required'
      });
    }

    const result = await emailService.sendPasswordResetEmail(userEmail, userData);

    logger.info(`Password reset email sent to: ${userEmail}`);

    res.json({
      success: result.success,
      message: result.success ? 'Password reset email sent successfully' : 'Failed to send password reset email',
      data: {
        messageId: result.messageId,
        error: result.error
      }
    });

  } catch (error) {
    logger.error('Error sending password reset email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/email-notifications/system/ticket-notification
 * Send support ticket notification (internal system use)
 */
router.post('/system/ticket-notification', async (req: Request, res: Response) => {
  try {
    const { userEmail, ticketData } = req.body;

    if (!userEmail || !ticketData?.ticketNumber || !ticketData?.title) {
      return res.status(400).json({
        success: false,
        message: 'User email, ticket number, and title are required'
      });
    }

    const result = await emailService.sendTicketNotificationEmail(userEmail, ticketData);

    logger.info(`Ticket notification email sent to: ${userEmail} for ticket: ${ticketData.ticketNumber}`);

    res.json({
      success: result.success,
      message: result.success ? 'Ticket notification sent successfully' : 'Failed to send ticket notification',
      data: {
        messageId: result.messageId,
        error: result.error
      }
    });

  } catch (error) {
    logger.error('Error sending ticket notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send ticket notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/email-notifications/system/alert-notification
 * Send property alert notification (internal system use)
 */
router.post('/system/alert-notification', async (req: Request, res: Response) => {
  try {
    const { userEmail, alertData } = req.body;

    if (!userEmail || !alertData?.title || !alertData?.type) {
      return res.status(400).json({
        success: false,
        message: 'User email, alert title, and type are required'
      });
    }

    const result = await emailService.sendAlertNotificationEmail(userEmail, alertData);

    logger.info(`Alert notification email sent to: ${userEmail} for alert: ${alertData.title}`);

    res.json({
      success: result.success,
      message: result.success ? 'Alert notification sent successfully' : 'Failed to send alert notification',
      data: {
        messageId: result.messageId,
        error: result.error
      }
    });

  } catch (error) {
    logger.error('Error sending alert notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send alert notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/email-notifications/system/subscription-change
 * Send subscription change notification (internal system use)
 */
router.post('/system/subscription-change', async (req: Request, res: Response) => {
  try {
    const { userEmail, subscriptionData } = req.body;

    if (!userEmail || !subscriptionData?.name || !subscriptionData?.newTier) {
      return res.status(400).json({
        success: false,
        message: 'User email, name, and new tier are required'
      });
    }

    const result = await emailService.sendSubscriptionChangeEmail(userEmail, subscriptionData);

    logger.info(`Subscription change email sent to: ${userEmail} - ${subscriptionData.oldTier} -> ${subscriptionData.newTier}`);

    res.json({
      success: result.success,
      message: result.success ? 'Subscription change notification sent successfully' : 'Failed to send subscription change notification',
      data: {
        messageId: result.messageId,
        error: result.error
      }
    });

  } catch (error) {
    logger.error('Error sending subscription change notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send subscription change notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/email-notifications/health
 * Email service health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isConfigured = !!process.env.SENDGRID_API_KEY;

    res.json({
      success: true,
      service: 'email-notifications',
      status: 'healthy',
      sendgrid: {
        configured: isConfigured,
        status: isConfigured ? 'active' : 'mock-mode'
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'email-notifications',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;