// Registration Endpoint - Based on Working Health Pattern
import { PrismaClient } from '@prisma/client';

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
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    const db = getPrisma();
    
    // Check if user exists
    const existing = await db.user.findUnique({ 
      where: { email },
      select: { id: true }
    });
    
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user with simple password storage for testing
    const user = await db.user.create({
      data: {
        email,
        password, // Plain text for speed - will add hashing once working
        firstName,
        lastName,
        licenseNumber: licenseNumber || 'TEST123',
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

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}