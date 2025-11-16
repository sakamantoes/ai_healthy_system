import React from "react";
import { motion } from "framer-motion";

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color,
  change,
  description,
}) => {
  const colorClasses = {
    green: "bg-green-50 text-green-600 border-green-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span
          className={`text-sm font-medium px-2 py-1 rounded-full ${
            change.includes("+")
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {change}
        </span>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-gray-900 font-semibold mb-2">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
};

export default StatsCard;
