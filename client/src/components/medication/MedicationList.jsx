import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pill, Edit, Trash2, Clock, Bell, BellOff } from "lucide-react";
import { medicationsAPI } from "../../services/api";
import MedicationForm from "./MedicationForm";

const MedicationList = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await medicationsAPI.getAll();
      if (response.data.success) {
        setMedications(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching medications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medication?")) {
      try {
        await medicationsAPI.delete(id);
        setMedications(medications.filter((med) => med.id !== id));
      } catch (error) {
        console.error("Error deleting medication:", error);
      }
    }
  };

  const handleToggleReminders = async (medication) => {
    try {
      await medicationsAPI.update(medication.id, {
        sendEmailReminders: !medication.sendEmailReminders,
      });
      fetchMedications();
    } catch (error) {
      console.error("Error updating medication:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medications</h1>
          <p className="text-gray-600 mt-2">
            Manage your prescribed medications and reminders
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Medication</span>
        </motion.button>
      </div>
      <div className="">
        {/* Header */}

        {/* Medications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map((medication, index) => (
            <motion.div
              key={medication.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Pill className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {medication.name}
                    </h3>
                    <p className="text-sm text-gray-600">{medication.dosage}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleToggleReminders(medication)}
                    className={`p-1 rounded ${
                      medication.sendEmailReminders
                        ? "text-green-600 hover:text-green-700"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {medication.sendEmailReminders ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingMedication(medication);
                      setShowForm(true);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(medication.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Frequency</span>
                  <span className="font-medium">{medication.frequency}</span>
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>Times</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medication.times && Array.isArray(medication.times) ? (
                      medication.times.map((time, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                        >
                          {time}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {medication.times || "No times specified"}
                      </span>
                    )}
                  </div>
                </div>

                {medication.instructions && (
                  <div className="text-sm">
                    <span className="text-gray-600">Instructions: </span>
                    <span className="text-gray-900">
                      {medication.instructions}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      medication.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {medication.isActive ? "Active" : "Inactive"}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      medication.sendEmailReminders
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {medication.sendEmailReminders
                      ? "Reminders On"
                      : "Reminders Off"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {medications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300"
          >
            <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No medications yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first medication to start tracking
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Add Medication
            </button>
          </motion.div>
        )}

        {/* Medication Form Modal */}
        <AnimatePresence>
          {showForm && (
            <MedicationForm
              medication={editingMedication}
              onClose={() => {
                setShowForm(false);
                setEditingMedication(null);
              }}
              onSave={() => {
                setShowForm(false);
                setEditingMedication(null);
                fetchMedications();
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MedicationList;
