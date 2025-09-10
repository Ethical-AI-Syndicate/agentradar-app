// Minimal test function for Vercel
const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Basic test endpoint working'
  });
});

app.get('/test', (req, res) => {
  res.status(200).json({
    status: 'working',
    message: 'Test endpoint operational',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

module.exports = app;