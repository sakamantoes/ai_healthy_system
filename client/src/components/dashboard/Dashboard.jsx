import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Heart,
  Target,
  Clock,
  Pill,
  Activity,
  Calendar,
} from "lucide-react";
import {
  aiAPI,
  goalsAPI,
  medicationsAPI,
  symptomsAPI,
  remindersAPI,
} from "../../services/api";
import StatsCard from "./StatsCard";
import HealthChart from "./HealthChart";
import GoalsProgress from "./GoalsProgress";
import RecentActivity from "./RecentActivity";

const Dashboard = () => {
  const [healthData, setHealthData] = useState({
    adherenceRate: 0,
    medicationsCount: 0,
    activeGoalsCount: 0,
    completedGoalsCount: 0,
    todayRemindersCount: 0,
    recentSymptomsCount: 0,
  });
  const [aiInsights, setAiInsights] = useState("");
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        insightsResponse,
        goalsResponse,
        medicationsResponse,
        symptomsResponse,
        remindersResponse,
      ] = await Promise.all([
        aiAPI.getInsights(),
        goalsAPI.getAll(),
        medicationsAPI.getAll(),
        symptomsAPI.getAll(5),
        remindersAPI.getAll(true),
      ]);

      if (insightsResponse.data.success) {
        setAiInsights(insightsResponse.data.data.aiInsights);
        setHealthData(insightsResponse.data.data.healthData);
      }

      if (goalsResponse.data.success) {
        setGoals(goalsResponse.data.data.goals);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Adherence Rate",
      value: `${healthData.adherenceRate.toFixed(0)}%`,
      icon: TrendingUp,
      color: "green",
      change: "+5.2%",
      description: "Medication & Goal Compliance",
    },
    {
      title: "Active Medications",
      value: healthData.medicationsCount.toString(),
      icon: Pill,
      color: "blue",
      change: "Current",
      description: "Prescribed Medications",
    },
    {
      title: "Health Goals",
      value: healthData.activeGoalsCount.toString(),
      icon: Target,
      color: "purple",
      change: `${healthData.completedGoalsCount} completed`,
      description: "Active Goals Tracking",
    },
    {
      title: "Today's Reminders",
      value: healthData.todayRemindersCount.toString(),
      icon: Clock,
      color: "orange",
      change: "Upcoming",
      description: "Scheduled Reminders",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Your complete health overview and insights
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => aiAPI.sendTestAlert()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Send Test Alert
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <HealthChart healthData={healthData} />
        </motion.div>

        {/* Goals Progress */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GoalsProgress goals={goals} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              AI Health Insights
            </h2>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {aiInsights || "Loading insights..."}
            </p>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <RecentActivity />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
