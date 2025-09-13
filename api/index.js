// AgentRadar API Entry Point for AWS Deployment
// Express.js application entry point
const express = require('express');

const app = express();

// Basic CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Basic routes for health checks
app.get('/', (req, res) => {
  res.json({
    name: "AgentRadar API",
    version: "1.0.0",
    description: "Real Estate Intelligence Platform API",
    status: "operational",
    timestamp: new Date().toISOString(),
    deployment: "aws_container",
    environment: process.env.NODE_ENV || 'production'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: "1.0.0",
    deployment: "aws_container"
  });
});

app.get('/test', (req, res) => {
  res.json({
    status: "working",
    message: "🚀 API test endpoint - AWS deployment ready!",
    timestamp: new Date().toISOString(),
    deployment: "aws_container"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `${req.method} ${req.url} is not available`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("API error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: "Request failed",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4000;

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 AgentRadar API Server running on port ${PORT}`);
  });
}

module.exports = app;
