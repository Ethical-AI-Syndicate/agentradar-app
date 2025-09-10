const express = require("express");

const app = express();
const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.json({ 
    message: "AgentRadar API is running", 
    status: "healthy",
    timestamp: new Date().toISOString() 
  });
});

app.get("/test", (req, res) => {
  res.json({ 
    message: "Test endpoint working", 
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString() 
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`Minimal API server running on port ${PORT}`);
});

module.exports = app;
