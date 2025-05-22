import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Stats = () => {
  const user = auth.currentUser;
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchHabits = async () => {
      setLoading(true);
      try {
        const habitsRef = collection(db, "habits");
        const q = query(habitsRef, where("uid", "==", user.uid));
        const snapshot = await getDocs(q);

        const userHabits = [];
        snapshot.forEach((doc) => {
          userHabits.push({ id: doc.id, ...doc.data() });
        });
        setHabits(userHabits);
      } catch (error) {
        console.error("Error fetching habits:", error);
      }
      setLoading(false);
    };

    fetchHabits();
  }, [user]);

  // Helper: count total completions (number of keys in completions object)
  const countCompletions = (completions = {}) =>
    Object.keys(completions).length;

  // Helper: Calculate longest streak from completions object
  const calculateLongestStreak = (completions = {}) => {
    const dates = Object.keys(completions)
      .map((d) => new Date(d))
      .sort((a, b) => a - b);

    let longest = 0;
    let streak = 1;

    for (let i = 1; i < dates.length; i++) {
      const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        streak = 1;
      }
      if (streak > longest) longest = streak;
    }
    return longest || (dates.length > 0 ? 1 : 0);
  };

  // Helper: Calculate current streak from completions object
  const calculateCurrentStreak = (completions = {}) => {
    let streak = 0;
    let today = new Date();
    for (let i = 0; ; i++) {
      const day = new Date();
      day.setDate(today.getDate() - i);
      const dayStr = day.toISOString().slice(0, 10);
      if (completions[dayStr]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Calculate totals for all habits
  const totalCompleted = habits.reduce(
    (acc, habit) => acc + countCompletions(habit.completions),
    0
  );

  // Assuming each habit has xpReward field for XP per completion
  // Total XP = sum of (xpReward * completionsCount)
  const totalXP = habits.reduce(
    (acc, habit) =>
      acc + (habit.xpReward || 0) * countCompletions(habit.completions),
    0
  );

  // Longest streak across all habits
  const longestStreak = habits.reduce(
    (acc, habit) => Math.max(acc, calculateLongestStreak(habit.completions)),
    0
  );

  if (loading)
    return (
      <div className="p-4 text-center text-gray-400 text-lg animate-pulse">
        Loading your stats...
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-800 rounded-lg shadow-lg min-h-screen text-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center sm:text-left">
        📊 Your Stats
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-700 p-6 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-2">Total XP Gained</h2>
          <p className="text-4xl font-bold text-green-400">{totalXP}</p>
        </div>

        <div className="bg-gray-700 p-6 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-2">Habits Completed</h2>
          <p className="text-4xl font-bold text-blue-400">{totalCompleted}</p>
        </div>

        <div className="bg-gray-700 p-6 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-2">Longest Streak</h2>
          <p className="text-4xl font-bold text-yellow-400">
            {longestStreak} days
          </p>
        </div>
      </div>

      {habits.length === 0 ? (
        <p className="text-center text-gray-400">
          You have no habits yet. Start tracking to see your progress here!
        </p>
      ) : (
        <div>
          <h3 className="text-2xl font-semibold mb-4">Your Habits</h3>
          <div className="space-y-4">
            {habits.map(({ id, title, completions, xpReward }) => {
              const completedCount = countCompletions(completions);
              const longest = calculateLongestStreak(completions);
              const currentStreak = calculateCurrentStreak(completions);
              const totalXPForHabit = (xpReward || 0) * completedCount;

              return (
                <div
                  key={id}
                  className="bg-gray-700 p-4 rounded-md flex justify-between items-center shadow-sm"
                >
                  <div>
                    <h4 className="text-lg font-semibold text-blue-300">
                      {title}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Completed: {completedCount} times | XP: {totalXPForHabit}{" "}
                      | Longest Streak: {longest} days | Current Streak:{" "}
                      {currentStreak} days
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
