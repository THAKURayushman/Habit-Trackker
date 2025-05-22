import React from "react";
import { motion } from "framer-motion";

const formatDate = (date) => date.toISOString().slice(0, 10);
const formatDay = (date) =>
  date.toLocaleDateString("en-US", { weekday: "short" }); // e.g., "Mon"

const StreakCalendar = ({ completions }) => {
  const today = new Date();
  const days = [];

  for (let i = 29; i >= 0; i--) {
    const day = new Date();
    day.setDate(today.getDate() - i);
    const dateStr = formatDate(day);
    const isComplete = completions && completions[dateStr];

    days.push(
      <motion.div
        key={dateStr}
        title={`${formatDay(day)}, ${dateStr}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: (29 - i) * 0.015 }}
        className={`w-6 h-6 m-0.5 rounded-md cursor-default ${
          isComplete ? "bg-green-500" : "bg-gray-600"
        }`}
      />
    );
  }

  return (
    <div className="p-4 rounded-lg border border-gray-700 bg-gray-900 w-full max-w-xs">
      <h2 className="text-lg font-semibold mb-2 text-white">30-Day Streak</h2>
      <div className="flex flex-wrap">{days}</div>
      <div className="text-xs text-gray-400 mt-2">Hover to see dates</div>
    </div>
  );
};

export default StreakCalendar;
