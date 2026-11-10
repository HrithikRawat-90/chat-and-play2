import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('chat_play_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('chat_play_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('chat_play_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('chat_play_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Auth token verification failed:', err.message);
          setUser(null);
          setToken(null);
          localStorage.removeItem('chat_play_token');
          localStorage.removeItem('chat_play_user');
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user } = res.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('chat_play_token', token);
        localStorage.setItem('chat_play_user', JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', userData);
      if (res.data.success) {
        const { token, user } = res.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('chat_play_token', token);
        localStorage.setItem('chat_play_user', JSON.stringify(user));
        return { success: true, user };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout network error (ignoring):', err.message);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('chat_play_token');
      localStorage.removeItem('chat_play_user');
    }
  };

  const updateCurrentUser = (updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('chat_play_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        updateCurrentUser,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

