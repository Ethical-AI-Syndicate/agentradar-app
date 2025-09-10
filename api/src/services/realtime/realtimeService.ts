/**
 * Real-Time Service Integration
 * Integrates WebSocket server with Express app and provides real-time APIs
 */

import {
  createWebSocketServer,
  getWebSocketServer,
  AgentRadarWebSocketServer,
} from "./websocketServer.js";
import Redis from "ioredis";
import { Server as HttpServer } from "http";

interface Alert {
  id: string;
  type: string;
  title?: string;
  message?: string;
  propertyId?: string;
  address?: string;
  priority?: string;
  opportunityScore?: number;
  metadata?: any;
}

interface Listing {
  id: string;
  type: string;
  address: string;
  price?: number;
  region?: string;
  opportunityScore?: number;
}

interface UserPreferences {
  regions?: string[];
  types?: string[];
  priorityTypes?: string[];
}

interface MatchedUser {
  id: string;
  preferences: UserPreferences;
}

interface MarketUpdate {
  type?: string;
  title?: string;
  message?: string;
  data?: any;
  impact?: string;
  affectedProperties?: number;
}

interface PropertyChanges {
  type?: string;
  title?: string;
  changes?: any;
  newValue?: any;
  oldValue?: any;
  significance?: string;
}

interface SystemNotification {
  type?: string;
  title?: string;
  message?: string;
  severity?: string;
  targetUsers?: string;
}

export class RealtimeService {
  private wsServer: AgentRadarWebSocketServer | null = null;
  private redisClient: Redis | null = null;
  private initialized: boolean = false;

  /**
   * Initialize real-time services
   */
  async initialize(httpServer: HttpServer): Promise<RealtimeService> {
    try {
      console.log("🚀 Initializing AgentRadar Real-Time Services...");

      // Setup Redis client for publishing
      this.redisClient = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        username: process.env.REDIS_USERNAME || "default",
        db: 0,
        enableReadyCheck: true,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        commandTimeout: 5000,
        tls: process.env.REDIS_TLS === "true" ? {} : undefined,
      });

      await this.redisClient.connect();
      console.log("✅ Redis Cloud connected for real-time publishing");

      // Create and initialize WebSocket server
      this.wsServer = createWebSocketServer(httpServer);
      await this.wsServer.initialize();

      this.initialized = true;
      console.log("✅ Real-Time Services initialized successfully");

