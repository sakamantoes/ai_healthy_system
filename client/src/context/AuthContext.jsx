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
  const [authLoading, setAuthLoading] = useState(false);

  // Get token from localStorage on initial load
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token");
  });

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      console.log("🔐 Verifying token...");
      const response = await authAPI.getProfile(token);
      console.log("✅ Token verification response:", response);

      if (response.success) {
        setUser(response.data.user);
        setPreferences(response.data.preferences);
        console.log("✅ User set successfully:", response.data.user);
      } else {
        console.log("❌ Token verification failed - response not successful");
        logout();
      }
    } catch (error) {
      console.error("❌ Token verification error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setAuthLoading(true);
      console.log("🔐 Starting login process for:", email);

      const response = await authAPI.login({ email, password });

      console.log("📨 Login API response:", response);

      // Check if response has the expected structure
      if (response && response.success) {
        const {
          token: newToken,
          user: userData,
          preferences: userPreferences,
        } = response.data;

        console.log("✅ Login successful - setting user data");

        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(userData);
        setPreferences(userPreferences);

        return { success: true };
      } else {
        console.log("❌ Login failed - invalid response structure:", response);
        return {
          success: false,
          message: response?.message || "Invalid response from server",
        };
      }
    } catch (error) {
      console.error("💥 Login error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Network error during login",
      };
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setAuthLoading(true);
      const response = await authAPI.register(userData);

      if (response.success) {
        return {
          success: true,
          message: "Registration successful! Please log in.",
        };
      } else {
        return {
          success: false,
          message: response.message || "Registration failed",
        };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    console.log("🚪 Logging out user");
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setPreferences(null);
  };

  const updateProfile = async (profileData) => {
    try {
      setAuthLoading(true);
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
    } finally {
      setAuthLoading(false);
    }
  };

  const updatePreferences = async (preferencesData) => {
    try {
      setAuthLoading(true);
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
    } finally {
      setAuthLoading(false);
    }
  };

  const value = {
    user,
    preferences,
    token,
    loading: loading || authLoading,
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
