import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('vocal_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res.data?.success) {
            setUser(res.data.data);
            setBusinesses(res.data.data.businesses || []);
          }
        })
        .catch(() => {
          localStorage.removeItem('vocal_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      const { token, user: loggedInUser } = res.data.data;
      localStorage.setItem('vocal_token', token);
      setUser(loggedInUser);
      setBusinesses(loggedInUser.businesses || []);
      return loggedInUser;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('vocal_token');
    setUser(null);
    setBusinesses([]);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.data);
        setBusinesses(res.data.data.businesses || []);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const getBusiness = (typeOrName) => {
    if (!businesses.length) return null;
    return businesses.find(
      (b) => b.type === typeOrName || b.name.toLowerCase() === typeOrName.toLowerCase()
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        businesses,
        login,
        logout,
        refreshUser,
        getBusiness,
        travelBiz: getBusiness('TRAVEL'),
        mobileBiz: getBusiness('MOBILE'),
        fuelBiz: getBusiness('FUEL'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
