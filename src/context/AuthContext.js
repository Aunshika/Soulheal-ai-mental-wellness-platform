import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('soulheal_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(!localStorage.getItem('soulheal_user'));

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('soulheal_token');
    if (token) {
      API.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('soulheal_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('soulheal_token');
          localStorage.removeItem('soulheal_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, captchaToken) => {
    const res = await API.post('/auth/login', { email, password, captchaToken });
    localStorage.setItem('soulheal_token', res.data.token);
    localStorage.setItem('soulheal_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password, role, gender, captchaToken) => {
    const res = await API.post('/auth/register', { name, email, password, role, gender, captchaToken });
    localStorage.setItem('soulheal_token', res.data.token);
    localStorage.setItem('soulheal_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('soulheal_token');
    localStorage.removeItem('soulheal_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
