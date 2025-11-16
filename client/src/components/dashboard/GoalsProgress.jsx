import React from "react";
import { motion } from "framer-motion";
import { Target, CheckCircle, Clock, Award } from "lucide-react";

const GoalsProgress = ({ goals }) => {
  const completedGoals = goals.filter((goal) => goal.isCompleted);
  const activeGoals = goals.filter((goal) => !goal.isCompleted);
  const progressPercentage =
    goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Goals Progress
            </h2>
            <p className="text-gray-600 text-sm">
              Track your health objectives
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {completedGoals.length}/{goals.length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span>{progressPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-purple-600 h-3 rounded-full"
          />
        </div>
      </div>

      {/* Active Goals List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Active Goals ({activeGoals.length})</span>
        </h3>

        {activeGoals.slice(0, 3).map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-gray-900 text-sm">
                  {goal.title}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
                    goal.priority
                  )}`}
                >
                  {goal.priority}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-600">
                <span>
                  Progress:{" "}
                  {((goal.currentValue / goal.targetValue) * 100).toFixed(0)}%
                </span>
                <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {activeGoals.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No active goals</p>
          </div>
        )}
      </div>

      {/* Recent Completions */}
      {completedGoals.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2 mb-3">
            <Award className="w-4 h-4" />
            <span>Recently Completed</span>
          </h3>
          <div className="space-y-2">
            {completedGoals.slice(0, 2).map((goal) => (
              <div
                key={goal.id}
                className="flex items-center space-x-2 text-sm"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">{goal.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsProgress;
