// Health categories and types
export const HEALTH_CATEGORIES = {
  MEDICATION: "medication",
  EXERCISE: "exercise",
  DIET: "diet",
  SYMPTOM: "symptom",
  LIFESTYLE: "lifestyle",
};

export const PRIORITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

export const REMINDER_TYPES = {
  MEDICATION: "medication",
  EXERCISE: "exercise",
  APPOINTMENT: "appointment",
  SYMPTOM_CHECK: "symptom_check",
  WATER: "water",
  OTHER: "other",
};

export const HEALTH_METRIC_TYPES = {
  BLOOD_PRESSURE: "blood_pressure",
  HEART_RATE: "heart_rate",
  BLOOD_SUGAR: "blood_sugar",
  WEIGHT: "weight",
  TEMPERATURE: "temperature",
  OTHER: "other",
};

// Common units for health metrics
export const HEALTH_UNITS = {
  BLOOD_PRESSURE: "mmHg",
  HEART_RATE: "bpm",
  BLOOD_SUGAR: "mg/dL",
  WEIGHT: "kg",
  TEMPERATURE: "°C",
  STEPS: "steps",
  MINUTES: "minutes",
  GLASSES: "glasses",
};

// Symptom severity levels
export const SYMPTOM_SEVERITY = {
  1: "Very Mild",
  2: "Mild",
  3: "Moderate",
  4: "Moderate",
  5: "Moderate",
  6: "Moderate to Severe",
  7: "Severe",
  8: "Very Severe",
  9: "Extremely Severe",
  10: "Critical",
};

// Medication frequencies
export const MEDICATION_FREQUENCIES = [
  "once daily",
  "twice daily",
  "three times daily",
  "four times daily",
  "as needed",
  "weekly",
  "monthly",
];

// Common medication times
export const COMMON_MEDICATION_TIMES = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

// API base URL
export const API_BASE_URL = "http://localhost:5000/api";

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  PREFERENCES: "preferences",
};
