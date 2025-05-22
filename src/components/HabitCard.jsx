const HabitCard = ({
  id,
  name,
  icon,
  isCompleted,
  streak,
  xpReward,
  onToggleComplete,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4 flex justify-between items-center">
      <div>
        <div className="text-2xl mb-1">
          {icon} <span className="font-semibold">{name}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          🔥 Streak: {streak} days &nbsp; | &nbsp; ⭐ XP: {xpReward}
        </div>
      </div>
      <button
        className={`px-3 py-2 rounded-md font-medium text-sm transition ${
          isCompleted
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-gray-300 text-black hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700"
        }`}
        onClick={() => onToggleComplete(id)}
      >
        {isCompleted ? "Completed" : "Mark Complete"}
      </button>
    </div>
  );
};

export default HabitCard;
