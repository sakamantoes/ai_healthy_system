import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Pill, Clock, Bell, BellOff } from "lucide-react";
import { medicationsAPI } from "../../services/api";
import {
  MEDICATION_FREQUENCIES,
  COMMON_MEDICATION_TIMES,
} from "../../utils/constants";
import LoadingSpinner from "../common/LoadingSpinner";

const MedicationForm = ({ medication, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "once daily",
    times: [],
    instructions: "",
    sendEmailReminders: true,
    isActive: true,
  });

  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name || "",
        dosage: medication.dosage || "",
        frequency: medication.frequency || "once daily",
        times: medication.times || [],
        instructions: medication.instructions || "",
        sendEmailReminders:
          medication.sendEmailReminders !== undefined
            ? medication.sendEmailReminders
            : true,
        isActive:
          medication.isActive !== undefined ? medication.isActive : true,
      });
    }
  }, [medication]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTimeToggle = (time) => {
    setFormData((prev) => ({
      ...prev,
      times: prev.times.includes(time)
        ? prev.times.filter((t) => t !== time)
        : [...prev.times, time].sort(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.times.length === 0) {
      alert("Please select at least one medication time");
      return;
    }

    setLoading(true);

    try {
      let response;
      if (medication) {
        response = await medicationsAPI.update(medication.id, formData);
      } else {
        response = await medicationsAPI.create(formData);
      }

      if (response.data.success) {
        onSave(response.data.data);
      }
    } catch (error) {
      console.error("Error saving medication:", error);
      alert("Failed to save medication. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Pill className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {medication ? "Edit Medication" : "Add New Medication"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medication Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Metformin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosage *
              </label>
              <input
                type="text"
                name="dosage"
                value={formData.dosage}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 500mg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency *
              </label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {MEDICATION_FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="isActive"
                value={formData.isActive}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Medication Times *</span>
              </div>
              <span className="text-xs text-gray-500 font-normal">
                Select all times when you need to take this medication
              </span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {COMMON_MEDICATION_TIMES.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleTimeToggle(time)}
                  className={`p-2 rounded-lg border transition-colors text-sm ${
                    formData.times.includes(time)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            {formData.times.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  Selected times: {formData.times.join(", ")}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Take with food, Avoid alcohol, etc."
            />
          </div>

          <div className="flex items-center space-x-3">
            {formData.sendEmailReminders ? (
              <Bell className="w-5 h-5 text-blue-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <input
              type="checkbox"
              name="sendEmailReminders"
              checked={formData.sendEmailReminders}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label className="text-sm text-gray-700">
              Send email reminders for this medication
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
              disabled={loading || formData.times.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <LoadingSpinner size="small" text="" />
              ) : medication ? (
                "Update Medication"
              ) : (
                "Add Medication"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default MedicationForm;