      return this;
    } catch (error) {
      console.error("❌ Failed to initialize Real-Time Services:", error);
      throw error;
    }
  }

  /**
   * Send real-time alert to specific user
   */
  async sendUserAlert(userId: string, alert: Alert): Promise<void> {
    if (!this.initialized || !this.wsServer) {
      console.warn("Real-time service not initialized, skipping alert");
      return;
    }

    try {
      await this.wsServer.broadcastAlert(userId, {
        id: alert.id,
        type: alert.type,
        title: alert.title || "New Property Alert",
        message:
          alert.message || "A new property matching your criteria is available",
        propertyId: alert.propertyId,
        address: alert.address,
        priority: alert.priority || "medium",
        opportunityScore: alert.opportunityScore,
        metadata: alert.metadata || {},
      });

      console.log(`📨 Real-time alert sent to user ${userId}: ${alert.type}`);
    } catch (error) {
      console.error("Error sending user alert:", error);
    }
  }

  /**
   * Broadcast market update to all subscribed users
   */
  async broadcastMarketUpdate(
    region: string,
    update: MarketUpdate,
  ): Promise<void> {
    if (!this.initialized || !this.wsServer) {
      console.warn("Real-time service not initialized, skipping market update");
      return;
    }

    try {
      await this.wsServer.broadcastMarketUpdate(region, {
        type: update.type || "market_change",
        title: update.title || "Market Update",
        message: update.message,
        data: update.data,
        impact: update.impact || "medium",
        affectedProperties: update.affectedProperties || 0,
      });

      console.log(`📊 Market update broadcast for ${region}: ${update.type}`);
    } catch (error) {
      console.error("Error broadcasting market update:", error);
    }
  }

  /**
   * Notify users about property changes
   */
  async notifyPropertyChange(
    propertyId: string,
    changes: PropertyChanges,
    interestedUserIds: string[] = [],
  ): Promise<void> {
    if (!this.initialized || !this.wsServer) {
      console.warn(
        "Real-time service not initialized, skipping property change notification",
      );
      return;
    }

    try {
      await this.wsServer.broadcastPropertyChange(
        propertyId,
        {
          type: changes.type || "property_update",
          title: changes.title || "Property Update",
          changes: changes.changes || {},
          newValue: changes.newValue,
          oldValue: changes.oldValue,
          significance: changes.significance || "medium",
        },
        interestedUserIds,
      );

      console.log(
        `🏠 Property change notification sent for ${propertyId} to ${interestedUserIds.length} users`,
      );
    } catch (error) {
      console.error("Error notifying property change:", error);
    }
  }

  /**
   * Send system-wide notification
   */
  async sendSystemNotification(
    notification: SystemNotification,
  ): Promise<void> {
    if (!this.initialized || !this.redisClient) {
      console.warn(
        "Real-time service not initialized, skipping system notification",
      );
      return;
    }

    try {
      await this.redisClient.publish(
        "system_notifications",
        JSON.stringify({
          type: notification.type || "system_update",
          title: notification.title || "System Notification",
          message: notification.message,
          severity: notification.severity || "info",
          targetUsers: notification.targetUsers || "all",
          timestamp: new Date().toISOString(),
        }),
      );

      console.log(`🔔 System notification sent: ${notification.type}`);
    } catch (error) {
      console.error("Error sending system notification:", error);
    }
  }

  /**
   * Real-time alert matching and dispatch
   */
  async processNewListing(listing: Listing): Promise<void> {
    if (!this.initialized) {
      console.warn(
        "Real-time service not initialized, skipping listing processing",
      );
      return;
    }

    try {
      // This would typically integrate with the alert matching service
      // For now, we'll simulate the process

      const matchedUsers = await this.findMatchingUsers(listing);

      for (const user of matchedUsers) {
        await this.sendUserAlert(user.id, {
          id: `listing-${listing.id}`,
          type: "new_listing",
          title: "New Property Match",
          message: `A new ${listing.type} property at ${listing.address} matches your search criteria`,
          propertyId: listing.id,
          address: listing.address,
          priority: this.calculateAlertPriority(listing, user.preferences),
          opportunityScore: listing.opportunityScore,
          metadata: {
            price: listing.price,
            propertyType: listing.type,
            region: listing.region,
          },
        });
      }

      console.log(
        `🎯 Processed new listing ${listing.id}, matched ${matchedUsers.length} users`,
      );
    } catch (error) {
      console.error("Error processing new listing:", error);
    }
  }

  /**
   * Batch send alerts (for daily digest, etc.)
   */
  async sendBatchAlerts(
    alerts: Array<{ userId: string; alertData: Alert }>,
  ): Promise<void> {
    if (!this.initialized || !alerts?.length) {
      return;
    }

    try {
      const promises = alerts.map((alert) =>
        this.sendUserAlert(alert.userId, alert.alertData),
      );

      await Promise.allSettled(promises);
      console.log(`📦 Batch sent ${alerts.length} alerts`);
    } catch (error) {
      console.error("Error sending batch alerts:", error);
    }
  }

  /**
   * Get real-time service statistics
   */
  getStats(): any {
    if (!this.initialized) {
      return { status: "not_initialized" };
    }

    return {
      status: "active",
      websocket: this.wsServer?.getStats() || {},
      redis: {
        status: this.redisClient?.status || "unknown",
        connectedAt: new Date().toISOString(),
      },
      initialized: this.initialized,
    };
  }

  /**
   * Health check for real-time services
   */
  async healthCheck(): Promise<any> {
    try {
      if (!this.initialized) {
        return { status: "unhealthy", reason: "not_initialized" };
      }

      // Test Redis connection
      if (this.redisClient) {
        await this.redisClient.ping();
      }

      // Get WebSocket stats
      const wsStats = this.wsServer?.getStats() || {};

      return {
        status: "healthy",
        websocket: {
          connected_users: wsStats.connectedUsers || 0,
          active_sockets: wsStats.activeSockets || 0,
        },
        redis: {
          status: "connected",
          response_time: "ok",
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: "unhealthy",
        reason: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Helper methods
   */

  async findMatchingUsers(listing: Listing): Promise<MatchedUser[]> {
    // This would integrate with your user preferences and alert matching logic
    // Placeholder implementation
    return [
      // { id: 'user1', preferences: { regions: ['toronto'], types: ['power_of_sale'] } }
    ];
  }

  calculateAlertPriority(
    listing: Listing,
    userPreferences?: UserPreferences,
  ): string {
    let priority = "medium";

    if ((listing.opportunityScore || 0) > 80) priority = "high";
    if (listing.type === "power_of_sale" || listing.type === "tax_sale")
      priority = "high";
    if (userPreferences?.priorityTypes?.includes(listing.type))
      priority = "high";

    return priority;
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log("🛑 Shutting down Real-Time Services...");

    try {
      if (this.wsServer) {
        await this.wsServer.shutdown();
      }

      if (this.redisClient) {
        await this.redisClient.quit();
      }

      this.initialized = false;
      console.log("✅ Real-Time Services shutdown complete");
    } catch (error) {
      console.error("Error during Real-Time Services shutdown:", error);
    }
  }
}

// Export singleton instance
let realtimeServiceInstance: RealtimeService | null = null;

export function createRealtimeService(): RealtimeService {
  if (!realtimeServiceInstance) {
    realtimeServiceInstance = new RealtimeService();
  }
  return realtimeServiceInstance;
}

export function getRealtimeService(): RealtimeService | null {
  return realtimeServiceInstance;
}
