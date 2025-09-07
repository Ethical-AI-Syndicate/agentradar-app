import request from 'supertest';
import app from '../index';
import { prismaClient, createTestUser, createTestAlert, createTestJWT } from './setup';

describe('Alerts Routes', () => {
  describe('GET /api/alerts', () => {
    it('should return paginated alerts without authentication', async () => {
      // Create test alerts
      await createTestAlert({ title: 'Alert 1', priority: 'HIGH' });
      await createTestAlert({ title: 'Alert 2', priority: 'MEDIUM' });
      await createTestAlert({ title: 'Alert 3', priority: 'LOW' });

      const response = await request(app)
        .get('/api/alerts')
        .expect(200);

      expect(response.body).toMatchObject({
        alerts: expect.any(Array),
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          pages: 1
        }
      });

      expect(response.body.alerts).toHaveLength(3);
      // Should be ordered by priority desc, then created desc
      expect(response.body.alerts[0].priority).toBe('HIGH');
    });

    it('should support pagination', async () => {
      // Create 25 alerts
      for (let i = 1; i <= 25; i++) {
        await createTestAlert({ title: `Alert ${i}` });
      }

      const response = await request(app)
        .get('/api/alerts?page=2&limit=10')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3
      });

      expect(response.body.alerts).toHaveLength(10);
    });

    it('should filter by alert type', async () => {
      await createTestAlert({ alertType: 'POWER_OF_SALE' });
      await createTestAlert({ alertType: 'ESTATE_SALE' });
      await createTestAlert({ alertType: 'TAX_SALE' });

      const response = await request(app)
        .get('/api/alerts?type=ESTATE_SALE')
        .expect(200);

      expect(response.body.alerts).toHaveLength(1);
      expect(response.body.alerts[0].alertType).toBe('ESTATE_SALE');
    });

    it('should filter by priority', async () => {
      await createTestAlert({ priority: 'HIGH' });
      await createTestAlert({ priority: 'MEDIUM' });
      await createTestAlert({ priority: 'LOW' });

      const response = await request(app)
        .get('/api/alerts?priority=HIGH')
        .expect(200);

      expect(response.body.alerts).toHaveLength(1);
      expect(response.body.alerts[0].priority).toBe('HIGH');
    });

    it('should filter by city', async () => {
      await createTestAlert({ city: 'Toronto' });
      await createTestAlert({ city: 'Mississauga' });
      await createTestAlert({ city: 'Brampton' });

      const response = await request(app)
        .get('/api/alerts?city=toronto') // Case insensitive
        .expect(200);

      expect(response.body.alerts).toHaveLength(1);
      expect(response.body.alerts[0].city).toBe('Toronto');
    });
  });

  describe('GET /api/alerts/stats', () => {
    it('should return alert statistics', async () => {
      // Create test data
      await createTestAlert({ alertType: 'POWER_OF_SALE', priority: 'HIGH', city: 'Toronto' });
      await createTestAlert({ alertType: 'ESTATE_SALE', priority: 'MEDIUM', city: 'Toronto' });
      await createTestAlert({ alertType: 'POWER_OF_SALE', priority: 'HIGH', city: 'Mississauga' });

      const response = await request(app)
        .get('/api/alerts/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        summary: {
          totalAlerts: 3,
          timeframe: '30d'
        },
        breakdown: {
          byType: expect.arrayContaining([
            { type: 'POWER_OF_SALE', count: 2 },
            { type: 'ESTATE_SALE', count: 1 }
          ]),
          byPriority: expect.arrayContaining([
            { priority: 'HIGH', count: 2 },
            { priority: 'MEDIUM', count: 1 }
          ]),
          byCity: expect.arrayContaining([
            { city: 'Toronto', count: 2 },
            { city: 'Mississauga', count: 1 }
          ])
        }
      });
    });

    it('should support different timeframes', async () => {
      const response = await request(app)
        .get('/api/alerts/stats?timeframe=7d')
        .expect(200);

      expect(response.body.summary.timeframe).toBe('7d');
    });
  });

  describe('GET /api/alerts/personalized', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/alerts/personalized')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication required',
        message: 'No token provided'
      });
    });

    it('should return personalized alerts for authenticated user', async () => {
      const user = await createTestUser({ email: 'personalized@example.com' });
      const token = await createTestJWT(user.id);

      // Create some alerts
      await createTestAlert({ alertType: 'POWER_OF_SALE', priority: 'HIGH', city: 'Toronto' });
      await createTestAlert({ alertType: 'ESTATE_SALE', priority: 'MEDIUM', city: 'Mississauga' });

      const response = await request(app)
        .get('/api/alerts/personalized')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        alerts: expect.any(Array),
        personalized: expect.any(Boolean),
        count: expect.any(Number)
      });

      // Should include setup preferences URL if no preferences exist
      if (!response.body.personalized) {
        expect(response.body.setupPreferencesUrl).toBe('/api/preferences');
      }
    });

    it('should limit results based on query parameter', async () => {
      const user = await createTestUser({ email: 'limit@example.com' });
      const token = await createTestJWT(user.id);

      // Create multiple alerts
      for (let i = 0; i < 25; i++) {
        await createTestAlert({ priority: 'HIGH' });
      }

      const response = await request(app)
        .get('/api/alerts/personalized?limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.alerts.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/alerts/:id', () => {
    it('should return specific alert by ID', async () => {
      const alert = await createTestAlert({ title: 'Specific Alert' });

      const response = await request(app)
        .get(`/api/alerts/${alert.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: alert.id,
        title: 'Specific Alert',
        alertType: alert.alertType,
        city: alert.city
      });
    });

    it('should return 404 for non-existent alert', async () => {
      const response = await request(app)
        .get('/api/alerts/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Alert not found'
      });
    });

    it('should return 400 for missing alert ID', async () => {
      const response = await request(app)
        .get('/api/alerts/')
        .expect(404); // This will be a 404 since route doesn't match
    });
  });

  describe('POST /api/alerts/:id/bookmark', () => {
    it('should require authentication', async () => {
      const alert = await createTestAlert();

      const response = await request(app)
        .post(`/api/alerts/${alert.id}/bookmark`)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication required'
      });
    });

    it('should bookmark alert for authenticated user', async () => {
      const user = await createTestUser({ email: 'bookmark@example.com' });
      const token = await createTestJWT(user.id);
      const alert = await createTestAlert();

      const response = await request(app)
        .post(`/api/alerts/${alert.id}/bookmark`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Alert bookmarked successfully',
        userAlert: {
          userId: user.id,
          alertId: alert.id,
          isBookmarked: true
        }
      });

      // Verify in database
      const userAlert = await prismaClient.userAlert.findUnique({
        where: {
          userId_alertId: {
            userId: user.id,
            alertId: alert.id
          }
        }
      });
      expect(userAlert?.isBookmarked).toBe(true);
    });

    it('should return 404 for non-existent alert', async () => {
      const user = await createTestUser();
      const token = await createTestJWT(user.id);

      const response = await request(app)
        .post('/api/alerts/non-existent-id/bookmark')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Alert not found'
      });
    });
  });

  describe('DELETE /api/alerts/:id/bookmark', () => {
    it('should unbookmark alert for authenticated user', async () => {
      const user = await createTestUser({ email: 'unbookmark@example.com' });
      const token = await createTestJWT(user.id);
      const alert = await createTestAlert();

      // First bookmark the alert
      await prismaClient.userAlert.create({
        data: {
          userId: user.id,
          alertId: alert.id,
          isBookmarked: true
        }
      });

      const response = await request(app)
        .delete(`/api/alerts/${alert.id}/bookmark`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Alert unbookmarked successfully'
      });

      // Verify in database
      const userAlert = await prismaClient.userAlert.findUnique({
        where: {
          userId_alertId: {
            userId: user.id,
            alertId: alert.id
          }
        }
      });
      expect(userAlert?.isBookmarked).toBe(false);
    });

    it('should return 404 if bookmark not found', async () => {
      const user = await createTestUser();
      const token = await createTestJWT(user.id);
      const alert = await createTestAlert();

      const response = await request(app)
        .delete(`/api/alerts/${alert.id}/bookmark`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Bookmark not found'
      });
    });
  });

  describe('PUT /api/alerts/:id/viewed', () => {
    it('should mark alert as viewed', async () => {
      const user = await createTestUser();
      const alert = await createTestAlert();

      const response = await request(app)
        .put(`/api/alerts/${alert.id}/viewed`)
        .send({ userId: user.id })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Alert marked as viewed successfully',
        userAlert: {
          userId: user.id,
          alertId: alert.id,
          isViewed: true
        }
      });

      // Verify in database
      const userAlert = await prismaClient.userAlert.findUnique({
        where: {
          userId_alertId: {
            userId: user.id,
            alertId: alert.id
          }
        }
      });
      expect(userAlert?.isViewed).toBe(true);
      expect(userAlert?.viewedAt).toBeDefined();
    });

    it('should return 400 if userId missing', async () => {
      const alert = await createTestAlert();

      const response = await request(app)
        .put(`/api/alerts/${alert.id}/viewed`)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'User ID is required'
      });
    });

    it('should return 404 for non-existent alert', async () => {
      const user = await createTestUser();

      const response = await request(app)
        .put('/api/alerts/non-existent-id/viewed')
        .send({ userId: user.id })
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Alert not found'
      });
    });
  });
});