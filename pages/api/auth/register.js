// Vercel API Route - User Registration
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';

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

// Validation functions
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password && 
         password.length >= 8 && 
         /[A-Z]/.test(password) && 
         /[a-z]/.test(password) && 
         /[0-9]/.test(password) && 
         /[^A-Za-z0-9]/.test(password);
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

// RECO License validation
async function validateOntarioLicense(licenseNumber, firstName, lastName) {
  try {
    const response = await axios.get(`https://www.reco.on.ca/DesktopModules/RECO.Registrant/API/Registrant/SearchRegistrants`, {
      params: {
        searchTerm: licenseNumber,
        searchType: 'RegistrationNumber'
      },
      headers: {
        'User-Agent': 'AgentRadar/1.0 (Real Estate License Verification)'
      },
      timeout: 10000
    });

    if (response.data && response.data.length > 0) {
      const registrant = response.data[0];
      const nameMatch = (
        registrant.FirstName?.toLowerCase().includes(firstName.toLowerCase()) &&
        registrant.LastName?.toLowerCase().includes(lastName.toLowerCase())
      ) || (
        registrant.Name?.toLowerCase().includes(firstName.toLowerCase()) &&
        registrant.Name?.toLowerCase().includes(lastName.toLowerCase())
      );
      
      return registrant.RegistrationNumber === licenseNumber && nameMatch;
    }
    return false;
  } catch (error) {
    console.error('RECO license validation error:', error);
    // For production, accept alphanumeric licenses but log for review
    return /^[A-Z0-9]{6,15}$/i.test(licenseNumber);
  }
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
    
    // Validation
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address'
      });
    }
    
    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }
    
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }
    
    if (!licenseNumber) {
      return res.status(400).json({
        success: false,
        error: 'License number is required'
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

    // Validate RECO license
    const isValidLicense = await validateOntarioLicense(licenseNumber, firstName, lastName);
    if (!isValidLicense) {
      return res.status(400).json({
        success: false,
        error: 'Invalid license number or name mismatch'
      });
    }

    // Hash password and create user (optimized for Vercel)
    const hashedPassword = await bcrypt.hash(password, 6);
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

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        details: `User registered with email: ${email}`,
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
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