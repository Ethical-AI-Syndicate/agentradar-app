'use client';

/**
 * Authentication Context Provider
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  login as apiLogin, 
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
  isAuthenticated,
  getUser,
  setUser as setUserCookie,
  setToken as setTokenCookie,
  LoginData,
  RegisterData
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isAuthenticated()) {
          // Try to get cached user first
          const cachedUser = getUser();
          if (cachedUser) {
            setUser(cachedUser);
            setLoading(false);
            
            // Refresh user data in background
            try {
              const freshUser = await getCurrentUser();
              if (freshUser) {
                setUser(freshUser);
              }
            } catch (error) {
              console.error('Failed to refresh user:', error);
            }
          } else {
            // No cached user, fetch from API
            const currentUser = await getCurrentUser();
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      const response = await apiLogin(data);
      
      if (response.success) {
        setTokenCookie(response.token);
        setUserCookie(response.user);
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiRegister(data);
      
      if (response.success) {
        setTokenCookie(response.token);
        setUserCookie(response.user);
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Registration failed' };
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};