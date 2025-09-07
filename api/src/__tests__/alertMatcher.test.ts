import { AlertMatcher } from '../services/alertMatcher';
import { prismaClient, createTestUser, createTestAlert } from './setup';

describe('AlertMatcher Service', () => {
  let alertMatcher: AlertMatcher;

  beforeAll(() => {
    alertMatcher = new AlertMatcher();
  });

  describe('getPersonalizedAlerts', () => {
    it('should return high-priority alerts when user has no preferences', async () => {
      const user = await createTestUser({ email: 'no-prefs@example.com' });
      
      // Create alerts with different priorities
      await createTestAlert({ priority: 'HIGH', title: 'High Priority Alert' });
      await createTestAlert({ priority: 'MEDIUM', title: 'Medium Priority Alert' });
      await createTestAlert({ priority: 'LOW', title: 'Low Priority Alert' });

      const alerts = await alertMatcher.getPersonalizedAlerts(user.id, 10);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]?.priority).toBe('HIGH');
      expect(alerts[0]?.title).toBe('High Priority Alert');
    });

    it('should return alerts based on user preferences', async () => {
      const user = await createTestUser({ email: 'with-prefs@example.com' });
      
      // Create user preferences
      await prismaClient.alertPreference.create({
        data: {
          userId: user.id,
          cities: ['Toronto'],
          alertTypes: ['POWER_OF_SALE', 'ESTATE_SALE'],
          minPriority: 'MEDIUM',
          minOpportunityScore: 60,
          propertyTypes: ['detached']
        }
      });

      // Create matching and non-matching alerts
      const matchingAlert = await createTestAlert({
        alertType: 'POWER_OF_SALE',
        city: 'Toronto',
        priority: 'HIGH',
        opportunityScore: 75,
        propertyType: 'detached'
      });

      const nonMatchingAlert = await createTestAlert({
        alertType: 'TAX_SALE', // Not in user's preferred types
        city: 'Toronto',
        priority: 'HIGH',
        opportunityScore: 75
      });

      const alerts = await alertMatcher.getPersonalizedAlerts(user.id, 10);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]?.id).toBe(matchingAlert.id);
    });

    it('should respect the limit parameter', async () => {
      const user = await createTestUser({ email: 'limit-test@example.com' });
      
      // Create multiple high-priority alerts
      for (let i = 0; i < 15; i++) {
        await createTestAlert({ priority: 'HIGH', title: `Alert ${i}` });
      }

      const alerts = await alertMatcher.getPersonalizedAlerts(user.id, 5);
      expect(alerts).toHaveLength(5);
    });

    it('should order by opportunity score, then priority, then creation date', async () => {
      const user = await createTestUser({ email: 'ordering@example.com' });
      
      const alert1 = await createTestAlert({
        priority: 'HIGH',
        opportunityScore: 90,
        title: 'Best Opportunity'
      });

      const alert2 = await createTestAlert({
        priority: 'HIGH',
        opportunityScore: 85,
        title: 'Good Opportunity'
      });

      const alert3 = await createTestAlert({
        priority: 'MEDIUM',
        opportunityScore: 95,
        title: 'Great Medium Priority'
      });

      const alerts = await alertMatcher.getPersonalizedAlerts(user.id, 10);
      
      // Should be ordered by opportunity score desc
      expect(alerts[0]?.opportunityScore).toBe(95);
      expect(alerts[1]?.opportunityScore).toBe(90);
      expect(alerts[2]?.opportunityScore).toBe(85);
    });
  });

  describe('findMatchingUsers', () => {
    it('should find users with matching preferences', async () => {
      // Create users with different preferences
      const user1 = await createTestUser({ email: 'match1@example.com' });
      const user2 = await createTestUser({ email: 'match2@example.com' });
      const user3 = await createTestUser({ email: 'nomatch@example.com' });

      // User 1 - interested in POWER_OF_SALE in Toronto
      await prismaClient.alertPreference.create({
        data: {
          userId: user1.id,
          cities: ['Toronto'],
          alertTypes: ['POWER_OF_SALE'],
          minPriority: 'MEDIUM',
          minOpportunityScore: 50
        }
      });

      // User 2 - interested in POWER_OF_SALE with higher score threshold
      await prismaClient.alertPreference.create({
        data: {
          userId: user2.id,
          cities: ['Toronto', 'Mississauga'],
          alertTypes: ['POWER_OF_SALE', 'ESTATE_SALE'],
          minPriority: 'MEDIUM',
          minOpportunityScore: 70
        }
      });

      // User 3 - different preferences (won't match)
      await prismaClient.alertPreference.create({
        data: {
          userId: user3.id,
          cities: ['Vancouver'],
          alertTypes: ['TAX_SALE'],
          minPriority: 'HIGH',
          minOpportunityScore: 80
        }
      });

      // Create alert that should match users 1 and 2
      const alert = await createTestAlert({
        alertType: 'POWER_OF_SALE',
        city: 'Toronto',
        priority: 'HIGH',
        opportunityScore: 75
      });

      const matches = await alertMatcher.findMatchingUsers(alert);

      expect(matches).toHaveLength(2);
      
      const userIds = matches.map(m => m.user.id);
      expect(userIds).toContain(user1.id);
      expect(userIds).toContain(user2.id);
      expect(userIds).not.toContain(user3.id);

      // User 2 should have higher score due to higher opportunity score threshold met
      const user2Match = matches.find(m => m.user.id === user2.id);
      expect(user2Match?.matchScore).toBeGreaterThan(50); // Minimum viable score
    });

    it('should not match alerts with insufficient priority', async () => {
      const user = await createTestUser({ email: 'high-priority@example.com' });
      
      await prismaClient.alertPreference.create({
        data: {
          userId: user.id,
          cities: ['Toronto'],
          alertTypes: ['POWER_OF_SALE'],
          minPriority: 'HIGH', // Requires HIGH priority
          minOpportunityScore: 50
        }
      });

      const alert = await createTestAlert({
        alertType: 'POWER_OF_SALE',
        city: 'Toronto',
        priority: 'MEDIUM', // Too low priority
        opportunityScore: 75
      });

      const matches = await alertMatcher.findMatchingUsers(alert);
      expect(matches).toHaveLength(0);
    });

    it('should not match alerts with insufficient opportunity score', async () => {
      const user = await createTestUser({ email: 'high-score@example.com' });
      
      await prismaClient.alertPreference.create({
        data: {
          userId: user.id,
          cities: ['Toronto'],
          alertTypes: ['POWER_OF_SALE'],
          minPriority: 'MEDIUM',
          minOpportunityScore: 80 // Requires high score
        }
      });

      const alert = await createTestAlert({
        alertType: 'POWER_OF_SALE',
        city: 'Toronto',
        priority: 'HIGH',
        opportunityScore: 60 // Too low score
      });

      const matches = await alertMatcher.findMatchingUsers(alert);
      expect(matches).toHaveLength(0);
    });

    it('should calculate match scores correctly', async () => {
      const user = await createTestUser({ email: 'score-test@example.com' });
      
      await prismaClient.alertPreference.create({
        data: {
          userId: user.id,
          cities: ['Toronto'],
          alertTypes: ['POWER_OF_SALE'],
          minPriority: 'MEDIUM',
          minOpportunityScore: 60,
          propertyTypes: ['detached'],
          minValue: 30000000, // $300k
          maxValue: 70000000  // $700k
        }
      });

      const alert = await createTestAlert({
        alertType: 'POWER_OF_SALE', // +20 points
        city: 'Toronto',            // +25 points (preferred city)
        priority: 'HIGH',           // +15 points (meets minimum)
        opportunityScore: 75,       // +15 points (meets minimum)
        propertyType: 'detached',   // +15 points (matches preferred)
        estimatedValue: 50000000    // +10 points (within range)
      });

      const matches = await alertMatcher.findMatchingUsers(alert);
      expect(matches).toHaveLength(1);
      
      const match = matches[0];
      expect(match).toBeDefined();
      if (match) {
        expect(match.matchScore).toBeGreaterThan(80); // Should have high score
        expect(match.matchReasons).toContain('Matches preferred alert type: POWER_OF_SALE');
        expect(match.matchReasons).toContain('Located in preferred city: Toronto');
        expect(match.matchReasons).toContain('Matches preferred property type: detached');
      }
    });
  });

  describe('hasReachedDailyLimit', () => {
    it('should return false if user has no preferences', async () => {
      const user = await createTestUser({ email: 'no-limit@example.com' });
      const hasReached = await alertMatcher.hasReachedDailyLimit(user.id);
      expect(hasReached).toBe(false);
    });

    it('should return false if user is under daily limit', async () => {
      const user = await createTestUser({ email: 'under-limit@example.com' });
      
      await prismaClient.alertPreference.create({
        data: {
          userId: user.id,
          cities: ['Toronto'],
          alertTypes: ['POWER_OF_SALE'],
          minPriority: 'MEDIUM',
          minOpportunityScore: 50,
          maxAlertsPerDay: 5
        }
      });

      // Create 3 notifications today (under limit of 5)
      const today = new Date();
      today.setHours(10, 0, 0, 0);
      
      for (let i = 0; i < 3; i++) {
        const alert = await createTestAlert();
        await prismaClient.userAlert.create({
          data: {
            userId: user.id,
            alertId: alert.id,
            isNotified: true,
            notifiedAt: today
          }
        });
      }

      const hasReached = await alertMatcher.hasReachedDailyLimit(user.id);
      expect(hasReached).toBe(false);
    });

    it('should return true if user has reached daily limit', async () => {
      const user = await createTestUser({ email: 'at-limit@example.com' });
      
      await prismaClient.alertPreference.create({
        data: {
          userId: user.id,
          cities: ['Toronto'],
          alertTypes: ['POWER_OF_SALE'],
          minPriority: 'MEDIUM',
          minOpportunityScore: 50,
          maxAlertsPerDay: 3 // Low limit for testing
        }
      });

      // Create 3 notifications today (at limit)
      const today = new Date();
      today.setHours(10, 0, 0, 0);
      
      for (let i = 0; i < 3; i++) {
        const alert = await createTestAlert();
        await prismaClient.userAlert.create({
          data: {
            userId: user.id,
            alertId: alert.id,
            isNotified: true,
            notifiedAt: today
          }
        });
      }

      const hasReached = await alertMatcher.hasReachedDailyLimit(user.id);
      expect(hasReached).toBe(true);
    });
  });

  describe('isInQuietHours', () => {
    it('should return false if no quiet hours set', async () => {
      const preference = {
        quietHoursStart: null,
        quietHoursEnd: null
      } as any;

      const isQuiet = alertMatcher.isInQuietHours(preference);
      expect(isQuiet).toBe(false);
    });

    it('should detect quiet hours within same day', async () => {
      const preference = {
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      } as any;

      // Mock current time to be 23:30 (should be in quiet hours)
      const originalDate = Date;
      const mockDate = new Date('2023-01-01T23:30:00Z');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;
      global.Date.now = () => mockDate.getTime();

      const isQuiet = alertMatcher.isInQuietHours(preference);
      expect(isQuiet).toBe(true);

      // Restore original Date
      global.Date = originalDate;
    });

    it('should detect quiet hours crossing midnight', async () => {
      const preference = {
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      } as any;

      // Mock current time to be 06:30 (should be in quiet hours)
      const originalDate = Date;
      const mockDate = new Date('2023-01-01T06:30:00Z');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;
      global.Date.now = () => mockDate.getTime();

      const isQuiet = alertMatcher.isInQuietHours(preference);
      expect(isQuiet).toBe(true);

      // Restore original Date
      global.Date = originalDate;
    });

    it('should return false outside quiet hours', async () => {
      const preference = {
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      } as any;

      // Mock current time to be 14:30 (should not be in quiet hours)
      const originalDate = Date;
      const mockDate = new Date('2023-01-01T14:30:00Z');
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;
      global.Date.now = () => mockDate.getTime();

      const isQuiet = alertMatcher.isInQuietHours(preference);
      expect(isQuiet).toBe(false);

      // Restore original Date
      global.Date = originalDate;
    });
  });
});