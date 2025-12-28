import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiClient from '../lib/axios';

interface User {
  id: string;
  name: string;
  email?: string;
  role: {
    name: string;
    scope: string[];
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  scopes: string[];
  login: (token: string, userData?: User) => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setScopes([]);
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/auth/me');
      const data = response.data;

      // Support both new format {success, data: {decoded}} and legacy format {auth, decoded}
      let decoded = null;
      if (data.success && data.data?.decoded) {
        decoded = data.data.decoded;
      } else if (data.auth && data.decoded) {
        decoded = data.decoded;
      }

      if (decoded) {
        const role = decoded.role || {};
        const scopesArr = Array.isArray(role.scope)
          ? role.scope
          : role.scope
          ? [role.scope]
          : [];

        setIsAuthenticated(true);
        setScopes(scopesArr);
        setUser({
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: {
            name: role.name || 'user',
            scope: scopesArr,
          },
        });
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setScopes([]);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setIsAuthenticated(false);
      setUser(null);
      setScopes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = (token: string, userData?: User) => {
    localStorage.setItem('token', token);
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
      setScopes(userData.role.scope);
    } else {
      fetchMe();
    }
  };

  const logout = useCallback(async () => {
    try {
      await apiClient.get('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      setScopes([]);
      window.location.href = '/login';
    }
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    loading,
    user,
    scopes,
    login,
    logout,
    refreshAuth: fetchMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

