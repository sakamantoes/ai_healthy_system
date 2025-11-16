import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await authAPI.getProfile(token);
      if (response.success) {
        setUser(response.data.user);
        setPreferences(response.data.preferences);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.success) {
        const { token, user, preferences } = response.data;
        localStorage.setItem("token", token);
        setToken(token);
        setUser(user);
        setPreferences(preferences);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        const { token, user, preferences } = response.data;
        localStorage.setItem("token", token);
        setToken(token);
        setUser(user);
        setPreferences(preferences);
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setPreferences(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData, token);
      if (response.success) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Update failed",
      };
    }
  };

  const updatePreferences = async (preferencesData) => {
    try {
      const response = await authAPI.updatePreferences(preferencesData, token);
      if (response.success) {
        setPreferences(response.data);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Update failed",
      };
    }
  };

  const value = {
    user,
    preferences,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
