import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color,
  change,
  description,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [displayChange, setDisplayChange] = useState(change);
  const [displayDescription, setDisplayDescription] = useState(description);
  const [displayColor, setDisplayColor] = useState(color);

  const colorClasses = {
    green: "bg-green-50 text-green-600 border-green-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  // Generate random data based on card type
  const generateRandomData = () => {
    if (title === "Adherence Rate") {
      // Random percentage between 40% and 95%
      const randomPercent = Math.floor(Math.random() * 56) + 40;
      const status =
        randomPercent >= 80
          ? "Excellent"
          : randomPercent >= 50
          ? "Good"
          : "Needs Work";
      const newColor =
        randomPercent >= 80 ? "green" : randomPercent >= 50 ? "orange" : "red";

      setDisplayValue(`${randomPercent}%`);
      setDisplayChange(status);
      setDisplayColor(newColor);
      setDisplayDescription(
        `${Math.floor(randomPercent / 20)} of 5 goals completed`
      );
    } else if (title === "Active Medications") {
      // Random count between 1 and 5
      const randomCount = Math.floor(Math.random() * 5) + 1;
      setDisplayValue(randomCount.toString());
      setDisplayChange("Active");
      setDisplayColor("blue");
      setDisplayDescription("Currently prescribed medications");
    } else if (title === "Today's Reminders") {
      // Random count between 0 and 4
      const randomCount = Math.floor(Math.random() * 5);
      const status = randomCount > 0 ? "Pending" : "All Done";
      const newColor = randomCount > 0 ? "orange" : "green";

      setDisplayValue(randomCount.toString());
      setDisplayChange(status);
      setDisplayColor(newColor);
      setDisplayDescription("Reminders scheduled for today");
    }
  };

  useEffect(() => {
    // Set initial random data
    generateRandomData();

    // Update every 2 minutes (120,000 milliseconds)
    const interval = setInterval(() => {
      generateRandomData();
    }, 120000);

    return () => clearInterval(interval);
  }, [title]);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[displayColor]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span
          className={`text-sm font-medium px-2 py-1 rounded-full ${
            displayChange === "Excellent" ||
            displayChange === "All Done" ||
            displayChange === "Active"
              ? "bg-green-100 text-green-800"
              : displayChange === "Good" || displayChange === "Pending"
              ? "bg-orange-100 text-orange-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {displayChange}
        </span>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">
          {displayValue}
        </h3>
        <p className="text-gray-900 font-semibold mb-2">{title}</p>
        <p className="text-sm text-gray-600">{displayDescription}</p>
      </div>
    </motion.div>
  );
};

export default StatsCard;
