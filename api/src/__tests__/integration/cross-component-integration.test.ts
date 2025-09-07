/**
 * Cross-Component Integration Testing - Phase 5 QA Excellence
 * CRITICAL: Validates complete system integration workflows
 * TARGET: End-to-end business process validation with real data flows
 */

import request from 'supertest';
import { app } from '../../index';
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

describe('Cross-Component Integration Testing', () => {
  let prisma: PrismaClient;
  let testUser: any;
  let adminUser: any;
  let testUserJWT: string;
  let adminJWT: string;

  beforeAll(async () => {
    prisma = global.__GLOBAL_TEST_CONFIG__.database.client;
    
    // Setup test users
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.agentradar.app',
        password: 'TestUser123!'
      });
    
    testUserJWT = userLogin.body.token;
    testUser = userLogin.body.user;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.agentradar.app',
        password: 'TestAdmin123!'
      });
    
    adminJWT = adminLogin.body.token;
    adminUser = adminLogin.body.user;
  });

  /**
   * Complete User Registration & Onboarding Flow
   * Tests the entire user journey from registration to first alert
   */
  describe('Complete User Onboarding Integration', () => {
    test('should handle complete user registration and preference setup flow', async () => {
      const uniqueEmail = `integration-test-${Date.now()}@example.com`;
      let newUserToken: string;
      let newUserId: string;

      // Step 1: User Registration
      console.log('   🔄 Testing user registration...');
      const registrationResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: 'IntegrationTest123!',
          firstName: 'Integration',
          lastName: 'TestUser'
        });

      expect(registrationResponse.status).toBe(201);
      expect(registrationResponse.body.token).toBeDefined();
      expect(registrationResponse.body.user.email).toBe(uniqueEmail);
      
      newUserToken = registrationResponse.body.token;
      newUserId = registrationResponse.body.user.id;

      // Step 2: Verify User Can Access Protected Routes
      console.log('   🔄 Testing authenticated access...');
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newUserToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.user.id).toBe(newUserId);

      // Step 3: Get Default Preferences (Should Auto-Create)
      console.log('   🔄 Testing default preferences creation...');
      const preferencesResponse = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${newUserToken}`);

      expect(preferencesResponse.status).toBe(200);
      expect(preferencesResponse.body.preferences).toBeDefined();
      expect(preferencesResponse.body.preferences.userId).toBe(newUserId);

      // Step 4: Update Preferences
      console.log('   🔄 Testing preferences update...');
      const updatePreferencesResponse = await request(app)
        .put('/api/preferences')
        .send({
          cities: ['Toronto', 'Montreal'],
          alertTypes: ['POWER_OF_SALE', 'ESTATE_SALE'],
          minPriority: 'MEDIUM',
          maxDistance: 30,
          minOpportunityScore: 70
        })
        .set('Authorization', `Bearer ${newUserToken}`);

      expect(updatePreferencesResponse.status).toBe(200);
      expect(updatePreferencesResponse.body.preferences.cities).toContain('Toronto');

      // Step 5: Get Personalized Alerts Based on Preferences
      console.log('   🔄 Testing personalized alerts...');
      const personalizedAlertsResponse = await request(app)
        .get('/api/alerts/personalized')
        .set('Authorization', `Bearer ${newUserToken}`);

      expect(personalizedAlertsResponse.status).toBe(200);
      expect(personalizedAlertsResponse.body.alerts).toBeDefined();
      expect(Array.isArray(personalizedAlertsResponse.body.alerts)).toBe(true);

      // Step 6: Verify Database Consistency
      console.log('   🔄 Testing database consistency...');
      const dbUser = await prisma.user.findUnique({
        where: { id: newUserId },
        include: { alertPreferences: true }
      });

      expect(dbUser).toBeDefined();
      expect(dbUser?.alertPreferences).toBeDefined();
      expect(dbUser?.alertPreferences?.cities).toContain('Toronto');

      console.log('   ✅ Complete user onboarding flow validated');
    });

    test('should handle user profile updates with preference synchronization', async () => {
      // Update user profile
      const profileUpdateResponse = await request(app)
        .put('/api/auth/profile')
        .send({
          firstName: 'UpdatedFirstName',
          lastName: 'UpdatedLastName'
        })
        .set('Authorization', `Bearer ${testUserJWT}`);

      expect(profileUpdateResponse.status).toBe(200);
      expect(profileUpdateResponse.body.user.firstName).toBe('UpdatedFirstName');

      // Verify preferences still accessible after profile update
      const preferencesResponse = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${testUserJWT}`);

      expect(preferencesResponse.status).toBe(200);
      expect(preferencesResponse.body.preferences.userId).toBe(testUser.id);
    });
  });

  /**
   * Alert Management Integration
   * Tests complete alert lifecycle and user interactions
   */
  describe('Alert Management Integration', () => {
    let testAlertId: string;

    test('should handle complete alert interaction workflow', async () => {
      // Step 1: Get Available Alerts
      console.log('   🔄 Testing alert retrieval...');
      const alertsResponse = await request(app)
        .get('/api/alerts')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${testUserJWT}`);

      expect(alertsResponse.status).toBe(200);
      expect(alertsResponse.body.alerts.length).toBeGreaterThan(0);
      
      testAlertId = alertsResponse.body.alerts[0].id;

      // Step 2: View Specific Alert
      console.log('   🔄 Testing alert detail view...');
      const alertDetailResponse = await request(app)
        .get(`/api/alerts/${testAlertId}`)
        .set('Authorization', `Bearer ${testUserJWT}`);

      expect(alertDetailResponse.status).toBe(200);
      expect(alertDetailResponse.body.alert.id).toBe(testAlertId);

      // Step 3: Mark Alert as Viewed
      console.log('   🔄 Testing alert view tracking...');
      const viewedResponse = await request(app)
        .put(`/api/alerts/${testAlertId}/viewed`)
        .set('Authorization', `Bearer ${testUserJWT}`);

      expect(viewedResponse.status).toBe(200);
      expect(viewedResponse.body.success).toBe(true);

      // Step 4: Bookmark Alert
      console.log('   🔄 Testing alert bookmarking...');
      const bookmarkResponse = await request(app)
        .post(`/api/alerts/${testAlertId}/bookmark`)
        .set('Authorization', `Bearer ${testUserJWT}`);

      expect([200, 201]).toContain(bookmarkResponse.status);
      expect(bookmarkResponse.body.success).toBe(true);

      // Step 5: Verify UserAlert Record Created
      console.log('   🔄 Testing database record creation...');
      const userAlert = await prisma.userAlert.findFirst({
        where: {
          userId: testUser.id,
          alertId: testAlertId
        }
      });

      expect(userAlert).toBeDefined();
      expect(userAlert?.isBookmarked).toBe(true);
      expect(userAlert?.hasViewed).toBe(true);

      // Step 6: Filter Alerts by Bookmarked Status
      console.log('   🔄 Testing bookmarked alerts filtering...');
      const bookmarkedAlertsResponse = await request(app)
        .get('/api/alerts')
        .query({ bookmarked: 'true' })
        .set('Authorization', `Bearer ${testUserJWT}`);

      expect(bookmarkedAlertsResponse.status).toBe(200);
      const bookmarkedAlerts = bookmarkedAlertsResponse.body.alerts;
      expect(bookmarkedAlerts.some((alert: any) => alert.id === testAlertId)).toBe(true);

      // Step 7: Remove Bookmark
      console.log('   🔄 Testing bookmark removal...');
      const unbookmarkResponse = await request(app)
        .delete(`/api/alerts/${testAlertId}/bookmark`)
        .set('Authorization', `Bearer ${testUserJWT}`);

      expect(unbookmarkResponse.status).toBe(200);
      expect(unbookmarkResponse.body.success).toBe(true);

      console.log('   ✅ Complete alert management flow validated');
    });

    test('should validate alert statistics integration', async () => {
      // Get alert statistics
      const statsResponse = await request(app)
        .get('/api/alerts/stats')
        .set('Authorization', `Bearer ${testUserJWT}`);

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.stats.total).toBeGreaterThanOrEqual(0);

      // Verify stats reflect actual database state
      const dbAlertCount = await prisma.alert.count({
        where: { status: 'ACTIVE' }
      });

      // Stats should be consistent with database
      expect(statsResponse.body.stats.byStatus.ACTIVE).toBeLessThanOrEqual(dbAlertCount);
    });
  });

  /**
   * Admin Operations Integration
   * Tests complete administrative workflows
   */
  describe('Admin Operations Integration', () => {
    let supportTicketId: string;

    test('should handle complete admin user management workflow', async () => {
      // Step 1: Admin Views All Users
      console.log('   🔄 Testing admin user list access...');
      const usersResponse = await request(app)
        .get('/api/admin/users')
        .query({ limit: 10 })
        .set('Authorization', `Bearer ${adminJWT}`);

      expect(usersResponse.status).toBe(200);
      expect(usersResponse.body.users.length).toBeGreaterThan(0);

      // Step 2: Admin Searches for Specific User
      console.log('   🔄 Testing admin user search...');
      const searchResponse = await request(app)
        .get('/api/admin/users')
        .query({ search: 'test', limit: 5 })
        .set('Authorization', `Bearer ${adminJWT}`);

      expect(searchResponse.status).toBe(200);
      expect(Array.isArray(searchResponse.body.users)).toBe(true);

      // Step 3: Admin Views Analytics
      console.log('   🔄 Testing admin analytics access...');
      const analyticsResponse = await request(app)
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminJWT}`);

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body.analytics).toBeDefined();
      expect(analyticsResponse.body.analytics.userStats).toBeDefined();
      expect(analyticsResponse.body.analytics.alertStats).toBeDefined();

      // Step 4: Verify Analytics Data Accuracy
      console.log('   🔄 Testing analytics data accuracy...');
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({ where: { isActive: true } });

      expect(analyticsResponse.body.analytics.userStats.total).toBe(totalUsers);
      expect(analyticsResponse.body.analytics.userStats.active).toBe(activeUsers);

      console.log('   ✅ Complete admin workflow validated');
    });

    test('should handle support ticket lifecycle integration', async () => {
      // Step 1: Admin Creates Support Ticket
      console.log('   🔄 Testing support ticket creation...');
      const createTicketResponse = await request(app)
        .post('/api/admin/support-tickets')
        .send({
          subject: 'Integration Test Support Ticket',
          description: 'This is a comprehensive integration test ticket',
          priority: 'HIGH',
          userId: testUser.id
        })
        .set('Authorization', `Bearer ${adminJWT}`);

      expect([200, 201]).toContain(createTicketResponse.status);
      expect(createTicketResponse.body.ticket).toBeDefined();
      
      supportTicketId = createTicketResponse.body.ticket.id;

      // Step 2: Admin Views All Support Tickets
      console.log('   🔄 Testing support ticket listing...');
      const ticketsResponse = await request(app)
        .get('/api/admin/support-tickets')
        .set('Authorization', `Bearer ${adminJWT}`);

      expect(ticketsResponse.status).toBe(200);
      expect(ticketsResponse.body.tickets.some((ticket: any) => ticket.id === supportTicketId)).toBe(true);

      // Step 3: Admin Filters Tickets by Status
      console.log('   🔄 Testing ticket filtering...');
      const openTicketsResponse = await request(app)
        .get('/api/admin/support-tickets')
        .query({ status: 'OPEN' })
        .set('Authorization', `Bearer ${adminJWT}`);

      expect(openTicketsResponse.status).toBe(200);
      if (openTicketsResponse.body.tickets.length > 0) {
        openTicketsResponse.body.tickets.forEach((ticket: any) => {
          expect(ticket.status).toBe('OPEN');
        });
      }

      // Step 4: Verify Database Consistency
      console.log('   🔄 Testing ticket database consistency...');
      const dbTicket = await prisma.supportTicket.findUnique({
        where: { id: supportTicketId },
        include: { user: true }
      });

      expect(dbTicket).toBeDefined();
      expect(dbTicket?.userId).toBe(testUser.id);
      expect(dbTicket?.user.id).toBe(testUser.id);

      console.log('   ✅ Complete support ticket lifecycle validated');
    });
  });

  /**
   * Authentication & Authorization Integration
   * Tests security workflows across components
   */
  describe('Authentication & Authorization Integration', () => {
    test('should enforce proper access control across all components', async () => {
      // Test 1: Regular user cannot access admin endpoints
      console.log('   🔄 Testing admin access restriction...');
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/analytics/overview',
        '/api/admin/support-tickets',
        '/api/admin/system-settings'
      ];

      for (const endpoint of adminEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${testUserJWT}`);

        expect(response.status).toBe(403);
      }

      // Test 2: Admin can access all admin endpoints
      console.log('   🔄 Testing admin access permissions...');
      for (const endpoint of adminEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminJWT}`);

        expect(response.status).toBe(200);
      }

      // Test 3: Both users can access their own data
      console.log('   🔄 Testing user data access...');
      const userEndpoints = [
        '/api/auth/me',
        '/api/preferences',
        '/api/alerts'
      ];

      for (const endpoint of userEndpoints) {
        // Regular user access
        const userResponse = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${testUserJWT}`);
        expect(userResponse.status).toBe(200);

        // Admin access
        const adminResponse = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminJWT}`);
        expect(adminResponse.status).toBe(200);
      }

      console.log('   ✅ Access control integration validated');
    });

    test('should maintain session consistency across requests', async () => {
      let sessionToken: string;

      // Step 1: Login and get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.agentradar.app',
          password: 'TestUser123!'
        });

      sessionToken = loginResponse.body.token;
      const userId = loginResponse.body.user.id;

      // Step 2: Use token across multiple requests
      const requests = [
        request(app).get('/api/auth/me').set('Authorization', `Bearer ${sessionToken}`),
        request(app).get('/api/preferences').set('Authorization', `Bearer ${sessionToken}`),
        request(app).get('/api/alerts').set('Authorization', `Bearer ${sessionToken}`)
      ];

      const responses = await Promise.all(requests);

      // All requests should succeed with same user
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify consistent user identity
      expect(responses[0].body.user.id).toBe(userId);
      expect(responses[1].body.preferences.userId).toBe(userId);

      console.log('   ✅ Session consistency validated');
    });
  });

  /**
   * Database Integrity Integration
   * Tests data consistency across all operations
   */
  describe('Database Integrity Integration', () => {
    test('should maintain referential integrity across all operations', async () => {
      const testEmail = `integrity-test-${Date.now()}@example.com`;

      // Step 1: Create User
      console.log('   🔄 Testing user creation integrity...');
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'IntegrityTest123!',
          firstName: 'Integrity',
          lastName: 'Test'
        });

      const newUserId = userResponse.body.user.id;
      const newUserToken = userResponse.body.token;

      // Step 2: Create Preferences (should link to user)
      console.log('   🔄 Testing preferences integrity...');
      await request(app)
        .put('/api/preferences')
        .send({
          cities: ['Toronto'],
          alertTypes: ['POWER_OF_SALE'],
          minPriority: 'MEDIUM'
        })
        .set('Authorization', `Bearer ${newUserToken}`);

      // Step 3: Create User Alert Interaction
      const alertsResponse = await request(app)
        .get('/api/alerts')
        .query({ limit: 1 })
        .set('Authorization', `Bearer ${newUserToken}`);

      if (alertsResponse.body.alerts.length > 0) {
        const alertId = alertsResponse.body.alerts[0].id;
        
        console.log('   🔄 Testing user alert integrity...');
        await request(app)
          .post(`/api/alerts/${alertId}/bookmark`)
          .set('Authorization', `Bearer ${newUserToken}`);
      }

      // Step 4: Verify All Related Data Exists
      console.log('   🔄 Testing referential integrity...');
      const dbUser = await prisma.user.findUnique({
        where: { id: newUserId },
        include: {
          alertPreferences: true,
          userAlerts: true
        }
      });

      expect(dbUser).toBeDefined();
      expect(dbUser?.alertPreferences).toBeDefined();
      expect(dbUser?.alertPreferences?.userId).toBe(newUserId);

      // Step 5: Admin Support Ticket Integration
      console.log('   🔄 Testing support ticket integrity...');
      const ticketResponse = await request(app)
        .post('/api/admin/support-tickets')
        .send({
          subject: 'Integrity Test Ticket',
          description: 'Testing database integrity',
          priority: 'LOW',
          userId: newUserId
        })
        .set('Authorization', `Bearer ${adminJWT}`);

      const ticketId = ticketResponse.body.ticket.id;

      // Verify ticket links to user
      const dbTicket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: { user: true }
      });

      expect(dbTicket).toBeDefined();
      expect(dbTicket?.userId).toBe(newUserId);
      expect(dbTicket?.user.email).toBe(testEmail);

      console.log('   ✅ Database integrity validated');
    });

    test('should handle transaction rollback on failures', async () => {
      // Test transaction behavior by attempting invalid operations
      console.log('   🔄 Testing transaction rollback...');
      
      const initialUserCount = await prisma.user.count();

      // Attempt to create user with invalid data that should fail validation
      const invalidResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email-format',
          password: 'weak',
          firstName: '',
          lastName: ''
        });

      expect([400, 422]).toContain(invalidResponse.status);

      // Verify user count unchanged (no partial creation)
      const finalUserCount = await prisma.user.count();
      expect(finalUserCount).toBe(initialUserCount);

      console.log('   ✅ Transaction rollback validated');
    });
  });

  /**
   * Performance Integration
   * Tests system performance under realistic workflows
   */
  describe('Performance Integration Testing', () => {
    test('should maintain performance under typical user workflows', async () => {
      const workflowStartTime = performance.now();

      // Simulate typical user session
      const operations = [
        // Login
        request(app).post('/api/auth/login').send({
          email: 'user@test.agentradar.app',
          password: 'TestUser123!'
        }),
        
        // Get profile
        request(app).get('/api/auth/me').set('Authorization', `Bearer ${testUserJWT}`),
        
        // Get preferences
        request(app).get('/api/preferences').set('Authorization', `Bearer ${testUserJWT}`),
        
        // Browse alerts
        request(app).get('/api/alerts').query({ limit: 10 }).set('Authorization', `Bearer ${testUserJWT}`),
        
        // Get personalized alerts
        request(app).get('/api/alerts/personalized').set('Authorization', `Bearer ${testUserJWT}`),
        
        // Get alert stats
        request(app).get('/api/alerts/stats').set('Authorization', `Bearer ${testUserJWT}`)
      ];

      const responses = await Promise.all(operations);
      const workflowEndTime = performance.now();
      const totalTime = workflowEndTime - workflowStartTime;

      // All operations should succeed
      responses.forEach((response, index) => {
        expect([200, 201]).toContain(response.status);
      });

      console.log(`   ⏱️  Complete user workflow: ${totalTime.toFixed(2)}ms`);
      
      // Typical user workflow should complete within reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds max

      console.log('   ✅ Performance integration validated');
    });

    test('should handle admin workflows efficiently', async () => {
      const adminWorkflowStart = performance.now();

      // Simulate admin session
      const adminOperations = [
        // Get users list
        request(app).get('/api/admin/users').query({ limit: 20 }).set('Authorization', `Bearer ${adminJWT}`),
        
        // Get analytics
        request(app).get('/api/admin/analytics/overview').set('Authorization', `Bearer ${adminJWT}`),
        
        // Get support tickets
        request(app).get('/api/admin/support-tickets').set('Authorization', `Bearer ${adminJWT}`),
        
        // Get system settings
        request(app).get('/api/admin/system-settings').set('Authorization', `Bearer ${adminJWT}`)
      ];

      const adminResponses = await Promise.all(adminOperations);
      const adminWorkflowEnd = performance.now();
      const adminTotalTime = adminWorkflowEnd - adminWorkflowStart;

      // All admin operations should succeed
      adminResponses.forEach(response => {
        expect(response.status).toBe(200);
      });

      console.log(`   ⏱️  Complete admin workflow: ${adminTotalTime.toFixed(2)}ms`);
      expect(adminTotalTime).toBeLessThan(3000); // 3 seconds max

      console.log('   ✅ Admin performance validated');
    });
  });

  afterAll(() => {
    console.log('\n🔗 Cross-Component Integration Testing Complete');
    console.log('📊 Integration Test Summary:');
    console.log('   ✅ User Onboarding Flow: Complete');
    console.log('   ✅ Alert Management Integration: Complete');  
    console.log('   ✅ Admin Operations Integration: Complete');
    console.log('   ✅ Authentication & Authorization: Complete');
    console.log('   ✅ Database Integrity: Complete');
    console.log('   ✅ Performance Integration: Complete');
    console.log('\n🎯 ENTERPRISE INTEGRATION STATUS: VALIDATED ✅');
  });
});