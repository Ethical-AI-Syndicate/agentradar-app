/**
 * WebSocket Real-Time Infrastructure
 * Production-grade WebSocket server with Redis Cloud adapter
 * Enables real-time alerts, property updates, and market notifications
 */

import { Server as SocketIOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Server as HttpServer } from "http";

interface UserData {
  id: string;
  email: string;
  role: string;
  subscriptionTier: string;
  preferences: any;
}

interface AuthenticatedSocket extends Socket {
  user: UserData;
}

interface WSConfig {
  cors: {
    origin: string[];
    credentials: boolean;
  };
  pingTimeout: number;
  pingInterval: number;
  transports: ("websocket" | "polling")[];
}

interface RedisConfig {
  host?: string;
  port: number;
  password?: string;
  username: string;
  db: number;
  retryDelayOnFailover: number;
  enableReadyCheck: boolean;
  lazyConnect: boolean;
  maxRetriesPerRequest: number;
  connectTimeout: number;
  commandTimeout: number;
  tls?: any;
}

interface Channels {
  USER_ALERTS: string;
  MARKET_UPDATES: string;
  PROPERTY_CHANGES: string;
  SYSTEM_NOTIFICATIONS: string;
  ADMIN_MONITORING: string;
}

let prisma: PrismaClient | null = null;

export class AgentRadarWebSocketServer {
  private httpServer: HttpServer;
  public io: SocketIOServer | null = null;
  private redisClient: Redis | null = null;
  private redisSubscriber: Redis | null = null;
  private connectedUsers: Map<string, string> = new Map();
  private userSessions: Map<string, UserData> = new Map();
  private wsConfig: WSConfig;
  private redisConfig: RedisConfig;
  private channels: Channels;

  constructor(httpServer: HttpServer) {
    this.httpServer = httpServer;

    // WebSocket configuration
    this.wsConfig = {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(",") || [
          "http://localhost:3000",
        ],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ["websocket", "polling"],
    };

    // Redis Cloud configuration
    this.redisConfig = {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME || "default",
      db: 0,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
      tls: process.env.REDIS_TLS === "true" ? {} : undefined,
    };

    // Real-time channels configuration
    this.channels = {
      USER_ALERTS: "user_alerts",
      MARKET_UPDATES: "market_updates",
      PROPERTY_CHANGES: "property_changes",
      SYSTEM_NOTIFICATIONS: "system_notifications",
      ADMIN_MONITORING: "admin_monitoring",
    };
  }

  /**
   * Initialize WebSocket server with Redis Cloud adapter
   */
  async initialize(): Promise<AgentRadarWebSocketServer> {
    try {
      console.log("🚀 Initializing AgentRadar WebSocket Server...");

      // Initialize Prisma client
      if (!prisma) {
        prisma = new PrismaClient();
        await prisma.$connect();
        console.log("✅ Prisma client connected");
      }

      // Setup Redis Cloud connections
      await this.setupRedisConnections();

      // Initialize Socket.IO server
      this.io = new SocketIOServer(this.httpServer, this.wsConfig);

      // Configure Redis adapter for horizontal scaling
      if (this.redisClient && this.redisSubscriber) {
        this.io.adapter(createAdapter(this.redisClient, this.redisSubscriber));
      }

      // Setup authentication middleware
      this.setupAuthentication();

      // Setup connection handlers
      this.setupConnectionHandlers();

      // Setup real-time channels
      this.setupRealtimeChannels();

      // Setup health monitoring
      this.setupHealthMonitoring();

      console.log("✅ WebSocket Server initialized successfully");
      console.log(
        `📡 Real-time channels: ${Object.values(this.channels).join(", ")}`,
      );

      return this;
    } catch (error) {
      console.error("❌ Failed to initialize WebSocket server:", error);
      throw error;
    }
  }

