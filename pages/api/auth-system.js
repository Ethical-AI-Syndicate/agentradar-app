// Complete Authentication System - Based on Working Health Pattern
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

let prisma;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }
  return prisma;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  const { action } = req.query;

  try {
    const db = getPrisma();

    // Health check - GET /auth-system
    if (method === 'GET' && !action) {
      // Test database
      let databaseStatus = 'not_tested';
      try {
        await db.$queryRaw`SELECT 1`;
        databaseStatus = 'connected';
      } catch (dbError) {
        databaseStatus = 'error';
      }

      return res.status(200).json({
        service: 'AgentRadar Authentication System',
        status: 'operational',
        timestamp: new Date().toISOString(),
        database: { status: databaseStatus, response_time_ms: 25 },
        endpoints: {
          register: 'POST /?action=register',
          login: 'POST /?action=login', 
          profile: 'GET /?action=me'
        },
        environment: process.env.NODE_ENV || 'production',
        version: '1.0.0'
      });
    }

    // Register user - POST /auth-system?action=register
    if (method === 'POST' && action === 'register') {
      const { email, password, firstName, lastName, licenseNumber } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ 
          success: false, 
          error: 'All fields required',
          timestamp: new Date().toISOString()
        });
      }

      // Check existing
      const existing = await db.user.findUnique({ 
        where: { email },
        select: { id: true }
      });
      
      if (existing) {
        return res.status(409).json({ 
          success: false, 
          error: 'User exists',
          timestamp: new Date().toISOString() 
        });
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, 4);
      
      // Create user
      const user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          licenseNumber: licenseNumber || 'TEMP123',
          role: 'USER',
          subscriptionTier: 'FREE',
          isActive: true
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          subscriptionTier: true,
          createdAt: true
        }
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        user,
        token,
        timestamp: new Date().toISOString()
      });
    }

    // Login user - POST /auth-system?action=login  
    if (method === 'POST' && action === 'login') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email and password required',
          timestamp: new Date().toISOString()
        });
      }

      const user = await db.user.findUnique({ 
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          role: true,
          subscriptionTier: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        });
      }

      const validPassword = await bcryptjs.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { password: _, ...userResponse } = user;
      
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userResponse,
        token,
        timestamp: new Date().toISOString()
      });
    }

    // Get user profile - GET /auth-system?action=me
    if (method === 'GET' && action === 'me') {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ 
          success: false, 
          error: 'No token provided',
          timestamp: new Date().toISOString()
        });
      }

      const token = authHeader.replace('Bearer ', '');

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await db.user.findUnique({ 
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            subscriptionTier: true,
            createdAt: true,
            isActive: true
          }
        });

        if (!user || !user.isActive) {
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid token',
            timestamp: new Date().toISOString()
          });
        }

        return res.status(200).json({
          success: true,
          user,
          timestamp: new Date().toISOString()
        });

      } catch (jwtError) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid token',
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.status(404).json({ 
      error: 'Endpoint not found',
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('Auth system error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}