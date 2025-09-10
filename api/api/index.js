// Vercel Serverless Function - Compatible with Neon Database
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const Redis = require('ioredis');

// Initialize Express app for serverless
const app = express();

// Initialize Prisma client for Neon database (serverless-optimized)
let prisma;
try {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
} catch (error) {
  console.error("Database initialization error:", error);
}

// Initialize Redis client for Redis Cloud (serverless-optimized)
let redis;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  redis.on('error', (error) => {
    console.error("Redis connection error:", error);
  });
} catch (error) {
  console.error("Redis initialization error:", error);
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  recoLicense: z.string().min(1, "RECO license is required")
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

// Helper functions
function generateJWT(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function validateRECOLicense(recoLicense) {
  // Real RECO license validation
  try {
    const response = await fetch(`https://www.reco.on.ca/public/validate-license/${recoLicense}`);
    return response.ok;
  } catch (error) {
    console.error("RECO validation error:", error);
    // For production, we'll accept any format for now but log for review
    return /^[A-Z0-9]{8,12}$/i.test(recoLicense);
  }
}

// Configure CORS for production domains
app.use(cors({
  origin: [
    "https://agentradar.app",
    "https://api.agentradar.app", 
    "https://dash.agentradar.app",
    "https://admin.agentradar.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
  credentials: true
}));

// Security middleware
app.use(helmet());
app.use(express.json({ limit: "10mb" }));

// Health check - Test Neon database connection
app.get("/health", async (req, res) => {
  try {
    let databaseStatus = { status: "not_initialized" };
    let cacheStatus = { status: "not_initialized" };
    
    if (prisma) {
      try {
        // Test database connection with a simple query
        await prisma.$queryRaw`SELECT 1 as health`;
        databaseStatus = { status: "connected", provider: "neon" };
      } catch (dbError) {
        console.error("Database health check error:", dbError);
        databaseStatus = { status: "error", error: dbError.message };
      }
    }
    
    if (redis) {
      try {
        // Test Redis connection
        await redis.ping();
        cacheStatus = { status: "connected", provider: "redis_cloud" };
      } catch (redisError) {
        console.error("Redis health check error:", redisError);
        cacheStatus = { status: "error", error: redisError.message };
      }
    }
    
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "production",
      version: "1.0.0",
      message: "AgentRadar API is operational",
      services: {
        database: databaseStatus,
        cache: cacheStatus,
        realtime: { status: "serverless_ready" }
      }
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API root endpoint
app.get("/api", (req, res) => {
  try {
    res.status(200).json({
      name: "AgentRadar API",
      version: "1.0.0",
      description: "Real Estate Intelligence Platform API",
      status: "operational",
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: "/api/auth",
        users: "/api/users",
        alerts: "/api/alerts", 
        properties: "/api/properties",
        admin: "/api/admin",
        payments: "/api/payments",
        mls: "/api/mls"
      },
      health: "/health"
    });
  } catch (error) {
    console.error("API endpoint error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "API endpoint failed"
    });
  }
});

// Test endpoint
app.get("/test", (req, res) => {
  try {
    res.status(200).json({
      status: "working",
      message: "API server is running in serverless mode",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "production"
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      error: "Test failed",
      message: error.message
    });
  }
});

// Authentication endpoints - Full Neon database integration
app.post("/api/auth/register", async (req, res) => {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors
      });
    }

    const { email, password, firstName, lastName, recoLicense } = validation.data;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: "Database not available",
        message: "Database connection not initialized"
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists",
        message: "An account with this email already exists"
      });
    }

    // Validate RECO license
    const isValidLicense = await validateRECOLicense(recoLicense);
    if (!isValidLicense) {
      return res.status(400).json({
        success: false,
        error: "Invalid RECO license",
        message: "Please provide a valid RECO license number"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        recoLicense,
        role: 'USER',
        subscriptionTier: 'FREE',
        isActive: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        details: `User registered with email: ${email}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    });

    // Generate JWT token
    const token = generateJWT(user);

    res.status(201).json({
      success: true,
      message: "Registration successful",
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
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred during registration"
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors
      });
    }

    const { email, password } = validation.data;

    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: "Database not available",
        message: "Database connection not initialized"
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        message: "Email or password is incorrect"
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account deactivated",
        message: "Your account has been deactivated. Please contact support."
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        message: "Email or password is incorrect"
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: `User logged in with email: ${email}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    });

    // Generate JWT token
    const token = generateJWT(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
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
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred during login"
    });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
        message: "Authorization token is required"
      });
    }

    const token = req.headers.authorization.replace('Bearer ', '');
    
    if (!prisma) {
      return res.status(503).json({
        success: false,
        error: "Database not available",
        message: "Database connection not initialized"
      });
    }

    // Check if token is blacklisted (if Redis is available)
    if (redis) {
      try {
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
          return res.status(401).json({
            success: false,
            error: "Token invalid",
            message: "Token has been revoked"
          });
        }
      } catch (redisError) {
        console.warn("Redis blacklist check failed:", redisError);
      }
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "User not found",
        message: "Invalid token or user deactivated"
      });
    }

    res.status(200).json({
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

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
        message: "Token is invalid or expired"
      });
    }
    
    console.error("Auth me error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while verifying token"
    });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
        message: "Authorization token is required"
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token and extract user info
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
        message: "Token is invalid or expired"
      });
    }

    // Add token to blacklist in Redis (if available)
    if (redis) {
      try {
        // Store token in blacklist with expiration matching token expiration
        const tokenExp = decoded.exp;
        const currentTime = Math.floor(Date.now() / 1000);
        const ttl = tokenExp - currentTime;
        
        if (ttl > 0) {
          await redis.setEx(`blacklist:${token}`, ttl, 'true');
        }
      } catch (redisError) {
        console.warn("Redis blacklist error:", redisError);
      }
    }

    // Log activity
    if (prisma) {
      try {
        await prisma.activityLog.create({
          data: {
            userId: decoded.userId,
            action: 'USER_LOGOUT',
            details: `User logged out`,
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown'
          }
        });
      } catch (dbError) {
        console.warn("Database activity log error:", dbError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Logout successful"
    });

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred during logout"
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `${req.method} ${req.path} is not available in serverless mode`,
    availableEndpoints: ["/health", "/api", "/test", "/api/auth/*"],
    note: "Full API requires database connection. Use local development server for complete functionality."
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: "An unexpected error occurred in serverless function",
    details: error.message
  });
});

// Export for Vercel
module.exports = app;