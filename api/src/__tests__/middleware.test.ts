import request from 'supertest';
import express from 'express';
import { authenticateToken, optionalAuthentication } from '../middleware/auth';
import { errorHandler } from '../middleware/errorHandler';
import { notFound } from '../middleware/notFound';
import { createTestUser, createTestJWT } from './setup';

// Test app setup
function createTestApp() {
  const app = express();
  app.use(express.json());
  return app;
}

describe('Authentication Middleware', () => {
  describe('authenticateToken', () => {
    it('should allow access with valid token', async () => {
      const app = createTestApp();
      const user = await createTestUser({ email: 'middleware@example.com' });
      const token = await createTestJWT(user.id);

      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ 
          success: true, 
          user: req.user 
        });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe(user.id);
    });

    it('should reject request without token', async () => {
      const app = createTestApp();
      
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication required',
        message: 'No token provided'
      });
    });

    it('should reject request with invalid token', async () => {
      const app = createTestApp();
      
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Invalid token',
        message: 'Token is invalid or expired'
      });
    });

    it('should reject request with malformed authorization header', async () => {
      const app = createTestApp();
      
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'invalid-format')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Authentication required',
        message: 'Invalid authorization header format'
      });
    });

    it('should reject token for non-existent user', async () => {
      const app = createTestApp();
      const token = await createTestJWT('non-existent-user-id');
      
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'User not found',
        message: 'User associated with this token no longer exists'
      });
    });

    it('should reject token for inactive user', async () => {
      const app = createTestApp();
      const user = await createTestUser({ 
        email: 'inactive@example.com',
        isActive: false 
      });
      const token = await createTestJWT(user.id);
      
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Account deactivated',
        message: 'Your account has been deactivated'
      });
    });
  });

  describe('optionalAuthentication', () => {
    it('should allow access without token', async () => {
      const app = createTestApp();
      
      app.get('/optional', optionalAuthentication, (req, res) => {
        res.json({ 
          success: true, 
          authenticated: !!req.user,
          user: req.user || null
        });
      });

      const response = await request(app)
        .get('/optional')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        authenticated: false,
        user: null
      });
    });

    it('should attach user if valid token provided', async () => {
      const app = createTestApp();
      const user = await createTestUser({ email: 'optional@example.com' });
      const token = await createTestJWT(user.id);
      
      app.get('/optional', optionalAuthentication, (req, res) => {
        res.json({ 
          success: true, 
          authenticated: !!req.user,
          user: req.user
        });
      });

      const response = await request(app)
        .get('/optional')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          email: user.email
        }
      });
    });

    it('should continue without user if invalid token provided', async () => {
      const app = createTestApp();
      
      app.get('/optional', optionalAuthentication, (req, res) => {
        res.json({ 
          success: true, 
          authenticated: !!req.user,
          user: req.user || null
        });
      });

      const response = await request(app)
        .get('/optional')
        .set('Authorization', 'Bearer invalid-token')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        authenticated: false,
        user: null
      });
    });
  });
});

describe('Error Handling Middleware', () => {
  describe('errorHandler', () => {
    it('should handle validation errors (400)', async () => {
      const app = createTestApp();
      
      app.get('/validation-error', (req, res, next) => {
        const error = new Error('Validation failed');
        (error as any).status = 400;
        next(error);
      });
      
      app.use(errorHandler);

      const response = await request(app)
        .get('/validation-error')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        status: 400
      });
    });

    it('should handle authentication errors (401)', async () => {
      const app = createTestApp();
      
      app.get('/auth-error', (req, res, next) => {
        const error = new Error('Unauthorized');
        (error as any).status = 401;
        next(error);
      });
      
      app.use(errorHandler);

      const response = await request(app)
        .get('/auth-error')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        status: 401
      });
    });

    it('should handle not found errors (404)', async () => {
      const app = createTestApp();
      
      app.get('/not-found-error', (req, res, next) => {
        const error = new Error('Resource not found');
        (error as any).status = 404;
        next(error);
      });
      
      app.use(errorHandler);

      const response = await request(app)
        .get('/not-found-error')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Resource not found',
        status: 404
      });
    });

    it('should handle internal server errors (500)', async () => {
      const app = createTestApp();
      
      app.get('/server-error', (req, res, next) => {
        const error = new Error('Internal server error');
        next(error);
      });
      
      app.use(errorHandler);

      const response = await request(app)
        .get('/server-error')
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Internal Server Error',
        status: 500
      });

      // In production, detailed error messages should be hidden
      expect(response.body.error).not.toBe('Internal server error');
    });

    it('should include stack trace in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const app = createTestApp();
      
      app.get('/dev-error', (req, res, next) => {
        const error = new Error('Development error');
        next(error);
      });
      
      app.use(errorHandler);

      const response = await request(app)
        .get('/dev-error')
        .expect(500);

      expect(response.body.stack).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const app = createTestApp();
      
      app.get('/prod-error', (req, res, next) => {
        const error = new Error('Production error');
        next(error);
      });
      
      app.use(errorHandler);

      const response = await request(app)
        .get('/prod-error')
        .expect(500);

      expect(response.body.stack).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFound', () => {
    it('should handle 404 for non-existent routes', async () => {
      const app = createTestApp();
      
      app.use(notFound);
      app.use(errorHandler);

      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Route not found',
        message: 'The requested resource was not found on this server',
        path: '/non-existent-route',
        method: 'GET'
      });
    });

    it('should handle 404 for different HTTP methods', async () => {
      const app = createTestApp();
      
      app.use(notFound);
      app.use(errorHandler);

      const response = await request(app)
        .post('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Route not found',
        method: 'POST',
        path: '/non-existent-route'
      });
    });
  });
});