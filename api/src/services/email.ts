import sgMail from '@sendgrid/mail';
import { createLogger } from '../utils/logger';

const logger = createLogger();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EarlyAdopterEmailData {
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  discountPercent: number;
  expiresAt: Date;
}

interface PasswordResetEmailData {
  email: string;
  firstName: string;
  lastName: string;
  resetToken: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
  try {
    const { email, firstName, lastName, resetToken } = data;
    const resetUrl = `https://agentradar.app/reset-password?token=${resetToken}`;
    
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'AgentRadar <noreply@agentradar.app>',
      subject: 'AgentRadar - Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - AgentRadar</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔒 Password Reset Request</h1>
                    <p>Reset your AgentRadar password</p>
                </div>
                
                <div class="content">
                    <p>Hi ${firstName},</p>
                    
                    <p>We received a request to reset your password for your AgentRadar account. If you didn't make this request, you can safely ignore this email.</p>
                    
                    <div class="warning">
                        <strong>⚠️ Security Note:</strong> This reset link will expire in 24 hours for your security.
                    </div>
                    
                    <p>To reset your password, click the button below:</p>
                    
                    <p style="text-align: center;">
                        <a href="${resetUrl}" class="button">Reset My Password</a>
                    </p>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 3px; font-family: monospace;">${resetUrl}</p>
                    
                    <p>If you continue to have problems, please contact our support team.</p>
                    
                    <div class="footer">
                        <p><strong>AgentRadar Security Team</strong><br>
                        Protecting your real estate intelligence</p>
                        <p><small>If you didn't request this password reset, please contact us immediately.</small></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - AgentRadar
        
        Hi ${firstName},
        
        We received a request to reset your password for your AgentRadar account. If you didn't make this request, you can safely ignore this email.
        
        To reset your password, visit this link:
        ${resetUrl}
        
        This reset link will expire in 24 hours for your security.
        
        If you continue to have problems, please contact our support team.
        
        AgentRadar Security Team
        Protecting your real estate intelligence
      `
    };

    await sgMail.send(msg);
    logger.info(`Password reset email sent to ${email}`);
    return true;
    
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    return false;
  }
}

export async function sendEarlyAdopterConfirmationEmail(data: EarlyAdopterEmailData): Promise<boolean> {
  try {
    const { email, firstName, lastName, token, discountPercent, expiresAt } = data;
    
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'AgentRadar <noreply@agentradar.app>',
      subject: `🎉 Welcome to AgentRadar Early Access - ${discountPercent}% Off Secured!`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to AgentRadar Early Access</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .token-box { background: #fff; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
                .token { font-family: monospace; font-size: 16px; font-weight: bold; color: #667eea; word-break: break-all; }
                .benefits { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to AgentRadar Early Access!</h1>
                    <p>You're in! Get ready for exclusive real estate intelligence.</p>
                </div>
                
                <div class="content">
                    <p>Hi ${firstName},</p>
                    
                    <p>Congratulations! You've successfully joined the AgentRadar early access program. You're now part of an exclusive group of forward-thinking real estate professionals who will be the first to discover off-market opportunities.</p>
                    
                    <div class="benefits">
                        <h3>🎁 Your Early Adopter Benefits:</h3>
                        <ul>
                            <li><strong>${discountPercent}% lifetime discount</strong> on all plans</li>
                            <li>Priority access to new features</li>
                            <li>Direct feedback channel to our development team</li>
                            <li>Exclusive early access to market intelligence tools</li>
                        </ul>
                    </div>
                    
                    <div class="token-box">
                        <h3>Your Early Access Token:</h3>
                        <div class="token">${token}</div>
                        <p><small>Keep this token safe - you'll need it to claim your discount when we launch!</small></p>
                        <p><strong>Expires:</strong> ${expiresAt.toLocaleDateString()}</p>
                    </div>
                    
                    <h3>What's Next?</h3>
                    <ol>
                        <li><strong>Stay tuned</strong> - We'll send you updates as we get closer to launch</li>
                        <li><strong>Prepare for launch</strong> - Start thinking about the properties you want to find before they hit MLS</li>
                        <li><strong>Spread the word</strong> - Invite colleagues to join the early access (they'll get the same great discount!)</li>
                    </ol>
                    
                    <p>We're building AgentRadar to help real estate professionals like you discover opportunities before they become public. From power of sale properties to estate sales and development opportunities - we'll give you the intelligence edge you need.</p>
                    
                    <a href="https://agentradar.app" class="button">Visit AgentRadar.app</a>
                    
                    <div class="footer">
                        <p>Questions? Reply to this email - we read every message!</p>
                        <p><strong>AgentRadar Team</strong><br>
                        Building the future of real estate intelligence</p>
                        <p><small>You received this email because you signed up for AgentRadar early access. You can unsubscribe at any time.</small></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
        Welcome to AgentRadar Early Access!
        
        Hi ${firstName},
        
        Congratulations! You've successfully joined the AgentRadar early access program.
        
        Your Early Adopter Benefits:
        - ${discountPercent}% lifetime discount on all plans
        - Priority access to new features
        - Direct feedback channel to our development team
        - Exclusive early access to market intelligence tools
        
        Your Early Access Token: ${token}
        Keep this token safe - you'll need it to claim your discount when we launch!
        Expires: ${expiresAt.toLocaleDateString()}
        
        What's Next?
        1. Stay tuned - We'll send you updates as we get closer to launch
        2. Prepare for launch - Start thinking about the properties you want to find before they hit MLS
        3. Spread the word - Invite colleagues to join the early access
        
        Questions? Reply to this email - we read every message!
        
        AgentRadar Team
        Building the future of real estate intelligence
      `
    };

    await sgMail.send(msg);
    logger.info(`Early adopter confirmation email sent to ${email}`);
    return true;
    
  } catch (error) {
    logger.error('Failed to send early adopter confirmation email:', error);
    return false;
  }
}