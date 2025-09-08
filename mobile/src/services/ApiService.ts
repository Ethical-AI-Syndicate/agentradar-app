import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  subscriptionTier: string;
  createdAt: string;
  isActive: boolean;
}

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
  status: string;
}

export interface AlertPreferences {
  preferredCities: string[];
  alertTypes: string[];
  priorityLevels: string[];
  maxDailyAlerts: number;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enablePushNotifications: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  minOpportunityScore?: number;
  maxPropertyValue?: number;
  minPropertyValue?: number;
  propertyTypes?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;
  private isOnline: boolean = true;
  private requestQueue: Array<{ config: AxiosRequestConfig; resolve: Function; reject: Function }> = [];

  constructor() {
    this.baseURL = __DEV__ ? 'http://localhost:4000/api' : 'https://api.agentradar.app/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.setupNetworkMonitoring();
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (!this.isOnline) {
          throw new Error('No internet connection');
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            await this.logout();
            return Promise.reject(refreshError);
          }
        }

        if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
          this.queueRequest(originalRequest);
          return Promise.reject(new Error('Network error - request queued for retry'));
        }

        return Promise.reject(error);
      }
    );
  }

  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected === true;
      
      if (wasOffline && this.isOnline) {
        this.processQueuedRequests();
      }
    });
  }

  private queueRequest(config: AxiosRequestConfig): void {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ config, resolve, reject });
    });
  }

  private async processQueuedRequests(): Promise<void> {
    while (this.requestQueue.length > 0) {
      const { config, resolve, reject } = this.requestQueue.shift()!;
      try {
        const response = await this.api(config);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await this.api.post('/auth/login', credentials);
      const { user, token } = response.data;
      
      await AsyncStorage.multiSet([
        ['auth_token', token],
        ['user_data', JSON.stringify(user)],
      ]);
      
      return { success: true, data: { user, token } };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  }

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await this.api.post('/auth/register', data);
      const { user, token } = response.data;
      
      await AsyncStorage.multiSet([
        ['auth_token', token],
        ['user_data', JSON.stringify(user)],
      ]);
      
      return { success: true, data: { user, token } };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  }

  async refreshToken(): Promise<void> {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.api.post('/auth/refresh', { refreshToken });
    const { token } = response.data;
    
    await AsyncStorage.setItem('auth_token', token);
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.get('/auth/me');
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to get user data' 
      };
    }
  }

  async getAlerts(params: {
    page?: number;
    limit?: number;
    type?: string;
    priority?: string;
    city?: string;
    status?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<AlertData>>> {
    try {
      const response = await this.api.get('/alerts', { params });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch alerts' 
      };
    }
  }

  async getPersonalizedAlerts(limit: number = 20): Promise<ApiResponse<{ alerts: AlertData[]; personalized: boolean }>> {
    try {
      const response = await this.api.get('/alerts/personalized', {
        params: { limit }
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch personalized alerts' 
      };
    }
  }

  async getAlert(id: string): Promise<ApiResponse<AlertData>> {
    try {
      const response = await this.api.get(`/alerts/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch alert' 
      };
    }
  }

  async bookmarkAlert(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post(`/alerts/${id}/bookmark`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to bookmark alert' 
      };
    }
  }

  async unbookmarkAlert(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.delete(`/alerts/${id}/bookmark`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to remove bookmark' 
      };
    }
  }

  async markAlertViewed(id: string, userId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.put(`/alerts/${id}/viewed`, { userId });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to mark alert as viewed' 
      };
    }
  }

  async getAlertStats(timeframe: '7d' | '30d' | '90d' = '30d'): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/alerts/stats', {
        params: { timeframe }
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch alert statistics' 
      };
    }
  }

  async getPreferences(): Promise<ApiResponse<AlertPreferences>> {
    try {
      const response = await this.api.get('/preferences');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch preferences' 
      };
    }
  }

  async updatePreferences(preferences: Partial<AlertPreferences>): Promise<ApiResponse<AlertPreferences>> {
    try {
      const response = await this.api.put('/preferences', preferences);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update preferences' 
      };
    }
  }

  async getPreferenceOptions(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/preferences/options');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch preference options' 
      };
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return false;
      
      const result = await this.getCurrentUser();
      return result.success;
    } catch (error) {
      return false;
    }
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await AsyncStorage.getItem(`cache_${key}`);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > 5 * 60 * 1000; // 5 minutes
        if (!isExpired) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  async setCachedData<T>(key: string, data: T): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error setting cached data:', error);
    }
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  showNetworkError(): void {
    Alert.alert(
      'Network Error',
      'Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
  }
}

export default new ApiService();