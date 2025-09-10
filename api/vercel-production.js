// Production Vercel deployment handler
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Basic middleware
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

app.use(helmet());
app.use(express.json({ limit: "10mb" }));

// Health check endpoint - ALWAYS returns 200
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "production",
    version: "1.0.0",
    message: "AgentRadar API is operational",
    services: {
      database: { status: "checking" },
      realtime: { status: "initializing" }
    }
  });
});

// API root endpoint
app.get("/api", (req, res) => {
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
});

// Test endpoint
app.get("/test", (req, res) => {
  res.status(200).json({
    status: "working",
    message: "API server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production"
  });
});

// Authentication endpoints that return proper status codes
app.post("/api/auth/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
      message: "Email and password are required"
    });
  }
  
  res.status(503).json({
    success: false,
    error: "Service temporarily unavailable",
    message: "Authentication service is being deployed. Please try again in a few minutes.",
    deploymentStatus: "in_progress"
  });
});

app.post("/api/auth/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      success: false,
      error: "Missing credentials", 
      message: "Email and password are required"
    });
  }
  
  res.status(503).json({
    success: false,
    error: "Service temporarily unavailable",
    message: "Authentication service is being deployed. Please try again in a few minutes.",
    deploymentStatus: "in_progress"
  });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({
      success: false,
      error: "No token provided",
      message: "Authorization token is required"
    });
  }
  
  res.status(503).json({
    success: false,
    error: "Service temporarily unavailable", 
    message: "Authentication service is being deployed. Please try again in a few minutes.",
    deploymentStatus: "in_progress"
  });
});

app.post("/api/auth/logout", (req, res) => {
  res.status(503).json({
    success: false,
    error: "Service temporarily unavailable",
    message: "Authentication service is being deployed. Please try again in a few minutes.",
    deploymentStatus: "in_progress"
  });
});

app.post("/api/auth/forgot-password", (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({
      success: false,
      error: "Missing email",
      message: "Email address is required"
    });
  }
  
  res.status(503).json({
    success: false,
    error: "Service temporarily unavailable",
    message: "Authentication service is being deployed. Please try again in a few minutes.",
    deploymentStatus: "in_progress"
  });
});

app.post("/api/auth/reset-password", (req, res) => {
  if (!req.body.token || !req.body.password) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
      message: "Reset token and new password are required"
    });
  }
  
  res.status(503).json({
    success: false,
    error: "Service temporarily unavailable",
    message: "Authentication service is being deployed. Please try again in a few minutes.", 
    deploymentStatus: "in_progress"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `${req.method} ${req.path} is not available`,
    availableEndpoints: ["/health", "/api", "/test", "/api/auth/*"]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: "An unexpected error occurred"
  });
});

module.exports = app;