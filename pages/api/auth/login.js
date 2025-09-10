// Vercel API Route - User Login
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

function generateJWT(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role || 'USER'
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const db = getPrisma();
    const user = await db.user.findUnique({ where: { email } });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account deactivated'
      });
    }

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: `User logged in with email: ${email}`,
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });

    const token = generateJWT(user);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subscriptionTier: user.subscriptionTier
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during login'
    });
  }
}