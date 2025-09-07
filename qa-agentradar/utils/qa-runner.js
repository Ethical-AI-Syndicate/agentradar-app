const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AgentRadarQARunner {
  constructor() {
    this.baseURL = 'https://agentradar.app';
    this.adminURL = 'https://admin.agentradar.app';
    this.results = {
      summary: {},
      security: {},
      performance: {},
      accessibility: {},
      links: {},
      functionality: {},
      crossBrowser: {}
    };
  }

  async runSecurityAudit() {
    console.log('🔒 Running Security Audit...');
    
    const securityResults = {
      https: true,
      hsts: false,
      headers: {},
      mixedContent: false,
      sensitiveDataExposure: false
    };

    try {
      // Check HTTPS headers
      const curlOutput = execSync(`curl -I ${this.baseURL}`, { encoding: 'utf-8' });
      const headers = curlOutput.split('\n').reduce((acc, line) => {
        const [key, value] = line.split(': ');
        if (key && value) acc[key.toLowerCase()] = value.trim();
        return acc;
      }, {});

      securityResults.headers = headers;
      securityResults.hsts = !!headers['strict-transport-security'];
      
      // Check admin subdomain
      const adminCurlOutput = execSync(`curl -I ${this.adminURL}`, { encoding: 'utf-8' });
      const adminStatus = adminCurlOutput.includes('200') ? 'accessible' : 'restricted';
      securityResults.adminAccess = adminStatus;

    } catch (error) {
      console.error('Security audit error:', error.message);
    }

    this.results.security = securityResults;
    return securityResults;
  }

  async runLinkValidation() {
    console.log('🔗 Running Link Validation...');
    
    const linkResults = {
      internalLinks: { tested: 0, passed: 0, failed: 0 },
      externalLinks: { tested: 0, passed: 0, failed: 0 },
      anchorLinks: { tested: 0, passed: 0, failed: 0 }
    };

    // Simulate link checking (would normally use linkinator or similar)
    const commonLinks = [
      '/',
      '/#features',
      '/#pricing',
      '/#faq'
    ];

    for (const link of commonLinks) {
      try {
        const fullURL = `${this.baseURL}${link}`;
        const response = execSync(`curl -o /dev/null -s -w "%{http_code}" "${fullURL}"`, { encoding: 'utf-8' });
        const statusCode = parseInt(response.trim());
        
        linkResults.internalLinks.tested++;
        if (statusCode >= 200 && statusCode < 400) {
          linkResults.internalLinks.passed++;
        } else {
          linkResults.internalLinks.failed++;
        }
      } catch (error) {
        linkResults.internalLinks.tested++;
        linkResults.internalLinks.failed++;
      }
    }

    this.results.links = linkResults;
    return linkResults;
  }

  async runPerformanceAudit() {
    console.log('⚡ Running Performance Audit...');
    
    const performanceResults = {
      loadTime: null,
      responseTime: null,
      pageSize: null,
      cacheHeaders: false
    };

    try {
      // Measure response time
      const startTime = Date.now();
      execSync(`curl -o /dev/null -s "${this.baseURL}"`);
      const endTime = Date.now();
      
      performanceResults.responseTime = endTime - startTime;
      performanceResults.loadTime = performanceResults.responseTime; // Simplified
      
      // Check cache headers
      const headers = execSync(`curl -I ${this.baseURL}`, { encoding: 'utf-8' });
      performanceResults.cacheHeaders = headers.includes('cache-control') || headers.includes('expires');
      
    } catch (error) {
      console.error('Performance audit error:', error.message);
    }

    this.results.performance = performanceResults;
    return performanceResults;
  }

  async generateSummaryReport() {
    const timestamp = new Date().toISOString();
    
    const summary = {
      timestamp,
      testSuite: 'AgentRadar Comprehensive QA',
      baseURL: this.baseURL,
      adminURL: this.adminURL,
      overallStatus: 'COMPLETED',
      criticalIssues: [],
      recommendations: []
    };

    // Analyze results and generate recommendations
    if (this.results.security.hsts) {
      summary.recommendations.push('✅ HSTS is properly configured');
    } else {
      summary.criticalIssues.push('❌ HSTS header missing');
      summary.recommendations.push('🔧 Add HSTS header for enhanced security');
    }

    if (this.results.performance.responseTime < 2000) {
      summary.recommendations.push('✅ Good response time performance');
    } else {
      summary.recommendations.push('⚠️ Consider optimizing response times');
    }

    if (this.results.links.internalLinks.failed === 0) {
      summary.recommendations.push('✅ All internal links working correctly');
    } else {
      summary.criticalIssues.push(`❌ ${this.results.links.internalLinks.failed} broken internal links`);
    }

    // Admin subdomain analysis
    if (this.results.security.adminAccess === 'accessible') {
      summary.recommendations.push('✅ Admin subdomain is accessible and routing correctly');
    }

    this.results.summary = summary;
    return summary;
  }

  async runFullAudit() {
    console.log('🚀 Starting Comprehensive QA Audit for AgentRadar...\n');
    
    await this.runSecurityAudit();
    await this.runLinkValidation();  
    await this.runPerformanceAudit();
    const summary = await this.generateSummaryReport();
    
    console.log('\n📊 QA AUDIT COMPLETE');
    console.log('='.repeat(50));
    console.log(`Timestamp: ${summary.timestamp}`);
    console.log(`Base URL: ${summary.baseURL}`);
    console.log(`Admin URL: ${summary.adminURL}`);
    console.log('\n🔍 CRITICAL ISSUES:');
    summary.criticalIssues.forEach(issue => console.log(`  ${issue}`));
    console.log('\n💡 RECOMMENDATIONS:');
    summary.recommendations.forEach(rec => console.log(`  ${rec}`));
    
    // Write detailed report
    const reportPath = path.join(__dirname, '../reports/qa-audit-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    return this.results;
  }
}

module.exports = AgentRadarQARunner;

// If run directly
if (require.main === module) {
  const qaRunner = new AgentRadarQARunner();
  qaRunner.runFullAudit().catch(console.error);
}