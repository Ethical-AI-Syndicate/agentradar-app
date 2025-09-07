/**
 * Performance Testing Suite for AgentRadar API
 * 
 * Tests for load testing, stress testing, memory usage, and performance optimization
 */

import request from 'supertest';
import { Express } from 'express';
import { performance } from 'perf_hooks';
import { testDb, jwt, perfHelper, dataGenerator, sleep } from '../helpers/test-helpers';

export class PerformanceTestSuite {
  private app: Express;
  private performanceThresholds: PerformanceThresholds;

  constructor(app: Express, thresholds?: Partial<PerformanceThresholds>) {
    this.app = app;
    this.performanceThresholds = {
      apiResponseTime: 200, // ms
      databaseQueryTime: 100, // ms
      maxMemoryUsage: 200 * 1024 * 1024, // 200MB
      concurrentUsers: 500,
      requestsPerSecond: 100,
      errorRate: 0.1, // 0.1%
      ...thresholds
    };
  }

  // API Response Time Tests
  async testApiResponseTimes(endpoints: string[]): Promise<void> {
    describe('API Response Time Performance', () => {
      for (const endpoint of endpoints) {
        it(`should respond within ${this.performanceThresholds.apiResponseTime}ms for ${endpoint}`, async () => {
          const user = await testDb.createUser();
          const token = await jwt.createUserToken(user.id, user.email);

          const { result: response, duration } = await perfHelper.measureExecutionTime(async () => {
            return request(this.app)
              .get(endpoint)
              .set('Authorization', `Bearer ${token}`);
          });

          expect(duration).toBeLessThan(this.performanceThresholds.apiResponseTime);
          expect(response.status).toBeOneOf([200, 201, 400, 401, 403, 404]);

          await testDb.cleanupUser(user.id);
        });

        it(`should maintain consistent response times under load for ${endpoint}`, async () => {
          const user = await testDb.createUser();
          const token = await jwt.createUserToken(user.id, user.email);

          const concurrentRequests = 50;
          const responses = await perfHelper.createConcurrentRequests(async () => {
            const { result, duration } = await perfHelper.measureExecutionTime(async () => {
              return request(this.app)
                .get(endpoint)
                .set('Authorization', `Bearer ${token}`);
            });
            return { response: result, duration };
          }, concurrentRequests);

          // Calculate average response time
          const totalDuration = responses.reduce((sum, r) => sum + r.duration, 0);
          const avgResponseTime = totalDuration / responses.length;

          // 95th percentile should be within threshold
          const sortedDurations = responses.map(r => r.duration).sort((a, b) => a - b);
          const p95Index = Math.floor(sortedDurations.length * 0.95);
          const p95ResponseTime = sortedDurations[p95Index];

          expect(avgResponseTime).toBeLessThan(this.performanceThresholds.apiResponseTime);
          expect(p95ResponseTime).toBeLessThan(this.performanceThresholds.apiResponseTime * 2);

          // Verify success rate
          const successfulRequests = responses.filter(r => r.response.status < 400);
          const successRate = successfulRequests.length / responses.length;
          expect(successRate).toBeGreaterThan(0.95); // 95% success rate

          await testDb.cleanupUser(user.id);
        });
      }
    });
  }

