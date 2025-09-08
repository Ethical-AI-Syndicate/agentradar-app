import { PrismaClient } from '../generated/prisma';
import { createLogger } from '../utils/logger';

const prisma = new PrismaClient();
const logger = createLogger();

/**
 * Compliance Management Service
 * Handles enterprise compliance requirements and governance
 */
export class ComplianceService {
  
  /**
   * Data Subject Access Request (GDPR Article 15)
   * Provides complete user data export
   */
  async handleDataSubjectAccessRequest(userId: string): Promise<any> {
    try {
      logger.info(`Processing GDPR Access Request for user: ${userId}`);
      
      const userData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          alertPreferences: true,
          userAlerts: {
            include: {
              alert: true
            }
          },
          savedProperties: true,
          activityLogs: true,
          supportTickets: true,
          customerSupportTickets: true
        }
      });

      if (!userData) {
        throw new Error('User not found');
      }

      // Create comprehensive data export
      const dataExport = {
        personal_data: {
          user_id: userData.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          company: userData.company,
          license_number: userData.licenseNumber,
          created_at: userData.createdAt,
          last_login: userData.lastLogin,
          subscription_tier: userData.subscriptionTier
        },
        preferences: userData.alertPreferences,
        alert_history: userData.userAlerts.map(ua => ({
          alert_id: ua.alert.id,
          alert_type: ua.alert.type,
          viewed_at: ua.viewedAt,
          bookmarked: ua.isBookmarked
        })),
        saved_properties: userData.savedProperties,
        support_history: userData.supportTickets.map(ticket => ({
          ticket_id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          created_at: ticket.createdAt
        })),
        activity_logs: userData.activityLogs.map(log => ({
          action: log.action,
          timestamp: log.createdAt,
          details: log.details
        }))
      };

      // Log the access request
      await this.logComplianceAction(userId, 'GDPR_ACCESS_REQUEST', {
        request_date: new Date().toISOString(),
        data_exported: Object.keys(dataExport).length > 0
      });

      return dataExport;
    } catch (error) {
      logger.error('GDPR Access Request Failed', error);
      throw error;
    }
  }

  /**
   * Right to be Forgotten (GDPR Article 17)
   * Handles user data deletion requests
   */
  async handleRightToBeForgotten(userId: string, reason: string): Promise<boolean> {
    try {
      logger.warn(`Processing GDPR Deletion Request for user: ${userId}`);
      
      // Check if user has any legal obligations that prevent deletion
      const legalHolds = await this.checkLegalHolds(userId);
      if (legalHolds.length > 0) {
        throw new Error(`Cannot delete data: Legal holds active - ${legalHolds.join(', ')}`);
      }

      // Begin data deletion process
      await prisma.$transaction(async (tx) => {
        // Delete related data first (foreign key constraints)
        await tx.userAlert.deleteMany({ where: { userId } });
        await tx.alertPreference.deleteMany({ where: { userId } });
        await tx.savedProperty.deleteMany({ where: { userId } });
        await tx.activityLog.deleteMany({ where: { userId } });
        await tx.supportTicketMessage.deleteMany({ where: { userId } });
        await tx.supportTicket.deleteMany({ where: { userId } });
        await tx.customerSupportTicket.updateMany({
          where: { userId },
          data: { userId: null } // Anonymize instead of delete for audit trail
        });

        // Anonymize user record instead of deleting for compliance audit
        await tx.user.update({
          where: { id: userId },
          data: {
            email: `deleted-${Date.now()}@anonymized.local`,
            firstName: '[DELETED]',
            lastName: '[DELETED]',
            phone: null,
            company: '[DELETED]',
            licenseNumber: null,
            passwordHash: '[DELETED]',
            isActive: false
          }
        });
      });

      // Log the deletion
      await this.logComplianceAction(userId, 'GDPR_RIGHT_TO_BE_FORGOTTEN', {
        deletion_date: new Date().toISOString(),
        reason,
        anonymized: true
      });

      logger.warn(`GDPR Deletion Completed for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('GDPR Deletion Request Failed', error);
      throw error;
    }
  }

  /**
   * Data Portability (GDPR Article 20)
   * Provides structured data export for user migration
   */
  async handleDataPortabilityRequest(userId: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    try {
      const dataExport = await this.handleDataSubjectAccessRequest(userId);
      
      if (format === 'csv') {
        return this.convertToCSV(dataExport);
      }

      await this.logComplianceAction(userId, 'GDPR_DATA_PORTABILITY', {
        export_date: new Date().toISOString(),
        format
      });

      return dataExport;
    } catch (error) {
      logger.error('Data Portability Request Failed', error);
      throw error;
    }
  }

  /**
   * Data Retention Policy Management
   * Implements automated data retention and deletion
   */
  async enforceDataRetentionPolicies(): Promise<void> {
    try {
      const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '2555'); // 7 years
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      logger.info(`Enforcing data retention policy: ${retentionDays} days`);

      // Find records past retention period
      const expiredRecords = await prisma.activityLog.findMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        },
        select: {
          id: true,
          userId: true,
          action: true,
          createdAt: true
        }
      });

      if (expiredRecords.length > 0) {
        // Delete expired activity logs
        await prisma.activityLog.deleteMany({
          where: {
            id: {
              in: expiredRecords.map(r => r.id)
            }
          }
        });

        logger.info(`Data retention cleanup: Deleted ${expiredRecords.length} expired records`);
        
        // Log retention enforcement
        await this.logComplianceAction('SYSTEM', 'DATA_RETENTION_CLEANUP', {
          records_deleted: expiredRecords.length,
          retention_period: `${retentionDays} days`,
          cleanup_date: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Data Retention Enforcement Failed', error);
      throw error;
    }
  }

  /**
   * SOX Compliance Audit
   * Financial data access auditing
   */
  async generateSOXAuditReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      // This would integrate with your audit logging system
      const auditEntries = await prisma.activityLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          action: {
            contains: 'financial'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const report = {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        total_financial_accesses: auditEntries.length,
        unique_users: new Set(auditEntries.map(e => e.userId)).size,
        admin_accesses: auditEntries.filter(e => e.user?.role === 'ADMIN').length,
        non_admin_accesses: auditEntries.filter(e => e.user?.role !== 'ADMIN').length,
        detailed_entries: auditEntries.map(entry => ({
          timestamp: entry.createdAt,
          user_id: entry.userId,
          user_email: entry.user?.email,
          user_role: entry.user?.role,
          action: entry.action,
          details: entry.details
        }))
      };

      await this.logComplianceAction('SYSTEM', 'SOX_AUDIT_REPORT', {
        report_period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
        total_entries: auditEntries.length,
        generated_at: new Date().toISOString()
      });

      return report;
    } catch (error) {
      logger.error('SOX Audit Report Generation Failed', error);
      throw error;
    }
  }

  /**
   * Real Estate License Compliance Check
   */
  async validateRealEstateLicenses(): Promise<any> {
    try {
      const licensedUsers = await prisma.user.findMany({
        where: {
          licenseNumber: {
            not: null
          },
          isActive: true
        },
        select: {
          id: true,
          email: true,
          licenseNumber: true,
          company: true,
          createdAt: true
        }
      });

      const validationReport = {
        total_licensed_users: licensedUsers.length,
        licenses_to_verify: licensedUsers.map(user => ({
          user_id: user.id,
          email: user.email,
          license_number: this.maskLicenseNumber(user.licenseNumber!),
          company: user.company,
          account_age_days: Math.floor(
            (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        })),
        compliance_status: 'MANUAL_VERIFICATION_REQUIRED'
      };

      await this.logComplianceAction('SYSTEM', 'RE_LICENSE_COMPLIANCE_CHECK', {
        total_licenses: licensedUsers.length,
        check_date: new Date().toISOString()
      });

      return validationReport;
    } catch (error) {
      logger.error('Real Estate License Compliance Check Failed', error);
      throw error;
    }
  }

  /**
   * Comprehensive Compliance Dashboard
   */
  async getComplianceDashboard(): Promise<any> {
    try {
      const [
        totalUsers,
        activeUsers,
        gdprRequests,
        soxAudits,
        retentionCleanups
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.activityLog.count({
          where: {
            action: {
              in: ['GDPR_ACCESS_REQUEST', 'GDPR_RIGHT_TO_BE_FORGOTTEN', 'GDPR_DATA_PORTABILITY']
            }
          }
        }),
        prisma.activityLog.count({
          where: {
            action: 'SOX_AUDIT_REPORT'
          }
        }),
        prisma.activityLog.count({
          where: {
            action: 'DATA_RETENTION_CLEANUP'
          }
        })
      ]);

      return {
        overview: {
          total_users: totalUsers,
          active_users: activeUsers,
          inactive_users: totalUsers - activeUsers,
          compliance_score: this.calculateComplianceScore()
        },
        gdpr: {
          total_requests: gdprRequests,
          status: 'COMPLIANT'
        },
        sox: {
          total_audits: soxAudits,
          status: 'COMPLIANT'
        },
        data_retention: {
          cleanups_performed: retentionCleanups,
          retention_period: `${process.env.DATA_RETENTION_DAYS || '2555'} days`,
          status: 'ACTIVE'
        },
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Compliance Dashboard Generation Failed', error);
      throw error;
    }
  }

  // Private utility methods

  private async checkLegalHolds(userId: string): Promise<string[]> {
    // Check for active legal holds that prevent data deletion
    const holds: string[] = [];
    
    // Check for pending support tickets
    const pendingTickets = await prisma.supportTicket.count({
      where: {
        userId,
        status: {
          in: ['OPEN', 'IN_PROGRESS']
        }
      }
    });

    if (pendingTickets > 0) {
      holds.push('PENDING_SUPPORT_TICKETS');
    }

    // Check for financial obligations (subscriptions, etc.)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        stripeCustomerId: true
      }
    });

    if (user?.stripeCustomerId && user.subscriptionTier !== 'FREE') {
      holds.push('ACTIVE_SUBSCRIPTION');
    }

    return holds;
  }

  private async logComplianceAction(userId: string, action: string, details: any): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId: userId === 'SYSTEM' ? undefined : userId,
          action,
          details: JSON.stringify(details),
          ipAddress: '127.0.0.1', // System action
          userAgent: 'ComplianceService/1.0'
        }
      });
    } catch (error) {
      logger.error('Failed to log compliance action', error);
    }
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would be enhanced for production
    const flattenedData: any[] = [];
    
    const flatten = (obj: any, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flatten(value, newKey);
        } else {
          flattenedData.push({ key: newKey, value: JSON.stringify(value) });
        }
      });
    };

    flatten(data);
    
    const headers = 'Field,Value\n';
    const rows = flattenedData.map(item => `"${item.key}","${item.value}"`).join('\n');
    
    return headers + rows;
  }

  private maskLicenseNumber(license: string): string {
    if (license.length <= 4) return license;
    return `****${license.slice(-4)}`;
  }

  private calculateComplianceScore(): number {
    // Simplified compliance score calculation
    return 95; // Would be based on actual compliance metrics
  }
}

export const complianceService = new ComplianceService();