import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Simple health check that doesn't require database
app.get('/health', (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      api: "operational"
    }
  });
});

// Basic test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: "API is working",
    timestamp: new Date().toISOString()
  });
});

// Catch-all for other routes
app.get('*', (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path
  });
});

export default app;