  // Database Performance Tests
  async testDatabasePerformance(): Promise<void> {
    describe('Database Performance', () => {
      it('should execute simple queries within threshold', async () => {
        const { duration } = await perfHelper.measureExecutionTime(async () => {
          return testDb.getPrismaClient().user.count();
        });

        expect(duration).toBeLessThan(this.performanceThresholds.databaseQueryTime);
      });

      it('should handle complex alert queries efficiently', async () => {
        // Create test data
        const alerts = dataGenerator.generateBulkAlerts(1000);
        await Promise.all(alerts.map(alert => testDb.createAlert(alert)));

        const { duration } = await perfHelper.measureExecutionTime(async () => {
          return testDb.getPrismaClient().alert.findMany({
            where: {
              status: 'ACTIVE',
              city: { in: ['Toronto', 'Vancouver', 'Montreal'] },
              opportunityScore: { gte: 70 }
            },
            orderBy: [
              { opportunityScore: 'desc' },
              { priority: 'desc' },
              { createdAt: 'desc' }
            ],
            take: 50,
            include: {
              userAlerts: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          });
        });

        expect(duration).toBeLessThan(this.performanceThresholds.databaseQueryTime * 5); // Allow 5x for complex queries

        // Cleanup
        await testDb.getPrismaClient().alert.deleteMany({
          where: { description: { contains: 'Automated bulk test alert' } }
        });
      });

      it('should handle database transactions efficiently', async () => {
        const user = await testDb.createUser();
        const alerts = dataGenerator.generateBulkAlerts(10);

        const { duration } = await perfHelper.measureExecutionTime(async () => {
          return testDb.getPrismaClient().$transaction(async (prisma) => {
            const createdAlerts = [];
            
            for (const alertData of alerts) {
              const alert = await prisma.alert.create({ data: alertData });
              createdAlerts.push(alert);
              
              await prisma.userAlert.create({
                data: {
                  userId: user.id,
                  alertId: alert.id,
                  matchScore: 75
                }
              });
            }
            
            return createdAlerts;
          });
        });

        expect(duration).toBeLessThan(this.performanceThresholds.databaseQueryTime * 10);

        await testDb.cleanupUser(user.id);
      });

      it('should maintain connection pool efficiency', async () => {
        const connectionPromises = Array(20).fill(null).map(async () => {
          const { duration } = await perfHelper.measureExecutionTime(async () => {
            const client = testDb.getPrismaClient();
            await client.user.count();
            return client;
          });
          return duration;
        });

        const durations = await Promise.all(connectionPromises);
        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

        expect(avgDuration).toBeLessThan(this.performanceThresholds.databaseQueryTime);
      });
    });
  }

  // Load Testing
  async testLoadCapacity(endpoint: string): Promise<void> {
    describe('Load Testing', () => {
      it('should handle concurrent users within threshold', async () => {
        const concurrentUsers = Math.min(this.performanceThresholds.concurrentUsers, 100); // Limit for test environment
        const requestsPerUser = 5;

        // Create test users
        const users = await Promise.all(
          Array(concurrentUsers).fill(null).map(() => testDb.createUser())
        );

        const startTime = performance.now();

        // Simulate concurrent user activity
        const userPromises = users.map(async (user) => {
          const token = await jwt.createUserToken(user.id, user.email);
          const userRequests = Array(requestsPerUser).fill(null).map(async () => {
            const { result, duration } = await perfHelper.measureExecutionTime(async () => {
              return request(this.app)
                .get(endpoint)
                .set('Authorization', `Bearer ${token}`);
            });
            return { response: result, duration };
          });

          return Promise.all(userRequests);
        });

        const results = await Promise.all(userPromises);
        const endTime = performance.now();

        const executionTime = endTime - startTime;
        const totalRequests = concurrentUsers * requestsPerUser;
        const requestsPerSecond = totalRequests / (executionTime / 1000);

        // Performance assertions
        expect(requestsPerSecond).toBeGreaterThan(this.performanceThresholds.requestsPerSecond / 2);
        expect(executionTime).toBeLessThan(60000); // Complete within 60 seconds

        // Verify success rate
        const allResponses = results.flat();
        const successfulResponses = allResponses.filter(r => r.response.status < 400);
        const successRate = successfulResponses.length / allResponses.length;
        expect(successRate).toBeGreaterThan(1 - this.performanceThresholds.errorRate);

        // Response time distribution
        const durations = allResponses.map(r => r.duration);
        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        expect(avgDuration).toBeLessThan(this.performanceThresholds.apiResponseTime * 2);

        // Cleanup
        await Promise.all(users.map(user => testDb.cleanupUser(user.id)));
      });

      it('should maintain performance under sustained load', async () => {
        const user = await testDb.createUser();
        const token = await jwt.createUserToken(user.id, user.email);
        const duration = 30000; // 30 seconds
        const requestInterval = 100; // 100ms between requests

        const results: Array<{ response: any; duration: number }> = [];
        const startTime = performance.now();

        while (performance.now() - startTime < duration) {
          const { result, duration: reqDuration } = await perfHelper.measureExecutionTime(async () => {
            return request(this.app)
              .get(endpoint)
              .set('Authorization', `Bearer ${token}`);
          });

          results.push({ response: result, duration: reqDuration });
          await sleep(requestInterval);
        }

        // Analyze performance over time
        const firstHalf = results.slice(0, Math.floor(results.length / 2));
        const secondHalf = results.slice(Math.floor(results.length / 2));

        const avgFirstHalf = firstHalf.reduce((sum, r) => sum + r.duration, 0) / firstHalf.length;
        const avgSecondHalf = secondHalf.reduce((sum, r) => sum + r.duration, 0) / secondHalf.length;

        // Performance should not degrade significantly over time
        expect(avgSecondHalf).toBeLessThan(avgFirstHalf * 1.5);

        await testDb.cleanupUser(user.id);
      });
    });
  }

  // Memory Usage Tests
  async testMemoryUsage(endpoint: string): Promise<void> {
    describe('Memory Usage', () => {
      it('should not exceed memory limits during normal operations', async () => {
        const user = await testDb.createUser();
        const token = await jwt.createUserToken(user.id, user.email);

        const initialMemory = process.memoryUsage().heapUsed;

        // Perform multiple operations
        const operations = Array(100).fill(null).map(() =>
          request(this.app)
            .get(endpoint)
            .set('Authorization', `Bearer ${token}`)
        );

        await Promise.all(operations);

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;

        expect(memoryIncrease).toBeLessThan(this.performanceThresholds.maxMemoryUsage);

        await testDb.cleanupUser(user.id);
      });

      it('should handle large datasets without memory leaks', async () => {
        const { result, memoryDelta } = await perfHelper.measureMemoryUsage(async () => {
          // Create large dataset
          const largeDataset = dataGenerator.generateBulkAlerts(5000);
          const createdAlerts = await Promise.all(
            largeDataset.map(alert => testDb.createAlert(alert))
          );

          // Process the dataset
          const results = await testDb.getPrismaClient().alert.findMany({
            take: 1000,
            include: { userAlerts: true }
          });

          // Cleanup
          await testDb.getPrismaClient().alert.deleteMany({
            where: {
              id: { in: createdAlerts.map(a => a.id) }
            }
          });

          return results;
        });

        expect(memoryDelta).toBeLessThan(this.performanceThresholds.maxMemoryUsage);
        expect(result).toBeDefined();
      });

      it('should properly cleanup resources', async () => {
        const initialConnections = process.listenerCount('beforeExit');
        
        // Perform operations that create resources
        const user = await testDb.createUser();
        const token = await jwt.createUserToken(user.id, user.email);

        await Promise.all(
          Array(50).fill(null).map(() =>
            request(this.app)
              .get(endpoint)
              .set('Authorization', `Bearer ${token}`)
          )
        );

        await testDb.cleanupUser(user.id);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        const finalConnections = process.listenerCount('beforeExit');
        
        // Should not have accumulated listeners
        expect(finalConnections).toBeLessThanOrEqual(initialConnections + 1);
      });
    });
  }

  // Alert Matching Performance Tests
  async testAlertMatchingPerformance(): Promise<void> {
    describe('Alert Matching Performance', () => {
      it('should handle large scale alert matching efficiently', async () => {
        // Create test users with preferences
        const users = await Promise.all(
          Array(100).fill(null).map(async () => {
            const user = await testDb.createUser();
            await testDb.createAlertPreference(user.id);
            return user;
          })
        );

        // Create alerts
        const alerts = await Promise.all(
          dataGenerator.generateBulkAlerts(1000).map(alert => testDb.createAlert(alert))
        );

        const { duration } = await perfHelper.measureExecutionTime(async () => {
          // Simulate alert matching for all alerts
          const matchPromises = alerts.slice(0, 100).map(alert => // Limit for testing
            testDb.getPrismaClient().user.findMany({
              where: {
                alertPreferences: {
                  some: {
                    alertTypes: { has: alert.alertType },
                    minOpportunityScore: { lte: alert.opportunityScore },
                    maxOpportunityScore: { gte: alert.opportunityScore }
                  }
                }
              },
              take: 50
            })
          );

          return Promise.all(matchPromises);
        });

        // Should complete within reasonable time
        expect(duration).toBeLessThan(5000); // 5 seconds for 100 alerts

        // Cleanup
        await Promise.all(users.map(user => testDb.cleanupUser(user.id)));
        await Promise.all(alerts.map(alert => testDb.cleanupAlert(alert.id)));
      });

      it('should optimize database queries for matching', async () => {
        const user = await testDb.createUser();
        await testDb.createAlertPreference(user.id, {
          preferredCities: ['Toronto', 'Vancouver'],
          alertTypes: ['POWER_OF_SALE'],
          minOpportunityScore: 70
        });

        // Create alerts that match and don't match
        const matchingAlert = await testDb.createAlert({
          city: 'Toronto',
          alertType: 'POWER_OF_SALE',
          opportunityScore: 80
        });

        const nonMatchingAlert = await testDb.createAlert({
          city: 'Calgary',
          alertType: 'ESTATE_SALE',
          opportunityScore: 60
        });

        const { duration } = await perfHelper.measureExecutionTime(async () => {
          return testDb.getPrismaClient().alert.findMany({
            where: {
              city: { in: ['Toronto', 'Vancouver'] },
              alertType: 'POWER_OF_SALE',
              opportunityScore: { gte: 70 }
            }
          });
        });

        expect(duration).toBeLessThan(50); // Should be very fast with proper indexing

        await testDb.cleanupUser(user.id);
        await testDb.cleanupAlert(matchingAlert.id);
        await testDb.cleanupAlert(nonMatchingAlert.id);
      });
    });
  }

  // Stress Testing
  async testStressLimits(endpoint: string): Promise<void> {
    describe('Stress Testing', () => {
      it('should gracefully handle extreme load', async () => {
        const extremeLoad = 1000;
        const user = await testDb.createUser();
        const token = await jwt.createUserToken(user.id, user.email);

        const startTime = performance.now();

        // Create extreme concurrent load
        const requests = Array(extremeLoad).fill(null).map(async () => {
          try {
            const response = await request(this.app)
              .get(endpoint)
              .set('Authorization', `Bearer ${token}`)
              .timeout(10000); // 10 second timeout

            return { success: true, status: response.status };
          } catch (error) {
            return { success: false, error: error.message };
          }
        });

        const results = await Promise.all(requests);
        const endTime = performance.now();

        const executionTime = endTime - startTime;
        const successfulRequests = results.filter(r => r.success);
        const successRate = successfulRequests.length / results.length;

        // Under extreme stress, some failures are acceptable
        expect(successRate).toBeGreaterThan(0.7); // 70% success rate minimum
        expect(executionTime).toBeLessThan(60000); // Should complete within 60 seconds

        // But server should not crash
        const healthResponse = await request(this.app).get('/api/health');
        expect(healthResponse.status).toBe(200);

        await testDb.cleanupUser(user.id);
      });

      it('should recover from resource exhaustion', async () => {
        // Simulate resource exhaustion
        const user = await testDb.createUser();
        const token = await jwt.createUserToken(user.id, user.email);

        // Create many concurrent long-running requests
        const heavyRequests = Array(50).fill(null).map(() =>
          request(this.app)
            .get('/api/alerts?limit=1000') // Large data request
            .set('Authorization', `Bearer ${token}`)
        );

        try {
          await Promise.all(heavyRequests);
        } catch (error) {
          // Some requests may fail due to resource limits
        }

        // Wait for recovery
        await sleep(2000);

        // Server should be responsive again
        const recoveryResponse = await request(this.app)
          .get('/api/health')
          .timeout(5000);

        expect(recoveryResponse.status).toBe(200);

        await testDb.cleanupUser(user.id);
      });
    });
  }

  // Performance Regression Tests
  async testPerformanceRegression(endpoint: string, baselineMetrics?: PerformanceMetrics): Promise<void> {
    describe('Performance Regression', () => {
      it('should not regress from baseline performance', async () => {
        const user = await testDb.createUser();
        const token = await jwt.createUserToken(user.id, user.email);

        const iterations = 20;
        const durations: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const { duration } = await perfHelper.measureExecutionTime(async () => {
            return request(this.app)
              .get(endpoint)
              .set('Authorization', `Bearer ${token}`);
          });
          durations.push(duration);
          
          // Small delay between requests
          await sleep(10);
        }

        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const p95Duration = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];

        // Compare against baseline if provided
        if (baselineMetrics) {
          expect(avgDuration).toBeLessThan(baselineMetrics.avgResponseTime * 1.2); // 20% tolerance
          expect(p95Duration).toBeLessThan(baselineMetrics.p95ResponseTime * 1.2);
        } else {
          // Use general thresholds
          expect(avgDuration).toBeLessThan(this.performanceThresholds.apiResponseTime);
          expect(p95Duration).toBeLessThan(this.performanceThresholds.apiResponseTime * 2);
        }

        await testDb.cleanupUser(user.id);
      });
    });
  }

  // Generate performance report
  async generatePerformanceReport(endpoint: string): Promise<PerformanceReport> {
    const user = await testDb.createUser();
    const token = await jwt.createUserToken(user.id, user.email);

    const iterations = 100;
    const results: Array<{ duration: number; memoryUsed: number; status: number }> = [];

    for (let i = 0; i < iterations; i++) {
      const initialMemory = process.memoryUsage().heapUsed;
      
      const { result: response, duration } = await perfHelper.measureExecutionTime(async () => {
        return request(this.app)
          .get(endpoint)
          .set('Authorization', `Bearer ${token}`);
      });

      const finalMemory = process.memoryUsage().heapUsed;
      
      results.push({
        duration,
        memoryUsed: finalMemory - initialMemory,
        status: response.status
      });

      await sleep(10); // Small delay
    }

    await testDb.cleanupUser(user.id);

    const durations = results.map(r => r.duration).sort((a, b) => a - b);
    const successfulRequests = results.filter(r => r.status < 400);

    return {
      endpoint,
      totalRequests: iterations,
      successfulRequests: successfulRequests.length,
      successRate: successfulRequests.length / iterations,
      avgResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minResponseTime: durations[0],
      maxResponseTime: durations[durations.length - 1],
      p50ResponseTime: durations[Math.floor(durations.length * 0.5)],
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
      avgMemoryUsage: results.reduce((sum, r) => sum + r.memoryUsed, 0) / results.length,
      timestamp: new Date().toISOString()
    };
  }
}

// Interfaces
export interface PerformanceThresholds {
  apiResponseTime: number; // ms
  databaseQueryTime: number; // ms
  maxMemoryUsage: number; // bytes
  concurrentUsers: number;
  requestsPerSecond: number;
  errorRate: number; // percentage (0-1)
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  maxMemoryUsage: number;
  requestsPerSecond: number;
  errorRate: number;
}

export interface PerformanceReport {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  successRate: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  avgMemoryUsage: number;
  timestamp: string;
}

export default PerformanceTestSuite;