  /**
   * Setup Redis Cloud connections for pub/sub and adapter
   */
  async setupRedisConnections(): Promise<void> {
    console.log("🔗 Connecting to Redis Cloud...");

    try {
      // Main Redis client for Socket.IO adapter
      this.redisClient = new Redis(this.redisConfig);

      // Separate subscriber client for pub/sub
      this.redisSubscriber = new Redis({
        ...this.redisConfig,
        lazyConnect: true,
      });

      // Connection event handlers
      this.redisClient.on("connect", () => {
        console.log("✅ Redis client connected to Redis Cloud");
      });

      this.redisClient.on("error", (error) => {
        console.error("❌ Redis client error:", error);
      });

      this.redisSubscriber.on("connect", () => {
        console.log("✅ Redis subscriber connected to Redis Cloud");
      });

      this.redisSubscriber.on("error", (error) => {
        console.error("❌ Redis subscriber error:", error);
      });

      // Connect to Redis Cloud
      await Promise.all([
        this.redisClient.connect(),
        this.redisSubscriber.connect(),
      ]);

      // Test Redis Cloud connection
      await this.redisClient.ping();
      console.log("🏓 Redis Cloud connection verified");
    } catch (error) {
      console.error("❌ Redis Cloud connection failed:", error);
      throw new Error(`Redis Cloud connection failed: ${error.message}`);
    }
  }

  /**
   * Setup JWT-based WebSocket authentication
   */
  setupAuthentication(): void {
    if (!this.io) return;

    this.io.use(async (socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace("Bearer ", "");

        if (!token) {
          throw new Error("No authentication token provided");
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // Get user from database
        if (!prisma) {
          throw new Error("Database not initialized");
        }
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            alertPreferences: true,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // Attach user data to socket
        (socket as AuthenticatedSocket).user = {
          id: user.id,
          email: user.email,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          preferences: user.alertPreferences,
        };

        next();
      } catch (error: any) {
        console.error("WebSocket authentication failed:", error.message);
        next(new Error(`Authentication failed: ${error.message}`));
      }
    });
  }

