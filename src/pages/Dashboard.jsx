import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import axios from "axios";
import StreakCalendar from "../components/StreakCalendar";
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

const formatDate = (date) => date.toISOString().slice(0, 10);

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

const Dashboard = () => {
  const user = auth.currentUser;
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newHabit, setNewHabit] = useState({
    title: "",
    icon: "",
    xpReward: 5,
  });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchHabits = async () => {
      setLoading(true);
      try {
        const habitsRef = collection(db, "habits");
        const q = query(habitsRef, where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        const userHabits = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHabits(userHabits);
      } catch (err) {
        console.error("Error fetching habits:", err);
      }
      setLoading(false);
    };
    fetchHabits();
  }, [user]);

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
        { id: docRef.id, ...newHabit, completions: {} },
      ]);
      setNewHabit({ title: "", icon: "", xpReward: 5 });
    } catch (err) {
      console.error("Error adding habit:", err);
    }
  };

  const handleToggleComplete = async (habit) => {
    const today = formatDate(new Date());
    if (habit.completions?.[today]) return;

    const updatedCompletions = { ...habit.completions, [today]: true };

    try {
      await updateDoc(doc(db, "habits", habit.id), {
        completions: updatedCompletions,
      });
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id ? { ...h, completions: updatedCompletions } : h
        )
      );
    } catch (err) {
      console.error("Error updating completion:", err);
    }
  };

  const handleDeleteHabit = async (id) => {
    if (!window.confirm("Delete this habit?")) return;
    try {
      await deleteDoc(doc(db, "habits", id));
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error("Error deleting habit:", err);
    }
  };

  const handleEditHabit = (habit) => {
    setEditingHabit({ ...habit }); // Open modal with prefilled habit
  };

  const fetchAiSuggestions = async () => {
    if (!habits.length) {
      alert("Please add at least one habit to get personalized suggestions.");
      return;
    }
    setLoadingAI(true);

    const titles = habits.map((h) => h.title).join(", ");
    const prompt = `I've added these habits: ${titles}. Suggest 3 new daily habits that support consistency and enhance these existing habits. 
For each suggestion, give a short title and a one-line benefit. Respond in this format:
Habit: <title>
Benefit: <one-line reason why it’s useful>`;

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4-0125-preview",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const suggestionText = response.data.choices[0].message.content;
      const suggestions = suggestionText
        .split("Habit:")
        .filter((chunk) => chunk.trim())
        .map((chunk) => {
          const [titleLine, benefitLine] = chunk.trim().split("Benefit:");
          return {
            title: titleLine.trim(),
            benefit: benefitLine?.trim() || "",
          };
        });

      setAiSuggestions(suggestions);
    } catch (err) {
      console.error("AI suggestion error:", err);
      alert("Failed to fetch suggestions. Please try again.");
    }

    setLoadingAI(false);
  };

  const handleAddSuggestedHabits = async (title) => {
    const defaultIcon = "🌟"; // or ask user later
    const defaultXP = 5;

    try {
      const docRef = await addDoc(collection(db, "habits"), {
        uid: user.uid,
        title,
        icon: defaultIcon,
        xpReward: defaultXP,
        completions: {},
        createdAt: serverTimestamp(),
      });

      setHabits((prev) => [
        ...prev,
        {
          id: docRef.id,
          title,
          icon: defaultIcon,
          xpReward: defaultXP,
          completions: {},
        },
      ]);
    } catch (err) {
      console.error("Error adding suggested habit:", err);
    }
  };

  if (loading)
    return (
      <div className="p-4 text-center text-gray-400 animate-pulse">
        Loading your habits...
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen bg-gray-900 text-white rounded-lg shadow-lg overflow-x-hidden">
      <h1 className="text-3xl font-extrabold mb-6 text-center">
        🎯 Welcome, {user.displayName?.split(" ")[0] || "User"}!
      </h1>

      {/* AI Suggestion Section */}
      <div className="bg-indigo-800 p-5 rounded-xl shadow-md mb-10">
        <h2 className="text-xl font-semibold mb-3 text-white">
          💡 AI Habit Suggestions
        </h2>
        <button
          onClick={fetchAiSuggestions}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition mb-4"
        >
          {loadingAI ? "Thinking..." : "Suggest New Habits"}
        </button>
        <div className="grid md:grid-cols-2 gap-4">
          {aiSuggestions.map((s, i) => (
            <div
              key={i}
              className="bg-gray-700 p-4 rounded-lg shadow text-gray-100"
            >
              <h4 className="text-lg font-semibold">{s.title}</h4>
              <p className="text-sm text-gray-300 mb-2">{s.benefit}</p>
              <button
                onClick={() => handleAddSuggestedHabits(s.title)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
              >
                Add Habit
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Habit */}
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
              setNewHabit({ ...newHabit, title: e.target.value })
            }
            placeholder="Habit name"
            className="bg-gray-700 text-gray-200 px-4 py-2 rounded w-full sm:flex-grow"
            required
          />
          <input
            type="text"
            value={newHabit.icon}
            onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
            placeholder="Emoji"
            className="w-full sm:w-20 text-center bg-gray-700 px-2 py-2 rounded text-gray-200"
            required
            maxLength={2}
          />
          <input
            type="number"
            value={newHabit.xpReward}
            onChange={(e) =>
              setNewHabit({ ...newHabit, xpReward: e.target.value })
            }
            className="w-full sm:w-20 text-center bg-gray-700 px-2 py-2 rounded text-gray-200"
            placeholder="XP"
            required
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded"
          >
            Add
          </button>
        </div>
      </form>

      {/* Habit Cards */}
      <div className="grid gap-6">
        {habits.length === 0 ? (
          <p className="text-gray-400 text-center">You have no habits yet.</p>
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
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{habit.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold">{habit.title}</h3>
                    <p className="text-sm text-gray-400">
                      XP: {habit.xpReward} | Current: {currentStreak}d |
                      Longest: {longestStreak}d
                    </p>
                    <StreakCalendar completions={habit.completions} />
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-3 sm:mt-0">
                  {!completedToday ? (
                    <button
                      onClick={() => handleToggleComplete(habit)}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
                    >
                      Mark Complete
                    </button>
                  ) : (
                    <span className="bg-green-600 px-4 py-2 rounded text-white font-semibold">
                      Completed Today ✅
                    </span>
                  )}

                  <button
                    onClick={() => handleEditHabit(habit)}
                    className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-gray-900 font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {editingHabit && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white text-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Edit Habit</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const { id, title, icon, xpReward } = editingHabit;
                try {
                  await updateDoc(doc(db, "habits", id), {
                    title: title.trim(),
                    icon: icon.trim(),
                    xpReward: Number(xpReward),
                  });
                  setHabits((prev) =>
                    prev.map((h) =>
                      h.id === id
                        ? { ...h, title, icon, xpReward: Number(xpReward) }
                        : h
                    )
                  );
                  setEditingHabit(null);
                } catch (err) {
                  console.error("Error updating habit:", err);
                }
              }}
            >
              <div className="mb-4">
                <label className="block mb-1 font-semibold">Habit Title</label>
                <input
                  type="text"
                  value={editingHabit.title}
                  onChange={(e) =>
                    setEditingHabit({ ...editingHabit, title: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded border border-gray-300"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">Emoji</label>
                <input
                  type="text"
                  value={editingHabit.icon}
                  maxLength={2}
                  onChange={(e) =>
                    setEditingHabit({ ...editingHabit, icon: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded border border-gray-300"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">XP Reward</label>
                <input
                  type="number"
                  value={editingHabit.xpReward}
                  onChange={(e) =>
                    setEditingHabit({
                      ...editingHabit,
                      xpReward: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded border border-gray-300"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingHabit(null)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
