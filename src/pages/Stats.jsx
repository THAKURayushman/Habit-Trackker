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

  // Calculate totals and streaks
  const totalXP = habits.reduce((acc, h) => acc + (h.xp || 0), 0);
  const totalCompleted = habits.reduce(
    (acc, h) => acc + (h.completedCount || 0),
    0
  );

  // For simplicity, longest streak: max of habit.streak or 0
  const longestStreak = habits.reduce(
    (acc, h) => Math.max(acc, h.streak || 0),
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
            {habits.map(({ id, title, completedCount, xp, streak }) => (
              <div
                key={id}
                className="bg-gray-700 p-4 rounded-md flex justify-between items-center shadow-sm"
              >
                <div>
                  <h4 className="text-lg font-semibold text-blue-300">
                    {title}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Completed: {completedCount} times | XP: {xp || 0} | Streak:{" "}
                    {streak || 0} days
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
