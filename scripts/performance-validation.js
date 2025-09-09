#!/usr/bin/env node

/**
 * AgentRadar Performance Validation
 * 
 * Validates Core Web Vitals, response times, and optimization metrics
 */

const chalk = require('chalk');
const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');

class PerformanceValidator {
  constructor() {
    this.baseUrl = process.env.VALIDATION_URL || 'https://agentradar.app';
    this.apiUrl = process.env.API_URL || 'https://api.agentradar.app';
    this.results = [];
  }

  log(testId, description, status, metrics = {}) {
    const result = {
      testId,
      description,
      status,
      metrics,
      timestamp: new Date().toISOString()
    };

    this.results.push(result);

    console.log(
      status === 'PASS' 
        ? chalk.green(`✅ ${testId}: ${description}`)
        : chalk.red(`❌ ${testId}: ${description}`)
    );

    if (Object.keys(metrics).length > 0) {
      console.log(chalk.gray(`   Metrics: ${JSON.stringify(metrics, null, 2)}`));
    }
  }

  async measureResponseTime(url) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const req = https.request(url, { method: 'GET' }, (res) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            responseTime,
            statusCode: res.statusCode,
            headers: res.headers,
            contentLength: data.length
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Request timeout')));
      req.end();
    });
  }

  async runLighthouseAudit() {
    try {
      console.log(chalk.blue('🔍 Running Lighthouse performance audit...'));
      
      const lighthouseCmd = `npx lighthouse ${this.baseUrl} --output=json --output-path=lighthouse-report.json --chrome-flags="--headless" --quiet`;
      
      execSync(lighthouseCmd, { stdio: 'pipe' });
      
      const report = JSON.parse(fs.readFileSync('lighthouse-report.json', 'utf8'));
      const metrics = {
        performanceScore: Math.round(report.lhr.categories.performance.score * 100),
        lcp: report.lhr.audits['largest-contentful-paint'].numericValue,
        fid: report.lhr.audits['max-potential-fid'].numericValue,
        cls: report.lhr.audits['cumulative-layout-shift'].numericValue,
        fcp: report.lhr.audits['first-contentful-paint'].numericValue,
        tti: report.lhr.audits['interactive'].numericValue
      };

      // Evaluate against targets
      const targets = {
        performanceScore: 90,
        lcp: 2500, // 2.5 seconds
        fid: 100,  // 100ms
        cls: 0.1,  // 0.1
        fcp: 1800, // 1.8 seconds
        tti: 3800  // 3.8 seconds
      };

      let passed = true;
      const failures = [];

      if (metrics.performanceScore < targets.performanceScore) {
        passed = false;
        failures.push(`Performance score ${metrics.performanceScore} < ${targets.performanceScore}`);
      }
      
      if (metrics.lcp > targets.lcp) {
        passed = false;
        failures.push(`LCP ${Math.round(metrics.lcp)}ms > ${targets.lcp}ms`);
      }
      
      if (metrics.fid > targets.fid) {
        passed = false;
        failures.push(`FID ${Math.round(metrics.fid)}ms > ${targets.fid}ms`);
      }
      
      if (metrics.cls > targets.cls) {
        passed = false;
        failures.push(`CLS ${metrics.cls.toFixed(3)} > ${targets.cls}`);
      }

      this.log('PERF_001', 'Lighthouse Core Web Vitals', passed ? 'PASS' : 'FAIL', {
        ...metrics,
        failures: failures
      });

      // Clean up report file
      if (fs.existsSync('lighthouse-report.json')) {
        fs.unlinkSync('lighthouse-report.json');
      }

      return passed;
    } catch (error) {
      this.log('PERF_001', 'Lighthouse performance audit', 'FAIL', {
        error: error.message,
        fix: 'Install Lighthouse and ensure site is accessible'
      });
      return false;
    }
  }

  async validateAPIResponseTimes() {
    console.log(chalk.blue('⚡ Validating API response times...'));
    
    const endpoints = [
      `${this.apiUrl}/health`,
      `${this.baseUrl}/api/health`,
      `${this.baseUrl}/`
    ];

    let allPassed = true;

    for (const endpoint of endpoints) {
      try {
        const result = await this.measureResponseTime(endpoint);
        const passed = result.responseTime < 500; // 500ms target
        
        if (!passed) allPassed = false;

        this.log(
          `API_PERF_${endpoint.split('/').pop() || 'root'}`, 
          `Response time for ${endpoint}`, 
          passed ? 'PASS' : 'FAIL',
          {
            responseTime: `${result.responseTime}ms`,
            statusCode: result.statusCode,
            contentLength: result.contentLength
          }
        );
      } catch (error) {
        allPassed = false;
        this.log(
          `API_PERF_${endpoint.split('/').pop() || 'root'}`, 
          `Response time for ${endpoint}`, 
          'FAIL',
          { error: error.message }
        );
      }
    }

    return allPassed;
  }

  async validateCaching() {
    console.log(chalk.blue('🗄️ Validating caching configuration...'));
    
    try {
      const result = await this.measureResponseTime(this.baseUrl);
      const cacheHeaders = result.headers;
      
      let passed = true;
      const issues = [];
      
      // Check for cache-control header
      if (!cacheHeaders['cache-control']) {
        passed = false;
        issues.push('Missing cache-control header');
      }
      
      // Check for ETag or Last-Modified
      if (!cacheHeaders['etag'] && !cacheHeaders['last-modified']) {
        passed = false;
        issues.push('Missing ETag or Last-Modified header');
      }
      
      // Check for Cloudflare caching
      const cfCacheStatus = cacheHeaders['cf-cache-status'];
      if (cfCacheStatus && cfCacheStatus !== 'HIT' && cfCacheStatus !== 'MISS') {
        issues.push(`Cloudflare cache status: ${cfCacheStatus}`);
      }

      this.log('CACHE_001', 'Caching optimization', passed ? 'PASS' : 'FAIL', {
        cacheControl: cacheHeaders['cache-control'],
        etag: cacheHeaders['etag'],
        cfCacheStatus: cfCacheStatus,
        issues: issues
      });

      return passed;
    } catch (error) {
      this.log('CACHE_001', 'Caching validation', 'FAIL', {
        error: error.message
      });
      return false;
    }
  }

  async validateResourceOptimization() {
    console.log(chalk.blue('📦 Validating resource optimization...'));
    
    try {
      const result = await this.measureResponseTime(this.baseUrl);
      const headers = result.headers;
      
      let passed = true;
      const optimizations = [];
      
      // Check for compression
      const encoding = headers['content-encoding'];
      if (encoding && (encoding.includes('gzip') || encoding.includes('br'))) {
        optimizations.push(`Compression: ${encoding}`);
      } else {
        passed = false;
        optimizations.push('Missing compression');
      }
      
      // Check content type
      const contentType = headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        optimizations.push(`Content-Type: ${contentType}`);
      }
      
      // Estimate bundle size from content length
      const contentLength = parseInt(headers['content-length'] || '0');
      if (contentLength > 1024 * 1024) { // 1MB
        optimizations.push(`Large content size: ${Math.round(contentLength / 1024)}KB`);
      }

      this.log('OPT_001', 'Resource optimization', passed ? 'PASS' : 'FAIL', {
        contentLength: `${Math.round(contentLength / 1024)}KB`,
        encoding: encoding || 'none',
        optimizations: optimizations
      });

      return passed;
    } catch (error) {
      this.log('OPT_001', 'Resource optimization validation', 'FAIL', {
        error: error.message
      });
      return false;
    }
  }

  generateReport() {
    const summary = {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      timestamp: new Date().toISOString()
    };

    const report = {
      summary,
      results: this.results
    };

    fs.writeFileSync('performance-validation-report.json', JSON.stringify(report, null, 2));
    
    console.log(chalk.cyan(`\n📊 Performance Validation Summary:`));
    console.log(chalk.white(`Total Tests: ${summary.totalTests}`));
    console.log(chalk.green(`Passed: ${summary.passed}`));
    console.log(chalk.red(`Failed: ${summary.failed}`));
    console.log(chalk.white(`Success Rate: ${Math.round((summary.passed / summary.totalTests) * 100)}%`));
    
    return summary.failed === 0;
  }

  async run() {
    console.log(chalk.cyan('⚡ AgentRadar Performance Validation'));
    console.log(chalk.gray('Validating Core Web Vitals and optimization metrics\n'));

    const startTime = Date.now();
    
    // Run all performance tests
    const lighthousePass = await this.runLighthouseAudit();
    const apiPass = await this.validateAPIResponseTimes();
    const cachePass = await this.validateCaching();
    const optimizationPass = await this.validateResourceOptimization();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    const allPassed = lighthousePass && apiPass && cachePass && optimizationPass;
    
    console.log(chalk.cyan(`\n⚡ Performance validation completed in ${duration}s`));
    
    const reportPassed = this.generateReport();
    
    if (allPassed && reportPassed) {
      console.log(chalk.green('✅ PERFORMANCE VALIDATION PASSED'));
      return true;
    } else {
      console.log(chalk.red('❌ PERFORMANCE VALIDATION FAILED'));
      console.log(chalk.yellow('Review performance metrics and optimize before deployment'));
      return false;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const validator = new PerformanceValidator();
  
  validator.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('Performance validation error:'), error.message);
      process.exit(1);
    });
}

module.exports = PerformanceValidator;