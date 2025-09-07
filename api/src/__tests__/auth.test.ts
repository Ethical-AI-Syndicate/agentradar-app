import request from 'supertest';
import app from '../index';
import { prismaClient, createTestUser } from './setup';

describe('Authentication Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        user: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          subscriptionTier: 'FREE'
        }
      });

      expect(response.body.token).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('should not register user with existing email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          phone: '+1234567890'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Email already registered',
        message: 'A user with this email already exists'
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          phone: '+1234567890'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123', // Too weak
          firstName: 'Test',
          lastName: 'User',
          phone: '+1234567890'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const user = await createTestUser({
        email: 'login@example.com',
        firstName: 'Login',
        lastName: 'Test'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });

      expect(response.body.token).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('should not login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    });

    it('should not login with invalid password', async () => {
      await createTestUser({ email: 'wrongpass@example.com' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should not login inactive user', async () => {
      await createTestUser({
        email: 'inactive@example.com',
        isActive: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.'
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh valid token', async () => {
      const user = await createTestUser({ email: 'refresh@example.com' });
      
      // First login to get a token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.token;

      // Now refresh the token
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token refreshed successfully'
      });

      expect(response.body.token).toBeDefined();
      expect(response.body.token).not.toBe(token); // Should be a new token
    });

    it('should not refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication required',
        message: 'No token provided'
      });
    });

    it('should not refresh invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Invalid token',
        message: 'Token is invalid or expired'
      });
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      const user = await createTestUser({ email: 'me@example.com' });
      
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          subscriptionTier: user.subscriptionTier,
          isActive: user.isActive
        }
      });

      expect(response.body.user.password).toBeUndefined();
    });

    it('should not return user info without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication required',
        message: 'No token provided'
      });
    });
  });
});