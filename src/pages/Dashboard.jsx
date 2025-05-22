import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { useDispatch, useSelector } from "react-redux";
import { subscribeToHabits } from "../redux/habitsSlice";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

// Format date as YYYY-MM-DD
const formatDate = (date) => date.toISOString().slice(0, 10);

// Calculate current streak
const calculateCurrentStreak = (completions = {}) => {
  let streak = 0;
  let today = new Date();
  for (let i = 0; ; i++) {
    let day = new Date();
    day.setDate(today.getDate() - i);
    if (completions[formatDate(day)]) streak++;
    else break;
  }
  return streak;
};

// Calculate longest streak
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

// Streak Calendar Component
const StreakCalendar = ({ completions }) => {
  const days = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const day = new Date();
    day.setDate(today.getDate() - i);
    const dayStr = formatDate(day);
    days.push(
      <div
        key={dayStr}
        title={dayStr}
        className={`w-5 h-5 m-0.5 rounded ${
          completions && completions[dayStr] ? "bg-green-500" : "bg-gray-700"
        }`}
      />
    );
  }
  return <div className="flex flex-wrap w-full max-w-xs">{days}</div>;
};

const Dashboard = () => {
  const user = auth.currentUser;
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newHabit, setNewHabit] = useState({
    title: "",
    icon: "",
    xpReward: 5,
  });

  // Fetch habits from Firestore
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

  // Add new habit
  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.title.trim() || !newHabit.icon.trim()) return;

    try {
      const docRef = await addDoc(collection(db, "habits"), {
        uid: user.uid,
        title: newHabit.title.trim(),
        icon: newHabit.icon.trim(),
        xpReward: Number(newHabit.xpReward) || 5,
        completions: {},
        createdAt: serverTimestamp(),
      });

      setHabits((prev) => [
        ...prev,
        {
          id: docRef.id,
          title: newHabit.title.trim(),
          icon: newHabit.icon.trim(),
          xpReward: Number(newHabit.xpReward) || 5,
          completions: {},
        },
      ]);

      setNewHabit({ title: "", icon: "", xpReward: 5 });
    } catch (err) {
      console.error("Error adding habit:", err);
    }
  };

  // Toggle completion for today
  const handleToggleComplete = async (habit) => {
    if (!habit) return;
    const today = formatDate(new Date());
    const completions = habit.completions || {};

    // If already completed today, ignore (or you can allow toggle off by removing this)
    if (completions[today]) return;

    const updatedCompletions = { ...completions, [today]: true };

    try {
      const habitDoc = doc(db, "habits", habit.id);
      await updateDoc(habitDoc, { completions: updatedCompletions });
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id ? { ...h, completions: updatedCompletions } : h
        )
      );
    } catch (err) {
      console.error("Error updating completion:", err);
    }
  };

  // Delete habit
  const handleDeleteHabit = async (id) => {
    if (!window.confirm("Are you sure you want to delete this habit?")) return;

    try {
      await deleteDoc(doc(db, "habits", id));
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error("Error deleting habit:", err);
    }
  };

  // Edit habit (simple prompt for demo)
  const handleEditHabit = async (habit) => {
    const newTitle = prompt("Edit habit title:", habit.title);
    if (!newTitle || !newTitle.trim()) return;

    try {
      const habitDoc = doc(db, "habits", habit.id);
      await updateDoc(habitDoc, { title: newTitle.trim() });
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id ? { ...h, title: newTitle.trim() } : h
        )
      );
    } catch (err) {
      console.error("Error editing habit:", err);
    }
  };

  if (loading)
    return (
      <div className="p-4 text-center text-gray-400 text-lg animate-pulse">
        Loading your habits...
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen bg-gray-900 text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-extrabold mb-6 text-center">
        🎯 Welcome, {user.displayName?.split(" ")[0] || "User"}!
      </h1>

      {/* Add New Habit Form */}
      <form
        onSubmit={handleAddHabit}
        className="bg-gray-800 shadow-lg rounded-xl p-5 mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-300 mb-3">
          Add a New Habit
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={newHabit.title}
            onChange={(e) =>
              setNewHabit((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Habit name (e.g. Drink Water)"
            className="flex-grow w-full sm:w-auto bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            value={newHabit.icon}
            onChange={(e) =>
              setNewHabit((prev) => ({ ...prev, icon: e.target.value }))
            }
            placeholder="Emoji icon (e.g. 💧)"
            className="w-full sm:w-20 text-center bg-gray-700 border border-gray-600 rounded-md px-2 py-2 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            maxLength={2}
          />
          <input
            type="number"
            value={newHabit.xpReward}
            onChange={(e) =>
              setNewHabit((prev) => ({ ...prev, xpReward: e.target.value }))
            }
            min={1}
            max={100}
            className="w-full sm:w-20 text-center bg-gray-700 border border-gray-600 rounded-md px-2 py-2 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="XP"
            required
          />
          <button
            type="submit"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md transition duration-200"
          >
            Add Habit
          </button>
        </div>
      </form>

      {/* Habit List */}
      <div className="grid gap-6">
        {habits.length === 0 ? (
          <p className="text-gray-400 text-center">
            You have no habits yet. Add one above to get started!
          </p>
        ) : (
          habits.map((habit) => {
            const today = formatDate(new Date());
            const completedToday = habit.completions?.[today];
            const currentStreak = calculateCurrentStreak(habit.completions);
            const longestStreak = calculateLongestStreak(habit.completions);

            return (
              <div
                key={habit.id}
                className="bg-gray-800 p-4 rounded-lg shadow flex flex-col sm:flex-row sm:items-center justify-between"
              >
                <div className="flex items-center space-x-4 mb-3 sm:mb-0 flex-wrap sm:flex-nowrap">
                  <span className="text-3xl">{habit.icon}</span>
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold truncate">
                      {habit.title}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">
                      XP: {habit.xpReward} | Current Streak: {currentStreak}d |
                      Longest: {longestStreak}d
                    </p>
                    <StreakCalendar completions={habit.completions} />
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                  {!completedToday ? (
                    <button
                      onClick={() => handleToggleComplete(habit)}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold transition w-full sm:w-auto"
                      aria-label={`Mark habit ${habit.title} complete today`}
                    >
                      Mark Complete Today
                    </button>
                  ) : (
                    <button
                      disabled
                      className="bg-green-600 px-4 py-2 rounded text-white font-semibold cursor-not-allowed w-full sm:w-auto"
                      aria-label={`Habit ${habit.title} completed today`}
                    >
                      Completed Today ✅
                    </button>
                  )}

                  <button
                    onClick={() => handleEditHabit(habit)}
                    className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-gray-900 font-semibold transition w-full sm:w-auto"
                    aria-label={`Edit habit ${habit.title}`}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white font-semibold transition w-full sm:w-auto"
                    aria-label={`Delete habit ${habit.title}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;
