import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('examease_token'));
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState([]);

  useEffect(() => {
    // Fetch available demo accounts
    api.auth
      .getDemoAccounts()
      .then((res) => {
        if (res.accounts) setDemoAccounts(res.accounts);
      })
      .catch(() => {});

    // Check token validity on mount
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('examease_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.auth.getMe();
        if (res.user) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  const login = async (email, password = null) => {
    try {
      const res = await api.auth.demoLogin(email, password);
      if (res.token && res.user) {
        localStorage.setItem('examease_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('examease_token');
    setToken(null);
    setUser(null);
  };

  const switchAccount = async (email) => {
    return login(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'ADMIN',
        loading,
        demoAccounts,
        login,
        logout,
        switchAccount,
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
