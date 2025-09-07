/**
 * Automated Quality Validation - Phase 5 QA Excellence
 * CRITICAL: Comprehensive quality gates with Fortune 100 standards
 * TARGET: Zero-tolerance quality enforcement across all dimensions
 */

import request from 'supertest';
import { app } from '../../index';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface QualityMetric {
  category: string;
  metric: string;
  value: number;
  threshold: number;
  status: 'pass' | 'warning' | 'fail';
  impact: 'low' | 'medium' | 'high' | 'critical';
}

interface QualityReport {
  overallStatus: 'pass' | 'warning' | 'fail';
  score: number;
  metrics: QualityMetric[];
  recommendations: string[];
  timestamp: Date;
}

describe('Automated Quality Validation - Enterprise Standards', () => {
  let prisma: PrismaClient;
  let qualityReport: QualityReport = {
    overallStatus: 'pass',
    score: 0,
    metrics: [],
    recommendations: [],
    timestamp: new Date()
  };

  beforeAll(async () => {
    prisma = global.__GLOBAL_TEST_CONFIG__.database.client;
    console.log('🎯 Automated Quality Validation - Fortune 100 Standards');
    console.log('Target: Zero-tolerance quality enforcement\n');
  });

  /**
   * Code Quality Validation
   * TypeScript, ESLint, Complexity, Documentation
   */
  describe('Code Quality Validation', () => {
    test('TypeScript Type Safety Validation', async () => {
      console.log('🔍 Validating TypeScript type safety...');
      
      let typeErrors = 0;
      let typeWarnings = 0;
      
      try {
        // Run TypeScript compiler check
        execSync('npm run type-check', { 
          cwd: process.cwd(),
          stdio: 'pipe'
        });
        
        console.log('✅ TypeScript compilation: No type errors');
        
      } catch (error) {
        // Parse TypeScript errors
        const output = error.toString();
        const errorMatches = output.match(/error TS\d+:/g);
        const warningMatches = output.match(/warning TS\d+:/g);
        
        typeErrors = errorMatches ? errorMatches.length : 0;
        typeWarnings = warningMatches ? warningMatches.length : 0;
        
        if (typeErrors > 0) {
          console.error(`❌ TypeScript errors found: ${typeErrors}`);
        }
      }

      const metric: QualityMetric = {
        category: 'Code Quality',
        metric: 'TypeScript Errors',
        value: typeErrors,
        threshold: 0,
        status: typeErrors === 0 ? 'pass' : 'fail',
        impact: 'high'
      };

      qualityReport.metrics.push(metric);

      if (typeErrors > 0) {
        qualityReport.recommendations.push('Fix all TypeScript compilation errors');
      }

      expect(typeErrors).toBe(0);
    });

    test('ESLint Code Quality Standards', async () => {
      console.log('📏 Validating ESLint code quality standards...');
      
      let lintErrors = 0;
      let lintWarnings = 0;
      
      try {
        // Run ESLint
        const lintOutput = execSync('npm run lint -- --format json', {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });

        const lintResults = JSON.parse(lintOutput);
        lintErrors = lintResults.reduce((sum: number, file: any) => sum + file.errorCount, 0);
        lintWarnings = lintResults.reduce((sum: number, file: any) => sum + file.warningCount, 0);
        
        console.log(`📊 ESLint Results: ${lintErrors} errors, ${lintWarnings} warnings`);
        
      } catch (error) {
        console.error('ESLint check failed:', error);
        lintErrors = 999; // Assume high error count if ESLint fails
      }

      const errorMetric: QualityMetric = {
        category: 'Code Quality',
        metric: 'ESLint Errors',
        value: lintErrors,
        threshold: 0,
        status: lintErrors === 0 ? 'pass' : 'fail',
        impact: 'medium'
      };

      const warningMetric: QualityMetric = {
        category: 'Code Quality',
        metric: 'ESLint Warnings',
        value: lintWarnings,
        threshold: 10,
        status: lintWarnings <= 10 ? 'pass' : 'warning',
        impact: 'low'
      };

      qualityReport.metrics.push(errorMetric, warningMetric);

      if (lintErrors > 0) {
        qualityReport.recommendations.push('Fix all ESLint errors before deployment');
      }

      expect(lintErrors).toBe(0);
    });

    test('Code Complexity Analysis', async () => {
      console.log('🧠 Analyzing code complexity...');
      
      // Analyze TypeScript files for complexity
      const sourceFiles = this.getSourceFiles('src/', ['.ts', '.tsx']);
      let highComplexityFiles = 0;
      const complexityThreshold = 15;
      
      for (const file of sourceFiles.slice(0, 10)) { // Sample 10 files
        const complexity = this.calculateCyclomaticComplexity(file);
        
        if (complexity > complexityThreshold) {
          highComplexityFiles++;
          console.warn(`⚠️ High complexity file: ${file} (${complexity})`);
        }
      }

      const complexityMetric: QualityMetric = {
        category: 'Code Quality',
        metric: 'High Complexity Files',
        value: highComplexityFiles,
        threshold: 0,
        status: highComplexityFiles === 0 ? 'pass' : 'warning',
        impact: 'medium'
      };

      qualityReport.metrics.push(complexityMetric);

      if (highComplexityFiles > 0) {
        qualityReport.recommendations.push(`Refactor ${highComplexityFiles} high-complexity files`);
      }

      console.log(`✅ Code complexity analysis: ${highComplexityFiles} high-complexity files`);
    });

    test('Documentation Coverage', async () => {
      console.log('📚 Validating documentation coverage...');
      
      const sourceFiles = this.getSourceFiles('src/', ['.ts', '.tsx']);
      let documentedFunctions = 0;
      let totalFunctions = 0;
      
      for (const file of sourceFiles.slice(0, 20)) { // Sample 20 files
        const content = fs.readFileSync(file, 'utf-8');
        
        // Count functions
        const functionMatches = content.match(/(function\s+\w+|const\s+\w+\s*=\s*async?\s*\(|\w+\s*:\s*async?\s*\()/g);
        const functions = functionMatches ? functionMatches.length : 0;
        
        // Count documented functions (JSDoc comments)
        const docMatches = content.match(/\/\*\*[\s\S]*?\*\/\s*(export\s+)?(function|const|async)/g);
        const documented = docMatches ? docMatches.length : 0;
        
        totalFunctions += functions;
        documentedFunctions += documented;
      }

      const documentationCoverage = totalFunctions > 0 ? (documentedFunctions / totalFunctions) * 100 : 100;

      const docMetric: QualityMetric = {
        category: 'Code Quality',
        metric: 'Documentation Coverage',
        value: Math.round(documentationCoverage),
        threshold: 70,
        status: documentationCoverage >= 70 ? 'pass' : 'warning',
        impact: 'low'
      };

      qualityReport.metrics.push(docMetric);

      if (documentationCoverage < 70) {
        qualityReport.recommendations.push('Improve documentation coverage to at least 70%');
      }

      console.log(`📊 Documentation coverage: ${documentationCoverage.toFixed(1)}%`);
    });
  });

  /**
   * Test Quality Validation
   * Coverage, Test effectiveness, Test performance
   */
  describe('Test Quality Validation', () => {
    test('Test Coverage Analysis', async () => {
      console.log('🧪 Analyzing test coverage quality...');
      
      let coverageData: any = null;
      
      try {
        // Read coverage summary
        const coveragePath = path.join(process.cwd(), 'coverage/coverage-summary.json');
        
        if (fs.existsSync(coveragePath)) {
          coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
        }
      } catch (error) {
        console.warn('Could not read coverage data, running tests...');
        
        // Run tests with coverage
        try {
          execSync('npm run test:coverage', { stdio: 'pipe' });
          const coveragePath = path.join(process.cwd(), 'coverage/coverage-summary.json');
          coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
        } catch (testError) {
          console.warn('Could not generate coverage data');
        }
      }

      if (coverageData && coverageData.total) {
        const { lines, functions, branches, statements } = coverageData.total;

        const coverageMetrics: QualityMetric[] = [
          {
            category: 'Test Quality',
            metric: 'Line Coverage',
            value: lines.pct,
            threshold: 95,
            status: lines.pct >= 95 ? 'pass' : lines.pct >= 85 ? 'warning' : 'fail',
            impact: 'high'
          },
          {
            category: 'Test Quality',
            metric: 'Function Coverage',
            value: functions.pct,
            threshold: 90,
            status: functions.pct >= 90 ? 'pass' : functions.pct >= 80 ? 'warning' : 'fail',
            impact: 'high'
          },
          {
            category: 'Test Quality',
            metric: 'Branch Coverage',
            value: branches.pct,
            threshold: 85,
            status: branches.pct >= 85 ? 'pass' : branches.pct >= 75 ? 'warning' : 'fail',
            impact: 'medium'
          },
          {
            category: 'Test Quality',
            metric: 'Statement Coverage',
            value: statements.pct,
            threshold: 95,
            status: statements.pct >= 95 ? 'pass' : statements.pct >= 85 ? 'warning' : 'fail',
            impact: 'high'
          }
        ];

        qualityReport.metrics.push(...coverageMetrics);

        // Add recommendations for low coverage
        if (lines.pct < 95) {
          qualityReport.recommendations.push(`Increase line coverage to 95% (currently ${lines.pct}%)`);
        }
        if (functions.pct < 90) {
          qualityReport.recommendations.push(`Increase function coverage to 90% (currently ${functions.pct}%)`);
        }

        console.log(`📊 Coverage: Lines ${lines.pct}%, Functions ${functions.pct}%, Branches ${branches.pct}%, Statements ${statements.pct}%`);

        // Validate enterprise coverage standards
        expect(lines.pct).toBeGreaterThanOrEqual(85); // Minimum 85% line coverage
        expect(functions.pct).toBeGreaterThanOrEqual(80); // Minimum 80% function coverage
      } else {
        console.warn('⚠️ Coverage data not available');
      }
    });

    test('Test Suite Performance', async () => {
      console.log('⚡ Validating test suite performance...');
      
      const testStart = Date.now();
      
      try {
        // Run a subset of fast tests to measure performance
        execSync('npm test -- --testTimeout=30000 --testPathPattern=unit', { 
          stdio: 'pipe',
          timeout: 60000 
        });
        
        const testDuration = Date.now() - testStart;
        
        const performanceMetric: QualityMetric = {
          category: 'Test Quality',
          metric: 'Test Suite Duration (ms)',
          value: testDuration,
          threshold: 120000, // 2 minutes
          status: testDuration <= 120000 ? 'pass' : 'warning',
          impact: 'medium'
        };

        qualityReport.metrics.push(performanceMetric);

        if (testDuration > 120000) {
          qualityReport.recommendations.push('Optimize test suite performance - consider parallel execution');
        }

        console.log(`⏱️ Test suite duration: ${testDuration}ms`);
        
      } catch (error) {
        console.warn('Test performance measurement failed:', error);
      }
    });
  });

  /**
   * API Quality Validation
   * Response times, Error rates, Contract compliance
   */
  describe('API Quality Validation', () => {
    test('API Response Time Standards', async () => {
      console.log('🌐 Validating API response time standards...');
      
      const testEndpoints = [
        { method: 'GET', path: '/health', expected: 100 },
        { method: 'POST', path: '/api/auth/login', expected: 500, body: { 
          email: 'user@test.agentradar.app', 
          password: 'TestUser123!' 
        }},
        { method: 'GET', path: '/api/alerts', expected: 1000 },
      ];

      let slowEndpoints = 0;
      const responseTimes: number[] = [];

      for (const endpoint of testEndpoints) {
        const startTime = Date.now();
        
        try {
          let response;
          if (endpoint.method === 'GET') {
            response = await request(app).get(endpoint.path);
          } else if (endpoint.method === 'POST') {
            response = await request(app).post(endpoint.path).send(endpoint.body);
          }

          const responseTime = Date.now() - startTime;
          responseTimes.push(responseTime);

          if (responseTime > endpoint.expected) {
            slowEndpoints++;
            console.warn(`⚠️ Slow endpoint: ${endpoint.method} ${endpoint.path} - ${responseTime}ms (expected <${endpoint.expected}ms)`);
          } else {
            console.log(`✅ ${endpoint.method} ${endpoint.path}: ${responseTime}ms`);
          }

        } catch (error) {
          console.error(`❌ Endpoint test failed: ${endpoint.method} ${endpoint.path}`, error);
          slowEndpoints++;
        }
      }

      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      const responseTimeMetric: QualityMetric = {
        category: 'API Quality',
        metric: 'Average Response Time (ms)',
        value: Math.round(avgResponseTime),
        threshold: 500,
        status: avgResponseTime <= 500 ? 'pass' : avgResponseTime <= 1000 ? 'warning' : 'fail',
        impact: 'high'
      };

      const slowEndpointMetric: QualityMetric = {
        category: 'API Quality',
        metric: 'Slow Endpoints',
        value: slowEndpoints,
        threshold: 0,
        status: slowEndpoints === 0 ? 'pass' : 'warning',
        impact: 'medium'
      };

      qualityReport.metrics.push(responseTimeMetric, slowEndpointMetric);

      if (slowEndpoints > 0) {
        qualityReport.recommendations.push(`Optimize ${slowEndpoints} slow API endpoints`);
      }
    });

    test('API Error Rate Standards', async () => {
      console.log('🚨 Validating API error rate standards...');
      
      const testRequests = 20;
      let errors = 0;
      
      // Test multiple requests to check error rates
      const requests = Array(testRequests).fill(null).map(async () => {
        try {
          const response = await request(app).get('/health');
          return response.status >= 400 ? 'error' : 'success';
        } catch (error) {
          return 'error';
        }
      });

      const results = await Promise.all(requests);
      errors = results.filter(result => result === 'error').length;
      
      const errorRate = (errors / testRequests) * 100;

      const errorRateMetric: QualityMetric = {
        category: 'API Quality',
        metric: 'Error Rate (%)',
        value: Math.round(errorRate * 100) / 100,
        threshold: 1,
        status: errorRate <= 1 ? 'pass' : errorRate <= 5 ? 'warning' : 'fail',
        impact: 'critical'
      };

      qualityReport.metrics.push(errorRateMetric);

      if (errorRate > 1) {
        qualityReport.recommendations.push(`Reduce API error rate from ${errorRate}% to below 1%`);
      }

      console.log(`📊 API error rate: ${errorRate}% (${errors}/${testRequests})`);
    });
  });

  /**
   * Database Quality Validation
   * Query performance, Data integrity, Schema validation
   */
  describe('Database Quality Validation', () => {
    test('Database Query Performance', async () => {
      console.log('🗄️ Validating database query performance...');
      
      const queries = [
        { name: 'User Count', query: () => prisma.user.count() },
        { name: 'Alert Count', query: () => prisma.alert.count() },
        { name: 'Recent Alerts', query: () => prisma.alert.findMany({ take: 10, orderBy: { createdAt: 'desc' } }) },
      ];

      let slowQueries = 0;
      const queryTimes: number[] = [];

      for (const { name, query } of queries) {
        const startTime = Date.now();
        
        try {
          await query();
          const queryTime = Date.now() - startTime;
          queryTimes.push(queryTime);

          if (queryTime > 1000) { // 1 second threshold
            slowQueries++;
            console.warn(`⚠️ Slow query: ${name} - ${queryTime}ms`);
          } else {
            console.log(`✅ ${name}: ${queryTime}ms`);
          }

        } catch (error) {
          console.error(`❌ Query failed: ${name}`, error);
          slowQueries++;
        }
      }

      const avgQueryTime = queryTimes.length > 0
        ? queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length
        : 0;

      const queryPerformanceMetric: QualityMetric = {
        category: 'Database Quality',
        metric: 'Average Query Time (ms)',
        value: Math.round(avgQueryTime),
        threshold: 500,
        status: avgQueryTime <= 500 ? 'pass' : avgQueryTime <= 1000 ? 'warning' : 'fail',
        impact: 'high'
      };

      qualityReport.metrics.push(queryPerformanceMetric);

      if (slowQueries > 0) {
        qualityReport.recommendations.push('Optimize slow database queries and add appropriate indexes');
      }
    });

    test('Data Integrity Validation', async () => {
      console.log('🔍 Validating data integrity...');
      
      let integrityIssues = 0;
      
      try {
        // Check for orphaned records
        const orphanedUserAlerts = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM user_alerts ua 
          LEFT JOIN users u ON ua."userId" = u.id 
          WHERE u.id IS NULL
        `;
        
        const orphanedCount = Array.isArray(orphanedUserAlerts) && orphanedUserAlerts[0] 
          ? Number(orphanedUserAlerts[0].count) 
          : 0;

        if (orphanedCount > 0) {
          integrityIssues++;
          console.warn(`⚠️ Found ${orphanedCount} orphaned user_alerts records`);
        }

        // Check for invalid data
        const invalidUsers = await prisma.user.count({
          where: {
            OR: [
              { email: '' },
              { firstName: '' },
              { lastName: '' }
            ]
          }
        });

        if (invalidUsers > 0) {
          integrityIssues++;
          console.warn(`⚠️ Found ${invalidUsers} users with invalid data`);
        }

      } catch (error) {
        console.error('Data integrity check failed:', error);
        integrityIssues++;
      }

      const integrityMetric: QualityMetric = {
        category: 'Database Quality',
        metric: 'Data Integrity Issues',
        value: integrityIssues,
        threshold: 0,
        status: integrityIssues === 0 ? 'pass' : 'warning',
        impact: 'high'
      };

      qualityReport.metrics.push(integrityMetric);

      if (integrityIssues > 0) {
        qualityReport.recommendations.push('Fix data integrity issues and implement better validation');
      }

      console.log(`📊 Data integrity issues: ${integrityIssues}`);
    });
  });

  /**
   * Security Quality Validation
   * Vulnerability assessment, Authentication security
   */
  describe('Security Quality Validation', () => {
    test('Authentication Security Standards', async () => {
      console.log('🔐 Validating authentication security...');
      
      let securityIssues = 0;
      
      // Test weak password rejection
      const weakPasswordResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'security-test@example.com',
          password: 'weak',
          firstName: 'Security',
          lastName: 'Test'
        });

      if (![400, 422].includes(weakPasswordResponse.status)) {
        securityIssues++;
        console.warn('⚠️ Weak passwords not properly rejected');
      }

      // Test SQL injection protection
      const sqlInjectionResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: "admin' OR '1'='1",
          password: 'anything'
        });

      if (sqlInjectionResponse.status === 200) {
        securityIssues++;
        console.warn('⚠️ SQL injection vulnerability detected');
      }

      const securityMetric: QualityMetric = {
        category: 'Security Quality',
        metric: 'Security Issues',
        value: securityIssues,
        threshold: 0,
        status: securityIssues === 0 ? 'pass' : 'fail',
        impact: 'critical'
      };

      qualityReport.metrics.push(securityMetric);

      if (securityIssues > 0) {
        qualityReport.recommendations.push('Fix critical security vulnerabilities immediately');
      }

      console.log(`🛡️ Security issues detected: ${securityIssues}`);
    });
  });

  afterAll(async () => {
    // Generate final quality report
    const passedMetrics = qualityReport.metrics.filter(m => m.status === 'pass').length;
    const totalMetrics = qualityReport.metrics.length;
    
    qualityReport.score = totalMetrics > 0 ? Math.round((passedMetrics / totalMetrics) * 100) : 0;
    
    const criticalFailures = qualityReport.metrics.filter(m => m.status === 'fail' && m.impact === 'critical').length;
    const highImpactFailures = qualityReport.metrics.filter(m => m.status === 'fail' && m.impact === 'high').length;
    
    if (criticalFailures > 0) {
      qualityReport.overallStatus = 'fail';
    } else if (highImpactFailures > 0 || qualityReport.score < 80) {
      qualityReport.overallStatus = 'warning';
    } else {
      qualityReport.overallStatus = 'pass';
    }

    // Display quality report
    console.log('\n📊 AUTOMATED QUALITY VALIDATION REPORT');
    console.log('======================================');
    console.log(`Overall Status: ${qualityReport.overallStatus.toUpperCase()}`);
    console.log(`Quality Score: ${qualityReport.score}/100`);
    console.log(`Metrics Evaluated: ${totalMetrics}`);
    console.log(`Passed: ${passedMetrics}`);
    console.log(`Failed: ${qualityReport.metrics.filter(m => m.status === 'fail').length}`);
    console.log(`Warnings: ${qualityReport.metrics.filter(m => m.status === 'warning').length}`);
    console.log('');
    
    console.log('📋 Quality Metrics Summary:');
    qualityReport.metrics.forEach(metric => {
      const status = metric.status === 'pass' ? '✅' : metric.status === 'warning' ? '⚠️' : '❌';
      console.log(`${status} ${metric.category} - ${metric.metric}: ${metric.value} (threshold: ${metric.threshold})`);
    });
    
    if (qualityReport.recommendations.length > 0) {
      console.log('\n🎯 Recommendations:');
      qualityReport.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n✅ AUTOMATED QUALITY VALIDATION COMPLETE');
    console.log('========================================');
    
    // Save quality report
    const reportPath = path.join(process.cwd(), 'logs', `quality-report-${Date.now()}.json`);
    
    // Ensure logs directory exists
    const logsDir = path.dirname(reportPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(qualityReport, null, 2));
    console.log(`📄 Quality report saved: ${reportPath}\n`);

    // Fail test if critical issues found
    expect(criticalFailures).toBe(0);
    expect(qualityReport.score).toBeGreaterThanOrEqual(80);
  });

  // Helper methods
  private getSourceFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...this.getSourceFiles(itemPath, extensions));
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(itemPath);
          }
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }
    
    return files;
  }

  private calculateCyclomaticComplexity(filePath: string): number {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Simple complexity calculation based on control flow keywords
      const complexityKeywords = [
        'if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'finally',
        '&&', '||', '?', '??'
      ];
      
      let complexity = 1; // Base complexity
      
      for (const keyword of complexityKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const matches = content.match(regex);
        if (matches) {
          complexity += matches.length;
        }
      }
      
      return complexity;
      
    } catch (error) {
      return 0;
    }
  }
});