/**
 * Authentication utilities and API client
 */

import axios from "axios";
import Cookies from "js-cookie";

// API Configuration - Use production API
const API_BASE_URL = process.env.NODE_ENV === 'production' ? 'https://api.agentradar.app/api' : '/api';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Token management
const TOKEN_KEY = "agentradar_token";
const USER_KEY = "agentradar_user";

export const setToken = (token: string) => {
  Cookies.set(TOKEN_KEY, token, {
    expires: 30,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain:
      process.env.NODE_ENV === "production" ? ".agentradar.app" : undefined,
  });
};

export const getToken = (): string | null => {
  return Cookies.get(TOKEN_KEY) || null;
};

export const clearToken = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_KEY);
};

// User management
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  subscriptionTier: string;
  subscription?: {
    plan: string;
    status: string;
    expiresAt?: string;
  };
  preferences?: {
    notifications: boolean;
    alertFrequency: string;
    regions: string[];
  };
}

export const setUser = (user: User) => {
  Cookies.set(USER_KEY, JSON.stringify(user), {
    expires: 30,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain:
      process.env.NODE_ENV === "production" ? ".agentradar.app" : undefined,
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

export const clearUser = () => {
  Cookies.remove(USER_KEY);
};

// Auth API calls
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    user: User;
  };
}

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await apiClient.post("/health?action=login", data);
  
  // Transform response to match expected format
  if (response.data.success) {
    setToken(response.data.token);
    setUser(response.data.user);
    
    return {
      success: true,
      message: response.data.message,
      data: {
        accessToken: response.data.token,
        refreshToken: response.data.token,
        expiresIn: "24h",
        user: response.data.user
      }
    };
  }
  
  return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiClient.post("/health?action=register", data);
  
  // Transform response to match expected format
  if (response.data.success) {
    setToken(response.data.token);
    setUser(response.data.user);
    
    return {
      success: true,
      message: response.data.message,
      data: {
        accessToken: response.data.token,
        refreshToken: response.data.token,
        expiresIn: "24h",
        user: response.data.user
      }
    };
  }
  
  return response.data;
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearToken();
    clearUser();
  }
};

export const refreshToken = async (): Promise<string | null> => {
  try {
    const response = await apiClient.post("/auth/refresh");
    const { token } = response.data;
    setToken(token);
    return token;
  } catch (error) {
    clearToken();
    clearUser();
    return null;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await apiClient.get("/health?action=me");
    if (response.data.success) {
      const user = response.data.user;
      setUser(user);
      return user;
    }
    return null;
  } catch (error) {
    clearToken();
    clearUser();
    return null;
  }
};

// Auth status check
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const hasRole = (role: string): boolean => {
  const user = getUser();
  return user?.role === role;
};

export const hasValidSubscription = (): boolean => {
  const user = getUser();
  return user?.subscription?.status === "active";
};
