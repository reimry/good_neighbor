import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const InternalAuthContext = createContext(null);

export const InternalAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        } else {
          logout();
        }
      } catch (e) {
        console.error("Failed to parse user data", e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (login_id, password) => {
    try {
      const response = await api.post('/auth/login', { login_id, password });
      const { token, user } = response.data;
      
      // Verify super_admin role
      if (user.role !== 'super_admin') {
        return { 
          success: false, 
          error: 'Доступ заборонено. Потрібні права супер-адміністратора' 
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
        error: error.response?.data?.error || 'Помилка входу' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('internal_token');
    localStorage.removeItem('internal_user');
    setUser(null);
  };

  return (
    <InternalAuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </InternalAuthContext.Provider>
  );
};

export const useInternalAuth = () => useContext(InternalAuthContext);
