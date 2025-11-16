import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Target,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { goalsAPI } from "../../services/api";
import GoalForm from "./GoalForm";
import LoadingSpinner from "../common/LoadingSpinner";

const GoalList = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await goalsAPI.getAll();
      if (response.data.success) {
        setGoals(response.data.data.goals);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (goalId, newValue) => {
    try {
      await goalsAPI.update(goalId, { currentValue: newValue });
      fetchGoals();
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const handleToggleCompletion = async (goal) => {
    try {
      await goalsAPI.update(goal.id, { isCompleted: !goal.isCompleted });
      fetchGoals();
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const getProgressPercentage = (goal) => {
    return goal.targetValue > 0
      ? (goal.currentValue / goal.targetValue) * 100
      : 0;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "exercise":
        return "💪";
      case "diet":
        return "🥗";
      case "medication":
        return "💊";
      case "symptom":
        return "🤒";
      case "lifestyle":
        return "🌱";
      default:
        return "🎯";
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading goals..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Goals</h1>
          <p className="text-gray-600 mt-2">
            Track and manage your health objectives
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Goal</span>
        </motion.button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${
              goal.isCompleted ? "border-green-200" : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getCategoryIcon(goal.category)}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
                        goal.priority
                      )}`}
                    >
                      {goal.priority}
                    </span>
                    {goal.isCompleted && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingGoal(goal);
                  setShowForm(true);
                }}
                className="p-1 text-gray-400 hover:text-purple-600 rounded"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>

            {goal.description && (
              <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
            )}

            {/* Progress Section */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{getProgressPercentage(goal).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    goal.isCompleted ? "bg-green-500" : "bg-purple-500"
                  }`}
                  style={{
                    width: `${Math.min(getProgressPercentage(goal), 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  {goal.currentValue} {goal.unit}
                </span>
                <span>
                  {goal.targetValue} {goal.unit}
                </span>
              </div>
            </div>

            {/* Progress Controls */}
            {!goal.isCompleted && (
              <div className="flex space-x-2 mt-4">
                <input
                  type="number"
                  value={goal.currentValue}
                  onChange={(e) =>
                    handleUpdateProgress(
                      goal.id,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                  max={goal.targetValue}
                  step="1"
                />
                <button
                  onClick={() => handleToggleCompletion(goal)}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Deadline */}
            {goal.deadline && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">
                <Calendar className="w-4 h-4" />
                <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {goals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300"
        >
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No goals yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first health goal to start tracking progress
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Create Goal
          </button>
        </motion.div>
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <GoalForm
          goal={editingGoal}
          onClose={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingGoal(null);
            fetchGoals();
          }}
        />
      )}
    </div>
  );
};

export default GoalList;
