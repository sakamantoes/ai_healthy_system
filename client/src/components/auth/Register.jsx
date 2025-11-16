import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, User, Mail, Lock, Eye, EyeOff, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    condition: "",
    preferences: {
      dailyHealthAlerts: true,
      medicationReminders: true,
      appointmentReminders: true,
      symptomTrackingReminders: true,
      goalProgressUpdates: true,
      motivationalMessages: true,
      emailFrequency: "instant",
      preferredEmailTime: "09:00",
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("preferences.")) {
      const prefField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefField]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await register(formData);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-green-600 p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4"
          >
            <Heart className="w-8 h-8 text-blue-600" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-blue-100">Start your health management journey</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Age"
                  min="1"
                  max="120"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  placeholder="Health condition (e.g., Diabetes, Hypertension)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">
                Notification Preferences
              </h3>

              <div className="space-y-3">
                {[
                  { key: "dailyHealthAlerts", label: "Daily Health Alerts" },
                  { key: "medicationReminders", label: "Medication Reminders" },
                  {
                    key: "appointmentReminders",
                    label: "Appointment Reminders",
                  },
                  {
                    key: "symptomTrackingReminders",
                    label: "Symptom Tracking Reminders",
                  },
                  {
                    key: "goalProgressUpdates",
                    label: "Goal Progress Updates",
                  },
                  {
                    key: "motivationalMessages",
                    label: "Motivational Messages",
                  },
                ].map((pref) => (
                  <label key={pref.key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name={`preferences.${pref.key}`}
                      checked={formData.preferences[pref.key]}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{pref.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Frequency
                </label>
                <select
                  name="preferences.emailFrequency"
                  value={formData.preferences.emailFrequency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="instant">Instant</option>
                  <option value="daily_digest">Daily Digest</option>
                  <option value="weekly_summary">Weekly Summary</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Email Time
                </label>
                <input
                  type="time"
                  name="preferences.preferredEmailTime"
                  value={formData.preferences.preferredEmailTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating account...
              </div>
            ) : (
              "Create Account"
            )}
          </motion.button>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
