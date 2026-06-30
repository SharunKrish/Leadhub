import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios defaults on token change
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      localStorage.setItem('auth_token', token);
      
      // Fetch user info
      axios.get('/api/auth/user/')
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Invalid token:", err);
          // Token is invalid, clean up
          logout();
          setLoading(false);
        });
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('auth_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      const res = await axios.post('/api/auth/login/', { username, password });
      setToken(res.data.token);
      return { success: true };
    } catch (err) {
      console.error("Login failed:", err);
      const message = err.response?.data?.non_field_errors?.[0] || 
                      err.response?.data?.detail || 
                      "Invalid username or password.";
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await axios.post('/api/auth/logout/');
      } catch (err) {
        console.error("Logout request failed:", err);
      }
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
