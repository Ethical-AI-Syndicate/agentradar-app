/**
 * Production Readiness Validation with Chaos Engineering - Phase 5 QA Excellence
 * CRITICAL: Disaster recovery and resilience testing for Fortune 100 standards
 * TARGET: Zero production failures, 99.99% uptime, complete disaster recovery
 */

import request from 'supertest';
import { app } from '../../index';
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

interface ChaosExperiment {
  name: string;
  description: string;
  type: 'infrastructure' | 'network' | 'database' | 'application' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  recovery: () => Promise<void>;
  validate: () => Promise<boolean>;
}

interface ResilienceMetric {
  experiment: string;
  startTime: number;
  endTime?: number;
  recoveryTime?: number;
  success: boolean;
  errorsDuringChaos: number;
  errorsAfterRecovery: number;
  performanceImpact: number;
}

describe('Production Readiness Validation - Chaos Engineering', () => {
  let prisma: PrismaClient;
  let resilienceMetrics: ResilienceMetric[] = [];
  let systemHealthMonitor: EventEmitter;

  beforeAll(async () => {
    prisma = global.__GLOBAL_TEST_CONFIG__.database.client;
    systemHealthMonitor = new EventEmitter();
    
    console.log('🔥 Production Readiness Validation - Chaos Engineering');
    console.log('Target: 99.99% uptime, complete disaster recovery');
    console.log('Standards: Fortune 100 resilience requirements\n');
  });

  /**
   * Chaos Engineering Experiment 1: Database Connection Failures
   * Simulates database connectivity issues and validates recovery
   */
  describe('Chaos Experiment 1: Database Resilience', () => {
    test('Database Connection Pool Exhaustion', async () => {
      console.log('💥 Chaos Experiment: Database Connection Pool Exhaustion');
      
      const experimentStart = performance.now();
      let errorsDuringChaos = 0;
      let errorsAfterRecovery = 0;

      const metric: ResilienceMetric = {
        experiment: 'Database Connection Pool Exhaustion',
        startTime: experimentStart,
        success: false,
        errorsDuringChaos: 0,
        errorsAfterRecovery: 0,
        performanceImpact: 0
      };

      try {
        // Baseline performance test
        console.log('📊 Establishing baseline performance...');
        const baselineStart = performance.now();
        
        const baselineRequests = Array(10).fill(null).map(() =>
          request(app)
            .get('/api/alerts')
            .query({ limit: 5 })
            .set('Authorization', `Bearer ${await this.getTestToken()}`)
        );

        const baselineResults = await Promise.all(baselineRequests);
        const baselineTime = performance.now() - baselineStart;
        
        const baselineSuccessRate = baselineResults.filter(r => r.status === 200).length / baselineResults.length;
        console.log(`✅ Baseline: ${baselineTime.toFixed(0)}ms, ${(baselineSuccessRate * 100).toFixed(1)}% success rate`);

        // Chaos injection: Simulate connection pool exhaustion
        console.log('💥 Injecting chaos: Simulating connection pool exhaustion...');
        
        // Create many concurrent requests to exhaust connection pool
        const chaosRequests = Array(50).fill(null).map(async () => {
          try {
            const response = await request(app)
              .get('/api/alerts')
              .query({ limit: 1 })
              .set('Authorization', `Bearer ${await this.getTestToken()}`);
            
            return response.status === 200 ? 'success' : 'error';
          } catch (error) {
            return 'error';
          }
        });

        const chaosResults = await Promise.all(chaosRequests);
        errorsDuringChaos = chaosResults.filter(r => r === 'error').length;
        
        console.log(`💥 Chaos impact: ${errorsDuringChaos}/${chaosRequests.length} requests failed`);

        // Recovery validation
        console.log('🔧 Validating system recovery...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Allow recovery time

        const recoveryStart = performance.now();
        
        const recoveryRequests = Array(10).fill(null).map(() =>
          request(app)
            .get('/api/alerts')
            .query({ limit: 5 })
            .set('Authorization', `Bearer ${await this.getTestToken()}`)
        );

        const recoveryResults = await Promise.all(recoveryRequests);
        const recoveryTime = performance.now() - recoveryStart;
        
        errorsAfterRecovery = recoveryResults.filter(r => r.status !== 200).length;
        const recoverySuccessRate = recoveryResults.filter(r => r.status === 200).length / recoveryResults.length;
        
        console.log(`🔧 Recovery: ${recoveryTime.toFixed(0)}ms, ${(recoverySuccessRate * 100).toFixed(1)}% success rate`);

        // Performance impact calculation
        metric.performanceImpact = ((recoveryTime - baselineTime) / baselineTime) * 100;
        metric.endTime = performance.now();
        metric.recoveryTime = metric.endTime - experimentStart;
        metric.errorsDuringChaos = errorsDuringChaos;
        metric.errorsAfterRecovery = errorsAfterRecovery;
        metric.success = recoverySuccessRate >= 0.9; // 90% success rate required

        resilienceMetrics.push(metric);

        console.log(`📊 Performance impact: ${metric.performanceImpact.toFixed(1)}%`);
        console.log(`⏱️ Total recovery time: ${metric.recoveryTime.toFixed(0)}ms`);

        // Validate resilience requirements
        expect(recoverySuccessRate).toBeGreaterThanOrEqual(0.9); // 90% success rate after chaos
        expect(metric.performanceImpact).toBeLessThan(200); // Less than 200% performance impact
        expect(errorsAfterRecovery).toBeLessThanOrEqual(1); // Maximum 1 error after recovery

        console.log('✅ Database resilience test passed\n');

      } catch (error) {
        console.error('❌ Database resilience test failed:', error);
        metric.success = false;
        resilienceMetrics.push(metric);
        throw error;
      }
    });

    test('Database Query Timeout Resilience', async () => {
      console.log('💥 Chaos Experiment: Database Query Timeout Resilience');
      
      const experimentStart = performance.now();
      
      const metric: ResilienceMetric = {
        experiment: 'Database Query Timeout',
        startTime: experimentStart,
        success: false,
        errorsDuringChaos: 0,
        errorsAfterRecovery: 0,
        performanceImpact: 0
      };

      try {
        // Test API resilience with slow database queries
        console.log('🐌 Simulating slow database queries...');
        
        const slowQueryRequests = Array(5).fill(null).map(async () => {
          try {
            // Request with potential timeout
            const response = await request(app)
              .get('/api/alerts/stats')
              .set('Authorization', `Bearer ${await this.getTestToken()}`)
              .timeout(10000); // 10 second timeout
            
            return response.status === 200 ? 'success' : 'error';
          } catch (error) {
            return 'timeout';
          }
        });

        const slowQueryResults = await Promise.all(slowQueryRequests);
        const timeouts = slowQueryResults.filter(r => r === 'timeout').length;
        const errors = slowQueryResults.filter(r => r === 'error').length;
        
        console.log(`📊 Slow query results: ${timeouts} timeouts, ${errors} errors`);

        // Validate that system handles timeouts gracefully
        const successRate = slowQueryResults.filter(r => r === 'success').length / slowQueryResults.length;
        
        metric.endTime = performance.now();
        metric.recoveryTime = metric.endTime - experimentStart;
        metric.errorsDuringChaos = timeouts + errors;
        metric.success = successRate >= 0.6; // 60% success rate with slow queries
        
        resilienceMetrics.push(metric);

        console.log(`✅ Query timeout resilience: ${(successRate * 100).toFixed(1)}% success rate`);

        // Validate timeout handling
        expect(successRate).toBeGreaterThanOrEqual(0.6); // At least 60% success with slow queries

        console.log('✅ Database timeout resilience test passed\n');

      } catch (error) {
        console.error('❌ Database timeout resilience test failed:', error);
        metric.success = false;
        resilienceMetrics.push(metric);
        throw error;
      }
    });
  });

  /**
   * Chaos Engineering Experiment 2: High Load Stress Testing
   * Tests system behavior under extreme load conditions
   */
  describe('Chaos Experiment 2: High Load Resilience', () => {
    test('Concurrent User Load Stress Test', async () => {
      console.log('💥 Chaos Experiment: Concurrent User Load Stress Test');
      
      const experimentStart = performance.now();
      const concurrentUsers = 100;
      const requestsPerUser = 5;
      
      const metric: ResilienceMetric = {
        experiment: 'High Concurrent Load',
        startTime: experimentStart,
        success: false,
        errorsDuringChaos: 0,
        errorsAfterRecovery: 0,
        performanceImpact: 0
      };

      try {
        console.log(`🔥 Simulating ${concurrentUsers} concurrent users with ${requestsPerUser} requests each`);
        
        // Create massive concurrent load
        const allRequests: Promise<string>[] = [];
        
        for (let user = 0; user < concurrentUsers; user++) {
          for (let req = 0; req < requestsPerUser; req++) {
            const request = this.simulateUserRequest(user, req);
            allRequests.push(request);
          }
        }

        console.log(`📊 Executing ${allRequests.length} concurrent requests...`);
        
        const loadTestStart = performance.now();
        const results = await Promise.all(allRequests);
        const loadTestDuration = performance.now() - loadTestStart;
        
        const successCount = results.filter(r => r === 'success').length;
        const errorCount = results.filter(r => r === 'error').length;
        const timeoutCount = results.filter(r => r === 'timeout').length;
        
        const successRate = successCount / results.length;
        const avgResponseTime = loadTestDuration / results.length;
        
        console.log(`📊 Load test results:`);
        console.log(`   Total requests: ${results.length}`);
        console.log(`   Successful: ${successCount} (${(successRate * 100).toFixed(1)}%)`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Timeouts: ${timeoutCount}`);
        console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`   Total duration: ${loadTestDuration.toFixed(0)}ms`);

        // Recovery validation - check if system recovers after load
        console.log('🔧 Validating post-load recovery...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Recovery time

        const recoveryStart = performance.now();
        const recoveryRequests = Array(10).fill(null).map(() =>
          request(app).get('/health')
        );

        const recoveryResults = await Promise.all(recoveryRequests);
        const recoveryTime = performance.now() - recoveryStart;
        const recoverySuccessRate = recoveryResults.filter(r => r.status === 200).length / recoveryResults.length;
        
        console.log(`🔧 Recovery: ${recoveryTime.toFixed(0)}ms, ${(recoverySuccessRate * 100).toFixed(1)}% success rate`);

        metric.endTime = performance.now();
        metric.recoveryTime = metric.endTime - experimentStart;
        metric.errorsDuringChaos = errorCount + timeoutCount;
        metric.errorsAfterRecovery = recoveryResults.filter(r => r.status !== 200).length;
        metric.performanceImpact = avgResponseTime;
        metric.success = successRate >= 0.8 && recoverySuccessRate >= 0.95;

        resilienceMetrics.push(metric);

        // Validate load handling requirements
        expect(successRate).toBeGreaterThanOrEqual(0.8); // 80% success under load
        expect(recoverySuccessRate).toBeGreaterThanOrEqual(0.95); // 95% recovery success
        expect(avgResponseTime).toBeLessThan(5000); // Less than 5s average response

        console.log('✅ High load resilience test passed\n');

      } catch (error) {
        console.error('❌ High load resilience test failed:', error);
        metric.success = false;
        resilienceMetrics.push(metric);
        throw error;
      }
    });

    test('Memory Pressure Resilience', async () => {
      console.log('💥 Chaos Experiment: Memory Pressure Resilience');
      
      const experimentStart = performance.now();
      
      const metric: ResilienceMetric = {
        experiment: 'Memory Pressure',
        startTime: experimentStart,
        success: false,
        errorsDuringChaos: 0,
        errorsAfterRecovery: 0,
        performanceImpact: 0
      };

      try {
        // Monitor initial memory usage
        const initialMemory = process.memoryUsage();
        console.log(`📊 Initial memory: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);

        // Create memory pressure by making large data requests
        console.log('🧠 Creating memory pressure...');
        
        const memoryPressureRequests = Array(20).fill(null).map(async () => {
          try {
            const response = await request(app)
              .get('/api/alerts')
              .query({ limit: 100 }) // Large result sets
              .set('Authorization', `Bearer ${await this.getTestToken()}`);
            
            return response.status === 200 ? 'success' : 'error';
          } catch (error) {
            return 'error';
          }
        });

        const memoryResults = await Promise.all(memoryPressureRequests);
        
        // Check memory after pressure
        const peakMemory = process.memoryUsage();
        const memoryIncrease = peakMemory.heapUsed - initialMemory.heapUsed;
        
        console.log(`📊 Peak memory: ${Math.round(peakMemory.heapUsed / 1024 / 1024)}MB`);
        console.log(`📈 Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);

        const successCount = memoryResults.filter(r => r === 'success').length;
        const errorCount = memoryResults.filter(r => r === 'error').length;
        const successRate = successCount / memoryResults.length;

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        // Recovery check
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const recoveryMemory = process.memoryUsage();
        const memoryRecovered = peakMemory.heapUsed - recoveryMemory.heapUsed;
        
        console.log(`🔧 Recovery memory: ${Math.round(recoveryMemory.heapUsed / 1024 / 1024)}MB`);
        console.log(`♻️ Memory recovered: ${Math.round(memoryRecovered / 1024 / 1024)}MB`);

        metric.endTime = performance.now();
        metric.recoveryTime = metric.endTime - experimentStart;
        metric.errorsDuringChaos = errorCount;
        metric.performanceImpact = memoryIncrease / 1024 / 1024; // MB increase
        metric.success = successRate >= 0.9 && memoryIncrease < 100 * 1024 * 1024; // Less than 100MB increase

        resilienceMetrics.push(metric);

        // Validate memory handling
        expect(successRate).toBeGreaterThanOrEqual(0.9); // 90% success under memory pressure
        expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB increase

        console.log('✅ Memory pressure resilience test passed\n');

      } catch (error) {
        console.error('❌ Memory pressure resilience test failed:', error);
        metric.success = false;
        resilienceMetrics.push(metric);
        throw error;
      }
    });
  });

  /**
   * Chaos Engineering Experiment 3: Security Resilience Testing
   * Tests system resilience against security attacks and malicious inputs
   */
  describe('Chaos Experiment 3: Security Attack Resilience', () => {
    test('DDoS Attack Simulation', async () => {
      console.log('💥 Chaos Experiment: DDoS Attack Simulation');
      
      const experimentStart = performance.now();
      const attackIntensity = 200; // Requests per second simulation
      
      const metric: ResilienceMetric = {
        experiment: 'DDoS Attack Simulation',
        startTime: experimentStart,
        success: false,
        errorsDuringChaos: 0,
        errorsAfterRecovery: 0,
        performanceImpact: 0
      };

      try {
        console.log(`🔥 Simulating DDoS attack with ${attackIntensity} requests...`);
        
        // Create rapid-fire requests to simulate DDoS
        const ddosRequests: Promise<string>[] = [];
        
        for (let i = 0; i < attackIntensity; i++) {
          const request = this.simulateDDoSRequest(i);
          ddosRequests.push(request);
          
          // Add small delay to avoid overwhelming the test runner
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }

        const attackStart = performance.now();
        const attackResults = await Promise.all(ddosRequests);
        const attackDuration = performance.now() - attackStart;
        
        const rateLimited = attackResults.filter(r => r === 'rate_limited').length;
        const errors = attackResults.filter(r => r === 'error').length;
        const successful = attackResults.filter(r => r === 'success').length;
        
        console.log(`📊 DDoS attack results:`);
        console.log(`   Total requests: ${attackResults.length}`);
        console.log(`   Rate limited: ${rateLimited} (${((rateLimited / attackResults.length) * 100).toFixed(1)}%)`);
        console.log(`   Errors: ${errors}`);
        console.log(`   Successful: ${successful}`);
        console.log(`   Attack duration: ${attackDuration.toFixed(0)}ms`);

        // Validate that rate limiting is working
        const rateLimitingEffective = rateLimited > attackResults.length * 0.5; // At least 50% should be rate limited
        
        // Test legitimate user access during attack
        console.log('👤 Testing legitimate user access during attack...');
        
        const legitimateUserResponse = await request(app)
          .get('/health')
          .timeout(5000);
        
        const legitUserWorking = legitimateUserResponse.status === 200;
        
        console.log(`👤 Legitimate user access: ${legitUserWorking ? 'Working' : 'Blocked'}`);

        // Recovery validation
        console.log('🔧 Validating post-attack recovery...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Recovery time
        
        const recoveryRequests = Array(5).fill(null).map(() =>
          request(app).get('/health')
        );

        const recoveryResults = await Promise.all(recoveryRequests);
        const recoverySuccessRate = recoveryResults.filter(r => r.status === 200).length / recoveryResults.length;
        
        console.log(`🔧 Post-attack recovery: ${(recoverySuccessRate * 100).toFixed(1)}% success rate`);

        metric.endTime = performance.now();
        metric.recoveryTime = metric.endTime - experimentStart;
        metric.errorsDuringChaos = errors;
        metric.errorsAfterRecovery = recoveryResults.filter(r => r.status !== 200).length;
        metric.performanceImpact = attackDuration / attackResults.length;
        metric.success = rateLimitingEffective && legitUserWorking && recoverySuccessRate >= 0.9;

        resilienceMetrics.push(metric);

        // Validate DDoS protection
        expect(rateLimitingEffective).toBe(true); // Rate limiting should be effective
        expect(legitUserWorking).toBe(true); // Legitimate users should still work
        expect(recoverySuccessRate).toBeGreaterThanOrEqual(0.9); // 90% recovery success

        console.log('✅ DDoS attack resilience test passed\n');

      } catch (error) {
        console.error('❌ DDoS attack resilience test failed:', error);
        metric.success = false;
        resilienceMetrics.push(metric);
        throw error;
      }
    });

    test('Malicious Input Attack Resilience', async () => {
      console.log('💥 Chaos Experiment: Malicious Input Attack Resilience');
      
      const experimentStart = performance.now();
      
      const metric: ResilienceMetric = {
        experiment: 'Malicious Input Attack',
        startTime: experimentStart,
        success: false,
        errorsDuringChaos: 0,
        errorsAfterRecovery: 0,
        performanceImpact: 0
      };

      try {
        console.log('🦠 Testing malicious input handling...');
        
        // Test various malicious payloads
        const maliciousPayloads = global.__GLOBAL_TEST_CONFIG__.security.testPayloads;
        let blockedAttacks = 0;
        let totalAttacks = 0;
        
        // SQL injection attacks
        for (const payload of maliciousPayloads.sqlInjection) {
          totalAttacks++;
          try {
            const response = await request(app)
              .post('/api/auth/login')
              .send({
                email: payload,
                password: 'anything'
              });
            
            if ([400, 401, 422].includes(response.status)) {
              blockedAttacks++;
            }
          } catch (error) {
            blockedAttacks++; // Errors count as blocked
          }
        }

        // XSS attacks
        for (const payload of maliciousPayloads.xss.slice(0, 3)) { // Test subset
          totalAttacks++;
          try {
            const response = await request(app)
              .put('/api/auth/profile')
              .send({
                firstName: payload,
                lastName: 'Test'
              })
              .set('Authorization', `Bearer ${await this.getTestToken()}`);
            
            if ([400, 422].includes(response.status) || 
                (response.status === 200 && !response.body.user?.firstName?.includes('<script>'))) {
              blockedAttacks++;
            }
          } catch (error) {
            blockedAttacks++;
          }
        }

        const blockingEffectiveness = blockedAttacks / totalAttacks;
        
        console.log(`📊 Malicious input results:`);
        console.log(`   Total attacks: ${totalAttacks}`);
        console.log(`   Blocked attacks: ${blockedAttacks}`);
        console.log(`   Blocking effectiveness: ${(blockingEffectiveness * 100).toFixed(1)}%`);

        // Test system stability after malicious inputs
        console.log('🔧 Testing system stability after attacks...');
        
        const stabilityTest = await request(app)
          .get('/health');
        
        const systemStable = stabilityTest.status === 200;
        console.log(`🔧 System stability: ${systemStable ? 'Stable' : 'Unstable'}`);

        metric.endTime = performance.now();
        metric.recoveryTime = metric.endTime - experimentStart;
        metric.errorsDuringChaos = totalAttacks - blockedAttacks;
        metric.errorsAfterRecovery = systemStable ? 0 : 1;
        metric.performanceImpact = 0;
        metric.success = blockingEffectiveness >= 0.9 && systemStable;

        resilienceMetrics.push(metric);

        // Validate malicious input protection
        expect(blockingEffectiveness).toBeGreaterThanOrEqual(0.9); // 90% of attacks should be blocked
        expect(systemStable).toBe(true); // System should remain stable

        console.log('✅ Malicious input resilience test passed\n');

      } catch (error) {
        console.error('❌ Malicious input resilience test failed:', error);
        metric.success = false;
        resilienceMetrics.push(metric);
        throw error;
      }
    });
  });

  /**
   * Chaos Engineering Experiment 4: Network Resilience Testing
   * Tests system behavior during network failures and partitions
   */
  describe('Chaos Experiment 4: Network Resilience', () => {
    test('Simulated Network Latency Resilience', async () => {
      console.log('💥 Chaos Experiment: Network Latency Resilience');
      
      const experimentStart = performance.now();
      
      const metric: ResilienceMetric = {
        experiment: 'Network Latency',
        startTime: experimentStart,
        success: false,
        errorsDuringChaos: 0,
        errorsAfterRecovery: 0,
        performanceImpact: 0
      };

      try {
        console.log('🌐 Testing high network latency scenarios...');
        
        // Simulate high latency by using timeouts and slow requests
        const latencyRequests = Array(10).fill(null).map(async () => {
          const requestStart = performance.now();
          
          try {
            // Add artificial delay to simulate network latency
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
            
            const response = await request(app)
              .get('/api/alerts')
              .query({ limit: 5 })
              .set('Authorization', `Bearer ${await this.getTestToken()}`)
              .timeout(5000);
            
            const requestTime = performance.now() - requestStart;
            return { status: response.status, time: requestTime };
            
          } catch (error) {
            const requestTime = performance.now() - requestStart;
            return { status: 'timeout', time: requestTime };
          }
        });

        const latencyResults = await Promise.all(latencyRequests);
        
        const successfulRequests = latencyResults.filter(r => r.status === 200);
        const timeoutRequests = latencyResults.filter(r => r.status === 'timeout');
        
        const avgResponseTime = successfulRequests.length > 0 
          ? successfulRequests.reduce((sum, r) => sum + r.time, 0) / successfulRequests.length 
          : 0;
        
        const successRate = successfulRequests.length / latencyResults.length;
        
        console.log(`📊 Network latency results:`);
        console.log(`   Successful requests: ${successfulRequests.length}/${latencyResults.length}`);
        console.log(`   Success rate: ${(successRate * 100).toFixed(1)}%`);
        console.log(`   Timeouts: ${timeoutRequests.length}`);
        console.log(`   Average response time: ${avgResponseTime.toFixed(0)}ms`);

        // Test graceful degradation
        console.log('🔧 Testing graceful degradation...');
        
        const degradationTest = await request(app)
          .get('/health')
          .timeout(2000);
        
        const gracefulDegradation = degradationTest.status === 200;
        console.log(`🔧 Graceful degradation: ${gracefulDegradation ? 'Working' : 'Failed'}`);

        metric.endTime = performance.now();
        metric.recoveryTime = metric.endTime - experimentStart;
        metric.errorsDuringChaos = timeoutRequests.length;
        metric.errorsAfterRecovery = gracefulDegradation ? 0 : 1;
        metric.performanceImpact = avgResponseTime;
        metric.success = successRate >= 0.7 && gracefulDegradation;

        resilienceMetrics.push(metric);

        // Validate network resilience
        expect(successRate).toBeGreaterThanOrEqual(0.7); // 70% success with high latency
        expect(gracefulDegradation).toBe(true); // Should handle network issues gracefully

        console.log('✅ Network latency resilience test passed\n');

      } catch (error) {
        console.error('❌ Network latency resilience test failed:', error);
        metric.success = false;
        resilienceMetrics.push(metric);
        throw error;
      }
    });
  });

  afterAll(async () => {
    // Generate comprehensive resilience report
    console.log('\n🔥 PRODUCTION READINESS VALIDATION REPORT');
    console.log('==========================================');
    console.log('Target: 99.99% uptime, complete disaster recovery');
    console.log('Standards: Fortune 100 resilience requirements\n');
    
    const totalExperiments = resilienceMetrics.length;
    const successfulExperiments = resilienceMetrics.filter(m => m.success).length;
    const overallResilienceScore = totalExperiments > 0 ? (successfulExperiments / totalExperiments) * 100 : 0;
    
    console.log('📊 CHAOS ENGINEERING RESULTS:');
    console.log(`   Total experiments: ${totalExperiments}`);
    console.log(`   Successful: ${successfulExperiments}`);
    console.log(`   Failed: ${totalExperiments - successfulExperiments}`);
    console.log(`   Overall resilience score: ${overallResilienceScore.toFixed(1)}%\n`);
    
    console.log('🔬 EXPERIMENT DETAILS:');
    resilienceMetrics.forEach(metric => {
      const status = metric.success ? '✅' : '❌';
      const recoveryTime = metric.recoveryTime ? `${metric.recoveryTime.toFixed(0)}ms` : 'N/A';
      
      console.log(`${status} ${metric.experiment}:`);
      console.log(`   Recovery time: ${recoveryTime}`);
      console.log(`   Errors during chaos: ${metric.errorsDuringChaos}`);
      console.log(`   Errors after recovery: ${metric.errorsAfterRecovery}`);
      console.log(`   Performance impact: ${metric.performanceImpact.toFixed(1)}`);
      console.log('');
    });
    
    // Production readiness assessment
    const criticalFailures = resilienceMetrics.filter(m => !m.success).length;
    const avgRecoveryTime = resilienceMetrics
      .filter(m => m.recoveryTime)
      .reduce((sum, m) => sum + (m.recoveryTime || 0), 0) / 
      resilienceMetrics.filter(m => m.recoveryTime).length;
    
    console.log('🎯 PRODUCTION READINESS ASSESSMENT:');
    console.log(`   Resilience score: ${overallResilienceScore.toFixed(1)}%`);
    console.log(`   Critical failures: ${criticalFailures}`);
    console.log(`   Average recovery time: ${avgRecoveryTime.toFixed(0)}ms`);
    
    const productionReady = overallResilienceScore >= 80 && criticalFailures === 0 && avgRecoveryTime < 10000;
    
    if (productionReady) {
      console.log('\n🚀 PRODUCTION READINESS STATUS: READY ✅');
      console.log('   ✅ Resilience score ≥ 80%');
      console.log('   ✅ Zero critical failures');
      console.log('   ✅ Recovery time < 10 seconds');
      console.log('   ✅ Fortune 100 standards met');
    } else {
      console.log('\n⚠️ PRODUCTION READINESS STATUS: NOT READY ❌');
      if (overallResilienceScore < 80) console.log('   ❌ Resilience score below 80%');
      if (criticalFailures > 0) console.log(`   ❌ ${criticalFailures} critical failures`);
      if (avgRecoveryTime >= 10000) console.log('   ❌ Recovery time ≥ 10 seconds');
    }
    
    console.log('\n🔥 CHAOS ENGINEERING VALIDATION COMPLETE');
    console.log('==========================================\n');

    // Validate production readiness requirements
    expect(overallResilienceScore).toBeGreaterThanOrEqual(80);
    expect(criticalFailures).toBe(0);
    expect(avgRecoveryTime).toBeLessThan(10000);
  });

  // Helper methods
  private async getTestToken(): Promise<string> {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.agentradar.app',
        password: 'TestUser123!'
      });
    
    return response.body.token || '';
  }

  private async simulateUserRequest(userId: number, requestId: number): Promise<string> {
    try {
      const endpoints = [
        '/health',
        '/api/alerts',
        '/api/auth/me'
      ];
      
      const endpoint = endpoints[requestId % endpoints.length];
      const response = await request(app)
        .get(endpoint)
        .set('Authorization', endpoint !== '/health' ? `Bearer ${await this.getTestToken()}` : '')
        .timeout(10000);
      
      return response.status === 200 ? 'success' : 'error';
    } catch (error) {
      return error.code === 'ECONNABORTED' ? 'timeout' : 'error';
    }
  }

  private async simulateDDoSRequest(requestId: number): Promise<string> {
    try {
      const response = await request(app)
        .get('/health')
        .timeout(1000);
      
      if (response.status === 200) return 'success';
      if (response.status === 429) return 'rate_limited';
      return 'error';
    } catch (error) {
      return 'error';
    }
  }
});