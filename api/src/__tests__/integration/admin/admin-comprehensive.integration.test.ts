/**
 * Comprehensive Admin API Integration Tests
 * 
 * Demonstrates the full testing framework capabilities including:
 * - Custom matchers
 * - Security testing integration
 * - Performance monitoring
 * - Test helpers usage
 * - Proper cleanup patterns
 */

import request from 'supertest';
import app from '../../../index';
import { 
  testDb, 
  jwt, 
  ApiTestHelper,
  SecurityTestSuite,
  PerformanceTestSuite,
  dataGenerator,
  perfHelper,
  sleep 
} from '../../helpers/test-helpers';

describe('Admin API - Comprehensive Integration Tests', () => {
  let apiHelper: ApiTestHelper;
  let securitySuite: SecurityTestSuite;
  let performanceSuite: PerformanceTestSuite;

  beforeAll(() => {
    apiHelper = new ApiTestHelper(app);
    securitySuite = new SecurityTestSuite(app);
    performanceSuite = new PerformanceTestSuite(app);
  });

  describe('User Management', () => {
    describe('GET /api/admin/users', () => {
      it('should list users with pagination', async () => {
        const admin = await testDb.createUser({ role: 'ADMIN' });
        const token = await jwt.createAdminToken(admin.id, admin.email);

        // Create test users
        const testUsers = await Promise.all(
          dataGenerator.generateBulkUsers(5).map(userData => testDb.createUser(userData))
        );

        const response = await request(app)
          .get('/api/admin/users?page=1&limit=3')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body).toHaveValidPagination();
        expect(response.body.data).toHaveLength(3);
        expect(response.body.pagination).toMatchObject({
          page: 1,
          limit: 3,
          total: expect.any(Number),
          totalPages: expect.any(Number)
        });

        // Each user should match the schema
        response.body.data.forEach((user: any) => {
          expect(user).toMatchUserSchema();
        });

        // Cleanup
        await testDb.cleanupUser(admin.id);
        await Promise.all(testUsers.map(user => testDb.cleanupUser(user.id)));
      });

      it('should require admin authentication', async () => {
        await apiHelper.testAuthentication('/api/admin/users');
      });

      it('should require admin role', async () => {
        const user = await testDb.createUser({ role: 'USER' });
        const token = await jwt.createUserToken(user.id, user.email, 'USER');

        await apiHelper.testAuthorization('/api/admin/users', token);
        await testDb.cleanupUser(user.id);
      });

      it('should filter users by subscription tier', async () => {
        const admin = await testDb.createUser({ role: 'ADMIN' });
        const token = await jwt.createAdminToken(admin.id, admin.email);

        // Create users with different subscription tiers
        const freeUser = await testDb.createUser({ subscriptionTier: 'FREE' });
        const proUser = await testDb.createUser({ subscriptionTier: 'PROFESSIONAL' });

        const response = await request(app)
          .get('/api/admin/users?subscriptionTier=FREE')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        response.body.data.forEach((user: any) => {
          expect(user.subscriptionTier).toBeValidSubscriptionTier();
          expect(user.subscriptionTier).toBe('FREE');
        });

        // Cleanup
        await testDb.cleanupUser(admin.id);
        await testDb.cleanupUser(freeUser.id);
        await testDb.cleanupUser(proUser.id);
      });

      it('should handle performance requirements', async () => {
        const admin = await testDb.createUser({ role: 'ADMIN' });
        const token = await jwt.createAdminToken(admin.id, admin.email);

        // Create bulk users for performance testing
        const bulkUsers = await Promise.all(
          dataGenerator.generateBulkUsers(100).map(userData => testDb.createUser(userData))
        );

        const { result: response, duration } = await perfHelper.measureExecutionTime(async () => {
          return request(app)
            .get('/api/admin/users?limit=50')
            .set('Authorization', `Bearer ${token}`);
        });

        expect(response.status).toBe(200);
        expect(duration).toBeLessThan(200); // Should respond within 200ms
        expect(response.body.data).toHaveLength(50);

        // Cleanup
        await testDb.cleanupUser(admin.id);
        await Promise.all(bulkUsers.map(user => testDb.cleanupUser(user.id)));
      });
    });

    describe('PUT /api/admin/users/:id/suspend', () => {
      it('should suspend user account', async () => {
        const admin = await testDb.createUser({ role: 'ADMIN' });
        const user = await testDb.createUser({ role: 'USER', isActive: true });
        const adminToken = await jwt.createAdminToken(admin.id, admin.email);

        const suspensionReason = 'Policy violation - automated test';

        const response = await request(app)
          .put(`/api/admin/users/${user.id}/suspend`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: suspensionReason })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          user: {
            id: user.id,
            isActive: false,
            suspendedAt: expect.any(String),
            suspendedBy: admin.id
          }
        });

        // Verify user cannot authenticate after suspension
        const userToken = await jwt.createUserToken(user.id, user.email);
        const authResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(authResponse.body.error).toContain('suspended');

        // Cleanup
        await testDb.cleanupUser(admin.id);
        await testDb.cleanupUser(user.id);
      });

      it('should log admin action', async () => {
        const admin = await testDb.createUser({ role: 'ADMIN' });
        const user = await testDb.createUser({ role: 'USER' });
        const adminToken = await jwt.createAdminToken(admin.id, admin.email);

        await request(app)
          .put(`/api/admin/users/${user.id}/suspend`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Test suspension' })
          .expect(200);

        // Verify admin action was logged
        const adminActions = await testDb.getPrismaClient().adminAction.findMany({
          where: {
            adminId: admin.id,
            action: 'SUSPEND_USER',
            targetId: user.id
          }
        });

        expect(adminActions).toHaveLength(1);
        expect(adminActions[0]).toMatchObject({
          adminId: admin.id,
          action: 'SUSPEND_USER',
          targetType: 'USER',
          targetId: user.id,
          details: expect.objectContaining({
            reason: 'Test suspension'
          })
        });

        // Cleanup
        await testDb.cleanupUser(admin.id);
        await testDb.cleanupUser(user.id);
      });

      it('should validate suspension reason', async () => {
        const admin = await testDb.createUser({ role: 'ADMIN' });
        const user = await testDb.createUser({ role: 'USER' });
        const adminToken = await jwt.createAdminToken(admin.id, admin.email);

        // Test missing reason
        const response = await request(app)
          .put(`/api/admin/users/${user.id}/suspend`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(400);

        expect(response.body).toMatchApiErrorFormat();
        expect(response.body.error).toContain('reason');

        // Test empty reason
        const emptyReasonResponse = await request(app)
          .put(`/api/admin/users/${user.id}/suspend`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: '' })
          .expect(400);

        expect(emptyReasonResponse.body).toMatchApiErrorFormat();

        // Cleanup
        await testDb.cleanupUser(admin.id);
        await testDb.cleanupUser(user.id);
      });
    });

    describe('POST /api/admin/users/:id/unsuspend', () => {
      it('should unsuspend user account', async () => {
        const admin = await testDb.createUser({ role: 'ADMIN' });
        const user = await testDb.createUser({ role: 'USER', isActive: false });
        const adminToken = await jwt.createAdminToken(admin.id, admin.email);

        const response = await request(app)
          .post(`/api/admin/users/${user.id}/unsuspend`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          user: {
            id: user.id,
            isActive: true,
            unsuspendedAt: expect.any(String),
            unsuspendedBy: admin.id
          }
        });

        // Verify user can authenticate after unsuspension
        const userToken = await jwt.createUserToken(user.id, user.email);
        const authResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(authResponse.body.user).toMatchUserSchema();

        // Cleanup
        await testDb.cleanupUser(admin.id);
        await testDb.cleanupUser(user.id);
      });
    });
  });

  describe('System Analytics', () => {
    describe('GET /api/admin/analytics/dashboard', () => {
      it('should return dashboard metrics', async () => {
        const admin = await testDb.createUser({ role: 'ADMIN' });
        const adminToken = await jwt.createAdminToken(admin.id, admin.email);

        // Create test data for metrics
        const testUsers = await Promise.all([
          testDb.createUser({ subscriptionTier: 'FREE' }),
          testDb.createUser({ subscriptionTier: 'PROFESSIONAL' }),
          testDb.createUser({ subscriptionTier: 'TEAM_ENTERPRISE' })
        ]);

        const testAlerts = await Promise.all([
          testDb.createAlert({ status: 'ACTIVE', priority: 'HIGH' }),
          testDb.createAlert({ status: 'ACTIVE', priority: 'MEDIUM' }),
          testDb.createAlert({ status: 'RESOLVED', priority: 'LOW' })
        ]);

        const response = await request(app)
          .get('/api/admin/analytics/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          users: {
            total: expect.any(Number),
            active: expect.any(Number),
            bySubscriptionTier: expect.any(Object)
          },
          alerts: {
            total: expect.any(Number),
            active: expect.any(Number),
            byPriority: expect.any(Object),
            byStatus: expect.any(Object)
          },
          system: {
            uptime: expect.any(Number),
            memoryUsage: expect.any(Object),
            databaseConnections: expect.any(Number)
          }
        });

        // Verify metrics are accurate
        expect(response.body.users.total).toBeGreaterThanOrEqual(testUsers.length);
        expect(response.body.alerts.total).toBeGreaterThanOrEqual(testAlerts.length);

        // Cleanup
        await testDb.cleanupUser(admin.id);
        await Promise.all(testUsers.map(user => testDb.cleanupUser(user.id)));
        await Promise.all(testAlerts.map(alert => testDb.cleanupAlert(alert.id)));
      });

      it('should support date range filtering', async () => {
        const admin = await testDb.createUser({ role: 'ADMIN' });
        const adminToken = await jwt.createAdminToken(admin.id, admin.email);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // 7 days ago
        const endDate = new Date();

        const response = await request(app)
          .get('/api/admin/analytics/dashboard')
          .query({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          })
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.dateRange).toMatchObject({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

        await testDb.cleanupUser(admin.id);
      });
    });
  });

  describe('Security Testing Integration', () => {
    describe('Admin endpoints security', () => {
      securitySuite.testJWTSecurity('/api/admin/users');
      securitySuite.testAuthorization('/api/admin/users', 'ADMIN');
      securitySuite.testRateLimiting('/api/admin/users', 50); // Higher limit for admin endpoints
      
      it('should prevent privilege escalation', async () => {
        const user = await testDb.createUser({ role: 'USER' });
        const admin = await testDb.createUser({ role: 'ADMIN' });
        const userToken = await jwt.createUserToken(user.id, user.email, 'USER');

        // User tries to promote themselves to admin
        const response = await request(app)
          .put(`/api/admin/users/${user.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ role: 'ADMIN' })
          .expect(403);

        expect(response.body).toMatchApiErrorFormat();
        expect(response.body.error).toContain('permission');

        // Verify user role hasn't changed
        const updatedUser = await testDb.getPrismaClient().user.findUnique({
          where: { id: user.id }
        });
        expect(updatedUser?.role).toBe('USER');

        await testDb.cleanupUser(user.id);
        await testDb.cleanupUser(admin.id);
      });
    });

    describe('Input validation security', () => {
      securitySuite.testSQLInjectionPrevention('/api/admin/users', ['email', 'firstName', 'lastName']);
      securitySuite.testXSSPrevention('/api/admin/system-settings', ['key', 'value', 'description']);
    });
  });

  describe('Performance Testing Integration', () => {
    describe('Admin dashboard performance', () => {
      it('should meet performance requirements under load', async () => {
        const admin = await testDb.createUser({ role: 'ADMIN' });
        const adminToken = await jwt.createAdminToken(admin.id, admin.email);

        // Create substantial test data
        const users = await Promise.all(
          dataGenerator.generateBulkUsers(500).map(userData => testDb.createUser(userData))
        );
        const alerts = await Promise.all(
          dataGenerator.generateBulkAlerts(1000).map(alertData => testDb.createAlert(alertData))
        );

        // Test concurrent dashboard requests
        const concurrentRequests = 10;
        const requests = Array(concurrentRequests).fill(null).map(async () => {
          const { result, duration } = await perfHelper.measureExecutionTime(async () => {
            return request(app)
              .get('/api/admin/analytics/dashboard')
              .set('Authorization', `Bearer ${adminToken}`);
          });
          return { response: result, duration };
        });

        const results = await Promise.all(requests);

        // Verify all requests succeeded
        results.forEach(({ response, duration }) => {
          expect(response.status).toBe(200);
          expect(duration).toBeLessThan(500); // 500ms for complex dashboard
        });

        // Calculate average response time
        const avgDuration = results.reduce((sum, { duration }) => sum + duration, 0) / results.length;
        expect(avgDuration).toBeLessThan(300);

        // Cleanup
        await testDb.cleanupUser(admin.id);
        await Promise.all(users.map(user => testDb.cleanupUser(user.id)));
        await Promise.all(alerts.map(alert => testDb.cleanupAlert(alert.id)));
      });
    });

    describe('Admin operations performance', () => {
      it('should handle bulk user operations efficiently', async () => {
        const admin = await testDb.createUser({ role: 'ADMIN' });
        const adminToken = await jwt.createAdminToken(admin.id, admin.email);

        // Create users for bulk operations
        const testUsers = await Promise.all(
          dataGenerator.generateBulkUsers(50).map(userData => testDb.createUser(userData))
        );

        const { duration } = await perfHelper.measureExecutionTime(async () => {
          // Simulate bulk suspend operation
          const suspendPromises = testUsers.slice(0, 10).map(user =>
            request(app)
              .put(`/api/admin/users/${user.id}/suspend`)
              .set('Authorization', `Bearer ${adminToken}`)
              .send({ reason: 'Bulk test suspension' })
          );

          await Promise.all(suspendPromises);
        });

        expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

        // Cleanup
        await testDb.cleanupUser(admin.id);
        await Promise.all(testUsers.map(user => testDb.cleanupUser(user.id)));
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent user operations', async () => {
      const admin = await testDb.createUser({ role: 'ADMIN' });
      const adminToken = await jwt.createAdminToken(admin.id, admin.email);
      const fakeUserId = 'non-existent-user-id';

      const response = await request(app)
        .put(`/api/admin/users/${fakeUserId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' })
        .expect(404);

      expect(response.body).toMatchApiErrorFormat();
      expect(response.body.error).toContain('User not found');

      await testDb.cleanupUser(admin.id);
    });

    it('should handle database connection failures gracefully', async () => {
      const admin = await testDb.createUser({ role: 'ADMIN' });
      const adminToken = await jwt.createAdminToken(admin.id, admin.email);

      // Mock database error
      const originalQuery = testDb.getPrismaClient().user.findMany;
      jest.spyOn(testDb.getPrismaClient().user, 'findMany')
        .mockRejectedValueOnce(new Error('Database connection lost'));

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body).toMatchApiErrorFormat();
      expect(response.body.error).toContain('server error');

      // Restore original function
      testDb.getPrismaClient().user.findMany = originalQuery;

      await testDb.cleanupUser(admin.id);
    });

    it('should validate concurrent operations', async () => {
      const admin = await testDb.createUser({ role: 'ADMIN' });
      const user = await testDb.createUser({ role: 'USER' });
      const adminToken = await jwt.createAdminToken(admin.id, admin.email);

      // Attempt concurrent suspend/unsuspend operations
      const suspendPromise = request(app)
        .put(`/api/admin/users/${user.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Concurrent test 1' });

      const unsuspendPromise = request(app)
        .post(`/api/admin/users/${user.id}/unsuspend`)
        .set('Authorization', `Bearer ${adminToken}`);

      const [suspendResponse, unsuspendResponse] = await Promise.all([
        suspendPromise,
        unsuspendPromise
      ]);

      // One should succeed, one should fail or both should handle the race condition appropriately
      const responses = [suspendResponse, unsuspendResponse];
      const successfulResponses = responses.filter(r => r.status < 400);
      const errorResponses = responses.filter(r => r.status >= 400);

      expect(successfulResponses.length + errorResponses.length).toBe(2);
      
      // At least one operation should succeed
      expect(successfulResponses.length).toBeGreaterThanOrEqual(1);

      await testDb.cleanupUser(admin.id);
      await testDb.cleanupUser(user.id);
    });
  });

  describe('Integration with Business Logic', () => {
    it('should integrate with alert matching when user status changes', async () => {
      const admin = await testDb.createUser({ role: 'ADMIN' });
      const user = await testDb.createUser({ role: 'USER' });
      const adminToken = await jwt.createAdminToken(admin.id, admin.email);

      // Create user preferences and matching alert
      const preferences = await testDb.createAlertPreference(user.id);
      const alert = await testDb.createAlert({
        city: preferences.preferredCities[0],
        alertType: preferences.alertTypes[0],
        opportunityScore: preferences.minOpportunityScore + 10
      });

      // Initially user should be matched
      const initialMatches = await testDb.getPrismaClient().user.findMany({
        where: {
          id: user.id,
          isActive: true,
          alertPreferences: {
            some: {
              alertTypes: { has: alert.alertType }
            }
          }
        }
      });
      expect(initialMatches).toHaveLength(1);

      // Suspend user
      await request(app)
        .put(`/api/admin/users/${user.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Integration test' })
        .expect(200);

      // User should no longer be matched for alerts
      const postSuspendMatches = await testDb.getPrismaClient().user.findMany({
        where: {
          id: user.id,
          isActive: true,
          alertPreferences: {
            some: {
              alertTypes: { has: alert.alertType }
            }
          }
        }
      });
      expect(postSuspendMatches).toHaveLength(0);

      // Cleanup
      await testDb.cleanupUser(admin.id);
      await testDb.cleanupUser(user.id);
      await testDb.cleanupAlert(alert.id);
    });
  });
});

// This test file demonstrates:
// 1. Comprehensive API testing with real database
// 2. Integration of security testing patterns
// 3. Performance testing within integration tests
// 4. Custom matchers for domain-specific assertions
// 5. Proper cleanup patterns to prevent test pollution
// 6. Edge case and error condition testing
// 7. Business logic integration testing
// 8. Concurrent operation testing
// 9. Mock usage for error scenarios
// 10. Performance measurement and validation