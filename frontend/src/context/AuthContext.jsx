import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Token ${savedToken}`;
    }
    return savedToken;
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user info when token is set/verified
  useEffect(() => {
    if (token) {
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
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      const res = await axios.post('/api/auth/login/', { username, password });
      const newToken = res.data.token;
      axios.defaults.headers.common['Authorization'] = `Token ${newToken}`;
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      return { success: true };
    } catch (err) {
      console.error("Login failed:", err);
      const message = err.response?.data?.non_field_errors?.[0] || 
                      err.response?.data?.detail || 
                      "Invalid username or password.";
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post('/api/auth/register/', { username, email, password });
      const newToken = res.data.token;
      axios.defaults.headers.common['Authorization'] = `Token ${newToken}`;
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      return { success: true };
    } catch (err) {
      console.error("Registration failed:", err);
      const message = err.response?.data?.error || 
                      err.response?.data?.detail || 
                      "Registration failed. Please check your details.";
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
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
