import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('walleto_token');
    const storedUser = localStorage.getItem('walleto_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('walleto_token');
        localStorage.removeItem('walleto_user');
      }
    }
    setLoading(false);
  }, []);

  const persistAuth = (tokenValue, userData) => {
    localStorage.setItem('walleto_token', tokenValue);
    localStorage.setItem('walleto_user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  };

  const clearAuth = () => {
    localStorage.removeItem('walleto_token');
    localStorage.removeItem('walleto_user');
    setToken(null);
    setUser(null);
  };

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      persistAuth(newToken, userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/register', { name, email, password });
      const { token: newToken, user: userData } = response.data;
      persistAuth(newToken, userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = useCallback(() => {
    clearAuth();
  }, []);

  const refreshUser = async () => {
    try {
      const response = await axiosInstance.get('/api/auth/me');
      const { user: userData } = response.data;
      setUser(userData);
      localStorage.setItem('walleto_user', JSON.stringify(userData));
    } catch (error) {
      logout();
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
