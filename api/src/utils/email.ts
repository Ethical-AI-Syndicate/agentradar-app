import sgMail from "@sendgrid/mail";
import { createLogger } from "./logger";

const logger = createLogger();

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  logger.warn("SENDGRID_API_KEY not found - email functionality disabled");
}

export interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        logger.warn("Email not sent - SENDGRID_API_KEY not configured");
        return false;
      }

      const msg = {
        to: emailData.to,
        from:
          emailData.from || process.env.EMAIL_FROM || "noreply@agentradar.app",
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, ""),
      };

      await sgMail.send(msg);
      logger.info(`Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error) {
      logger.error("Failed to send email:", error);
      return false;
    }
  }

  async sendBulkEmail(emails: EmailData[]): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        logger.warn("Bulk email not sent - SENDGRID_API_KEY not configured");
        return false;
      }

      const messages = emails.map((email) => ({
        to: email.to,
        from: email.from || process.env.EMAIL_FROM || "noreply@agentradar.app",
        subject: email.subject,
        html: email.html,
        text: email.text || email.html.replace(/<[^>]*>/g, ""),
      }));

      await sgMail.send(messages);
      logger.info(
        `Bulk email sent successfully to ${emails.length} recipients`,
      );
      return true;
    } catch (error) {
      logger.error("Failed to send bulk email:", error);
      return false;
    }
  }
}

export const emailService = EmailService.getInstance();

// Export convenience function for backward compatibility
export const sendEmail = (emailData: EmailData): Promise<boolean> => {
  return emailService.sendEmail(emailData);
};
