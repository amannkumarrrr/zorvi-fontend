import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../services/authApi';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { addToast } = useToast();
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem('aura_user') && Boolean(localStorage.getItem('aura_token'));
  });

  // Check existing session on application boot
  const checkSession = useCallback(async () => {
    const token = localStorage.getItem('aura_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response && response.success && response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('aura_user', JSON.stringify(response.data.user));
      } else {
        // Guard against race conditions: only clear if token wasn't replaced by a newer login
        const currentToken = localStorage.getItem('aura_token');
        if (currentToken === token) {
          setUser(null);
          localStorage.removeItem('aura_token');
          localStorage.removeItem('aura_user');
        }
      }
    } catch (err) {
      // Keep existing user on network hiccup
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async ({ email, password }) => {
    try {
      const result = await authApi.login({ email, password });
      if (result.success && result.data?.user) {
        const loggedUser = result.data.user;
        const loggedToken = result.data.token;
        if (loggedToken) {
          localStorage.setItem('aura_token', loggedToken);
        }
        localStorage.setItem('aura_user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        setLoading(false);
        addToast(`Welcome back, ${loggedUser.name}!`, 'success');
        return { success: true, user: loggedUser };
      }
      return { success: false, message: result.message || 'Login failed' };
    } catch (error) {
      addToast(error.message, 'error');
      return { success: false, message: error.message, errors: error.errors };
    }
  };

  const register = async ({ name, email, password, signupToken }) => {
    try {
      const result = await authApi.register({ name, email, password, signupToken });
      if (result.success && result.data?.user) {
        setUser(result.data.user);
        if (result.data.token) {
          localStorage.setItem('aura_token', result.data.token);
        }
        localStorage.setItem('aura_user', JSON.stringify(result.data.user));
        addToast(`Account created! Welcome to ZORVI, ${result.data.user.name}.`, 'success');
        return { success: true, user: result.data.user };
      }
      return { success: false, message: result.message || 'Registration failed' };
    } catch (error) {
      addToast(error.message, 'error');
      return { success: false, message: error.message, errors: error.errors };
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_user');
      await authApi.logout();
      setUser(null);
      addToast('You have been signed out.', 'info');
    } catch (error) {
      setUser(null);
      localStorage.removeItem('aura_token');
      localStorage.removeItem('aura_user');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        refreshUser: checkSession,
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

export default AuthContext;
