import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Pill,
  Activity,
  Target,
  Clock,
  Settings,
  Heart,
} from "lucide-react";

const Sidebar = () => {
  const menuItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/medications", icon: Pill, label: "Medications" },
    { path: "/symptoms", icon: Activity, label: "Symptoms" },
    { path: "/goals", icon: Target, label: "Goals" },
  ];

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-[calc(100vh-80px)] p-4"
    >
      <nav className="space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.path}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Health Tip */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100"
      >
        <div className="flex items-center space-x-2 mb-2">
          <Heart className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">
            Health Tip
          </span>
        </div>
        <p className="text-xs text-blue-800">
          Consistency is key to managing chronic conditions. Track your symptoms
          daily for better insights.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Sidebar;
