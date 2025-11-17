import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data);
    return Promise.reject(error);
  }
);

// Auth API - FIXED VERSION
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      return response.data; // This should return { success: true, data: { token, user, preferences } }
    } catch (error) {
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProfile: async (token) => {
    try {
      const response = await api.get("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (profileData, token) => {
    try {
      const response = await api.put("/auth/profile", profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updatePreferences: async (preferencesData, token) => {
    try {
      const response = await api.put("/auth/preferences", preferencesData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Medications API
export const medicationsAPI = {
  getAll: () => api.get("/medications"),
  create: (medicationData) => api.post("/medications", medicationData),
  update: (id, medicationData) => api.put(`/medications/${id}`, medicationData),
  delete: (id) => api.delete(`/medications/${id}`),
};

// Symptoms API
export const symptomsAPI = {
  getAll: (limit = 20) => api.get(`/symptoms?limit=${limit}`),
  create: (symptomData) => api.post("/symptoms", symptomData),
};

// Goals API
export const goalsAPI = {
  getAll: () => api.get("/goals"),
  create: (goalData) => api.post("/goals", goalData),
  update: (id, goalData) => api.put(`/goals/${id}`, goalData),
};

// Health Metrics API
export const healthMetricsAPI = {
  getAll: (type, limit = 30) =>
    api.get(`/health-metrics?type=${type}&limit=${limit}`),
  create: (metricData) => api.post("/health-metrics", metricData),
};

// Reminders API
export const remindersAPI = {
  getAll: (upcoming = false) => api.get(`/reminders?upcoming=${upcoming}`),
  create: (reminderData) => api.post("/reminders", reminderData),
  update: (id, reminderData) => api.put(`/reminders/${id}`, reminderData),
};

// AI Insights API
export const aiAPI = {
  getInsights: () => api.get("/ai-insights"),
  sendTestAlert: () => api.post("/send-test-alert"),
};

export default api;
