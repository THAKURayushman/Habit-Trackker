import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Analytics = () => {
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
        snapshot.forEach((doc) =>
          userHabits.push({ id: doc.id, ...doc.data() })
        );
        setHabits(userHabits);
      } catch (err) {
        console.error("Error fetching habits:", err);
      }
      setLoading(false);
    };

    fetchHabits();
  }, [user]);

  // Calculate total XP
  const totalXP = habits.reduce((acc, habit) => {
    const completionsCount = habit.completions
      ? Object.keys(habit.completions).length
      : 0;
    return acc + completionsCount * habit.xpReward;
  }, 0);

  // Calculate total completions
  const totalCompletions = habits.reduce((acc, habit) => {
    return (
      acc + (habit.completions ? Object.keys(habit.completions).length : 0)
    );
  }, 0);

  // Calculate longest streak across all habits
  const calculateLongestStreak = (completions = {}) => {
    const dates = Object.keys(completions).sort();
    let longest = 0,
      streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = new Date(dates[i]) - new Date(dates[i - 1]);
      if (diff === 86400000) streak++;
      else streak = 1;
      if (streak > longest) longest = streak;
    }
    return longest || (dates.length > 0 ? 1 : 0);
  };

  let longestStreakOverall = 0;
  habits.forEach((habit) => {
    const habitLongest = calculateLongestStreak(habit.completions);
    if (habitLongest > longestStreakOverall)
      longestStreakOverall = habitLongest;
  });

  if (loading)
    return (
      <div className="p-4 text-center text-gray-400 text-lg animate-pulse">
        Loading analytics...
      </div>
    );

  return (
    <div className="p-6 max-w-3xl mx-auto min-h-screen bg-gray-900 text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-extrabold mb-6 text-center">
        📊 Your Habit Analytics
      </h1>

      <div className="bg-gray-800 rounded-xl p-6 space-y-4">
        <p className="text-xl">
          <strong>Total XP Earned:</strong> {totalXP}
        </p>
        <p className="text-xl">
          <strong>Total Habits Completed:</strong> {totalCompletions}
        </p>
        <p className="text-xl">
          <strong>Longest Habit Streak:</strong> {longestStreakOverall} days
        </p>
      </div>
    </div>
  );
};

export default Analytics;
