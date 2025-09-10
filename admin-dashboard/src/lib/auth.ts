/**
 * Admin Dashboard Authentication System
 * Integrates with AgentRadar API for secure admin session management
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
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  permissions: string[];
  lastLogin: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Token management
const TOKEN_KEY = 'agentradar_admin_token';
const USER_KEY = 'agentradar_admin_user';

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

export const setUser = (user: AdminUser): void => {
  Cookies.set(USER_KEY, JSON.stringify(user), {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.agentradar.app' : undefined,
  });
};

export const getUser = (): AdminUser | null => {
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
    return decoded.exp > currentTime && decoded.role === 'ADMIN' || decoded.role === 'SUPER_ADMIN';
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
export const login = async (credentials: LoginCredentials): Promise<{ success: boolean; user?: AdminUser; error?: string }> => {
  try {
    const response = await apiClient.post('/api/health?action=admin-login', credentials);
    
    if (response.data.success && response.data.token && response.data.user) {
      // Verify user has admin role
      if (response.data.user.role !== 'ADMIN' && response.data.user.role !== 'SUPER_ADMIN') {
        return {
          success: false,
          error: 'Access denied: Admin privileges required',
        };
      }

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

export const getCurrentUser = async (): Promise<AdminUser | null> => {
  try {
    const response = await apiClient.get('/api/health?action=admin-me');
    
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

// Permission checking
export const hasPermission = (user: AdminUser | null, permission: string): boolean => {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return user.permissions.includes(permission);
};

export const hasAnyPermission = (user: AdminUser | null, permissions: string[]): boolean => {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return permissions.some(permission => user.permissions.includes(permission));
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

// Admin permissions constants
export const PERMISSIONS = {
  // User Management
  VIEW_USERS: 'users:view',
  CREATE_USERS: 'users:create',
  EDIT_USERS: 'users:edit',
  DELETE_USERS: 'users:delete',
  
  // Content Management
  MANAGE_BLOG: 'content:blog',
  MANAGE_CAREERS: 'content:careers',
  MANAGE_DOCS: 'content:docs',
  
  // Support
  VIEW_TICKETS: 'support:view',
  MANAGE_TICKETS: 'support:manage',
  
  // Billing
  VIEW_BILLING: 'billing:view',
  MANAGE_BILLING: 'billing:manage',
  
  // System
  VIEW_ANALYTICS: 'system:analytics',
  MANAGE_SYSTEM: 'system:manage',
  
  // Reports
  VIEW_REPORTS: 'reports:view',
  CREATE_REPORTS: 'reports:create',
} as const;