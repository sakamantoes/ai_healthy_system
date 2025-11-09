import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LogOut,
  Pill,
  Target,
  Bell,
  Activity,
  Brain,
  RefreshCw,
  AlertCircle,
  Mail,
} from "lucide-react";

const Dashboard = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState({
    adherenceRate: 0,
    aiInsights: "",
    healthData: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/ai-insights", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const result = await response.json();

      if (result.success) {
        setDashboardData({
          adherenceRate: result.data.healthData?.adherenceRate || 0,
          aiInsights: result.data.aiInsights || "",
          healthData: result.data.healthData || {},
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const sendTestAlert = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/send-test-alert",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("Test alert sent successfully! Check your email.");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error sending test alert:", error);
      alert("Failed to send test alert. Please try again.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  // Safe value getter for adherence rate
  const getAdherenceRate = () => {
    const rate = dashboardData.adherenceRate;
    if (rate === null || rate === undefined || isNaN(rate)) {
      return 0;
    }
    return rate;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            Loading your health dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="sm:max-w-7xl max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            ></motion.div>

            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw
                  className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </motion.button>

              <Link
                to="/profile"
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="font-medium">Profile</span>
              </Link>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="flex items-center sm:space-x-2 space-x-0.5 sm:px-4 px-2.5 sm:py-2 py-1 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="gap-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900"></h1>
            <p className="text-gray-600">
              Welcome back,{" "}
              <span className="font-semibold text-indigo-600">
                {user?.name}
              </span>
              ! 👋
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Adherence Rate */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Adherence Rate
                </h3>
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {getAdherenceRate().toFixed(1)}%
              </div>
              <p className="text-gray-600 text-sm">Overall Progress</p>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getAdherenceRate()}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-2 rounded-full bg-green-500"
                />
              </div>
            </div>

            {/* Medications */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Medications
                </h3>
                <Pill className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {dashboardData.healthData?.medicationsCount || 0}
              </div>
              <p className="text-gray-600 text-sm">Active</p>
            </div>

            {/* Goals */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Goals</h3>
                <Target className="h-6 w-6 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {dashboardData.healthData?.activeGoalsCount || 0}
              </div>
              <p className="text-gray-600 text-sm">In Progress</p>
            </div>

            {/* Reminders */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Reminders
                </h3>
                <Bell className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {dashboardData.healthData?.todayRemindersCount || 0}
              </div>
              <p className="text-gray-600 text-sm">Today</p>
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-2xl shadow-lg p-6 border border-green-200"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  AI Health Advisor
                </h2>
                <p className="text-green-700 text-sm">
                  Personalized recommendations based on your data
                </p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="prose prose-green max-w-none"
            >
              <div className="text-gray-700 leading-relaxed whitespace-pre-line bg-white/50 rounded-lg p-4">
                {dashboardData.aiInsights ||
                  "No AI insights available yet. Start tracking your health data to get personalized recommendations."}
              </div>
            </motion.div>
          </motion.div>

          {/* Navigation Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/medications"
                className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 group"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                    <Pill className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Medications
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Track and manage your medications with smart reminders and
                  schedules
                </p>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/symptoms"
                className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 group"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Symptom Tracker
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Record symptoms and get AI-powered analysis with risk
                  assessment
                </p>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/goals"
                className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 group"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Health Goals
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Set and track your health objectives with progress monitoring
                </p>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to="/reminders"
                className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 group"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                    <Bell className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Smart Reminders
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Never miss important health tasks with intelligent
                  notifications
                </p>
              </Link>
            </motion.div>
          </motion.div>

          {/* Test Alert Section */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-indigo-50 to-purple-100 rounded-2xl shadow-lg p-6 border border-indigo-200"
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <Mail className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Test Daily Alert
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Send a test daily health alert to your email to see how our
                notification system works
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendTestAlert}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
              >
                Send Test Alert
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
