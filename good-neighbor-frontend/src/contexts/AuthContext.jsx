import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on load
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (phoneOrEmail, password) => {
    try {
      // Determine if input is phone or email
      const isEmail = phoneOrEmail.includes('@');
      const isPhone = /^\+380\d{9}$/.test(phoneOrEmail);
      
      // Send as login_id for backward compatibility (backend detects phone/email pattern)
      // Or send explicitly as phone/email
      const payload = isEmail 
        ? { email: phoneOrEmail, password }
        : isPhone
        ? { phone: phoneOrEmail, password }
        : { login_id: phoneOrEmail, password }; // Fallback for backward compat
      
      const response = await api.post('/auth/login', payload);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Помилка входу' 
      };
    }
  };

  const activate = async (data) => {
    try {
      const response = await api.post('/auth/activate', data);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (error) {
      // Return errors array if present (validation errors) or single error message
      const errorMsg = error.response?.data?.error;
      const validationErrors = error.response?.data?.errors;
      
      return { 
        success: false, 
        error: errorMsg || (validationErrors ? validationErrors[0].msg : 'Помилка активації')
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  return (
    <AuthContext.Provider value={{ user, login, activate, logout, loading, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
