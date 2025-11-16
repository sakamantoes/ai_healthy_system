import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, AlertTriangle } from "lucide-react";
import { symptomsAPI } from "../../services/api";
import { SYMPTOM_SEVERITY } from "../../utils/constants";
import LoadingSpinner from "../common/LoadingSpinner";

const SymptomForm = ({ onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [formData, setFormData] = useState({
    type: "",
    severity: 5,
    description: "",
    duration: "",
    triggers: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await symptomsAPI.create(formData);

      if (response.data.success) {
        setAnalysis(response.data.data.analysis);
        onSave(response.data.data);
      }
    } catch (error) {
      console.error("Error recording symptom:", error);
      alert("Failed to record symptom. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity >= 8) return "text-red-600";
    if (severity >= 5) return "text-orange-600";
    return "text-yellow-600";
  };

  const getSeverityBgColor = (severity) => {
    if (severity >= 8) return "bg-red-100";
    if (severity >= 5) return "bg-orange-100";
    return "bg-yellow-100";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Record Symptom
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {!analysis ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptom Type *
                </label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Headache, Nausea, Fatigue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Severity Level: {formData.severity}/10 -{" "}
                  {SYMPTOM_SEVERITY[formData.severity]}
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    name="severity"
                    value={formData.severity}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Very Mild</span>
                    <span>Moderate</span>
                    <span>Critical</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe the symptom in detail..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., 2 hours, since morning"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Possible Triggers
                  </label>
                  <input
                    type="text"
                    name="triggers"
                    value={formData.triggers}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Stress, certain foods, lack of sleep"
                  />
                </div>
              </div>

              {/* Severity Indicator */}
              <div
                className={`p-4 rounded-lg ${getSeverityBgColor(
                  formData.severity
                )}`}
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle
                    className={`w-5 h-5 ${getSeverityColor(formData.severity)}`}
                  />
                  <span
                    className={`font-medium ${getSeverityColor(
                      formData.severity
                    )}`}
                  >
                    {formData.severity >= 8
                      ? "High Severity"
                      : formData.severity >= 5
                      ? "Medium Severity"
                      : "Low Severity"}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {formData.severity >= 8
                    ? "Consider contacting your healthcare provider if this persists."
                    : formData.severity >= 5
                    ? "Monitor this symptom and record any changes."
                    : "This appears to be a mild symptom. Continue monitoring."}
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <LoadingSpinner size="small" text="" />
                  ) : (
                    "Record Symptom & Get Analysis"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  ✅ Symptom Recorded Successfully
                </h3>
                <p className="text-green-700">
                  Your symptom has been recorded. Here's the AI analysis:
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  AI Health Analysis
                </h4>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {analysis.analysis}
                  </p>
                </div>
                {analysis.riskLevel && (
                  <div
                    className={`mt-4 p-3 rounded-lg ${
                      analysis.riskLevel === "high"
                        ? "bg-red-100 text-red-800"
                        : analysis.riskLevel === "medium"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    <strong>Risk Level:</strong>{" "}
                    {analysis.riskLevel.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setAnalysis(null);
                    setFormData({
                      type: "",
                      severity: 5,
                      description: "",
                      duration: "",
                      triggers: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Record Another Symptom
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SymptomForm;
