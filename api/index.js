// Production Vercel Serverless Function  
// This file serves as the entry point for api.agentradar.app
// Cache-busting update: 2025-09-10 11:13

try {
  const app = require('./dist/index.js');
  module.exports = app.default || app;
} catch (error) {
  console.error('Failed to load compiled Express app:', error);
  
  // Fallback basic API if compiled version fails
  module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Compiled Express app failed to load',
      timestamp: new Date().toISOString(),
      details: error.message
    });
  };
}