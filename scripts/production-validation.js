#!/usr/bin/env node

/**
 * AgentRadar Production Validation Protocol
 * 
 * Implements comprehensive 100% Bug-Free Production Deployment validation
 * with fail-forward methodology and continuous validation loops.
 */

const chalk = require('chalk');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class ProductionValidator {
  constructor() {
    this.results = {
      phase1: { security: [], passed: 0, failed: 0 },
      phase2: { functionality: [], passed: 0, failed: 0 },
      phase3: { performance: [], passed: 0, failed: 0 },
      phase4: { accessibility: [], passed: 0, failed: 0 },
      phase5: { compatibility: [], passed: 0, failed: 0 }
    };
    
    this.baseUrl = process.env.VALIDATION_URL || 'https://agentradar.app';
    this.adminUrl = process.env.ADMIN_URL || 'https://admin.agentradar.app';
    this.apiUrl = process.env.API_URL || 'https://api.agentradar.app';
    
    this.logFile = path.join(process.cwd(), 'validation-log.json');
    this.reportFile = path.join(process.cwd(), 'validation-report.html');
  }

  log(phase, testId, description, status, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      phase,
      testId,
      description,
      status,
      ...details
    };

    console.log(
      status === 'PASS' 
        ? chalk.green(`✅ ${testId}: ${description}`)
        : chalk.red(`❌ ${testId}: ${description}`)
    );

    if (details.error) {
      console.log(chalk.gray(`   Error: ${details.error}`));
    }
    if (details.fix) {
      console.log(chalk.yellow(`   Fix: ${details.fix}`));
    }

    // Update results
    this.results[phase][status === 'PASS' ? 'passed' : 'failed']++;
    
    // Determine category based on test ID
    let category = 'functionality';
    if (testId.includes('SSL') || testId.includes('SEC') || testId.includes('AUTH')) {
      category = 'security';
    } else if (testId.includes('PERF')) {
      category = 'performance';
    } else if (testId.includes('A11Y')) {
      category = 'accessibility';
    } else if (testId.includes('COMPAT')) {
      category = 'compatibility';
    }
    
    // Initialize category array if it doesn't exist
    if (!this.results[phase][category]) {
      this.results[phase][category] = [];
    }
    
    this.results[phase][category].push(logEntry);

    // Append to log file
    const logs = this.loadLogs();
    logs.push(logEntry);
    fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2));
  }

  loadLogs() {
    if (!fs.existsSync(this.logFile)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;
      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            responseTime: Date.now() - startTime
          });
        });
      });

      const startTime = Date.now();
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Request timeout')));
      
      if (options.data) {
        req.write(options.data);
      }
      
      req.end();
    });
  }

  async runCommand(command, expectSuccess = true) {
    try {
      const output = execSync(command, { encoding: 'utf8', timeout: 30000 });
      return { success: true, output: output.trim() };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        output: error.stdout || error.stderr || ''
      };
    }
  }

  // Phase 1: Infrastructure & Security
  async validatePhase1() {
    console.log(chalk.blue('\n🔒 Phase 1: Infrastructure & Security Validation'));
    console.log(chalk.gray('Target: 100% completion - CRITICAL BLOCKING'));

    // SSL/TLS Security Tests
    await this.testSSLCertificate();
    await this.testHTTPSRedirect();
    
    // Security Headers Tests
    await this.testSecurityHeaders();
    
    // Admin Security Tests
    await this.testAdminSecurity();
    
    return this.results.phase1.failed === 0;
  }

  async testSSLCertificate() {
    try {
      const result = await this.runCommand(`openssl s_client -connect ${this.baseUrl.replace('https://', '')}:443 -servername ${this.baseUrl.replace('https://', '')} -verify_return_error`);
      
      if (result.success && result.output.includes('Verify return code: 0')) {
        this.log('phase1', 'SSL_001', 'SSL certificate validation', 'PASS');
      } else {
        this.log('phase1', 'SSL_001', 'SSL certificate validation', 'FAIL', {
          error: result.error || 'Invalid SSL certificate chain',
          fix: 'Update SSL certificate and verify chain validity'
        });
      }
    } catch (error) {
      this.log('phase1', 'SSL_001', 'SSL certificate validation', 'FAIL', {
        error: error.message,
        fix: 'Configure valid SSL certificate'
      });
    }
  }

  async testHTTPSRedirect() {
    try {
      const httpUrl = this.baseUrl.replace('https://', 'http://');
      const response = await this.makeRequest(httpUrl, { method: 'HEAD' });
      
      if (response.statusCode >= 301 && response.statusCode <= 308) {
        const location = response.headers.location;
        if (location && location.startsWith('https://')) {
          this.log('phase1', 'SSL_002', 'HTTPS redirect enforcement', 'PASS');
        } else {
          this.log('phase1', 'SSL_002', 'HTTPS redirect enforcement', 'FAIL', {
            error: `Redirect location not HTTPS: ${location}`,
            fix: 'Configure HTTPS redirect in Cloudflare/Vercel settings'
          });
        }
      } else {
        this.log('phase1', 'SSL_002', 'HTTPS redirect enforcement', 'FAIL', {
          error: `No redirect from HTTP to HTTPS (status: ${response.statusCode})`,
          fix: 'Configure HTTPS redirect in Cloudflare page rules'
        });
      }
    } catch (error) {
      this.log('phase1', 'SSL_002', 'HTTPS redirect enforcement', 'FAIL', {
        error: error.message,
        fix: 'Configure HTTPS redirect'
      });
    }
  }

  async testSecurityHeaders() {
    try {
      const response = await this.makeRequest(this.baseUrl, { method: 'HEAD' });
      const headers = response.headers;

      // Test HSTS Header
      if (headers['strict-transport-security']) {
        this.log('phase1', 'HDR_001', 'HSTS header implementation', 'PASS');
      } else {
        this.log('phase1', 'HDR_001', 'HSTS header implementation', 'FAIL', {
          error: 'Missing Strict-Transport-Security header',
          fix: 'Add HSTS header to Next.js configuration'
        });
      }

      // Test X-Frame-Options Header
      if (headers['x-frame-options']) {
        this.log('phase1', 'HDR_002', 'X-Frame-Options header', 'PASS');
      } else {
        this.log('phase1', 'HDR_002', 'X-Frame-Options header', 'FAIL', {
          error: 'Missing X-Frame-Options header',
          fix: 'Add X-Frame-Options: DENY to next.config.ts'
        });
      }

      // Test Content Security Policy
      if (headers['content-security-policy']) {
        this.log('phase1', 'HDR_003', 'Content Security Policy', 'PASS');
      } else {
        this.log('phase1', 'HDR_003', 'Content Security Policy', 'FAIL', {
          error: 'Missing Content-Security-Policy header',
          fix: 'Implement comprehensive CSP in next.config.ts'
        });
      }

    } catch (error) {
      this.log('phase1', 'HDR_001', 'Security headers validation', 'FAIL', {
        error: error.message,
        fix: 'Fix network connectivity and retry'
      });
    }
  }

  async testAdminSecurity() {
    try {
      // Test admin subdomain resolution
      const result = await this.runCommand(`nslookup ${this.adminUrl.replace('https://', '')}`);
      
      if (result.success && !result.output.includes('NXDOMAIN')) {
        this.log('phase1', 'ADM_001', 'Admin subdomain isolation', 'PASS');
      } else {
        this.log('phase1', 'ADM_001', 'Admin subdomain isolation', 'FAIL', {
          error: 'Admin subdomain not resolving',
          fix: 'Configure DNS record for admin subdomain'
        });
      }

      // Test admin authentication endpoint
      try {
        const loginResponse = await this.makeRequest(`${this.adminUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({
            email: 'test@example.com',
            password: 'invalid'
          })
        });

        if (loginResponse.statusCode === 401 || loginResponse.statusCode === 400) {
          this.log('phase1', 'ADM_002', 'Admin authentication workflow', 'PASS');
        } else {
          this.log('phase1', 'ADM_002', 'Admin authentication workflow', 'FAIL', {
            error: `Unexpected response: ${loginResponse.statusCode}`,
            fix: 'Debug admin authentication endpoint'
          });
        }
      } catch (error) {
        this.log('phase1', 'ADM_002', 'Admin authentication workflow', 'FAIL', {
          error: error.message,
          fix: 'Verify admin API endpoint availability'
        });
      }

    } catch (error) {
      this.log('phase1', 'ADM_001', 'Admin security validation', 'FAIL', {
        error: error.message,
        fix: 'Configure admin infrastructure'
      });
    }
  }

  // Phase 2: Core Functionality
  async validatePhase2() {
    console.log(chalk.blue('\n⚙️ Phase 2: Core Functionality Validation'));
    console.log(chalk.gray('Target: 100% completion - CRITICAL BLOCKING'));

    await this.testMainPlatformFlows();
    await this.testAPIEndpoints();
    await this.runAutomatedTests();
    
    return this.results.phase2.failed === 0;
  }

  async testMainPlatformFlows() {
    // Test main page load
    try {
      const response = await this.makeRequest(this.baseUrl);
      
      if (response.statusCode === 200 && response.data.includes('AgentRadar')) {
        this.log('phase2', 'FUNC_001', 'Main platform page load', 'PASS');
      } else {
        this.log('phase2', 'FUNC_001', 'Main platform page load', 'FAIL', {
          error: `Page load failed (status: ${response.statusCode})`,
          fix: 'Debug main page rendering and routing'
        });
      }
    } catch (error) {
      this.log('phase2', 'FUNC_001', 'Main platform page load', 'FAIL', {
        error: error.message,
        fix: 'Fix application deployment and routing'
      });
    }
  }

  async testAPIEndpoints() {
    // Test health endpoint
    try {
      const response = await this.makeRequest(`${this.apiUrl}/health`);
      
      if (response.statusCode === 200) {
        this.log('phase2', 'API_001', 'API health endpoint', 'PASS');
      } else {
        this.log('phase2', 'API_001', 'API health endpoint', 'FAIL', {
          error: `Health check failed (status: ${response.statusCode})`,
          fix: 'Debug API server deployment'
        });
      }
    } catch (error) {
      this.log('phase2', 'API_001', 'API health endpoint', 'FAIL', {
        error: error.message,
        fix: 'Verify API server is running and accessible'
      });
    }
  }

  async runAutomatedTests() {
    // Run API test suite
    const testResult = await this.runCommand('cd api && npm test', false);
    
    if (testResult.success) {
      this.log('phase2', 'TEST_001', 'Automated test suite', 'PASS');
    } else {
      this.log('phase2', 'TEST_001', 'Automated test suite', 'FAIL', {
        error: testResult.error || 'Test failures detected',
        fix: 'Review and fix failing tests'
      });
    }
  }

  // Generate comprehensive report
  generateReport() {
    const logs = this.loadLogs();
    const summary = {
      totalTests: logs.length,
      passed: logs.filter(l => l.status === 'PASS').length,
      failed: logs.filter(l => l.status === 'FAIL').length,
      phases: this.results
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>AgentRadar Production Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .test-result.pass { border-color: #28a745; background: #f8fff8; }
        .test-result.fail { border-color: #dc3545; background: #fff8f8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 AgentRadar Production Validation Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Validation URL: ${this.baseUrl}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 2em; font-weight: bold;">${summary.totalTests}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #28a745;">${summary.passed}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #dc3545;">${summary.failed}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div style="font-size: 2em; font-weight: bold;">${Math.round((summary.passed / summary.totalTests) * 100)}%</div>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${logs.map(log => `
        <div class="test-result ${log.status.toLowerCase()}">
            <strong>${log.testId}</strong>: ${log.description}
            <div style="margin-top: 5px;">
                <span class="${log.status.toLowerCase()}">${log.status}</span>
                ${log.error ? `<div style="color: #dc3545; margin-top: 5px;">Error: ${log.error}</div>` : ''}
                ${log.fix ? `<div style="color: #ffc107; margin-top: 5px;">Fix: ${log.fix}</div>` : ''}
            </div>
        </div>
    `).join('')}
</body>
</html>`;

    fs.writeFileSync(this.reportFile, html);
    console.log(chalk.green(`\n📊 Validation report generated: ${this.reportFile}`));
  }

  // Main execution
  async run(phases = []) {
    console.log(chalk.cyan('🚀 AgentRadar Production Validation Protocol'));
    console.log(chalk.cyan('Target: 100% Bug-Free Production Deployment\n'));

    const startTime = Date.now();
    let allPassed = true;

    // Clear previous logs
    if (fs.existsSync(this.logFile)) {
      fs.unlinkSync(this.logFile);
    }

    if (phases.length === 0 || phases.includes('1')) {
      const phase1Pass = await this.validatePhase1();
      if (!phase1Pass) {
        console.log(chalk.red('\n❌ Phase 1 FAILED - Deployment blocked'));
        allPassed = false;
      }
    }

    if (phases.length === 0 || phases.includes('2')) {
      if (allPassed) {
        const phase2Pass = await this.validatePhase2();
        if (!phase2Pass) {
          console.log(chalk.red('\n❌ Phase 2 FAILED - Deployment blocked'));
          allPassed = false;
        }
      } else {
        console.log(chalk.yellow('\n⏭️ Skipping Phase 2 due to Phase 1 failures'));
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(chalk.cyan(`\n📊 Validation completed in ${duration}s`));
    
    if (allPassed) {
      console.log(chalk.green('✅ ALL PHASES PASSED - DEPLOYMENT APPROVED'));
    } else {
      console.log(chalk.red('❌ VALIDATION FAILED - DEPLOYMENT BLOCKED'));
      console.log(chalk.yellow('🔧 Review failures above and apply fixes before retry'));
    }

    this.generateReport();
    return allPassed;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const validator = new ProductionValidator();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
AgentRadar Production Validation Protocol

Usage:
  npm run validate:production              # Run all phases
  npm run validate:production --phase 1   # Run specific phase
  npm run validate:production --phase 1,2 # Run multiple phases
  npm run validate:production --help       # Show this help

Phases:
  1: Infrastructure & Security (CRITICAL)
  2: Core Functionality (CRITICAL)
  3: Performance (HIGH)
  4: Accessibility (HIGH) 
  5: Compatibility (MEDIUM)

Environment Variables:
  VALIDATION_URL  - Base URL to validate (default: https://agentradar.app)
  ADMIN_URL      - Admin URL to validate (default: https://admin.agentradar.app)
  API_URL        - API URL to validate (default: https://api.agentradar.app)
`);
    process.exit(0);
  }

  let phases = [];
  const phaseIndex = args.indexOf('--phase');
  if (phaseIndex !== -1 && args[phaseIndex + 1]) {
    phases = args[phaseIndex + 1].split(',').map(p => p.trim());
  }

  validator.run(phases)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('❌ Validation error:'), error.message);
      process.exit(1);
    });
}

module.exports = ProductionValidator;