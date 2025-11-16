import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Pill,
  Target,
  Heart,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { medicationsAPI, symptomsAPI, remindersAPI } from "../../services/api";

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const [medicationsRes, symptomsRes, remindersRes] = await Promise.all([
        medicationsAPI.getAll(),
        symptomsAPI.getAll(10),
        remindersAPI.getAll(true),
      ]);

      const activityList = [];

      // Add medications
      if (medicationsRes.data.success) {
        medicationsRes.data.data.slice(0, 3).forEach((med) => {
          activityList.push({
            id: `med-${med.id}`,
            type: "medication",
            title: `Added ${med.name}`,
            description: `${med.dosage} - ${med.frequency}`,
            time: new Date(med.createdAt),
            icon: Pill,
            color: "blue",
          });
        });
      }

      // Add symptoms
      if (symptomsRes.data.success) {
        symptomsRes.data.data.slice(0, 3).forEach((symptom) => {
          activityList.push({
            id: `symptom-${symptom.id}`,
            type: "symptom",
            title: `Recorded ${symptom.type}`,
            description: `Severity: ${symptom.severity}/10`,
            time: new Date(symptom.recordedAt),
            icon: Activity,
            color: symptom.severity >= 7 ? "red" : "orange",
          });
        });
      }

      // Add upcoming reminders
      if (remindersRes.data.success) {
        remindersRes.data.data.slice(0, 2).forEach((reminder) => {
          activityList.push({
            id: `reminder-${reminder.id}`,
            type: "reminder",
            title: `Upcoming: ${reminder.title}`,
            description: reminder.message,
            time: new Date(reminder.scheduledTime),
            icon: Clock,
            color: "purple",
          });
        });
      }

      // Sort by time and take latest 5
      activityList.sort((a, b) => b.time - a.time);
      setActivities(activityList.slice(0, 5));
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activity) => {
    const Icon = activity.icon;
    const colorClasses = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100",
      orange: "text-orange-600 bg-orange-100",
      red: "text-red-600 bg-red-100",
      purple: "text-purple-600 bg-purple-100",
    };

    return (
      <div className={`p-2 rounded-lg ${colorClasses[activity.color]}`}>
        <Icon className="w-4 h-4" />
      </div>
    );
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Activity className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Activity
          </h2>
          <p className="text-gray-600 text-sm">
            Latest health updates and actions
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {getActivityIcon(activity)}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {formatTime(activity.time)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm mt-1">
              Start by adding medications or recording symptoms
            </p>
          </div>
        )}
      </div>

      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium text-center">
            View All Activity
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
