// Vercel Serverless Function Handler - Simple test version
module.exports = async (req, res) => {
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
        message: "🎉 SUCCESS! JavaScript is EXECUTING instead of showing source code!",
        environment: process.env.NODE_ENV || 'production',
        buildSkipped: true,
        framework: "Express (configured)"
      });
    }
    
    if (url === '/health') {
      return res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(), 
        environment: process.env.NODE_ENV || 'production',
        version: "1.0.0",
        message: "✅ JavaScript execution confirmed!",
        deployment: "vercel_serverless_executing"
      });
    }
    
    if (url === '/test') {
      return res.status(200).json({
        status: "working",
        message: "🚀 API test endpoint - JavaScript executing properly!",
        timestamp: new Date().toISOString(),
        method,
        url,
        executionConfirmed: true
      });
    }
    
    // 404 for other routes
    res.status(404).json({
      error: "Endpoint not found",
      message: `${method} ${url} is not available in this test version`,
      timestamp: new Date().toISOString(),
      executionConfirmed: true,
      note: "JavaScript is executing properly - ready for full API integration"
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
};