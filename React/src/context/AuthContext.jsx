import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      checkAuthStatus();
      setInitialized(true);
    }
  }, [initialized]);

  const checkAuthStatus = async () => {
    try {
      // First restore from localStorage immediately for better UX
      const storedUserData = localStorage.getItem('userData');
      const token = localStorage.getItem('token');
      
      if (storedUserData && token) {
        try {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
        } catch (error) {
          console.error("Error parsing stored user data:", error);
          // Only clear if data is corrupted
          localStorage.removeItem('userData');
        }
      }

      // If no stored credentials, set loading to false and return
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Verify token with server (but don't block UI with stored data)
      try {
        const data = await authService.checkAuth();
        
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
      } catch (error) {
        console.log("Auth verification error:", error);
        
        // Only clear localStorage on explicit authentication errors
        if (error.status === 401 || error.status === 403) {
          console.log("Invalid credentials - clearing localStorage");
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setUser(null);
        } else {
          // For network/server errors, keep using stored credentials
          console.log("Network/server error - keeping stored credentials");
          // If we had stored user data, keep it
          if (!user && storedUserData) {
            try {
              setUser(JSON.parse(storedUserData));
            } catch (e) {
              console.error("Error restoring user data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Critical auth error:", error);
      // Only clear on critical errors
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await authService.signIn(email, password);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state and storage on logout
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
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