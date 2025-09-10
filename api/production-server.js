const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health endpoints
app.get("/", (req, res) => {
  res.json({ 
    message: "AgentRadar API is running", 
    status: "healthy",
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString() 
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: "connection pending",
    services: {
      api: "online",
      auth: "pending database",
      alerts: "pending database"
    }
  });
});

app.get("/test", (req, res) => {
  res.json({ 
    message: "Test endpoint working", 
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
    database_url_set: !!process.env.DATABASE_URL,
    jwt_secret_set: !!process.env.JWT_SECRET
  });
});

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "AgentRadar API",
    version: "1.0.0",
    status: "operational",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        status: "pending database connection"
      },
      alerts: {
        list: "GET /api/alerts",
        create: "POST /api/alerts",
        status: "pending database connection"
      },
      users: {
        profile: "GET /api/users/me",
        status: "pending database connection"
      }
    },
    documentation: "https://docs.agentradar.app"
  });
});

// Basic auth endpoints (mock until database is connected)
app.post("/api/auth/register", (req, res) => {
  res.status(503).json({
    error: "Service temporarily unavailable",
    message: "Database connection required for user registration",
    status: "pending_database_setup"
  });
});

app.post("/api/auth/login", (req, res) => {
  res.status(503).json({
    error: "Service temporarily unavailable", 
    message: "Database connection required for authentication",
    status: "pending_database_setup"
  });
});

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    available_endpoints: [
      "GET /",
      "GET /health", 
      "GET /test",
      "GET /api",
      "POST /api/auth/register",
      "POST /api/auth/login"
    ]
  });
});

app.listen(PORT, () => {
  console.log(`AgentRadar Production API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});

module.exports = app;