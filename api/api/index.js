// Vercel Serverless Function - API Root
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only supports GET requests'
    });
  }

  try {
    res.status(200).json({
      name: "AgentRadar API",
      version: "1.0.0", 
      description: "Real Estate Intelligence Platform API",
      status: "operational",
      timestamp: new Date().toISOString(),
      deployment: "vercel_serverless_functions",
      message: "API is running in Vercel serverless mode - WORKING!"
    });
  } catch (error) {
    console.error("API endpoint error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "API endpoint failed",
      details: error.message
    });
  }
};