import React from "react";
import { motion } from "framer-motion";

const LoadingSpinner = ({ size = "medium", text = "Loading..." }) => {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-12 h-12",
    large: "w-16 h-16",
    xlarge: "w-24 h-24",
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <motion.div
        className={`border-4 border-blue-200 border-t-blue-600 rounded-full ${sizeClasses[size]}`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-gray-600 font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;
