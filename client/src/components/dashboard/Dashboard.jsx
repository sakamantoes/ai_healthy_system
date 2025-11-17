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
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import {
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
  const [aiInsights, setAiInsights] = useState(
    "Analyzing your health patterns..."
  );
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshCount, setRefreshCount] = useState(0);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Generate personalized AI insights based on actual health data
  const generatePersonalizedInsights = (healthData, goalsData = []) => {
    const {
      adherenceRate,
      medicationsCount,
      activeGoalsCount,
      completedGoalsCount,
      todayRemindersCount,
      recentSymptomsCount,
    } = healthData;

    const totalGoals = activeGoalsCount + completedGoalsCount;

    // Base time-based message
    const hour = new Date().getHours();
    let timeContext = "";
    if (hour >= 5 && hour < 12) timeContext = "🌅 Good morning! ";
    else if (hour >= 12 && hour < 17) timeContext = "☀️ Good afternoon! ";
    else timeContext = "🌙 Good evening! ";

    // Adherence-based insights
    let adherenceInsight = "";
    if (adherenceRate >= 80) {
      adherenceInsight = `Your ${Math.round(
        adherenceRate
      )}% adherence rate is outstanding! This level of consistency significantly improves health outcomes. `;
    } else if (adherenceRate >= 50) {
      adherenceInsight = `Your ${Math.round(
        adherenceRate
      )}% adherence rate shows good progress. Let's work on building more consistent habits. `;
    } else if (totalGoals > 0) {
      adherenceInsight = `Let's focus on improving your ${Math.round(
        adherenceRate
      )}% adherence rate. Small, consistent steps lead to big changes. `;
    } else {
      adherenceInsight =
        "Start by setting some health goals to track your progress and build healthy habits. ";
    }

    // Goals-based insights
    let goalsInsight = "";
    if (completedGoalsCount > 0 && activeGoalsCount === 0) {
      goalsInsight = `Amazing! You've completed all ${completedGoalsCount} of your goals. Consider setting new ones to continue your progress. `;
    } else if (completedGoalsCount > 0) {
      goalsInsight = `Great work completing ${completedGoalsCount} goal${
        completedGoalsCount > 1 ? "s" : ""
      }! You have ${activeGoalsCount} more active goal${
        activeGoalsCount > 1 ? "s" : ""
      } to focus on. `;
    } else if (activeGoalsCount > 0) {
      goalsInsight = `You're working on ${activeGoalsCount} health goal${
        activeGoalsCount > 1 ? "s" : ""
      }. Consistency is key to achieving them. `;
    } else {
      goalsInsight =
        "Setting specific health goals can help you stay motivated and track your progress effectively. ";
    }

    // Medications and reminders insights
    let medicationsInsight = "";
    if (medicationsCount > 0 && todayRemindersCount > 0) {
      medicationsInsight = `You have ${todayRemindersCount} reminder${
        todayRemindersCount > 1 ? "s" : ""
      } today for your ${medicationsCount} medication${
        medicationsCount > 1 ? "s" : ""
      }. Staying on schedule is important. `;
    } else if (medicationsCount > 0) {
      medicationsInsight = `You're managing ${medicationsCount} medication${
        medicationsCount > 1 ? "s" : ""
      }. Keep up with your scheduled doses. `;
    } else {
      medicationsInsight =
        "If you have any prescribed medications, adding them to your tracker can help with adherence. ";
    }

    // Symptoms insights
    let symptomsInsight = "";
    if (recentSymptomsCount > 0) {
      symptomsInsight = `You've recorded ${recentSymptomsCount} symptom${
        recentSymptomsCount > 1 ? "s" : ""
      } recently. Tracking helps identify patterns. `;
    } else {
      symptomsInsight =
        "Regular symptom tracking provides valuable insights for your healthcare team. ";
    }

    // Motivational tip
    const motivationalTips = [
      "Remember: Progress over perfection! Every healthy choice counts. 💪",
      "Your health journey is unique to you. Celebrate your personal victories! 🎉",
      "Small, consistent actions create lasting change. You're building a healthier future! 🌟",
      "Listen to your body - it's your best guide on this wellness journey. ❤️",
      "Consistency is more important than intensity. Keep showing up for yourself! 🔄",
    ];
    const randomTip =
      motivationalTips[Math.floor(Math.random() * motivationalTips.length)];

    // Combine all insights
    const personalizedInsight = `${timeContext}${adherenceInsight}${goalsInsight}${medicationsInsight}${symptomsInsight}\n\n💡 ${randomTip}`;

    return personalizedInsight;
  };

  const generateAIInsights = () => {
    setInsightsLoading(true);

    // Simulate AI "thinking" delay for better UX
    setTimeout(() => {
      const personalizedInsight = generatePersonalizedInsights(
        healthData,
        goals
      );
      setAiInsights(personalizedInsight);
      setLastUpdate(new Date());
      setInsightsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    // Generate insights when health data changes
    if (healthData.adherenceRate !== 0 || healthData.medicationsCount !== 0) {
      generateAIInsights();
    }
  }, [healthData, goals]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("Fetching dashboard data...");

      const [
        goalsResponse,
        medicationsResponse,
        symptomsResponse,
        remindersResponse,
      ] = await Promise.all([
        goalsAPI.getAll(),
        medicationsAPI.getAll(),
        symptomsAPI.getAll(10),
        remindersAPI.getAll(true),
      ]);

      // Extract data with proper fallbacks
      const medicationsData = medicationsResponse.data?.data || [];
      const goalsData = goalsResponse.data?.data || [];
      const remindersData = remindersResponse.data?.data || [];
      const symptomsData = symptomsResponse.data?.data || [];

      // Calculate real metrics
      const medicationsCount = Array.isArray(medicationsData)
        ? medicationsData.length
        : 0;

      const totalGoals = Array.isArray(goalsData) ? goalsData.length : 0;
      const completedGoals = Array.isArray(goalsData)
        ? goalsData.filter((goal) => goal.isCompleted).length
        : 0;

      const todayRemindersCount = Array.isArray(remindersData)
        ? remindersData.length
        : 0;
      const recentSymptomsCount = Array.isArray(symptomsData)
        ? symptomsData.length
        : 0;

      const adherenceRate =
        totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

      const newHealthData = {
        adherenceRate,
        medicationsCount,
        activeGoalsCount: totalGoals - completedGoals,
        completedGoalsCount: completedGoals,
        todayRemindersCount,
        recentSymptomsCount,
      };

      setHealthData(newHealthData);
      setGoals(goalsData);

      console.log("Health data updated:", newHealthData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic stats based on real data
  const stats = [
    {
      title: "Adherence Rate",
      value: `${Math.round(healthData.adherenceRate)}%`,
      icon: TrendingUp,
      color:
        healthData.adherenceRate >= 80
          ? "green"
          : healthData.adherenceRate >= 50
          ? "orange"
          : "red",
      change:
        healthData.adherenceRate >= 80
          ? "Excellent"
          : healthData.adherenceRate >= 50
          ? "Good"
          : "Needs Work",
      description: `${healthData.completedGoalsCount} of ${
        healthData.completedGoalsCount + healthData.activeGoalsCount
      } goals completed`,
    },
    {
      title: "Active Medications",
      value: healthData.medicationsCount.toString(),
      icon: Pill,
      color: "blue",
      change: healthData.medicationsCount > 0 ? "Active" : "None",
      description: "Currently prescribed medications",
    },
    {
      title: "Today's Reminders",
      value: healthData.todayRemindersCount.toString(),
      icon: Clock,
      color: healthData.todayRemindersCount > 0 ? "orange" : "green",
      change: healthData.todayRemindersCount > 0 ? "Pending" : "All Done",
      description: "Reminders scheduled for today",
    },
  ];

  const handleRefresh = () => {
    setRefreshCount((prev) => prev + 1);
    fetchDashboardData();
  };

  const handleRefreshInsights = () => {
    generateAIInsights();
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
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Health Insights
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                Updated{" "}
                {lastUpdate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <button
                onClick={handleRefreshInsights}
                disabled={insightsLoading}
                className="p-1 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                title="Refresh insights"
              >
                <RefreshCw
                  className={`w-4 h-4 ${insightsLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {insightsLoading ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Generating personalized insights...</span>
                </div>
              ) : (
                aiInsights
              )}
            </p>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <RecentActivity refreshTrigger={refreshCount} />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
