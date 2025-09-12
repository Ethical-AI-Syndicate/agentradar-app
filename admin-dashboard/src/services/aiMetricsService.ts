import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AIMetrics {
  daily: {
    totalTokens: number;
    totalCost: number;
    totalCalls: number;
    successRate: number;
    averageLatency: number;
    date: string;
    costFormatted: string;
    successRateFormatted: string;
    averageLatencyFormatted: string;
  };
  operations: Array<{
    operation: string;
    totalCalls: number;
    successRate: number;
    averageLatency: number;
    totalTokens: number;
    totalCost: number;
    errors: string[];
    totalCostFormatted: string;
    successRateFormatted: string;
    averageLatencyFormatted: string;
  }>;
}

export interface AIMetricsFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  operations?: string[];
  minSuccessRate?: number;
}

class AIMetricsService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add auth interceptor
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('AI Metrics API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get daily AI statistics
   */
  async getDailyStats(date?: string): Promise<AIMetrics['daily']> {
    try {
      const params = date ? { date } : {};
      const response = await this.apiClient.get('/api/ai-stats/daily', { params });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch daily AI stats:', error);
      throw new Error('Unable to load daily AI statistics');
    }
  }

  /**
   * Get AI operations breakdown
   */
  async getOperationsStats(filters?: AIMetricsFilters): Promise<AIMetrics['operations']> {
    try {
      const response = await this.apiClient.get('/api/ai-stats/operations', { 
        params: filters 
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch operations stats:', error);
      throw new Error('Unable to load operations statistics');
    }
  }

  /**
   * Get historical AI metrics for charts
   */
  async getHistoricalStats(days: number = 30): Promise<{
    dates: string[];
    costs: number[];
    tokens: number[];
    calls: number[];
    successRates: number[];
    latencies: number[];
  }> {
    try {
      const response = await this.apiClient.get('/api/ai-stats/historical', {
        params: { days }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch historical stats:', error);
      throw new Error('Unable to load historical data');
    }
  }

  /**
   * Trigger daily summary email
   */
  async triggerDailySummary(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.apiClient.post('/api/ai-stats/summary');
      return response.data;
    } catch (error) {
      console.error('Failed to trigger daily summary:', error);
      throw new Error('Unable to send daily summary email');
    }
  }

  /**
   * Get real-time AI metrics (WebSocket alternative)
   */
  async getRealTimeStats(): Promise<{
    activeOperations: number;
    currentCost: number;
    lastHourCalls: number;
    systemStatus: 'healthy' | 'warning' | 'critical';
  }> {
    try {
      const response = await this.apiClient.get('/api/ai-stats/realtime');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch real-time stats:', error);
      throw new Error('Unable to load real-time data');
    }
  }

  /**
   * Get cost breakdown by service
   */
  async getCostBreakdown(period: '1d' | '7d' | '30d' = '7d'): Promise<{
    services: Array<{
      name: string;
      cost: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    totalCost: number;
  }> {
    try {
      const response = await this.apiClient.get('/api/ai-stats/cost-breakdown', {
        params: { period }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch cost breakdown:', error);
      throw new Error('Unable to load cost breakdown');
    }
  }

  /**
   * Get performance alerts
   */
  async getPerformanceAlerts(): Promise<Array<{
    id: string;
    type: 'cost' | 'latency' | 'error_rate' | 'usage';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>> {
    try {
      const response = await this.apiClient.get('/api/ai-stats/alerts');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      throw new Error('Unable to load performance alerts');
    }
  }

  /**
   * Update alert settings
   */
  async updateAlertSettings(settings: {
    costThreshold: number;
    latencyThreshold: number;
    errorRateThreshold: number;
    emailNotifications: boolean;
  }): Promise<{ success: boolean }> {
    try {
      const response = await this.apiClient.put('/api/ai-stats/alerts/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update alert settings:', error);
      throw new Error('Unable to update alert settings');
    }
  }

  /**
   * Export AI metrics data
   */
  async exportMetrics(format: 'csv' | 'json' = 'csv', period: string = '30d'): Promise<Blob> {
    try {
      const response = await this.apiClient.get('/api/ai-stats/export', {
        params: { format, period },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export metrics:', error);
      throw new Error('Unable to export metrics data');
    }
  }
}

export const aiMetricsService = new AIMetricsService();
export default aiMetricsService;