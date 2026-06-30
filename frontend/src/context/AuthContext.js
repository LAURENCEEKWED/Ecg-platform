import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { translations } from '../i18n';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  
  // Load settings from localStorage on init
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedLanguage = localStorage.getItem('language');
    if (savedDarkMode) setDarkMode(savedDarkMode === 'true');
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  // Apply dark mode to DOM
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translation function
  const t = (key) => translations[language]?.[key] || translations['en'][key] || key;

  const logout = useCallback(() => {
    localStorage.removeItem('ecg_token');
    localStorage.removeItem('ecg_user');
    setUser(null);
    setProfile(null);
    delete api.defaults.headers.common['Authorization'];
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('ecg_token');
    const savedUser = localStorage.getItem('ecg_user');
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(parsedUser);
        // Verify token
        api.get('/auth/me').then(res => {
          setUser(res.data.user);
          setProfile(res.data.profile);
        }).catch(() => logout());
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData, profile: profileData } = res.data;
    localStorage.setItem('ecg_token', token);
    localStorage.setItem('ecg_user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    setProfile(profileData);
    return userData;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user: userData, profile: profileData } = res.data;
    localStorage.setItem('ecg_token', token);
    localStorage.setItem('ecg_user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    setProfile(profileData);
    return userData;
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('ecg_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, 
      darkMode, setDarkMode, 
      language, setLanguage, t,
      login, register, logout, setUser, setProfile, updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
