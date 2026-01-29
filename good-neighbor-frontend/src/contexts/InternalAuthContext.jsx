import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const InternalAuthContext = createContext(null);

export const InternalAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('internal_token');
    localStorage.removeItem('internal_user');
    setUser(null);
  }, []);

  useEffect(() => {
    // Check for existing token on load
    const token = localStorage.getItem('internal_token');
    const savedUser = localStorage.getItem('internal_user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Verify user is super_admin
        if (parsedUser.role === 'super_admin') {
          setUser(parsedUser);
          // Note: Token validity will be checked on first API call
          // If token is invalid, the API interceptor will handle it
        } else {
          logout();
        }
      } catch (e) {
        console.error("Failed to parse user data", e);
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  const login = async (login_id, password) => {
    try {
      const response = await api.post('/auth/login', { login_id, password });
      const { token, user } = response.data;
      
      // Verify super_admin role
      if (user.role !== 'super_admin') {
        return { 
          success: false, 
          error: 'Access denied. Super admin privileges required' 
        };
      }
      
      // Use separate storage for internal panel
      localStorage.setItem('internal_token', token);
      localStorage.setItem('internal_user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login error' 
      };
    }
  };

  return (
    <InternalAuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </InternalAuthContext.Provider>
  );
};

export const useInternalAuth = () => {
  const context = useContext(InternalAuthContext);
  if (!context) {
    throw new Error('useInternalAuth must be used within an InternalAuthProvider');
  }
  return context;
};