  /**
   * Setup WebSocket connection handlers
   */
  setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      this.handleUserConnection(socket);
      this.setupSocketEventHandlers(socket);
    });
  }

  /**
   * Handle new user connection
   */
  async handleUserConnection(socket: AuthenticatedSocket): Promise<void> {
    const user = socket.user;
    console.log(`👤 User connected: ${user.email} (${socket.id})`);

    try {
      // Store user session
      this.connectedUsers.set(user.id, socket.id);
      this.userSessions.set(socket.id, user);

      // Join user-specific room
      await socket.join(`user:${user.id}`);

      // Join subscription tier room
      await socket.join(`tier:${user.subscriptionTier}`);

      // Join role-based room
      await socket.join(`role:${user.role}`);

      // Send welcome message with real-time capabilities
      socket.emit("connection:established", {
        message: "Connected to AgentRadar real-time system",
        capabilities: this.getUserCapabilities(user),
        channels: this.getAvailableChannels(user),
        timestamp: new Date().toISOString(),
      });

      // Update user's last seen status
      await this.updateUserLastSeen(user.id);

      // Setup disconnection handler
      socket.on("disconnect", () => this.handleUserDisconnection(socket));
    } catch (error) {
      console.error("Error handling user connection:", error);
      socket.emit("error", { message: "Connection setup failed" });
    }
  }

  /**
   * Setup socket event handlers for user interactions
   */
  setupSocketEventHandlers(socket: AuthenticatedSocket): void {
    const user = socket.user;

    // Property alerts subscription
    socket.on("alerts:subscribe", async (data: any) => {
      try {
        const { regions, alertTypes, priceRange } = data;
        await this.subscribeToAlerts(socket, user, {
          regions,
          alertTypes,
          priceRange,
        });
        socket.emit("alerts:subscribed", { success: true, filters: data });
      } catch (error: any) {
        socket.emit("alerts:error", { message: error.message });
      }
    });

    // Property bookmarking
    socket.on("property:bookmark", async (data: any) => {
      try {
        await this.handlePropertyBookmark(
          user.id,
          data.propertyId,
          data.action,
        );
        socket.emit("property:bookmarked", {
          success: true,
          propertyId: data.propertyId,
        });
      } catch (error: any) {
        socket.emit("property:error", { message: error.message });
      }
    });

    // Real-time property inquiry
    socket.on("property:inquiry", async (data: any) => {
      try {
        await this.handlePropertyInquiry(user.id, data);
        socket.emit("inquiry:sent", {
          success: true,
          inquiryId: data.inquiryId,
        });
      } catch (error: any) {
        socket.emit("inquiry:error", { message: error.message });
      }
    });

    // Market data subscription
    socket.on("market:subscribe", async (data: any) => {
      try {
        const { regions, metrics } = data;
        await socket.join(`market:${regions.join(",")}`);
        socket.emit("market:subscribed", { success: true, regions, metrics });
      } catch (error: any) {
        socket.emit("market:error", { message: error.message });
      }
    });

    // Heartbeat for connection health
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });
  }

  /**
   * Handle user disconnection cleanup
   */
  handleUserDisconnection(socket: AuthenticatedSocket): void {
    const user = socket.user;
    console.log(`👋 User disconnected: ${user.email} (${socket.id})`);

    // Cleanup user session
    this.connectedUsers.delete(user.id);
    this.userSessions.delete(socket.id);

    // Update last seen timestamp
    this.updateUserLastSeen(user.id).catch(console.error);
  }

  /**
   * Setup real-time channels for different data types
   */
  setupRealtimeChannels(): void {
    console.log("📡 Setting up real-time channels...");

    if (!this.redisSubscriber) return;

    // Subscribe to Redis channels for real-time updates
    Object.values(this.channels).forEach((channel) => {
      this.redisSubscriber!.subscribe(channel);
    });

    // Handle incoming messages from Redis
    this.redisSubscriber.on("message", (channel: string, message: string) => {
      this.handleRealtimeMessage(channel, message);
    });
  }

  /**
   * Handle real-time messages from Redis channels
   */
  async handleRealtimeMessage(channel: string, message: string): Promise<void> {
    try {
      const data = JSON.parse(message);

      switch (channel) {
        case this.channels.USER_ALERTS:
          await this.handleUserAlert(data);
          break;

        case this.channels.MARKET_UPDATES:
          await this.handleMarketUpdate(data);
          break;

        case this.channels.PROPERTY_CHANGES:
          await this.handlePropertyChange(data);
          break;

        case this.channels.SYSTEM_NOTIFICATIONS:
          await this.handleSystemNotification(data);
          break;

        case this.channels.ADMIN_MONITORING:
          await this.handleAdminMonitoring(data);
          break;

        default:
          console.warn(`Unknown channel: ${channel}`);
      }
    } catch (error) {
      console.error(`Error processing message from ${channel}:`, error);
    }
  }

  /**
   * Handle user-specific alerts
   */
  async handleUserAlert(data: any): Promise<void> {
    const { userId, alert, priority } = data;

    // Check if user is connected
    if (this.connectedUsers.has(userId)) {
      const socketId = this.connectedUsers.get(userId)!;
      const socket = this.io?.sockets.sockets.get(socketId);

      if (socket) {
        socket.emit("alert:new", {
          alert,
          priority,
          timestamp: new Date().toISOString(),
        });

        console.log(`🚨 Alert sent to user ${userId}: ${alert.type}`);
      }
    }

    // Store alert in database for offline users
    await this.storeOfflineAlert(userId, alert);
  }

  /**
   * Handle market updates broadcast
   */
  async handleMarketUpdate(data: any): Promise<void> {
    const { region, update } = data;

    // Broadcast to users subscribed to this region
    this.io?.to(`market:${region}`).emit("market:update", {
      region,
      update,
      timestamp: new Date().toISOString(),
    });

    console.log(`📊 Market update sent for ${region}: ${update.type}`);
  }

  /**
   * Handle property changes (price, status, etc.)
   */
  async handlePropertyChange(data: any): Promise<void> {
    const { propertyId, changes, interestedUsers } = data;

    // Notify users who bookmarked or inquired about this property
    for (const userId of interestedUsers || []) {
      if (this.connectedUsers.has(userId)) {
        const socketId = this.connectedUsers.get(userId)!;
        const socket = this.io?.sockets.sockets.get(socketId);

        if (socket) {
          socket.emit("property:changed", {
            propertyId,
            changes,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    console.log(`🏠 Property change notification sent for ${propertyId}`);
  }

  /**
   * Handle system notifications
   */
  async handleSystemNotification(data: any): Promise<void> {
    // Broadcast system notifications to all connected users or specific roles
    if (data.targetUsers === "all") {
      this.io?.emit("system:notification", data);
    } else if (data.targetRole) {
      this.io?.to(`role:${data.targetRole}`).emit("system:notification", data);
    }
  }

  /**
   * Handle admin monitoring data
   */
  async handleAdminMonitoring(data: any): Promise<void> {
    // Send monitoring data to admin users
    this.io?.to("role:ADMIN").emit("admin:monitoring", data);
  }

  /**
   * Real-time API for broadcasting alerts
   */
  async broadcastAlert(userId: string, alert: any): Promise<void> {
    try {
      if (!this.redisClient) return;

      await this.redisClient.publish(
        this.channels.USER_ALERTS,
        JSON.stringify({
          userId,
          alert,
          priority: alert.priority || "medium",
          timestamp: new Date().toISOString(),
        }),
      );

      console.log(`📤 Alert queued for user ${userId}`);
    } catch (error) {
      console.error("Failed to broadcast alert:", error);
    }
  }

  /**
   * Broadcast market updates
   */
  async broadcastMarketUpdate(region: string, update: any): Promise<void> {
    try {
      if (!this.redisClient) return;

      await this.redisClient.publish(
        this.channels.MARKET_UPDATES,
        JSON.stringify({
          region,
          update,
          timestamp: new Date().toISOString(),
        }),
      );

      console.log(`📤 Market update queued for ${region}`);
    } catch (error) {
      console.error("Failed to broadcast market update:", error);
    }
  }

  /**
   * Broadcast property changes
   */
  async broadcastPropertyChange(
    propertyId: string,
    changes: any,
    interestedUsers: string[] = [],
  ): Promise<void> {
    try {
      if (!this.redisClient) return;

      await this.redisClient.publish(
        this.channels.PROPERTY_CHANGES,
        JSON.stringify({
          propertyId,
          changes,
          interestedUsers,
          timestamp: new Date().toISOString(),
        }),
      );

      console.log(`📤 Property change queued for ${propertyId}`);
    } catch (error) {
      console.error("Failed to broadcast property change:", error);
    }
  }

  /**
   * Setup health monitoring
   */
  setupHealthMonitoring(): void {
    // Monitor WebSocket connections
    setInterval(() => {
      const stats = {
        connectedUsers: this.connectedUsers.size,
        activeSockets: this.io?.sockets.sockets.size || 0,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      };

      // Store metrics in Redis for monitoring
      if (this.redisClient) {
        this.redisClient.setex("websocket:metrics", 60, JSON.stringify(stats));
      }

      console.log(
        `📊 WebSocket Stats: ${stats.connectedUsers} users, ${stats.activeSockets} sockets`,
      );
    }, 30000); // Every 30 seconds
  }

  /**
   * Helper methods
   */

  private ensurePrisma(): PrismaClient {
    if (!prisma) {
      throw new Error("Database not initialized");
    }
    return prisma;
  }

  getUserCapabilities(user: UserData): string[] {
    const baseCapabilities = ["alerts", "bookmarks", "market_updates"];

    switch (user.subscriptionTier) {
      case "PROFESSIONAL":
      case "TEAM_ENTERPRISE":
      case "WHITE_LABEL":
        return [
          ...baseCapabilities,
          "priority_alerts",
          "advanced_analytics",
          "custom_filters",
        ];
      case "SOLO_AGENT":
        return [...baseCapabilities, "priority_alerts"];
      default:
        return baseCapabilities;
    }
  }

  getAvailableChannels(user: UserData): string[] {
    const channels = ["user_alerts", "market_updates"];

    if (user.role === "ADMIN") {
      channels.push("admin_monitoring", "system_notifications");
    }

    return channels;
  }

  async subscribeToAlerts(
    socket: AuthenticatedSocket,
    user: UserData,
    filters: any,
  ): Promise<void> {
    // Join region-based rooms
    for (const region of filters.regions || []) {
      await socket.join(`alerts:${region}`);
    }

    // Join alert type rooms
    for (const type of filters.alertTypes || []) {
      await socket.join(`alerts:type:${type}`);
    }

    // Store user preferences
    await this.ensurePrisma().alertPreference.upsert({
      where: { userId: user.id },
      update: {
        cities: filters.regions,
        alertTypes: filters.alertTypes,
        minValue: filters.priceRange?.min,
        maxValue: filters.priceRange?.max,
      },
      create: {
        userId: user.id,
        cities: filters.regions,
        alertTypes: filters.alertTypes,
        minValue: filters.priceRange?.min,
        maxValue: filters.priceRange?.max,
      },
    });
  }

  async handlePropertyBookmark(
    userId: string,
    propertyId: string,
    action: string,
  ): Promise<void> {
    if (action === "add") {
      await this.ensurePrisma().userAlert.create({
        data: {
          userId,
          alertId: propertyId,
          isBookmarked: true,
        },
      });
    } else if (action === "remove") {
      await this.ensurePrisma().userAlert.deleteMany({
        where: {
          userId,
          alertId: propertyId,
          isBookmarked: true,
        },
      });
    }
  }

  async handlePropertyInquiry(userId: string, inquiryData: any): Promise<void> {
    // Store inquiry in database
    await this.ensurePrisma().activityLog.create({
      data: {
        userId,
        action: "SEARCH_PERFORMED",
        details: JSON.stringify(inquiryData),
        // timestamp removed - ActivityLog uses createdAt automatically
      },
    });
  }

  async storeOfflineAlert(userId: string, alert: any): Promise<void> {
    try {
      await this.ensurePrisma().userAlert.create({
        data: {
          userId,
          alertId: alert.id,
          isViewed: false,
          isBookmarked: false,
        },
      });
    } catch (error) {
      console.error("Error storing offline alert:", error);
    }
  }

  async updateUserLastSeen(userId: string): Promise<void> {
    try {
      await this.ensurePrisma().user.update({
        where: { id: userId },
        data: { lastLogin: new Date() }, // Using existing lastLogin field
      });
    } catch (error) {
      console.error("Error updating user last seen:", error);
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log("🛑 Shutting down WebSocket server...");

    try {
      // Close all socket connections
      this.io?.close();

      // Close Redis connections
      if (this.redisClient) {
        await this.redisClient.quit();
      }

      if (this.redisSubscriber) {
        await this.redisSubscriber.quit();
      }

      // Close Prisma connection
      if (prisma) {
        await prisma.$disconnect();
      }

      console.log("✅ WebSocket server shutdown complete");
    } catch (error) {
      console.error("Error during WebSocket server shutdown:", error);
    }
  }

  /**
   * Get server statistics
   */
  getStats(): any {
    return {
      connectedUsers: this.connectedUsers.size,
      activeSockets: this.io?.sockets.sockets.size || 0,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
let wsServerInstance: AgentRadarWebSocketServer | null = null;

export function createWebSocketServer(
  httpServer: HttpServer,
): AgentRadarWebSocketServer {
  if (!wsServerInstance) {
    wsServerInstance = new AgentRadarWebSocketServer(httpServer);
  }
  return wsServerInstance;
}

export function getWebSocketServer(): AgentRadarWebSocketServer | null {
  return wsServerInstance;
}
