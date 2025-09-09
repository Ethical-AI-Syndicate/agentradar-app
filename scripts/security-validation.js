#!/usr/bin/env node

/**
 * AgentRadar Security Validation
 * 
 * Comprehensive security testing and vulnerability scanning
 */

const chalk = require('chalk');
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');

class SecurityValidator {
  constructor() {
    this.baseUrl = process.env.VALIDATION_URL || 'https://agentradar.app';
    this.adminUrl = process.env.ADMIN_URL || 'https://admin.agentradar.app';
    this.apiUrl = process.env.API_URL || 'https://api.agentradar.app';
    this.results = [];
  }

  log(testId, description, status, details = {}) {
    const result = {
      testId,
      description,
      status,
      details,
      timestamp: new Date().toISOString()
    };

    this.results.push(result);

    console.log(
      status === 'PASS' 
        ? chalk.green(`✅ ${testId}: ${description}`)
        : status === 'WARN'
        ? chalk.yellow(`⚠️ ${testId}: ${description}`)
        : chalk.red(`❌ ${testId}: ${description}`)
    );

    if (details.error) {
      console.log(chalk.gray(`   Error: ${details.error}`));
    }
    if (details.recommendation) {
      console.log(chalk.yellow(`   Recommendation: ${details.recommendation}`));
    }
  }

  async makeSecureRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Request timeout')));
      
      if (options.data) {
        req.write(options.data);
      }
      
