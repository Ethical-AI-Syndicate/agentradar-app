// Complete Authentication System - Production Ready
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

// Validate email format
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate password strength
function validatePassword(password) {
  return password && 
         password.length >= 8 && 
         /[A-Z]/.test(password) && 
         /[a-z]/.test(password) && 
         /[0-9]/.test(password) && 
         /[^A-Za-z0-9]/.test(password);
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    const db = getPrisma();

    // REGISTER USER
    if (req.method === 'POST' && action === 'register') {
      const { email, password, firstName, lastName, licenseNumber } = req.body;
      
      // Validation
      if (!email || !validateEmail(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email address' });
      }
      
      if (!password || !validatePassword(password)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
        });
      }
      
      if (!firstName || !lastName || !licenseNumber) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
      }

      // Check if user exists
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ success: false, error: 'User already exists' });
      }

      // Validate license format
      if (!/^[A-Z0-9]{6,15}$/i.test(licenseNumber)) {
        return res.status(400).json({ success: false, error: 'Invalid license number format' });
      }

      // Hash password (optimized for Vercel - using minimal rounds)
      const hashedPassword = await bcryptjs.hash(password, 4);
      
      // Create user
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
      
      return res.status(201).json({
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
    }

    // LOGIN USER
    if (req.method === 'POST' && action === 'login') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
      }

      const user = await db.user.findUnique({ where: { email } });
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const validPassword = await bcryptjs.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = generateJWT(user);
      
      return res.status(200).json({
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
    }

    // GET USER PROFILE
    if (req.method === 'GET' && action === 'me') {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ success: false, error: 'No token provided' });
      }

      const token = authHeader.replace('Bearer ', '');
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await db.user.findUnique({ where: { id: decoded.userId } });
        
        if (!user || !user.isActive) {
          return res.status(401).json({ success: false, error: 'Invalid token' });
        }

        return res.status(200).json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            subscriptionTier: user.subscriptionTier,
            createdAt: user.createdAt
          }
        });
      } catch (jwtError) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}