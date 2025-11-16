import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Calendar, Flag } from "lucide-react";
import { goalsAPI } from "../../services/api";
import { HEALTH_CATEGORIES, PRIORITY_LEVELS } from "../../utils/constants";
import LoadingSpinner from "../common/LoadingSpinner";

const GoalForm = ({ goal, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "exercise",
    targetValue: "",
    unit: "",
    deadline: "",
    priority: "medium",
    sendProgressEmails: true,
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title || "",
        description: goal.description || "",
        category: goal.category || "exercise",
        targetValue: goal.targetValue || "",
        unit: goal.unit || "",
        deadline: goal.deadline ? goal.deadline.split("T")[0] : "",
        priority: goal.priority || "medium",
        sendProgressEmails:
          goal.sendProgressEmails !== undefined
            ? goal.sendProgressEmails
            : true,
      });
    }
  }, [goal]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        targetValue: parseFloat(formData.targetValue),
      };

      let response;
      if (goal) {
        response = await goalsAPI.update(goal.id, submitData);
      } else {
        response = await goalsAPI.create(submitData);
      }

      if (response.data.success) {
        onSave(response.data.data);
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      alert("Failed to save goal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryUnits = (category) => {
    switch (category) {
      case "exercise":
        return ["steps", "minutes", "hours", "sessions", "km", "miles"];
      case "diet":
        return ["glasses", "servings", "cups", "liters", "meals"];
      case "medication":
        return ["doses", "times", "days"];
      case "symptom":
        return ["days", "episodes", "scale"];
      case "lifestyle":
        return ["hours", "days", "sessions", "times"];
      default:
        return ["units", "times", "days"];
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {goal ? "Edit Goal" : "Create New Goal"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goal Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Walk 10,000 steps daily"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe your goal..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Object.entries(HEALTH_CATEGORIES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Object.entries(PRIORITY_LEVELS).map(([key, value]) => (
                    <option key={key} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Value *
                </label>
                <input
                  type="number"
                  name="targetValue"
                  value={formData.targetValue}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select unit</option>
                  {getCategoryUnits(formData.category).map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Deadline</span>
                </div>
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="sendProgressEmails"
                checked={formData.sendProgressEmails}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label className="text-sm text-gray-700">
                Send progress update emails
              </label>
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
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <LoadingSpinner size="small" text="" />
                ) : goal ? (
                  "Update Goal"
                ) : (
                  "Create Goal"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GoalForm;
