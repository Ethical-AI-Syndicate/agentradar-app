// Simplified Vercel API Route - User Registration (Production Testing)
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

// Generate JWT
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
    const { email, password, firstName, lastName, licenseNumber } = req.body;
    
    // Basic validation
    if (!email || !password || !firstName || !lastName || !licenseNumber) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    const db = getPrisma();
    
    // Check if user exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Fast hash for production testing
    const hashedPassword = await bcrypt.hash(password, 4);
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        licenseNumber,
        role: 'USER',
        subscriptionTier: 'FREE',
        isActive: true
      }
    });

    const token = generateJWT(user);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
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
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during registration'
    });
  }
}