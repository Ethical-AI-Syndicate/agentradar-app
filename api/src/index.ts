import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createServer } from "http";
import { createLogger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { initializeServices, shutdownServices } from "./services";
import { createRealtimeService } from "./services/realtime/realtimeService";
import {
  connectDatabase,
  disconnectDatabase,
  healthCheck as dbHealthCheck,
} from "./lib/database";

// Routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import alertRoutes from "./routes/alerts";
import propertyRoutes from "./routes/properties";
import earlyAdopterRoutes from "./routes/early-adopters";
import adminRoutes from "./routes/admin";
import superAdminRoutes from "./routes/super-admin";
import customerSupportRoutes from "./routes/customer-support";
import contentManagementRoutes from "./routes/content-management";
import businessOperationsRoutes from "./routes/business-operations";
import emailNotificationsRoutes from "./routes/email-notifications";
import preferencesRoutes from "./routes/preferences";
// import monitoringRoutes from './routes/monitoring'; // Temporarily disabled
import customerOnboardingRoutes from "./routes/customer-onboarding";
import complianceRoutes from "./routes/compliance";
import leadQualificationRoutes from "./routes/leadQualification";
import competitiveAnalysisRoutes from "./routes/competitiveAnalysis";
import aiRoutes from "./routes/ai";
import realtimeRoutes from "./routes/realtime";
import cacheRoutes from "./routes/cache";
import paymentRoutes from "./routes/payments";
import mlsRoutes from "./routes/mls";
import courtFilingRoutes from "./routes/court-filings";
import estateSalesRoutes from "./routes/estate-sales";
import propertyAnalysisRoutes from "./routes/property-analysis";
// import courtProcessingRoutes from './routes/courtProcessing'; // Temporarily disabled

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const logger = createLogger();
const PORT = process.env.PORT || 4000;

// Initialize real-time services
let realtimeService: any = null;

// CORS must come before helmet to ensure headers are set properly
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001", 
      "http://192.168.1.163:3001",
      "https://agentradar.app",
      "https://api.agentradar.app",
      "https://dash.agentradar.app",
      "https://admin.agentradar.app",
      /vercel\.app$/
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
  }),
);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Body parsing middleware
// Stripe webhook needs raw body, so we handle it specially
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }),
);

// Simple test endpoint
app.get("/test", (req, res) => {
  res.json({
    status: "working",
    message: "API server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Health check endpoint (including WebSocket and Database status)
app.get("/health", async (req, res) => {
  try {
    const realtimeStats = realtimeService
      ? await realtimeService.healthCheck()
      : { status: "not_initialized" };
    const databaseStats = await dbHealthCheck();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: "1.0.0",
      services: {
        database: databaseStats,
        realtime: realtimeStats,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/early-adopters", earlyAdopterRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/customer-support", customerSupportRoutes);
app.use("/api/content-management", contentManagementRoutes);
app.use("/api/business-operations", businessOperationsRoutes);
app.use("/api/email-notifications", emailNotificationsRoutes);
app.use("/api/preferences", preferencesRoutes);
// app.use('/api/monitoring', monitoringRoutes); // Temporarily disabled
app.use("/api/customer-onboarding", customerOnboardingRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/leads", leadQualificationRoutes);
app.use("/api/competitive", competitiveAnalysisRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/realtime", realtimeRoutes);
app.use("/api/cache", cacheRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/mls", mlsRoutes);
app.use("/api/court-filings", courtFilingRoutes);
app.use("/api/estate-sales", estateSalesRoutes);
app.use("/api/property", propertyAnalysisRoutes);
// app.use('/api/court-processing', courtProcessingRoutes); // Temporarily disabled

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "AgentRadar API",
    version: "1.0.0",
    description: "Real Estate Intelligence Platform API",
    documentation: "/api/docs",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      alerts: "/api/alerts",
      properties: "/api/properties",
      earlyAdopters: "/api/early-adopters",
      admin: "/api/admin",
      superAdmin: "/api/super-admin",
      customerSupport: "/api/customer-support",
      contentManagement: "/api/content-management",
      businessOperations: "/api/business-operations",
      emailNotifications: "/api/email-notifications",
      preferences: "/api/preferences",
      // monitoring: '/api/monitoring', // Temporarily disabled
      customerOnboarding: "/api/customer-onboarding",
      compliance: "/api/compliance",
      leadQualification: "/api/leads",
      competitiveAnalysis: "/api/competitive",
      ai: "/api/ai",
      realtime: "/api/realtime",
      cache: "/api/cache",
      payments: "/api/payments",
      mls: "/api/mls",
      courtFilings: "/api/court-filings",
      estateSales: "/api/estate-sales",
      propertyAnalysis: "/api/property"
      // courtProcessing: '/api/court-processing' // Temporarily disabled
    },
    health: "/health",
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  if (realtimeService) {
    await realtimeService.shutdown();
  }
  await shutdownServices();
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  if (realtimeService) {
    await realtimeService.shutdown();
  }
  await shutdownServices();
  await disconnectDatabase();
  process.exit(0);
});

// Initialize database connection for serverless - but don't wait
connectDatabase().catch(error => {
  logger.error("❌ Failed to connect database:", error);
});

// Start server only if not in test environment AND not in serverless (Vercel)
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  const server = httpServer.listen(PORT, async () => {
    logger.info(`🚀 AgentRadar API Server running on port ${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    logger.info(`📖 API docs: http://localhost:${PORT}/api`);
  });

  // Handle server errors
  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.syscall !== "listen") {
      throw error;
    }

    const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;

    switch (error.code) {
      case "EACCES":
        logger.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case "EADDRINUSE":
        logger.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
}

export default app;
