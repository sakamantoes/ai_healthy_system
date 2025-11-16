import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const HealthChart = ({ healthData }) => {
  // Mock data for demonstration - in real app, this would come from API
  const symptomData = [
    { day: "Mon", severity: 3 },
    { day: "Tue", severity: 2 },
    { day: "Wed", severity: 4 },
    { day: "Thu", severity: 1 },
    { day: "Fri", severity: 2 },
    { day: "Sat", severity: 3 },
    { day: "Sun", severity: 2 },
  ];

  const adherenceData = [
    { month: "Jan", rate: 75 },
    { month: "Feb", rate: 82 },
    { month: "Mar", rate: 78 },
    { month: "Apr", rate: 85 },
    { month: "May", rate: 88 },
    { month: "Jun", rate: 90 },
  ];

  const goalDistribution = [
    { name: "Completed", value: healthData.completedGoalsCount },
    { name: "Active", value: healthData.activeGoalsCount },
    {
      name: "Not Started",
      value: Math.max(
        0,
        5 - healthData.activeGoalsCount - healthData.completedGoalsCount
      ),
    },
  ];

  const COLORS = ["#10B981", "#3B82F6", "#6B7280"];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Health Analytics
            </h2>
            <p className="text-gray-600 text-sm">
              Track your health progress over time
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symptom Trend */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Symptom Severity Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={symptomData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} domain={[0, 10]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="severity"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Adherence Rate */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Adherence Rate Progress
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={adherenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="rate" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Goal Distribution */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Goal Distribution
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={goalDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {goalDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            {goalDistribution.map((goal, index) => (
              <div key={goal.name} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-sm text-gray-600">
                  {goal.name}: {goal.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthChart;
