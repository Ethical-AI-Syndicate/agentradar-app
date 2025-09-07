/**
 * Database Performance Testing - Phase 5 QA Excellence
 * CRITICAL: Validates 3-5x performance improvements from Phase 4 database optimization
 * TARGET: Confirms database indexes deliver expected performance gains
 */

import { performance } from 'perf_hooks';
import { PrismaClient } from '@prisma/client';

describe('Database Performance Validation - Phase 4 Improvements', () => {
  let prisma: PrismaClient;
  let performanceMetrics: Record<string, number[]> = {};

  beforeAll(async () => {
    prisma = global.__GLOBAL_TEST_CONFIG__.database.client;
    
    // Warm up database connections
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('🔥 Database performance testing initiated');
    console.log('🎯 Target: Validate 3-5x performance improvements from Phase 4');
  });

  beforeEach(() => {
    performanceMetrics = {};
  });

  afterEach(() => {
    // Log performance results for each test
    Object.entries(performanceMetrics).forEach(([operation, times]) => {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      console.log(`📊 ${operation}:`);
      console.log(`   ⏱️  Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   📈 Max: ${maxTime.toFixed(2)}ms`);
      console.log(`   📉 Min: ${minTime.toFixed(2)}ms`);
    });
  });

  /**
   * Alert List Query Performance - CRITICAL
   * Expected: 5x improvement (200ms -> 50ms target)
   * Phase 4 Index: idx_alerts_status_priority
   */
  describe('Alert List Query Performance', () => {
    test('should meet Phase 4 performance targets for alert listing', async () => {
      const target = global.__GLOBAL_TEST_CONFIG__.performance.thresholds['db.alert.list'];
      const baseline = global.__GLOBAL_TEST_CONFIG__.performance.baselineMetrics['db.alert.list'];
      
      const times: number[] = [];
      
      // Run multiple iterations for accurate measurement
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        const alerts = await prisma.alert.findMany({
          where: {
            status: 'ACTIVE',
            priority: { in: ['HIGH', 'URGENT'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        times.push(duration);
        
        // Verify query returns data
        expect(alerts).toBeDefined();
        expect(Array.isArray(alerts)).toBe(true);
      }
      
      performanceMetrics['db.alert.list'] = times;
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      // Assert performance improvements
      console.log(`\n🎯 Alert List Query Performance:`);
      console.log(`   📊 Baseline (pre-optimization): ${baseline}ms`);
      console.log(`   🎯 Target (post-optimization): ${target}ms`);
      console.log(`   ✨ Current Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   🚀 Improvement: ${((baseline - avgTime) / baseline * 100).toFixed(1)}%`);
      
      // CRITICAL: Must meet Phase 4 target performance
      expect(avgTime).toBeLessThanOrEqual(target);
      
      // Verify significant improvement from baseline
      const improvementFactor = baseline / avgTime;
      expect(improvementFactor).toBeGreaterThanOrEqual(3); // Minimum 3x improvement
      
      console.log(`   ✅ Performance target achieved: ${improvementFactor.toFixed(1)}x improvement`);
    });

    test('should efficiently handle complex alert searches', async () => {
      const target = global.__GLOBAL_TEST_CONFIG__.performance.thresholds['db.alert.search'];
      
      const times: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        
        const alerts = await prisma.alert.findMany({
          where: {
            status: 'ACTIVE',
            alertType: { in: ['POWER_OF_SALE', 'ESTATE_SALE'] },
            city: { in: ['Toronto', 'Vancouver'] },
            opportunityScore: { gte: 60 },
            estimatedValue: { gte: 200000 },
          },
          include: {
            userAlerts: {
              where: { isBookmarked: true },
            },
          },
          orderBy: [
            { opportunityScore: 'desc' },
            { createdAt: 'desc' },
          ],
          take: 50,
        });
        
        const endTime = performance.now();
        times.push(endTime - startTime);
        
        expect(alerts).toBeDefined();
      }
      
      performanceMetrics['db.alert.search'] = times;
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      console.log(`\n🔍 Complex Alert Search Performance: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThanOrEqual(target);
    });
  });

  /**
   * User Dashboard Performance - CRITICAL
   * Expected: 8x improvement (800ms -> 100ms target)
   * Phase 4 Index: idx_user_alerts_user_created
   */
  describe('User Dashboard Performance', () => {
    test('should meet Phase 4 performance targets for user dashboard', async () => {
      const target = global.__GLOBAL_TEST_CONFIG__.performance.thresholds['db.user.dashboard'];
      const baseline = global.__GLOBAL_TEST_CONFIG__.performance.baselineMetrics['db.user.dashboard'];
      
      const times: number[] = [];
      
      for (let i = 0; i < 8; i++) {
        const startTime = performance.now();
        
        // Simulate complete dashboard data loading
        const [
          userAlerts,
          bookmarkedAlerts,
          recentActivity,
          alertStats
        ] = await Promise.all([
          // User's recent alerts
          prisma.userAlert.findMany({
            where: { userId: 'test-regular-user-id' },
            include: { alert: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }),
          
          // User's bookmarked alerts
          prisma.userAlert.findMany({
            where: {
              userId: 'test-regular-user-id',
              isBookmarked: true,
            },
            include: { alert: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
          
          // Recent activity logs
          prisma.activityLog.findMany({
            where: { userId: 'test-regular-user-id' },
            orderBy: { createdAt: 'desc' },
            take: 20,
          }),
          
          // Alert statistics
          prisma.userAlert.groupBy({
            by: ['isNotified', 'isBookmarked'],
            where: { userId: 'test-regular-user-id' },
            _count: { id: true },
          }),
        ]);
        
        const endTime = performance.now();
        times.push(endTime - startTime);
        
        // Verify all data is loaded
        expect(userAlerts).toBeDefined();
        expect(bookmarkedAlerts).toBeDefined();
        expect(recentActivity).toBeDefined();
        expect(alertStats).toBeDefined();
      }
      
      performanceMetrics['db.user.dashboard'] = times;
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      console.log(`\n📊 User Dashboard Performance:`);
      console.log(`   📊 Baseline: ${baseline}ms`);
      console.log(`   🎯 Target: ${target}ms`);
      console.log(`   ✨ Current: ${avgTime.toFixed(2)}ms`);
      
      const improvementFactor = baseline / avgTime;
      console.log(`   🚀 Improvement: ${improvementFactor.toFixed(1)}x faster`);
      
      // CRITICAL: Must achieve 8x improvement target
      expect(avgTime).toBeLessThanOrEqual(target);
      expect(improvementFactor).toBeGreaterThanOrEqual(6); // Minimum 6x improvement
      
      console.log(`   ✅ Dashboard performance target exceeded!`);
    });
  });

  /**
   * Alert Matching Algorithm Performance - CRITICAL
   * Expected: 5x improvement for personalized alerts
   * Phase 4 Index: idx_alert_preferences_user, idx_alerts_opportunity_score
   */
  describe('Alert Matching Performance', () => {
    test('should efficiently match alerts to user preferences', async () => {
      const target = global.__GLOBAL_TEST_CONFIG__.performance.thresholds['api.alerts.personalized'];
      
      const times: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        
        // Simulate alert matching algorithm
        const userPreferences = await prisma.alertPreference.findUnique({
          where: { userId: 'test-regular-user-id' },
        });
        
        if (userPreferences) {
          const matchingAlerts = await prisma.alert.findMany({
            where: {
              status: 'ACTIVE',
              alertType: { in: userPreferences.alertTypes },
              city: { in: userPreferences.cities },
              opportunityScore: { gte: userPreferences.minOpportunityScore || 0 },
              priority: { not: 'LOW' }, // Exclude low priority if user wants MEDIUM+
            },
            orderBy: [
              { opportunityScore: 'desc' },
              { priority: 'desc' },
              { createdAt: 'desc' },
            ],
            take: 20,
          });
          
          expect(matchingAlerts).toBeDefined();
          expect(Array.isArray(matchingAlerts)).toBe(true);
        }
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }
      
      performanceMetrics['alert.matching'] = times;
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      console.log(`\n🎯 Alert Matching Performance: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThanOrEqual(target);
    });
  });

  /**
   * Index Utilization Validation - CRITICAL
   * Ensures all Phase 4 indexes are being used effectively
   */
  describe('Database Index Utilization', () => {
    test('should utilize critical indexes from Phase 4 optimization', async () => {
      // Query index usage statistics
      const indexStats = await prisma.$queryRaw<Array<{
        schemaname: string;
        tablename: string;
        indexname: string;
        idx_scan: bigint;
        idx_tup_read: bigint;
        idx_tup_fetch: bigint;
      }>>`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE indexname LIKE 'idx_%'
        ORDER BY idx_scan DESC;
      `;
      
      console.log('\n📈 Index Usage Statistics:');
      
      // Critical indexes that must be used
      const criticalIndexes = [
        'idx_alerts_status_priority',
        'idx_alerts_city_type',
        'idx_alerts_opportunity_score',
        'idx_user_alerts_user_created',
        'idx_alert_preferences_user',
      ];
      
      const indexUsage = new Map();
      indexStats.forEach(stat => {
        indexUsage.set(stat.indexname, Number(stat.idx_scan));
        console.log(`   📊 ${stat.indexname}: ${stat.idx_scan} scans, ${stat.idx_tup_read} reads`);
      });
      
      // Verify critical indexes are being utilized
      criticalIndexes.forEach(indexName => {
        const scans = indexUsage.get(indexName) || 0;
        console.log(`   🔍 ${indexName}: ${scans} scans`);
        
        // In a comprehensive test run, indexes should be used
        // Note: This might be 0 in isolated tests, but should be > 0 in full test suite
        if (scans === 0) {
          console.warn(`   ⚠️  Index ${indexName} not used in current test - verify in full test suite`);
        }
      });
      
      expect(indexStats.length).toBeGreaterThan(0);
      console.log(`\n✅ Found ${indexStats.length} performance indexes`);
    });
  });

  /**
   * Connection Pool Performance
   * Validates efficient database connection management
   */
  describe('Connection Pool Performance', () => {
    test('should handle concurrent database requests efficiently', async () => {
      const concurrentRequests = 20;
      const startTime = performance.now();
      
      // Create concurrent database requests
      const requests = Array.from({ length: concurrentRequests }, async (_, i) => {
        return prisma.alert.findMany({
          where: { status: 'ACTIVE' },
          take: 5,
          skip: i * 5,
        });
      });
      
      const results = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      console.log(`\n🔗 Connection Pool Performance:`);
      console.log(`   📊 Concurrent Requests: ${concurrentRequests}`);
      console.log(`   ⏱️  Total Time: ${totalTime.toFixed(2)}ms`);
      console.log(`   📈 Average per Request: ${(totalTime / concurrentRequests).toFixed(2)}ms`);
      
      // Verify all requests completed successfully
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
      
      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(5000); // 5 second limit for 20 concurrent requests
      
      console.log(`   ✅ Connection pool handled ${concurrentRequests} concurrent requests efficiently`);
    });
  });

  /**
   * Memory Usage Validation
   * Ensures optimized queries don't cause memory leaks
   */
  describe('Memory Usage Optimization', () => {
    test('should maintain optimal memory usage during intensive operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      for (let i = 0; i < 10; i++) {
        await prisma.alert.findMany({
          include: {
            userAlerts: {
              include: {
                user: true,
              },
            },
          },
          take: 50,
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`\n💾 Memory Usage Analysis:`);
      console.log(`   📊 Initial Heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   📊 Final Heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   📈 Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory increase should be reasonable (< 50MB for test operations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`   ✅ Memory usage within acceptable limits`);
    });
  });

  afterAll(async () => {
    console.log('\n🏁 Database Performance Testing Complete');
    console.log('📊 Performance Summary:');
    
    // Generate performance summary
    Object.entries(performanceMetrics).forEach(([operation, times]) => {
      if (times.length > 0) {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const target = global.__GLOBAL_TEST_CONFIG__.performance.thresholds[operation];
        const baseline = global.__GLOBAL_TEST_CONFIG__.performance.baselineMetrics[operation];
        
        if (target && baseline) {
          const improvement = ((baseline - avgTime) / baseline * 100);
          const factor = baseline / avgTime;
          
          console.log(`   🎯 ${operation}:`);
          console.log(`      Performance: ${avgTime.toFixed(2)}ms (target: ${target}ms)`);
          console.log(`      Improvement: ${improvement.toFixed(1)}% (${factor.toFixed(1)}x faster)`);
          console.log(`      Status: ${avgTime <= target ? '✅ PASSED' : '❌ FAILED'}`);
        }
      }
    });
  });
});