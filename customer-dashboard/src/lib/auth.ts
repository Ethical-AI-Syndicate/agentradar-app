/**
 * Customer Dashboard Authentication System
 * Integrates with AgentRadar API for secure session management
 */

import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.agentradar.app';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  subscriptionTier: string;
  licenseNumber?: string;
  createdAt: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  licenseNumber?: string;
}

// Token management
const TOKEN_KEY = 'agentradar_token';
const USER_KEY = 'agentradar_user';

export const setToken = (token: string): void => {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.agentradar.app' : undefined,
  });
};

export const getToken = (): string | null => {
  return Cookies.get(TOKEN_KEY) || null;
};

export const clearToken = (): void => {
  Cookies.remove(TOKEN_KEY, {
    domain: process.env.NODE_ENV === 'production' ? '.agentradar.app' : undefined,
  });
  Cookies.remove(USER_KEY, {
    domain: process.env.NODE_ENV === 'production' ? '.agentradar.app' : undefined,
  });
};

export const setUser = (user: User): void => {
  Cookies.set(USER_KEY, JSON.stringify(user), {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.agentradar.app' : undefined,
  });
};

export const getUser = (): User | null => {
  const userStr = Cookies.get(USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// JWT token validation
export const isTokenValid = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch {
    return false;
  }
};

// API request interceptors
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && isTokenValid(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const login = async (credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const response = await apiClient.post('/api/health?action=login', credentials);
    
    if (response.data.success && response.data.token && response.data.user) {
      setToken(response.data.token);
      setUser(response.data.user);
      
      return {
        success: true,
        user: response.data.user,
      };
    }
    
    return {
      success: false,
      error: response.data.error || 'Login failed',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Network error occurred',
    };
  }
};

export const register = async (data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const response = await apiClient.post('/api/health?action=register', data);
    
    if (response.data.success && response.data.token && response.data.user) {
      setToken(response.data.token);
      setUser(response.data.user);
      
      return {
        success: true,
        user: response.data.user,
      };
    }
    
    return {
      success: false,
      error: response.data.error || 'Registration failed',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Network error occurred',
    };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await apiClient.get('/api/health?action=me');
    
    if (response.data.success && response.data.user) {
      setUser(response.data.user);
      return response.data.user;
    }
    
    return null;
  } catch (error) {
    clearToken();
    return null;
  }
};

export const logout = (): void => {
  clearToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const refreshUserData = async (): Promise<User | null> => {
  const token = getToken();
  if (!token || !isTokenValid(token)) {
    clearToken();
    return null;
  }
  
  return await getCurrentUser();
};

// Subscription management
export const getSubscriptionPlans = async () => {
  try {
    const response = await apiClient.get('/api/health?action=subscription-plans');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch subscription plans:', error);
    throw error;
  }
};

export const createCheckoutSession = async (planId: string, successUrl: string, cancelUrl: string) => {
  try {
    const response = await apiClient.post('/api/health?action=create-checkout', {
      planId,
      successUrl,
      cancelUrl,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
};

export const getSubscriptionStatus = async () => {
  try {
    const response = await apiClient.get('/api/health?action=subscription-status');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch subscription status:', error);
    throw error;
  }
};

export const createCustomerPortalSession = async (returnUrl: string) => {
  try {
    const response = await apiClient.post('/api/health?action=customer-portal', {
      returnUrl,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create customer portal session:', error);
    throw error;
  }
};

// Utility functions
export const getInitialAuthState = (): AuthState => {
  const token = getToken();
  const user = getUser();
  
  return {
    user,
    isAuthenticated: !!(token && user && isTokenValid(token)),
    isLoading: false,
    token,
  };
};

export const hasValidSession = (): boolean => {
  const token = getToken();
  return !!(token && isTokenValid(token));
};