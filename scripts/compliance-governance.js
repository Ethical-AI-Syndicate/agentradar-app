#!/usr/bin/env node

/**
 * AgentRadar Compliance & Governance Automation
 * Phase 6.4: Enterprise-grade compliance management
 * 
 * Features:
 * - GDPR compliance automation
 * - SOX financial audit trails
 * - Real estate license validation
 * - Data retention enforcement
 * - Privacy impact assessments
 * - Comprehensive reporting
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[${new Date().toISOString()}] INFO:${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[${new Date().toISOString()}] WARN:${colors.reset} ⚠️ ${msg}`),
  error: (msg) => console.log(`${colors.red}[${new Date().toISOString()}] ERROR:${colors.reset} ❌ ${msg}`),
  success: (msg) => console.log(`${colors.green}[${new Date().toISOString()}] SUCCESS:${colors.reset} ✅ ${msg}`)
};

class ComplianceGovernanceManager {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
    this.complianceConfig = this.loadComplianceConfiguration();
  }

  loadComplianceConfiguration() {
    return {
      gdpr: {
        enabled: true,
        autoDeleteExpiredRequests: true,
        maxResponseTimeDays: 30,
        dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '2555') // 7 years
      },
      sox: {
        enabled: true,
        auditFrequencyDays: 30,
        requireApprovalForFinancialAccess: true,
        retentionYears: 7
      },
      realEstate: {
        enabled: true,
        licenseValidationFrequencyDays: 90,
        expirationWarningDays: 30,
        requireActiveForTransactions: true
      },
      dataRetention: {
        enabled: true,
        checkFrequencyDays: 7,
        archiveBeforeDelete: true,
        policies: [
          { dataType: 'ACTIVITY_LOGS', retentionDays: 2555 },
          { dataType: 'AUDIT_LOGS', retentionDays: 2555 },
          { dataType: 'USER_DATA', retentionDays: 2555 },
          { dataType: 'FINANCIAL_DATA', retentionDays: 2555 }
        ]
      },
      dlp: {
        enabled: true,
        alertOnSensitiveData: true,
        blockHighRiskTransfers: true,
        sensitiveDataPatterns: [
          'SSN', 'CREDIT_CARD', 'LICENSE_NUMBER', 'BANK_ACCOUNT'
        ]
      }
    };
  }

  async initialize() {
    log.info('🏛️ Initializing Compliance & Governance System...');
    
    try {
      await this.validateApiConnection();
      await this.checkComplianceHealth();
      log.success('Compliance system initialized successfully');
      return true;
    } catch (error) {
      log.error(`Compliance initialization failed: ${error.message}`);
      return false;
    }
  }

  async validateApiConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`API health check failed: ${response.status}`);
      }
      log.info('✅ API connection validated');
    } catch (error) {
      throw new Error(`API connection failed: ${error.message}`);
    }
  }

  async checkComplianceHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/compliance/health`, {
        headers: await this.getAuthHeaders()
      });
      
      if (response.ok) {
        const health = await response.json();
        log.info(`📊 Compliance Health: ${health.data?.overall_status || 'Unknown'}`);
        log.info(`📈 Compliance Score: ${health.data?.compliance_score || 'N/A'}%`);
        return health.data;
      } else {
        throw new Error(`Compliance health check failed: ${response.status}`);
      }
    } catch (error) {
      log.warn(`Compliance health check unavailable: ${error.message}`);
      return null;
    }
  }

  async runGDPRCompliance() {
    log.info('🛡️ Running GDPR Compliance Checks...');
    
    try {
      // Check for pending GDPR requests
      const dashboard = await this.getComplianceDashboard();
      if (dashboard?.gdpr) {
        log.info(`📋 GDPR Status: ${dashboard.gdpr.status}`);
        log.info(`📊 Total Requests: ${dashboard.gdpr.total_requests}`);
      }

      // Check data retention compliance
      if (this.complianceConfig.gdpr.enabled) {
        await this.enforceDataRetention();
      }

      log.success('GDPR compliance check completed');
      return true;
    } catch (error) {
      log.error(`GDPR compliance check failed: ${error.message}`);
      return false;
    }
  }

  async runSOXCompliance() {
    log.info('📊 Running SOX Compliance Audit...');
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const response = await fetch(
        `${this.baseUrl}/api/compliance/sox/audit-report?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: await this.getAuthHeaders()
        }
      );

      if (response.ok) {
        const report = await response.json();
        log.info(`💰 Financial Accesses: ${report.data?.total_financial_accesses || 0}`);
        log.info(`👥 Unique Users: ${report.data?.unique_users || 0}`);
        log.info(`🔐 Admin Accesses: ${report.data?.admin_accesses || 0}`);
        log.success('SOX audit report generated');
        return report.data;
      } else {
        throw new Error(`SOX audit failed: ${response.status}`);
      }
    } catch (error) {
      log.error(`SOX compliance audit failed: ${error.message}`);
      return false;
    }
  }

  async runRealEstateLicenseValidation() {
    log.info('🏠 Running Real Estate License Validation...');
    
    try {
      const response = await fetch(
        `${this.baseUrl}/api/compliance/real-estate/license-validation`,
        {
          headers: await this.getAuthHeaders()
        }
      );

      if (response.ok) {
        const validation = await response.json();
        log.info(`📋 Licensed Users: ${validation.data?.total_licensed_users || 0}`);
        log.info(`✅ Compliance Status: ${validation.data?.compliance_status || 'Unknown'}`);
        log.success('Real estate license validation completed');
        return validation.data;
      } else {
        throw new Error(`License validation failed: ${response.status}`);
      }
    } catch (error) {
      log.error(`Real estate license validation failed: ${error.message}`);
      return false;
    }
  }

  async enforceDataRetention() {
    log.info('🧹 Enforcing Data Retention Policies...');
    
    try {
      const response = await fetch(
        `${this.baseUrl}/api/compliance/data-retention/enforce`,
        {
          method: 'POST',
          headers: await this.getAuthHeaders()
        }
      );

      if (response.ok) {
        const result = await response.json();
        log.success('Data retention policies enforced');
        return result;
      } else {
        throw new Error(`Data retention enforcement failed: ${response.status}`);
      }
    } catch (error) {
      log.error(`Data retention enforcement failed: ${error.message}`);
      return false;
    }
  }

  async generateComplianceReport() {
    log.info('📊 Generating Comprehensive Compliance Report...');
    
    try {
      const [dashboard, gdprCheck, soxAudit, licenseValidation] = await Promise.all([
        this.getComplianceDashboard(),
        this.runGDPRCompliance(),
        this.runSOXCompliance(),
        this.runRealEstateLicenseValidation()
      ]);

      const report = {
        generated_at: new Date().toISOString(),
        overall_compliance_score: dashboard?.overview?.compliance_score || 'N/A',
        gdpr: {
          status: dashboard?.gdpr?.status || 'Unknown',
          total_requests: dashboard?.gdpr?.total_requests || 0,
          check_passed: !!gdprCheck
        },
        sox: {
          status: dashboard?.sox?.status || 'Unknown',
          total_audits: dashboard?.sox?.total_audits || 0,
          recent_audit: !!soxAudit,
          financial_accesses_last_30d: soxAudit?.total_financial_accesses || 0
        },
        data_retention: {
          status: dashboard?.data_retention?.status || 'Unknown',
          retention_period: dashboard?.data_retention?.retention_period || 'Unknown',
          cleanups_performed: dashboard?.data_retention?.cleanups_performed || 0
        },
        real_estate: {
          licensed_users: licenseValidation?.total_licensed_users || 0,
          compliance_status: licenseValidation?.compliance_status || 'Unknown',
          validation_passed: !!licenseValidation
        },
        recommendations: this.generateRecommendations(dashboard, gdprCheck, soxAudit, licenseValidation)
      };

      // Save report to file
      const reportPath = path.join(process.cwd(), 'compliance-reports');
      if (!fs.existsSync(reportPath)) {
        fs.mkdirSync(reportPath, { recursive: true });
      }

      const filename = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(path.join(reportPath, filename), JSON.stringify(report, null, 2));

      log.success(`Compliance report saved: ${filename}`);
      return report;
    } catch (error) {
      log.error(`Compliance report generation failed: ${error.message}`);
      return false;
    }
  }

  generateRecommendations(dashboard, gdprCheck, soxAudit, licenseValidation) {
    const recommendations = [];

    if (!gdprCheck) {
      recommendations.push('Review GDPR compliance processes and ensure all systems are operational');
    }

    if (!soxAudit || (soxAudit.non_admin_accesses && soxAudit.non_admin_accesses > 0)) {
      recommendations.push('Review SOX financial data access controls and implement stricter admin-only policies');
    }

    if (!licenseValidation) {
      recommendations.push('Implement automated real estate license validation and expiration monitoring');
    }

    if (dashboard?.overview?.compliance_score && dashboard.overview.compliance_score < 90) {
      recommendations.push('Improve overall compliance score by addressing identified gaps');
    }

    if (recommendations.length === 0) {
      recommendations.push('Compliance status is excellent - maintain current practices');
    }

    return recommendations;
  }

  async getComplianceDashboard() {
    try {
      const response = await fetch(`${this.baseUrl}/api/compliance/dashboard`, {
        headers: await this.getAuthHeaders()
      });
      
      if (response.ok) {
        const dashboard = await response.json();
        return dashboard.data;
      }
      return null;
    } catch (error) {
      log.warn(`Dashboard unavailable: ${error.message}`);
      return null;
    }
  }

  async getAuthHeaders() {
    // In a real implementation, this would get a valid admin JWT token
    // For now, return empty headers as auth might not be set up yet
    return {
      'Content-Type': 'application/json',
      'Authorization': process.env.ADMIN_TOKEN ? `Bearer ${process.env.ADMIN_TOKEN}` : ''
    };
  }

  displayHelp() {
    console.log(`
${colors.cyan}AgentRadar Compliance & Governance Manager${colors.reset}

${colors.yellow}Usage:${colors.reset}
  node compliance-governance.js [command]

${colors.yellow}Commands:${colors.reset}
  ${colors.green}init${colors.reset}        Initialize compliance system
  ${colors.green}health${colors.reset}      Check compliance health status
  ${colors.green}gdpr${colors.reset}        Run GDPR compliance checks
  ${colors.green}sox${colors.reset}         Run SOX financial audit
  ${colors.green}licenses${colors.reset}   Validate real estate licenses
  ${colors.green}retention${colors.reset}  Enforce data retention policies
  ${colors.green}report${colors.reset}     Generate comprehensive compliance report
  ${colors.green}dashboard${colors.reset}  View compliance dashboard
  ${colors.green}help${colors.reset}       Show this help message

${colors.yellow}Environment Variables:${colors.reset}
  API_BASE_URL          Base URL for AgentRadar API (default: http://localhost:4000)
  ADMIN_TOKEN           Admin authentication token for API access
  DATA_RETENTION_DAYS   Data retention period in days (default: 2555)

${colors.yellow}Examples:${colors.reset}
  node compliance-governance.js init
  node compliance-governance.js report
  node compliance-governance.js health
    `);
  }
}

// Main execution
async function main() {
  const command = process.argv[2] || 'help';
  const manager = new ComplianceGovernanceManager();

  switch (command.toLowerCase()) {
    case 'init':
    case 'initialize':
      const initialized = await manager.initialize();
      process.exit(initialized ? 0 : 1);
      break;

    case 'health':
    case 'status':
      const health = await manager.checkComplianceHealth();
      if (health) {
        console.log(JSON.stringify(health, null, 2));
      }
      break;

    case 'gdpr':
      const gdprResult = await manager.runGDPRCompliance();
      process.exit(gdprResult ? 0 : 1);
      break;

    case 'sox':
      const soxResult = await manager.runSOXCompliance();
      process.exit(soxResult ? 0 : 1);
      break;

    case 'licenses':
    case 'license':
      const licenseResult = await manager.runRealEstateLicenseValidation();
      process.exit(licenseResult ? 0 : 1);
      break;

    case 'retention':
      const retentionResult = await manager.enforceDataRetention();
      process.exit(retentionResult ? 0 : 1);
      break;

    case 'report':
      const report = await manager.generateComplianceReport();
      if (report) {
        console.log('\n📊 Compliance Report Summary:');
        console.log(`Overall Score: ${report.overall_compliance_score}%`);
        console.log(`GDPR Status: ${report.gdpr.status}`);
        console.log(`SOX Status: ${report.sox.status}`);
        console.log(`Licensed Users: ${report.real_estate.licensed_users}`);
        console.log('\nRecommendations:');
        report.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
      }
      process.exit(report ? 0 : 1);
      break;

    case 'dashboard':
      const dashboard = await manager.getComplianceDashboard();
      if (dashboard) {
        console.log(JSON.stringify(dashboard, null, 2));
      } else {
        log.error('Dashboard unavailable');
        process.exit(1);
      }
      break;

    case 'help':
    case '--help':
    case '-h':
    default:
      manager.displayHelp();
      break;
  }
}

// Handle global errors
process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Run the application
if (require.main === module) {
  main();
}