import request from 'supertest';
import app from '../index';
import { prismaClient, createTestUser, createTestJWT } from './setup';

describe('Preferences Routes', () => {
  let user: any;
  let token: string;

  beforeEach(async () => {
    user = await createTestUser({ email: 'preferences@example.com' });
    token = await createTestJWT(user.id);
  });

  describe('GET /api/preferences', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/preferences')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication required',
        message: 'No token provided'
      });
    });

    it('should create default preferences if none exist', async () => {
      const response = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        preferences: {
          userId: user.id,
          cities: ['Toronto', 'Mississauga', 'Brampton'],
          maxDistanceKm: 50,
          propertyTypes: ['detached', 'semi-detached', 'townhouse', 'condo'],
          alertTypes: ['POWER_OF_SALE', 'ESTATE_SALE', 'TAX_SALE'],
          minPriority: 'MEDIUM',
          minOpportunityScore: 30,
          emailNotifications: true,
          pushNotifications: true,
          maxAlertsPerDay: 10
        }
      });

      // Verify preferences were created in database
      const preferences = await prismaClient.alertPreference.findUnique({
        where: { userId: user.id }
      });
      expect(preferences).toBeDefined();
    });

    it('should return existing preferences', async () => {
      // Create preferences first
      const existingPreferences = await prismaClient.alertPreference.create({
        data: {
          userId: user.id,
          cities: ['Toronto'],
          maxDistanceKm: 25,
          propertyTypes: ['condo'],
          alertTypes: ['POWER_OF_SALE'],
          minPriority: 'HIGH',
          minOpportunityScore: 70,
          emailNotifications: false,
          pushNotifications: true,
          maxAlertsPerDay: 5
        }
      });

      const response = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.preferences).toMatchObject({
        userId: user.id,
        cities: ['Toronto'],
        maxDistanceKm: 25,
        propertyTypes: ['condo'],
        alertTypes: ['POWER_OF_SALE'],
        minPriority: 'HIGH',
        minOpportunityScore: 70,
        emailNotifications: false,
        pushNotifications: true,
        maxAlertsPerDay: 5
      });
    });
  });

  describe('PUT /api/preferences', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/preferences')
        .send({ cities: ['Toronto'] })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication required'
      });
    });

    it('should update preferences successfully', async () => {
      const updateData = {
        cities: ['Vancouver', 'Burnaby'],
        maxDistanceKm: 30,
        propertyTypes: ['detached', 'townhouse'],
        minValue: 40000000, // $400k in cents
        maxValue: 80000000, // $800k in cents
        minBedrooms: 2,
        maxBedrooms: 4,
        alertTypes: ['ESTATE_SALE', 'TAX_SALE'],
        minPriority: 'HIGH',
        minOpportunityScore: 60,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: false,
        maxAlertsPerDay: 15,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      };

      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Preferences updated successfully',
        preferences: {
          userId: user.id,
          ...updateData
        }
      });

      // Verify in database
      const preferences = await prismaClient.alertPreference.findUnique({
        where: { userId: user.id }
      });
      expect(preferences).toMatchObject({
        userId: user.id,
        ...updateData
      });
    });

    it('should validate distance range', async () => {
      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ maxDistanceKm: 1000 }) // Invalid - too high
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid distance',
        message: 'Distance must be between 1 and 500 km'
      });
    });

    it('should validate value range', async () => {
      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          minValue: 100000000, 
          maxValue: 50000000 // Min > Max
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid value range',
        message: 'Minimum value cannot be greater than maximum value'
      });
    });

    it('should validate opportunity score range', async () => {
      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ minOpportunityScore: 150 }) // Invalid - too high
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid opportunity score',
        message: 'Opportunity score must be between 0 and 100'
      });
    });

    it('should validate max alerts per day', async () => {
      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ maxAlertsPerDay: 200 }) // Invalid - too high
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid alerts limit',
        message: 'Maximum alerts per day must be between 1 and 100'
      });
    });

    it('should validate alert types', async () => {
      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ alertTypes: ['INVALID_TYPE'] })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid alert types'
      });
      expect(response.body.validTypes).toBeDefined();
    });

    it('should validate priority', async () => {
      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ minPriority: 'INVALID_PRIORITY' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid priority',
        message: 'Invalid minimum priority level'
      });
      expect(response.body.validPriorities).toBeDefined();
    });

    it('should create preferences if they do not exist', async () => {
      // Ensure user has no preferences
      await prismaClient.alertPreference.deleteMany({
        where: { userId: user.id }
      });

      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ cities: ['Calgary'] })
        .expect(200);

      expect(response.body.preferences.cities).toEqual(['Calgary']);
      
      // Should have default values for other fields
      expect(response.body.preferences.maxDistanceKm).toBe(50);
      expect(response.body.preferences.minPriority).toBe('MEDIUM');
    });
  });

  describe('DELETE /api/preferences', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/preferences')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication required'
      });
    });

    it('should reset preferences to defaults', async () => {
      // First create custom preferences
      await prismaClient.alertPreference.create({
        data: {
          userId: user.id,
          cities: ['Vancouver'],
          maxDistanceKm: 10,
          propertyTypes: ['condo'],
          alertTypes: ['TAX_SALE'],
          minPriority: 'URGENT',
          minOpportunityScore: 90,
          emailNotifications: false,
          pushNotifications: false,
          maxAlertsPerDay: 1
        }
      });

      const response = await request(app)
        .delete('/api/preferences')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Preferences reset to default successfully',
        preferences: {
          userId: user.id,
          cities: ['Toronto', 'Mississauga', 'Brampton'],
          maxDistanceKm: 50,
          propertyTypes: ['detached', 'semi-detached', 'townhouse', 'condo'],
          alertTypes: ['POWER_OF_SALE', 'ESTATE_SALE', 'TAX_SALE'],
          minPriority: 'MEDIUM',
          minOpportunityScore: 30,
          emailNotifications: true,
          pushNotifications: true,
          maxAlertsPerDay: 10
        }
      });

      // Verify in database
      const preferences = await prismaClient.alertPreference.findUnique({
        where: { userId: user.id }
      });
      expect(preferences?.cities).toEqual(['Toronto', 'Mississauga', 'Brampton']);
    });
  });

  describe('GET /api/preferences/options', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/preferences/options')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication required'
      });
    });

    it('should return available preference options', async () => {
      const response = await request(app)
        .get('/api/preferences/options')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        options: {
          alertTypes: expect.arrayContaining([
            {
              value: 'POWER_OF_SALE',
              label: expect.any(String),
              description: expect.any(String)
            },
            {
              value: 'ESTATE_SALE',
              label: expect.any(String),
              description: expect.any(String)
            }
          ]),
          priorities: expect.arrayContaining([
            {
              value: 'LOW',
              label: expect.any(String),
              order: expect.any(Number)
            },
            {
              value: 'MEDIUM',
              label: expect.any(String),
              order: expect.any(Number)
            },
            {
              value: 'HIGH',
              label: expect.any(String),
              order: expect.any(Number)
            },
            {
              value: 'URGENT',
              label: expect.any(String),
              order: expect.any(Number)
            }
          ]),
          propertyTypes: expect.arrayContaining([
            { value: 'detached', label: 'Detached House' },
            { value: 'condo', label: 'Condominium' }
          ]),
          cities: expect.arrayContaining([
            { value: 'Toronto', label: 'Toronto' },
            { value: 'Mississauga', label: 'Mississauga' }
          ])
        }
      });

      // Verify priorities are ordered correctly
      const priorities = response.body.options.priorities;
      const urgentPriority = priorities.find((p: any) => p.value === 'URGENT');
      const lowPriority = priorities.find((p: any) => p.value === 'LOW');
      expect(urgentPriority.order).toBeGreaterThan(lowPriority.order);
    });
  });
});