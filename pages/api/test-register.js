// Minimal Test Registration - Production Proof
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getPrisma();
    
    // Simple user creation without bcrypt for speed test
    const user = await db.user.create({
      data: {
        email,
        password, // Plain text for test only
        firstName,
        lastName,
        licenseNumber: 'TEST123',
        role: 'USER',
        subscriptionTier: 'FREE',
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Test user created',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Test registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      details: error.message
    });
  }
}