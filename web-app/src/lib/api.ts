/**
 * API Service Layer
 * Handles all API communications with the backend
 */

import { apiClient } from './auth';

// Types
export interface Alert {
  id: string;
  userId: string;
  type: 'POWER_OF_SALE' | 'FORECLOSURE' | 'ESTATE_SALE' | 'TAX_SALE';
  title: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  price?: number;
  estimatedValue?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'ACTIVE' | 'PAUSED' | 'RESOLVED';
  sourceUrl?: string;
  caseNumber?: string;
  saleDate?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertPreference {
  id: string;
  userId: string;
  cities: string[];
  propertyTypes: string[];
  minPrice?: number;
  maxPrice?: number;
  alertTypes: string[];
  priorities: string[];
  maxDistanceKm?: number;
  notificationMethods: string[];
  emailFrequency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedProperty {
  id: string;
  userId: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  propertyType?: string;
  price?: number;
  estimatedValue?: number;
  notes?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Alert API
export const alertsApi = {
  // Get all alerts for the user
  getAlerts: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    priority?: string;
    city?: string;
  }): Promise<PaginatedResponse<Alert>> => {
    const response = await apiClient.get('/alerts', { params });
    return response.data;
  },

  // Get personalized alerts
  getPersonalizedAlerts: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Alert>> => {
    const response = await apiClient.get('/alerts/personalized', { params });
    return response.data;
  },

  // Get alert by ID
  getAlert: async (id: string): Promise<ApiResponse<Alert>> => {
    const response = await apiClient.get(`/alerts/${id}`);
    return response.data;
  },

  // Create alert
  createAlert: async (alertData: Omit<Alert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Alert>> => {
    const response = await apiClient.post('/alerts', alertData);
    return response.data;
  },

  // Update alert
  updateAlert: async (id: string, alertData: Partial<Alert>): Promise<ApiResponse<Alert>> => {
    const response = await apiClient.put(`/alerts/${id}`, alertData);
    return response.data;
  },

  // Delete alert
  deleteAlert: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/alerts/${id}`);
    return response.data;
  },

  // Mark alert as resolved
  resolveAlert: async (id: string): Promise<ApiResponse<Alert>> => {
    const response = await apiClient.patch(`/alerts/${id}/resolve`);
    return response.data;
  },
};

// Alert Preferences API
export const preferencesApi = {
  // Get user preferences
  getPreferences: async (): Promise<ApiResponse<AlertPreference>> => {
    const response = await apiClient.get('/preferences');
    return response.data;
  },

  // Update preferences
  updatePreferences: async (preferences: Partial<AlertPreference>): Promise<ApiResponse<AlertPreference>> => {
    const response = await apiClient.put('/preferences', preferences);
    return response.data;
  },

  // Reset preferences to default
  resetPreferences: async (): Promise<ApiResponse<AlertPreference>> => {
    const response = await apiClient.post('/preferences/reset');
    return response.data;
  },
};

// Saved Properties API
export const propertiesApi = {
  // Get saved properties
  getSavedProperties: async (params?: {
    page?: number;
    limit?: number;
    city?: string;
    propertyType?: string;
    isFavorite?: boolean;
    tags?: string[];
  }): Promise<PaginatedResponse<SavedProperty>> => {
    const response = await apiClient.get('/properties', { params });
    return response.data;
  },

  // Get property by ID
  getProperty: async (id: string): Promise<ApiResponse<SavedProperty>> => {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data;
  },

  // Save property
  saveProperty: async (propertyData: Omit<SavedProperty, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<SavedProperty>> => {
    const response = await apiClient.post('/properties', propertyData);
    return response.data;
  },

  // Update property
  updateProperty: async (id: string, propertyData: Partial<SavedProperty>): Promise<ApiResponse<SavedProperty>> => {
    const response = await apiClient.put(`/properties/${id}`, propertyData);
    return response.data;
  },

  // Delete property
  deleteProperty: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/properties/${id}`);
    return response.data;
  },

  // Toggle favorite
  toggleFavorite: async (id: string): Promise<ApiResponse<SavedProperty>> => {
    const response = await apiClient.patch(`/properties/${id}/favorite`);
    return response.data;
  },

  // Add tag to property
  addTag: async (id: string, tag: string): Promise<ApiResponse<SavedProperty>> => {
    const response = await apiClient.patch(`/properties/${id}/tags`, { tag });
    return response.data;
  },

  // Remove tag from property
  removeTag: async (id: string, tag: string): Promise<ApiResponse<SavedProperty>> => {
    const response = await apiClient.delete(`/properties/${id}/tags/${encodeURIComponent(tag)}`);
    return response.data;
  },
};

// Search API
export interface PropertySearchParams {
  query?: string;
  city?: string;
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  radius?: number; // in km
  sortBy?: 'price' | 'date' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PropertySearchResult {
  id: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  propertyType?: string;
  price?: number;
  estimatedValue?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: string;
  yearBuilt?: number;
  description?: string;
  images?: string[];
  sourceUrl?: string;
  listingDate?: string;
  relevanceScore?: number;
}

export const searchApi = {
  // Search properties
  searchProperties: async (params: PropertySearchParams): Promise<PaginatedResponse<PropertySearchResult>> => {
    const response = await apiClient.get('/search/properties', { params });
    return response.data;
  },

  // Get search suggestions
  getSearchSuggestions: async (query: string): Promise<ApiResponse<string[]>> => {
    const response = await apiClient.get('/search/suggestions', { params: { q: query } });
    return response.data;
  },

  // Get popular searches
  getPopularSearches: async (): Promise<ApiResponse<string[]>> => {
    const response = await apiClient.get('/search/popular');
    return response.data;
  },
};

// Analytics API
export interface DashboardStats {
  totalAlerts: number;
  activeAlerts: number;
  highPriorityAlerts: number;
  savedProperties: number;
  favoriteProperties: number;
  totalValue: number;
  averageROI: number;
  marketTrend: number;
  newAlertsThisWeek: number;
  resolvedAlertsThisWeek: number;
}

export interface MarketTrend {
  date: string;
  averagePrice: number;
  totalListings: number;
  daysOnMarket: number;
}

export const analyticsApi = {
  // Get dashboard statistics
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },

  // Get market trends
  getMarketTrends: async (params?: {
    city?: string;
    propertyType?: string;
    timeframe?: 'week' | 'month' | 'quarter' | 'year';
  }): Promise<ApiResponse<MarketTrend[]>> => {
    const response = await apiClient.get('/analytics/trends', { params });
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (params?: {
    timeframe?: 'week' | 'month' | 'quarter' | 'year';
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/analytics/performance', { params });
    return response.data;
  },
};

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffInMs = now.getTime() - then.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return formatDate(date);
};