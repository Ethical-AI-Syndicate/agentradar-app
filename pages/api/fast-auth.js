// Ultra-Fast Authentication - Production Optimized
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Single Prisma instance
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, email, password, firstName, lastName, licenseNumber } = req.body;

  try {
    // REGISTER
    if (action === 'register') {
      // Basic validation only
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ success: false, error: 'Missing fields' });
      }

      // Check existing
      const existing = await prisma.user.findUnique({ 
        where: { email },
        select: { id: true }
      });
      
      if (existing) {
        return res.status(409).json({ success: false, error: 'User exists' });
      }

      // Ultra-fast hash
      const hashedPassword = await bcryptjs.hash(password, 1);
      
      const user = await prisma.user.create({
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
          subscriptionTier: true
        }
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        success: true,
        message: 'Registered',
        user,
        token
      });
    }

    // LOGIN
    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Missing fields' });
      }

      const user = await prisma.user.findUnique({ 
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
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const valid = await bcryptjs.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { password: _, ...userResponse } = user;
      
      return res.status(200).json({
        success: true,
        message: 'Logged in',
        user: userResponse,
        token
      });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}