import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

const SymptomTracker = ({ user }) => {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [formData, setFormData] = useState({
    type: "",
    severity: 1,
    description: "",
    duration: "",
    triggers: "",
  });

  useEffect(() => {
    fetchSymptoms();
  }, []);

  const fetchSymptoms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/symptoms?limit=20",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setSymptoms(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching symptoms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/symptoms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setSymptoms((prev) => [result.data.symptom, ...prev]);
        setAnalysis(result.data.analysis);
        setShowForm(false);
        setFormData({
          type: "",
          severity: 1,
          description: "",
          duration: "",
          triggers: "",
        });
      }
    } catch (error) {
      console.error("Error recording symptom:", error);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity <= 3) return "bg-green-100 text-green-800";
    if (severity <= 6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getRiskLevelColor = (riskLevel) => {
    const colors = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[riskLevel] || colors.low;
  };

  const getRiskIcon = (riskLevel) => {
    const icons = {
      low: <CheckCircle className="text-green-600" size={20} />,
      medium: <Activity className="text-yellow-600" size={20} />,
      high: <AlertTriangle className="text-red-600" size={20} />,
    };
    return icons[riskLevel] || icons.low;
  };

  // Calculate symptom trends
  const getSymptomTrend = (symptomType) => {
    const recentSymptoms = symptoms
      .filter((s) => s.type === symptomType)
      .slice(0, 5)
      .reverse();

    if (recentSymptoms.length < 2) return "stable";

    const first = recentSymptoms[0].severity;
    const last = recentSymptoms[recentSymptoms.length - 1].severity;

    if (last > first + 1) return "increasing";
    if (last < first - 1) return "decreasing";
    return "stable";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading symptom data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Symptom Tracker
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor and analyze your symptoms with AI
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            <span>Record Symptom</span>
          </motion.button>
        </motion.div>

        {/* AI Analysis */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-8 p-6 rounded-xl border-2 ${getRiskLevelColor(
              analysis.riskLevel
            )}`}
          >
            <div className="flex items-center space-x-3 mb-4">
              {getRiskIcon(analysis.riskLevel)}
              <h3 className="text-lg font-semibold">AI Health Analysis</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(
                  analysis.riskLevel
                )}`}
              >
                {analysis.riskLevel.toUpperCase()} RISK
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-line">
              {analysis.analysis}
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Symptom List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Recent Symptoms
              </h2>

              <div className="space-y-4">
                <AnimatePresence>
                  {symptoms.map((symptom, index) => (
                    <motion.div
                      key={symptom.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${getSeverityColor(
                            symptom.severity
                          )}`}
                        >
                          <span className="font-bold text-lg">
                            {symptom.severity}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {symptom.type}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {symptom.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock size={12} />
                              <span>
                                {new Date(
                                  symptom.recordedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            {symptom.duration && (
                              <span className="text-xs text-gray-500">
                                Duration: {symptom.duration}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                            symptom.severity
                          )}`}
                        >
                          {symptom.severity <= 3
                            ? "Mild"
                            : symptom.severity <= 6
                            ? "Moderate"
                            : "Severe"}
                        </div>
                        {getSymptomTrend(symptom.type) === "increasing" && (
                          <TrendingUp className="text-red-500" size={16} />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Empty State */}
              {symptoms.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Activity size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No symptoms recorded
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start tracking your symptoms to get AI-powered insights
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Record First Symptom
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Statistics Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Symptom Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Symptom Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Recorded</span>
                  <span className="font-medium">{symptoms.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last 7 Days</span>
                  <span className="font-medium">
                    {
                      symptoms.filter(
                        (s) =>
                          new Date(s.recordedAt) >
                          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Average Severity
                  </span>
                  <span className="font-medium">
                    {symptoms.length > 0
                      ? (
                          symptoms.reduce((sum, s) => sum + s.severity, 0) /
                          symptoms.length
                        ).toFixed(1)
                      : "0"}
                  </span>
                </div>
              </div>
            </div>

            {/* Common Symptoms */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Common Symptoms
              </h3>
              <div className="space-y-2">
                {Object.entries(
                  symptoms.reduce((acc, symptom) => {
                    acc[symptom.type] = (acc[symptom.type] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-700">{type}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {count} times
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Severity Distribution
              </h3>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                  const count = symptoms.filter(
                    (s) => s.severity === level
                  ).length;
                  const percentage =
                    symptoms.length > 0 ? (count / symptoms.length) * 100 : 0;

                  return (
                    <div key={level} className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600 w-4">{level}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            level <= 3
                              ? "bg-green-500"
                              : level <= 6
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Add Symptom Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Record New Symptom
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symptom Type
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Headache, Fatigue, Nausea"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity: {formData.severity}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.severity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          severity: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Mild</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows="3"
                      placeholder="Describe the symptom in detail..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({ ...formData, duration: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., 2 hours, 30 minutes"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Potential Triggers
                      </label>
                      <input
                        type="text"
                        value={formData.triggers}
                        onChange={(e) =>
                          setFormData({ ...formData, triggers: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Stress, Certain foods"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Record Symptom
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SymptomTracker;
