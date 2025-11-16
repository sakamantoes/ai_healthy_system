import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Activity,
  Calendar,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { symptomsAPI } from "../../services/api";
import SymptomForm from "./SymptomForm";
import LoadingSpinner from "../common/LoadingSpinner";

const SymptomList = () => {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSymptoms();
  }, []);

  const fetchSymptoms = async () => {
    try {
      const response = await symptomsAPI.getAll(20);
      if (response.data.success) {
        setSymptoms(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching symptoms:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity >= 8) return "text-red-600 bg-red-100";
    if (severity >= 5) return "text-orange-600 bg-orange-100";
    return "text-yellow-600 bg-yellow-100";
  };

  const getSeverityIcon = (severity) => {
    if (severity >= 8) return "🔴";
    if (severity >= 5) return "🟠";
    return "🟡";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner text="Loading symptoms..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Symptom Tracker</h1>
          <p className="text-gray-600 mt-2">
            Monitor and analyze your health symptoms
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Record Symptom</span>
        </motion.button>
      </div>

      {/* Symptoms List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {symptoms.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {symptoms.map((symptom, index) => (
              <motion.div
                key={symptom.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-2xl mt-1">
                      {getSeverityIcon(symptom.severity)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {symptom.type}
                        </h3>
                        <span
                          className={`text-sm px-2 py-1 rounded-full ${getSeverityColor(
                            symptom.severity
                          )}`}
                        >
                          Severity: {symptom.severity}/10
                        </span>
                      </div>

                      {symptom.description && (
                        <p className="text-gray-600 mb-3">
                          {symptom.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        {symptom.duration && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{symptom.duration}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>Recorded {formatDate(symptom.recordedAt)}</span>
                        </div>

                        {symptom.triggers && (
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Triggers: {symptom.triggers}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No symptoms recorded
            </h3>
            <p className="text-gray-600 mb-4">
              Start tracking your symptoms to get AI-powered insights
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Record First Symptom
            </button>
          </motion.div>
        )}
      </div>

      {/* Stats Summary */}
      {symptoms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {symptoms.length}
                </p>
                <p className="text-sm text-gray-600">Total Symptoms</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {symptoms.filter((s) => s.severity >= 7).length}
                </p>
                <p className="text-sm text-gray-600">High Severity</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    new Set(
                      symptoms.map((s) => new Date(s.recordedAt).toDateString())
                    ).size
                  }
                </p>
                <p className="text-sm text-gray-600">Tracking Days</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Symptom Form Modal */}
      {showForm && (
        <SymptomForm
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false);
            fetchSymptoms();
          }}
        />
      )}
    </div>
  );
};

export default SymptomList;
