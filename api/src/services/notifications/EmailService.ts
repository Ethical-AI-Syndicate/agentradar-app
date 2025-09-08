import sgMail from '@sendgrid/mail';
import { createLogger } from '../../utils/logger';

const logger = createLogger();

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailTemplate {
  id: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface EmailNotification {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
  categories?: string[];
  customArgs?: Record<string, string>;
  sendAt?: number;
}

export interface BulkEmailData {
  to: string;
  templateData?: Record<string, any>;
}

export interface BulkEmailNotification {
  from?: string;
  templateId: string;
  subject?: string;
  recipients: BulkEmailData[];
  categories?: string[];
  customArgs?: Record<string, string>;
  sendAt?: number;
}

class EmailService {
  private defaultFrom: string;

  constructor() {
    this.defaultFrom = process.env.EMAIL_FROM || 'AgentRadar <noreply@agentradar.app>';
    
    if (!process.env.SENDGRID_API_KEY) {
      logger.warn('SendGrid API key not configured. Email notifications will be logged only.');
    }
  }

  /**
   * Send a single email notification
   */
  async sendEmail(notification: EmailNotification): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        logger.info('Email would be sent (SendGrid not configured):', {
          to: notification.to,
          subject: notification.subject,
          from: notification.from || this.defaultFrom
        });
        return { success: true, messageId: 'mock-message-id' };
      }

      const msg: any = {
        to: notification.to,
        from: notification.from || this.defaultFrom,
        subject: notification.subject
      };

      // Add content
      if (notification.html) {
        msg.html = notification.html;
      }

      if (notification.text) {
        msg.text = notification.text;
      }

      // Add template if specified
      if (notification.templateId) {
        msg.templateId = notification.templateId;
        if (notification.templateData) {
          msg.dynamicTemplateData = notification.templateData;
        }
      }

      // Add attachments if provided
      if (notification.attachments) {
        msg.attachments = notification.attachments;
      }

      // Add categories for tracking
      if (notification.categories) {
        msg.categories = notification.categories;
      }

      // Add custom arguments
      if (notification.customArgs) {
        msg.customArgs = notification.customArgs;
      }

      // Schedule for later if sendAt is provided
      if (notification.sendAt) {
        msg.sendAt = notification.sendAt;
      }

      const [response] = await sgMail.send(msg);

      logger.info('Email sent successfully:', {
        to: notification.to,
        subject: notification.subject,
        messageId: response.headers['x-message-id']
      });

      return { 
        success: true, 
        messageId: response.headers['x-message-id'] 
      };

    } catch (error: any) {
      logger.error('Error sending email:', {
        error: error.message,
        response: error.response?.body,
        to: notification.to,
        subject: notification.subject
      });

      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Send bulk emails using SendGrid's batch functionality
   */
  async sendBulkEmails(notification: BulkEmailNotification): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        logger.info('Bulk emails would be sent (SendGrid not configured):', {
          templateId: notification.templateId,
          recipientCount: notification.recipients.length,
          subject: notification.subject
        });
        return { success: true, messageId: 'mock-bulk-message-id' };
      }

      const msg: any = {
        from: notification.from || this.defaultFrom,
        templateId: notification.templateId,
        personalizations: notification.recipients.map(recipient => ({
          to: [{ email: recipient.to }],
          dynamicTemplateData: recipient.templateData || {}
        }))
      };

      // Add subject if provided (otherwise use template default)
      if (notification.subject) {
        msg.subject = notification.subject;
      }

      // Add categories for tracking
      if (notification.categories) {
        msg.categories = notification.categories;
      }

      // Add custom arguments
      if (notification.customArgs) {
        msg.customArgs = notification.customArgs;
      }

      // Schedule for later if sendAt is provided
      if (notification.sendAt) {
        msg.sendAt = notification.sendAt;
      }

      const [response] = await sgMail.send(msg);

      logger.info('Bulk emails sent successfully:', {
        templateId: notification.templateId,
        recipientCount: notification.recipients.length,
        messageId: response.headers['x-message-id']
      });

      return { 
        success: true, 
        messageId: response.headers['x-message-id'] 
      };

    } catch (error: any) {
      logger.error('Error sending bulk emails:', {
        error: error.message,
        response: error.response?.body,
        templateId: notification.templateId,
        recipientCount: notification.recipients.length
      });

      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // =============================================================================
  // PREDEFINED EMAIL TYPES
  // =============================================================================

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(userEmail: string, userData: {
    name: string;
    subscriptionTier: string;
    loginUrl?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to AgentRadar - Your Real Estate Intelligence Platform',
      html: this.generateWelcomeEmailHTML(userData),
      text: this.generateWelcomeEmailText(userData),
      categories: ['welcome', 'onboarding'],
      customArgs: {
        emailType: 'welcome',
        subscriptionTier: userData.subscriptionTier
      }
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail: string, userData: {
    name: string;
    resetLink: string;
    expiryTime: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Reset Your AgentRadar Password',
      html: this.generatePasswordResetHTML(userData),
      text: this.generatePasswordResetText(userData),
      categories: ['password-reset', 'security'],
      customArgs: {
        emailType: 'password-reset'
      }
    });
  }

  /**
   * Send support ticket notification to user
   */
  async sendTicketNotificationEmail(userEmail: string, ticketData: {
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
    assignedAgent?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: userEmail,
      subject: `Support Ticket Update - ${ticketData.ticketNumber}`,
      html: this.generateTicketNotificationHTML(ticketData),
      text: this.generateTicketNotificationText(ticketData),
      categories: ['support', 'ticket-notification'],
      customArgs: {
        emailType: 'ticket-notification',
        ticketNumber: ticketData.ticketNumber
      }
    });
  }

  /**
   * Send alert notification email
   */
  async sendAlertNotificationEmail(userEmail: string, alertData: {
    title: string;
    type: string;
    priority: string;
    location: string;
    estimatedValue?: number;
    opportunityScore: number;
    viewLink: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: userEmail,
      subject: `🚨 New Property Alert: ${alertData.title}`,
      html: this.generateAlertNotificationHTML(alertData),
      text: this.generateAlertNotificationText(alertData),
      categories: ['alerts', 'property-notification'],
      customArgs: {
        emailType: 'alert-notification',
        alertType: alertData.type,
        priority: alertData.priority
      }
    });
  }

  /**
   * Send subscription change notification
   */
  async sendSubscriptionChangeEmail(userEmail: string, subscriptionData: {
    name: string;
    oldTier: string;
    newTier: string;
    effectiveDate: string;
    newFeatures: string[];
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: userEmail,
      subject: `Subscription Updated - Welcome to ${subscriptionData.newTier}`,
      html: this.generateSubscriptionChangeHTML(subscriptionData),
      text: this.generateSubscriptionChangeText(subscriptionData),
      categories: ['subscription', 'billing'],
      customArgs: {
        emailType: 'subscription-change',
        oldTier: subscriptionData.oldTier,
        newTier: subscriptionData.newTier
      }
    });
  }

  /**
   * Send admin notification email
   */
  async sendAdminNotificationEmail(adminEmails: string[], notificationData: {
    subject: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    actionRequired?: boolean;
    dashboardLink?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const severityEmojis = {
      low: '📊',
      medium: '⚠️',
      high: '🚨',
      critical: '🔴'
    };

    return this.sendEmail({
      to: adminEmails,
      subject: `${severityEmojis[notificationData.severity]} Admin Alert: ${notificationData.subject}`,
      html: this.generateAdminNotificationHTML(notificationData),
      text: this.generateAdminNotificationText(notificationData),
      categories: ['admin', 'notification', notificationData.severity],
      customArgs: {
        emailType: 'admin-notification',
        severity: notificationData.severity,
        actionRequired: notificationData.actionRequired ? 'true' : 'false'
      }
    });
  }

  // =============================================================================
  // EMAIL TEMPLATE GENERATORS
  // =============================================================================

  private generateWelcomeEmailHTML(data: { name: string; subscriptionTier: string; loginUrl?: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .tier-badge { background: #4CAF50; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏡 Welcome to AgentRadar!</h1>
              <p>Your Real Estate Intelligence Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${data.name}! 👋</h2>
              <p>Welcome to AgentRadar, the most advanced real estate intelligence platform for agents and professionals like you.</p>
              
              <p>Your account is now active with: <span class="tier-badge">${data.subscriptionTier}</span></p>
              
              <h3>🚀 What's Next?</h3>
              <ul>
                <li>Set up your alert preferences to start receiving property opportunities</li>
                <li>Explore our AI-powered market predictions and analytics</li>
                <li>Connect your MLS and CRM systems for seamless workflow</li>
                <li>Browse our extensive knowledge base and tutorials</li>
              </ul>
              
              ${data.loginUrl ? `<a href="${data.loginUrl}" class="button">Access Your Dashboard</a>` : ''}
              
              <p>If you have any questions, our support team is here to help 24/7.</p>
              
              <p>Best regards,<br>The AgentRadar Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateWelcomeEmailText(data: { name: string; subscriptionTier: string; loginUrl?: string }): string {
    return `
Welcome to AgentRadar, ${data.name}!

Your Real Estate Intelligence Platform account is now active with ${data.subscriptionTier} subscription.

What's Next:
- Set up your alert preferences
- Explore AI-powered market predictions
- Connect your MLS and CRM systems
- Browse our knowledge base

${data.loginUrl ? `Access your dashboard: ${data.loginUrl}` : ''}

Questions? Contact our support team anytime.

Best regards,
The AgentRadar Team
    `;
  }

  private generatePasswordResetHTML(data: { name: string; resetLink: string; expiryTime: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.name},</h2>
              <p>You requested to reset your AgentRadar password. Click the button below to create a new password:</p>
              
              <a href="${data.resetLink}" class="button">Reset Password</a>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link expires at ${data.expiryTime}</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              
              <p>If the button doesn't work, copy and paste this link: ${data.resetLink}</p>
              
              <p>For security questions, contact our support team.</p>
              
              <p>Best regards,<br>The AgentRadar Security Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generatePasswordResetText(data: { name: string; resetLink: string; expiryTime: string }): string {
    return `
Password Reset Request

Hello ${data.name},

You requested to reset your AgentRadar password.

Reset your password: ${data.resetLink}

IMPORTANT:
- This link expires at ${data.expiryTime}
- If you didn't request this, ignore this email
- Never share this link with anyone

For security questions, contact support.

Best regards,
The AgentRadar Security Team
    `;
  }

  private generateTicketNotificationHTML(data: {
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
    assignedAgent?: string;
  }): string {
    const statusColors: Record<string, string> = {
      'OPEN': '#2196F3',
      'IN_PROGRESS': '#FF9800',
      'RESOLVED': '#4CAF50',
      'CLOSED': '#757575'
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; margin: 5px 0; }
            .ticket-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎫 Support Ticket Update</h1>
              <p>Ticket #${data.ticketNumber}</p>
            </div>
            <div class="content">
              <div class="ticket-info">
                <h3>${data.title}</h3>
                <p><strong>Status:</strong> <span class="status-badge" style="background: ${statusColors[data.status] || '#757575'}">${data.status.replace('_', ' ')}</span></p>
                <p><strong>Priority:</strong> ${data.priority}</p>
                ${data.assignedAgent ? `<p><strong>Assigned Agent:</strong> ${data.assignedAgent}</p>` : ''}
              </div>
              
              <p>Your support ticket has been updated. Our team is working to resolve your issue as quickly as possible.</p>
              
              <p>You can track your ticket status and add additional information through your AgentRadar dashboard.</p>
              
              <p>Thank you for your patience.</p>
              
              <p>Best regards,<br>The AgentRadar Support Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateTicketNotificationText(data: {
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
    assignedAgent?: string;
  }): string {
    return `
Support Ticket Update - #${data.ticketNumber}

${data.title}

Status: ${data.status.replace('_', ' ')}
Priority: ${data.priority}
${data.assignedAgent ? `Assigned Agent: ${data.assignedAgent}` : ''}

Your support ticket has been updated. Our team is working to resolve your issue.

Track your ticket through your AgentRadar dashboard.

Best regards,
The AgentRadar Support Team
    `;
  }

  private generateAlertNotificationHTML(data: {
    title: string;
    type: string;
    priority: string;
    location: string;
    estimatedValue?: number;
    opportunityScore: number;
    viewLink: string;
  }): string {
    const priorityColors: Record<string, string> = {
      'LOW': '#4CAF50',
      'MEDIUM': '#FF9800',
      'HIGH': '#f44336',
      'URGENT': '#9C27B0'
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #FF6B6B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .alert-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FF6B6B; }
            .score-badge { background: #4CAF50; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; }
            .priority-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 New Property Alert!</h1>
              <p>Opportunity Detected</p>
            </div>
            <div class="content">
              <div class="alert-info">
                <h3>${data.title}</h3>
                <p><strong>Type:</strong> ${data.type.replace('_', ' ')}</p>
                <p><strong>Location:</strong> ${data.location}</p>
                <p><strong>Priority:</strong> <span class="priority-badge" style="background: ${priorityColors[data.priority] || '#757575'}">${data.priority}</span></p>
                ${data.estimatedValue ? `<p><strong>Estimated Value:</strong> $${data.estimatedValue.toLocaleString()}</p>` : ''}
                <p><strong>Opportunity Score:</strong> <span class="score-badge">${data.opportunityScore}/100</span></p>
              </div>
              
              <p>🎯 This property matches your alert preferences and represents a potential opportunity in your target market.</p>
              
              <a href="${data.viewLink}" class="button">View Property Details</a>
              
              <p><strong>💡 Pro Tip:</strong> Act fast on high-priority alerts - the best opportunities don't last long!</p>
              
              <p>Best regards,<br>The AgentRadar Intelligence Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateAlertNotificationText(data: {
    title: string;
    type: string;
    priority: string;
    location: string;
    estimatedValue?: number;
    opportunityScore: number;
    viewLink: string;
  }): string {
    return `
🚨 NEW PROPERTY ALERT!

${data.title}

Type: ${data.type.replace('_', ' ')}
Location: ${data.location}
Priority: ${data.priority}
${data.estimatedValue ? `Estimated Value: $${data.estimatedValue.toLocaleString()}` : ''}
Opportunity Score: ${data.opportunityScore}/100

This property matches your preferences and represents a potential opportunity.

View details: ${data.viewLink}

Act fast on high-priority alerts!

Best regards,
The AgentRadar Intelligence Team
    `;
  }

  private generateSubscriptionChangeHTML(data: {
    name: string;
    oldTier: string;
    newTier: string;
    effectiveDate: string;
    newFeatures: string[];
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .upgrade-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50; }
            .features-list { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Subscription Upgraded!</h1>
              <p>Welcome to ${data.newTier}</p>
            </div>
            <div class="content">
              <h2>Hello ${data.name}!</h2>
              <p>Great news! Your AgentRadar subscription has been successfully upgraded.</p>
              
              <div class="upgrade-info">
                <p><strong>Previous Plan:</strong> ${data.oldTier}</p>
                <p><strong>New Plan:</strong> ${data.newTier}</p>
                <p><strong>Effective Date:</strong> ${data.effectiveDate}</p>
              </div>
              
              <h3>🚀 Your New Features:</h3>
              <div class="features-list">
                <ul>
                  ${data.newFeatures.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
              </div>
              
              <p>These features are now active in your account and ready to use!</p>
              
              <a href="#" class="button">Explore New Features</a>
              
              <p>Questions about your new plan? Our support team is here to help you make the most of your upgrade.</p>
              
              <p>Best regards,<br>The AgentRadar Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateSubscriptionChangeText(data: {
    name: string;
    oldTier: string;
    newTier: string;
    effectiveDate: string;
    newFeatures: string[];
  }): string {
    return `
🎉 Subscription Upgraded!

Hello ${data.name},

Your AgentRadar subscription has been upgraded to ${data.newTier}.

Previous Plan: ${data.oldTier}
New Plan: ${data.newTier}
Effective Date: ${data.effectiveDate}

Your New Features:
${data.newFeatures.map(feature => `- ${feature}`).join('\n')}

These features are now active in your account!

Questions? Contact our support team.

Best regards,
The AgentRadar Team
    `;
  }

  private generateAdminNotificationHTML(data: {
    subject: string;
    message: string;
    severity: string;
    actionRequired?: boolean;
    dashboardLink?: string;
    metadata?: Record<string, any>;
  }): string {
    const severityColors: Record<string, string> = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#f44336',
      critical: '#9C27B0'
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${severityColors[data.severity]}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: ${severityColors[data.severity]}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .alert-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${severityColors[data.severity]}; }
            .severity-badge { background: ${severityColors[data.severity]}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; font-family: monospace; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Admin Notification</h1>
              <span class="severity-badge">${data.severity}</span>
            </div>
            <div class="content">
              <div class="alert-box">
                <h3>${data.subject}</h3>
                <p>${data.message}</p>
                
                ${data.actionRequired ? '<p><strong>⚠️ Action Required:</strong> This notification requires immediate attention.</p>' : ''}
                
                ${data.metadata ? `
                  <details>
                    <summary>Additional Details</summary>
                    <div class="metadata">${JSON.stringify(data.metadata, null, 2)}</div>
                  </details>
                ` : ''}
              </div>
              
              ${data.dashboardLink ? `<a href="${data.dashboardLink}" class="button">View Admin Dashboard</a>` : ''}
              
              <p>This is an automated notification from the AgentRadar system monitoring service.</p>
              
              <p>Timestamp: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateAdminNotificationText(data: {
    subject: string;
    message: string;
    severity: string;
    actionRequired?: boolean;
    dashboardLink?: string;
    metadata?: Record<string, any>;
  }): string {
    return `
🔔 ADMIN NOTIFICATION [${data.severity.toUpperCase()}]

${data.subject}

${data.message}

${data.actionRequired ? '⚠️ ACTION REQUIRED: This notification needs immediate attention.' : ''}

${data.dashboardLink ? `Admin Dashboard: ${data.dashboardLink}` : ''}

${data.metadata ? `Additional Details:\n${JSON.stringify(data.metadata, null, 2)}` : ''}

Timestamp: ${new Date().toISOString()}

This is an automated notification from AgentRadar system monitoring.
    `;
  }
}

export const emailService = new EmailService();