/**
 * WebSocket Real-Time Infrastructure
 * Production-grade WebSocket server with Redis Cloud adapter
 * Enables real-time alerts, property updates, and market notifications
 */

import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AgentRadarWebSocketServer {
  constructor(httpServer) {
    this.httpServer = httpServer;
    this.io = null;
    this.redisClient = null;
    this.redisSubscriber = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.userSessions = new Map(); // socketId -> user data
    
    // WebSocket configuration
    this.wsConfig = {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling']
    };

    // Redis Cloud configuration
    this.redisConfig = {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME || 'default',
      db: 0,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined
    };

    // Real-time channels configuration
    this.channels = {
      USER_ALERTS: 'user_alerts',
      MARKET_UPDATES: 'market_updates', 
      PROPERTY_CHANGES: 'property_changes',
      SYSTEM_NOTIFICATIONS: 'system_notifications',
      ADMIN_MONITORING: 'admin_monitoring'
    };
  }

  /**
   * Initialize WebSocket server with Redis Cloud adapter
   */
  async initialize() {
    try {
      console.log('🚀 Initializing AgentRadar WebSocket Server...');

      // Setup Redis Cloud connections
      await this.setupRedisConnections();

      // Initialize Socket.IO server
      this.io = new SocketIOServer(this.httpServer, this.wsConfig);

      // Configure Redis adapter for horizontal scaling
      this.io.adapter(createAdapter(this.redisClient, this.redisSubscriber));

      // Setup authentication middleware
      this.setupAuthentication();

      // Setup connection handlers
      this.setupConnectionHandlers();

      // Setup real-time channels
      this.setupRealtimeChannels();

      // Setup health monitoring
      this.setupHealthMonitoring();

      console.log('✅ WebSocket Server initialized successfully');
      console.log(`📡 Real-time channels: ${Object.values(this.channels).join(', ')}`);
      
      return this;

    } catch (error) {
      console.error('❌ Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Setup Redis Cloud connections for pub/sub and adapter
   */
  async setupRedisConnections() {
    console.log('🔗 Connecting to Redis Cloud...');

    try {
      // Main Redis client for Socket.IO adapter
      this.redisClient = new Redis(this.redisConfig);
      
      // Separate subscriber client for pub/sub
      this.redisSubscriber = new Redis({
        ...this.redisConfig,
        lazyConnect: true
      });

      // Connection event handlers
      this.redisClient.on('connect', () => {
        console.log('✅ Redis client connected to Redis Cloud');
      });

      this.redisClient.on('error', (error) => {
        console.error('❌ Redis client error:', error);
      });

      this.redisSubscriber.on('connect', () => {
        console.log('✅ Redis subscriber connected to Redis Cloud');
      });

      this.redisSubscriber.on('error', (error) => {
        console.error('❌ Redis subscriber error:', error);
      });

      // Connect to Redis Cloud
      await Promise.all([
        this.redisClient.connect(),
        this.redisSubscriber.connect()
      ]);

      // Test Redis Cloud connection
      await this.redisClient.ping();
      console.log('🏓 Redis Cloud connection verified');

    } catch (error) {
      console.error('❌ Redis Cloud connection failed:', error);
      throw new Error(`Redis Cloud connection failed: ${error.message}`);
    }
  }

  /**
   * Setup JWT-based WebSocket authentication
   */
  setupAuthentication() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        
        if (!token) {
          throw new Error('No authentication token provided');
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            alertPreferences: true
          }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Attach user data to socket
        socket.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          preferences: user.alertPreferences
        };

        next();

      } catch (error) {
        console.error('WebSocket authentication failed:', error.message);
        next(new Error(`Authentication failed: ${error.message}`));
      }
    });
  }

  /**
   * Setup WebSocket connection handlers
   */
  setupConnectionHandlers() {
    this.io.on('connection', (socket) => {
      this.handleUserConnection(socket);
      this.setupSocketEventHandlers(socket);
    });
  }

  /**
   * Handle new user connection
   */
  async handleUserConnection(socket) {
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
      socket.emit('connection:established', {
        message: 'Connected to AgentRadar real-time system',
        capabilities: this.getUserCapabilities(user),
        channels: this.getAvailableChannels(user),
        timestamp: new Date().toISOString()
      });

      // Update user's last seen status
      await this.updateUserLastSeen(user.id);

      // Setup disconnection handler
      socket.on('disconnect', () => this.handleUserDisconnection(socket));

    } catch (error) {
      console.error('Error handling user connection:', error);
      socket.emit('error', { message: 'Connection setup failed' });
    }
  }

  /**
   * Setup socket event handlers for user interactions
   */
  setupSocketEventHandlers(socket) {
    const user = socket.user;

    // Property alerts subscription
    socket.on('alerts:subscribe', async (data) => {
      try {
        const { regions, alertTypes, priceRange } = data;
        await this.subscribeToAlerts(socket, user, { regions, alertTypes, priceRange });
        socket.emit('alerts:subscribed', { success: true, filters: data });
      } catch (error) {
        socket.emit('alerts:error', { message: error.message });
      }
    });

    // Property bookmarking
    socket.on('property:bookmark', async (data) => {
      try {
        await this.handlePropertyBookmark(user.id, data.propertyId, data.action);
        socket.emit('property:bookmarked', { success: true, propertyId: data.propertyId });
      } catch (error) {
        socket.emit('property:error', { message: error.message });
      }
    });

    // Real-time property inquiry
    socket.on('property:inquiry', async (data) => {
      try {
        await this.handlePropertyInquiry(user.id, data);
        socket.emit('inquiry:sent', { success: true, inquiryId: data.inquiryId });
      } catch (error) {
        socket.emit('inquiry:error', { message: error.message });
      }
    });

    // Market data subscription
    socket.on('market:subscribe', async (data) => {
      try {
        const { regions, metrics } = data;
        await socket.join(`market:${regions.join(',')}`);
        socket.emit('market:subscribed', { success: true, regions, metrics });
      } catch (error) {
        socket.emit('market:error', { message: error.message });
      }
    });

    // Heartbeat for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  }

  /**
   * Handle user disconnection cleanup
   */
  handleUserDisconnection(socket) {
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
  setupRealtimeChannels() {
    console.log('📡 Setting up real-time channels...');

    // Subscribe to Redis channels for real-time updates
    Object.values(this.channels).forEach(channel => {
      this.redisSubscriber.subscribe(channel);
    });

    // Handle incoming messages from Redis
    this.redisSubscriber.on('message', (channel, message) => {
      this.handleRealtimeMessage(channel, message);
    });
  }

  /**
   * Handle real-time messages from Redis channels
   */
  async handleRealtimeMessage(channel, message) {
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
  async handleUserAlert(data) {
    const { userId, alert, priority } = data;
    
    // Check if user is connected
    if (this.connectedUsers.has(userId)) {
      const socketId = this.connectedUsers.get(userId);
      const socket = this.io.sockets.sockets.get(socketId);
      
      if (socket) {
        socket.emit('alert:new', {
          alert,
          priority,
          timestamp: new Date().toISOString()
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
  async handleMarketUpdate(data) {
    const { region, update, affectedUsers } = data;
    
    // Broadcast to users subscribed to this region
    this.io.to(`market:${region}`).emit('market:update', {
      region,
      update,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📊 Market update sent for ${region}: ${update.type}`);
  }

  /**
   * Handle property changes (price, status, etc.)
   */
  async handlePropertyChange(data) {
    const { propertyId, changes, interestedUsers } = data;
    
    // Notify users who bookmarked or inquired about this property
    for (const userId of interestedUsers || []) {
      if (this.connectedUsers.has(userId)) {
        const socketId = this.connectedUsers.get(userId);
        const socket = this.io.sockets.sockets.get(socketId);
        
        if (socket) {
          socket.emit('property:changed', {
            propertyId,
            changes,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    console.log(`🏠 Property change notification sent for ${propertyId}`);
  }

  /**
   * Real-time API for broadcasting alerts
   */
  async broadcastAlert(userId, alert) {
    try {
      await this.redisClient.publish(this.channels.USER_ALERTS, JSON.stringify({
        userId,
        alert,
        priority: alert.priority || 'medium',
        timestamp: new Date().toISOString()
      }));
      
      console.log(`📤 Alert queued for user ${userId}`);
    } catch (error) {
      console.error('Failed to broadcast alert:', error);
    }
  }

  /**
   * Broadcast market updates
   */
  async broadcastMarketUpdate(region, update) {
    try {
      await this.redisClient.publish(this.channels.MARKET_UPDATES, JSON.stringify({
        region,
        update,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`📤 Market update queued for ${region}`);
    } catch (error) {
      console.error('Failed to broadcast market update:', error);
    }
  }

  /**
   * Broadcast property changes
   */
  async broadcastPropertyChange(propertyId, changes, interestedUsers = []) {
    try {
      await this.redisClient.publish(this.channels.PROPERTY_CHANGES, JSON.stringify({
        propertyId,
        changes,
        interestedUsers,
        timestamp: new Date().toISOString()
      }));
      
      console.log(`📤 Property change queued for ${propertyId}`);
    } catch (error) {
      console.error('Failed to broadcast property change:', error);
    }
  }

  /**
   * Setup health monitoring
   */
  setupHealthMonitoring() {
    // Monitor WebSocket connections
    setInterval(() => {
      const stats = {
        connectedUsers: this.connectedUsers.size,
        activeSockets: this.io.sockets.sockets.size,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
      
      // Store metrics in Redis for monitoring
      this.redisClient.setex('websocket:metrics', 60, JSON.stringify(stats));
      
      console.log(`📊 WebSocket Stats: ${stats.connectedUsers} users, ${stats.activeSockets} sockets`);
    }, 30000); // Every 30 seconds
  }

  /**
   * Helper methods
   */
  
  getUserCapabilities(user) {
    const baseCapabilities = ['alerts', 'bookmarks', 'market_updates'];
    
    switch (user.subscriptionTier) {
      case 'PROFESSIONAL':
      case 'TEAM_ENTERPRISE':
      case 'WHITE_LABEL':
        return [...baseCapabilities, 'priority_alerts', 'advanced_analytics', 'custom_filters'];
      case 'SOLO_AGENT':
        return [...baseCapabilities, 'priority_alerts'];
      default:
        return baseCapabilities;
    }
  }

  getAvailableChannels(user) {
    const channels = ['user_alerts', 'market_updates'];
    
    if (user.role === 'ADMIN') {
      channels.push('admin_monitoring', 'system_notifications');
    }
    
    return channels;
  }

  async subscribeToAlerts(socket, user, filters) {
    // Join region-based rooms
    for (const region of filters.regions || []) {
      await socket.join(`alerts:${region}`);
    }
    
    // Join alert type rooms
    for (const type of filters.alertTypes || []) {
      await socket.join(`alerts:type:${type}`);
    }
    
    // Store user preferences
    await prisma.alertPreference.upsert({
      where: { userId: user.id },
      update: {
        preferredCities: filters.regions,
        alertTypes: filters.alertTypes,
        minValue: filters.priceRange?.min,
        maxValue: filters.priceRange?.max
      },
      create: {
        userId: user.id,
        preferredCities: filters.regions,
        alertTypes: filters.alertTypes,
        minValue: filters.priceRange?.min,
        maxValue: filters.priceRange?.max
      }
    });
  }

  async handlePropertyBookmark(userId, propertyId, action) {
    if (action === 'add') {
      await prisma.userAlert.create({
        data: {
          userId,
          alertId: propertyId,
          bookmarked: true
        }
      });
    } else if (action === 'remove') {
      await prisma.userAlert.deleteMany({
        where: {
          userId,
          alertId: propertyId,
          bookmarked: true
        }
      });
    }
  }

  async handlePropertyInquiry(userId, inquiryData) {
    // Store inquiry in database
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PROPERTY_INQUIRY',
        details: JSON.stringify(inquiryData),
        timestamp: new Date()
      }
    });
  }

  async storeOfflineAlert(userId, alert) {
    try {
      await prisma.userAlert.create({
        data: {
          userId,
          alertId: alert.id,
          viewed: false,
          bookmarked: false
        }
      });
    } catch (error) {
      console.error('Error storing offline alert:', error);
    }
  }

  async updateUserLastSeen(userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() }
      });
    } catch (error) {
      console.error('Error updating user last seen:', error);
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down WebSocket server...');
    
    try {
      // Close all socket connections
      this.io.close();
      
      // Close Redis connections
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      
      if (this.redisSubscriber) {
        await this.redisSubscriber.quit();
      }
      
      // Close Prisma connection
      await prisma.$disconnect();
      
      console.log('✅ WebSocket server shutdown complete');
    } catch (error) {
      console.error('Error during WebSocket server shutdown:', error);
    }
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeSockets: this.io?.sockets.sockets.size || 0,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
let wsServerInstance = null;

export function createWebSocketServer(httpServer) {
  if (!wsServerInstance) {
    wsServerInstance = new AgentRadarWebSocketServer(httpServer);
  }
  return wsServerInstance;
}

export function getWebSocketServer() {
  return wsServerInstance;
}