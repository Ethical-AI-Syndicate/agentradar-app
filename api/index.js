// Vercel Serverless Function Handler
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url, method } = req;
    
    // Basic routing for testing
    if (url === '/' || url === '/api' || url === '/api/') {
      return res.status(200).json({
        name: "AgentRadar API",
        version: "1.0.0",
        description: "Real Estate Intelligence Platform API", 
        status: "operational",
        timestamp: new Date().toISOString(),
        deployment: "vercel_serverless_executing",
        message: "🎉 API is now EXECUTING JavaScript instead of showing source!",
        environment: process.env.NODE_ENV || 'production'
      });
    }
    
    if (url === '/health') {
      return res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(), 
        environment: process.env.NODE_ENV || 'production',
        version: "1.0.0",
        message: "AgentRadar API health check - EXECUTING!",
        deployment: "vercel_serverless_executing"
      });
    }
    
    if (url === '/test') {
      return res.status(200).json({
        status: "working",
        message: "🚀 JavaScript execution confirmed!",
        timestamp: new Date().toISOString(),
        method,
        url
      });
    }
    
    // 404 for other routes
    res.status(404).json({
      error: "Endpoint not found",
      message: `${method} ${url} is not available`,
      timestamp: new Date().toISOString(),
      executionConfirmed: true
    });
    
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({
      error: "Internal server error", 
      message: "Handler execution failed",
      timestamp: new Date().toISOString(),
      details: error.message
    });
  }
}