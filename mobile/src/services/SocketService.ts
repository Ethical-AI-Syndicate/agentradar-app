import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface AlertData {
  id: string;
  alertType: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  description: string;
  address?: string;
  city: string;
  opportunityScore: number;
  estimatedValue?: number;
  createdAt: string;
}

export interface MarketUpdate {
  region: string;
  metric: string;
  currentValue: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: string;
}

export interface PropertyUpdate {
  propertyId: string;
  address: string;
  city: string;
  updateType: 'price_change' | 'status_change' | 'new_listing';
  previousValue?: number;
  newValue: number;
  changePercent?: number;
  timestamp: string;
}

class SocketService {
  private socket: Socket | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private userId: string | null = null;
  private listeners: Map<string, Function[]> = new Map();

  private config = {
    url: __DEV__ ? 'ws://localhost:4000' : 'wss://api.agentradar.app',
    options: {
      transports: ['websocket'],
      timeout: 20000,
      autoConnect: false,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
    }
  };

  async connect(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userDataStr = await AsyncStorage.getItem('user_data');
      
      if (!token || !userDataStr) {
        throw new Error('Authentication required');
      }

      const userData = JSON.parse(userDataStr);
      this.userId = userData.id;

      if (this.socket?.connected) {
        return;
      }

      this.socket = io(this.config.url, {
        ...this.config.options,
        auth: { token },
        query: { userId: this.userId }
      });

      this.setupEventListeners();
      this.socket.connect();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket?.once('connect', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.connectionAttempts = 0;
          console.log('SocketService: Connected successfully');
          resolve();
        });

        this.socket?.once('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('SocketService: Connection failed:', error);
          reject(error);
        });
      });

    } catch (error) {
      console.error('SocketService: Connection setup failed:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.connectionAttempts = 0;
      console.log('SocketService: Connected to server');
      
      if (this.userId) {
        this.socket?.emit('join_user_channel', this.userId);
      }

      this.emit('connection_status_changed', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('SocketService: Disconnected:', reason);
      this.emit('connection_status_changed', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('SocketService: Connection error:', error);
      this.handleReconnection();
    });

    this.socket.on('new_alert', (alert: AlertData) => {
      console.log('SocketService: Received new alert:', alert);
      this.handleNewAlert(alert);
      this.emit('new_alert', alert);
    });

    this.socket.on('market_update', (update: MarketUpdate) => {
      console.log('SocketService: Received market update:', update);
      this.emit('market_update', update);
    });

    this.socket.on('property_update', (update: PropertyUpdate) => {
      console.log('SocketService: Received property update:', update);
      this.emit('property_update', update);
    });

    this.socket.on('alert_matched', (data: { alert: AlertData; matchScore: number }) => {
      console.log('SocketService: Alert matched for user:', data);
      this.handlePersonalizedAlert(data.alert, data.matchScore);
      this.emit('alert_matched', data);
    });

    this.socket.on('system_notification', (notification: any) => {
      console.log('SocketService: System notification:', notification);
      this.emit('system_notification', notification);
    });
  }

  private async handleNewAlert(alert: AlertData): Promise<void> {
    try {
      const alertSettings = await AsyncStorage.getItem('alert_settings');
      const settings = alertSettings ? JSON.parse(alertSettings) : { enableNotifications: true };

      if (settings.enableNotifications && alert.priority === 'HIGH' || alert.priority === 'URGENT') {
        await this.sendLocalNotification({
          title: `New ${alert.alertType} Alert`,
          body: `${alert.title} - ${alert.city}`,
          data: { alertId: alert.id, type: 'new_alert' },
          categoryIdentifier: 'alert'
        });
      }

      await this.cacheAlert(alert);
    } catch (error) {
      console.error('SocketService: Error handling new alert:', error);
    }
  }

  private async handlePersonalizedAlert(alert: AlertData, matchScore: number): Promise<void> {
    try {
      if (matchScore >= 75) {
        await this.sendLocalNotification({
          title: 'High-Priority Match!',
          body: `${alert.title} - ${Math.round(matchScore)}% match`,
          data: { alertId: alert.id, matchScore, type: 'personalized_alert' },
          categoryIdentifier: 'high_priority'
        });
      }

      await this.cacheAlert(alert);
    } catch (error) {
      console.error('SocketService: Error handling personalized alert:', error);
    }
  }

  private async cacheAlert(alert: AlertData): Promise<void> {
    try {
      const existingAlertsStr = await AsyncStorage.getItem('cached_alerts');
      const existingAlerts: AlertData[] = existingAlertsStr ? JSON.parse(existingAlertsStr) : [];
      
      const filteredAlerts = existingAlerts.filter(a => a.id !== alert.id);
      const updatedAlerts = [alert, ...filteredAlerts].slice(0, 100);
      
      await AsyncStorage.setItem('cached_alerts', JSON.stringify(updatedAlerts));
    } catch (error) {
      console.error('SocketService: Error caching alert:', error);
    }
  }

  private async sendLocalNotification(notification: {
    title: string;
    body: string;
    data: any;
    categoryIdentifier: string;
  }): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          categoryIdentifier: notification.categoryIdentifier,
          sound: 'default',
          badge: 1,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('SocketService: Error sending notification:', error);
    }
  }

  private handleReconnection(): void {
    if (this.connectionAttempts >= this.maxReconnectAttempts) {
      console.error('SocketService: Max reconnection attempts reached');
      this.emit('max_reconnections_reached');
      return;
    }

    this.connectionAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.connectionAttempts), 30000);
    
    console.log(`SocketService: Reconnecting in ${delay}ms (attempt ${this.connectionAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected && this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`SocketService: Error in ${event} callback:`, error);
        }
      });
    }
  }

  joinChannel(channel: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_channel', channel);
    }
  }

  leaveChannel(channel: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_channel', channel);
    }
  }

  sendMessage(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('SocketService: Cannot send message - not connected');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  async getCachedAlerts(): Promise<AlertData[]> {
    try {
      const cachedAlertsStr = await AsyncStorage.getItem('cached_alerts');
      return cachedAlertsStr ? JSON.parse(cachedAlertsStr) : [];
    } catch (error) {
      console.error('SocketService: Error getting cached alerts:', error);
      return [];
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem('cached_alerts');
    } catch (error) {
      console.error('SocketService: Error clearing cache:', error);
    }
  }
}

export default new SocketService();