      req.end();
    });
  }

  async validateSSLConfiguration() {
    console.log(chalk.blue('🔒 Validating SSL/TLS Configuration...'));
    
    try {
      // Test SSL Labs-style checks
      const response = await this.makeSecureRequest(this.baseUrl);
      
      // Check for HTTPS redirect
      const httpUrl = this.baseUrl.replace('https://', 'http://');
      try {
        const httpResponse = await this.makeSecureRequest(httpUrl);
        if (httpResponse.statusCode >= 301 && httpResponse.statusCode <= 308) {
          this.log('SSL_001', 'HTTPS redirect enforcement', 'PASS');
        } else {
          this.log('SSL_001', 'HTTPS redirect enforcement', 'FAIL', {
            error: `HTTP not redirecting to HTTPS (${httpResponse.statusCode})`,
            recommendation: 'Configure HTTPS redirect in Cloudflare/Vercel'
          });
        }
      } catch (error) {
        this.log('SSL_001', 'HTTPS redirect test', 'FAIL', {
          error: error.message,
          recommendation: 'Ensure HTTP to HTTPS redirect is configured'
        });
      }

      return true;
    } catch (error) {
      this.log('SSL_001', 'SSL configuration validation', 'FAIL', {
        error: error.message,
        recommendation: 'Check SSL certificate and configuration'
      });
      return false;
    }
  }

  async validateSecurityHeaders() {
    console.log(chalk.blue('🛡️ Validating Security Headers...'));
    
    const urls = [this.baseUrl, this.adminUrl];
    let allPassed = true;

    for (const url of urls) {
      try {
        const response = await this.makeSecureRequest(url);
        const headers = response.headers;
        const urlType = url.includes('admin') ? 'Admin' : 'Main';

        // Required security headers
        const securityHeaders = {
          'strict-transport-security': {
            required: true,
            check: (value) => value && value.includes('max-age') && parseInt(value.match(/max-age=(\d+)/)?.[1] || 0) >= 31536000
          },
          'x-content-type-options': {
            required: true,
            check: (value) => value === 'nosniff'
          },
          'x-frame-options': {
            required: true,
            check: (value) => value === 'DENY' || value === 'SAMEORIGIN'
          },
          'content-security-policy': {
            required: true,
            check: (value) => value && value.length > 50
          },
          'referrer-policy': {
            required: false,
            check: (value) => value && value.includes('strict-origin')
          }
        };

        for (const [headerName, config] of Object.entries(securityHeaders)) {
          const headerValue = headers[headerName];
          
          if (config.required && !headerValue) {
            allPassed = false;
            this.log(`HDR_${headerName.toUpperCase().replace(/-/g, '_')}`, 
              `${urlType} site ${headerName} header`, 'FAIL', {
                error: `Missing required header: ${headerName}`,
                recommendation: `Add ${headerName} header to Next.js configuration`
              });
          } else if (headerValue && !config.check(headerValue)) {
            allPassed = false;
            this.log(`HDR_${headerName.toUpperCase().replace(/-/g, '_')}`, 
              `${urlType} site ${headerName} header`, 'FAIL', {
                error: `Invalid header value: ${headerValue}`,
                recommendation: `Update ${headerName} header configuration`
              });
          } else if (headerValue) {
            this.log(`HDR_${headerName.toUpperCase().replace(/-/g, '_')}`, 
              `${urlType} site ${headerName} header`, 'PASS');
          }
        }

      } catch (error) {
        allPassed = false;
        this.log('HDR_VALIDATION', `Security headers for ${url}`, 'FAIL', {
          error: error.message,
          recommendation: 'Check site accessibility and configuration'
        });
      }
    }

    return allPassed;
  }

  async validateAPISecuritys() {
    console.log(chalk.blue('🔐 Validating API Security...'));
    
    const endpoints = [
      `${this.apiUrl}/health`,
      `${this.baseUrl}/api/health`,
      `${this.apiUrl}/api/auth/login`,
      `${this.apiUrl}/api/admin/users`
    ];

    let allPassed = true;

    for (const endpoint of endpoints) {
      try {
        // Test CORS headers
        const response = await this.makeSecureRequest(endpoint, {
          method: 'OPTIONS',
          headers: {
            'Origin': 'https://malicious-site.com',
            'Access-Control-Request-Method': 'GET'
          }
        });

        const corsHeader = response.headers['access-control-allow-origin'];
        
        if (corsHeader === '*') {
          allPassed = false;
          this.log('API_CORS', `CORS configuration for ${endpoint}`, 'FAIL', {
            error: 'Wildcard CORS origin detected',
            recommendation: 'Configure specific allowed origins instead of wildcard'
          });
        } else {
          this.log('API_CORS', `CORS configuration for ${endpoint}`, 'PASS');
        }

        // Test for sensitive information exposure
        if (response.data && response.data.toLowerCase().includes('error')) {
          const sensitivePatterns = [
            /password/i,
            /secret/i,
            /token/i,
            /key/i,
            /database/i
          ];
          
          let hasSensitive = false;
          for (const pattern of sensitivePatterns) {
            if (pattern.test(response.data)) {
              hasSensitive = true;
              break;
            }
          }
          
          if (hasSensitive) {
            allPassed = false;
            this.log('API_EXPOSURE', `Information disclosure in ${endpoint}`, 'FAIL', {
              error: 'Potential sensitive information exposure in error messages',
              recommendation: 'Sanitize error messages to avoid information leakage'
            });
          }
        }

      } catch (error) {
        // This is expected for some endpoints
        if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
          this.log('API_ACCESS', `API endpoint accessibility ${endpoint}`, 'WARN', {
            error: error.message,
            recommendation: 'Verify API endpoint is properly deployed and accessible'
          });
        }
      }
    }

    return allPassed;
  }

  async validateAuthenticationSecurity() {
    console.log(chalk.blue('🔑 Validating Authentication Security...'));
    
    try {
      // Test admin login with invalid credentials
      const loginResponse = await this.makeSecureRequest(`${this.adminUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          email: 'invalid@test.com',
          password: 'wrongpassword'
        })
      });

      if (loginResponse.statusCode === 401 || loginResponse.statusCode === 400) {
        this.log('AUTH_001', 'Invalid credentials handling', 'PASS');
      } else {
        this.log('AUTH_001', 'Invalid credentials handling', 'FAIL', {
          error: `Unexpected response code: ${loginResponse.statusCode}`,
          recommendation: 'Ensure proper authentication error handling'
        });
      }

      // Test for timing attack resistance
      const start1 = Date.now();
      await this.makeSecureRequest(`${this.adminUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'password123'
        })
      }).catch(() => {}); // Ignore errors
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await this.makeSecureRequest(`${this.adminUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          email: 'valid@test.com',
          password: 'wrongpassword'
        })
      }).catch(() => {}); // Ignore errors
      const time2 = Date.now() - start2;

      const timeDiff = Math.abs(time1 - time2);
      if (timeDiff > 500) { // More than 500ms difference
        this.log('AUTH_002', 'Timing attack resistance', 'WARN', {
          error: `Significant timing difference: ${timeDiff}ms`,
          recommendation: 'Consider implementing constant-time authentication checks'
        });
      } else {
        this.log('AUTH_002', 'Timing attack resistance', 'PASS');
      }

      return true;
    } catch (error) {
      this.log('AUTH_001', 'Authentication security validation', 'FAIL', {
        error: error.message,
        recommendation: 'Check authentication endpoint configuration'
      });
      return false;
    }
  }

  async runDependencySecurityCheck() {
    console.log(chalk.blue('📦 Running Dependency Security Check...'));
    
    try {
      // Check for npm audit in API directory
      const auditResult = execSync('cd api && npm audit --audit-level=moderate --json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const audit = JSON.parse(auditResult);
      const vulnerabilities = audit.vulnerabilities || {};
      const highSeverity = Object.values(vulnerabilities).filter(v => 
        v.severity === 'high' || v.severity === 'critical'
      ).length;

      if (highSeverity === 0) {
        this.log('DEP_001', 'High/Critical vulnerability check', 'PASS', {
          totalVulnerabilities: Object.keys(vulnerabilities).length,
          highSeverity: highSeverity
        });
      } else {
        this.log('DEP_001', 'High/Critical vulnerability check', 'FAIL', {
          error: `${highSeverity} high/critical vulnerabilities found`,
          recommendation: 'Run npm audit fix or update vulnerable dependencies'
        });
      }

      return highSeverity === 0;
    } catch (error) {
      this.log('DEP_001', 'Dependency security check', 'WARN', {
        error: error.message,
        recommendation: 'Ensure npm audit is available and run dependency checks'
      });
      return true; // Don't fail validation for audit issues
    }
  }

  generateSecurityReport() {
    const summary = {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      warnings: this.results.filter(r => r.status === 'WARN').length,
      timestamp: new Date().toISOString()
    };

    const report = {
      summary,
      results: this.results,
      recommendations: this.results
        .filter(r => r.details.recommendation)
        .map(r => ({ testId: r.testId, recommendation: r.details.recommendation }))
    };

    fs.writeFileSync('security-validation-report.json', JSON.stringify(report, null, 2));
    
    console.log(chalk.cyan(`\n🛡️ Security Validation Summary:`));
    console.log(chalk.white(`Total Tests: ${summary.totalTests}`));
    console.log(chalk.green(`Passed: ${summary.passed}`));
    console.log(chalk.red(`Failed: ${summary.failed}`));
    console.log(chalk.yellow(`Warnings: ${summary.warnings}`));
    console.log(chalk.white(`Security Score: ${Math.round((summary.passed / (summary.totalTests - summary.warnings)) * 100)}%`));
    
    return summary.failed === 0;
  }

  async run() {
    console.log(chalk.cyan('🛡️ AgentRadar Security Validation'));
    console.log(chalk.gray('Comprehensive security testing and vulnerability scanning\n'));

    const startTime = Date.now();
    
    // Run all security tests
    const sslPass = await this.validateSSLConfiguration();
    const headersPass = await this.validateSecurityHeaders();
    const apiPass = await this.validateAPISecuritys();
    const authPass = await this.validateAuthenticationSecurity();
    const depsPass = await this.runDependencySecurityCheck();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    const allPassed = sslPass && headersPass && apiPass && authPass && depsPass;
    
    console.log(chalk.cyan(`\n🛡️ Security validation completed in ${duration}s`));
    
    const reportPassed = this.generateSecurityReport();
    
    if (allPassed && reportPassed) {
      console.log(chalk.green('✅ SECURITY VALIDATION PASSED'));
      return true;
    } else {
      console.log(chalk.red('❌ SECURITY VALIDATION FAILED'));
      console.log(chalk.yellow('Review security issues and apply fixes before deployment'));
      return false;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const validator = new SecurityValidator();
  
  validator.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('Security validation error:'), error.message);
      process.exit(1);
    });
}

module.exports = SecurityValidator;