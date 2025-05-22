import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig"; // Your firebase config import

// Utility: Format date as YYYY-MM-DD string
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

// Calculate current streak from completions object
function calculateCurrentStreak(completions) {
  if (!completions) return 0;

  let streak = 0;
  let currentDate = new Date();
  while (true) {
    const dateStr = formatDate(currentDate);
    if (completions[dateStr]) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// Calculate longest streak from completions object
function calculateLongestStreak(completions) {
  if (!completions) return 0;

  const dates = Object.keys(completions).sort(); // Ascending order
  let longestStreak = 0;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const diffTime = currDate - prevDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);
  return longestStreak;
}

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);

  // Fetch habits for current user from Firestore
  const fetchHabits = async () => {
    if (!auth.currentUser) return;
    try {
      const habitsRef = collection(db, "habits");
      const q = query(habitsRef, where("uid", "==", auth.currentUser.uid));
      const snapshot = await getDocs(q);
      const userHabits = [];
      snapshot.forEach((doc) => userHabits.push({ id: doc.id, ...doc.data() }));
      setHabits(userHabits);
    } catch (err) {
      console.error("Error fetching habits:", err);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  // Toggle completion for today's date for a given habit
  const handleToggleComplete = async (habit) => {
    if (!habit) return;
    const today = formatDate(new Date());
    const completions = habit.completions || {};

    // Prevent marking done twice on same day
    if (completions[today]) {
      console.log("Already marked done today for habit:", habit.name);
      return;
    }

    const updatedCompletions = { ...completions, [today]: true };

    try {
      const habitDoc = doc(db, "habits", habit.id);
      await updateDoc(habitDoc, { completions: updatedCompletions });

      // Update local state immediately for responsiveness
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habit.id ? { ...h, completions: updatedCompletions } : h
        )
      );

      console.log("Completion updated for habit:", habit.name);

      // Optional: Re-fetch habits to guarantee Firestore sync
      // Comment out if you want to reduce reads and trust local update
      await fetchHabits();
    } catch (err) {
      console.error("Error updating completion:", err);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Habit Tracker</h1>
      {habits.length === 0 && <p>Loading habits...</p>}
      {habits.map((habit) => {
        const currentStreak = calculateCurrentStreak(habit.completions);
        const longestStreak = calculateLongestStreak(habit.completions);
        const today = formatDate(new Date());
        const doneToday = habit.completions?.[today] === true;

        return (
          <div
            key={habit.id}
            style={{
              border: "1px solid gray",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
              maxWidth: "400px",
            }}
          >
            <h2>{habit.name}</h2>
            <p>
              Current Streak: <strong>{currentStreak}</strong>
            </p>
            <p>
              Longest Streak: <strong>{longestStreak}</strong>
            </p>
            <button
              onClick={() => handleToggleComplete(habit)}
              disabled={doneToday}
              style={{
                backgroundColor: doneToday ? "gray" : "green",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: doneToday ? "not-allowed" : "pointer",
              }}
            >
              {doneToday ? "Done Today ✓" : "Mark Done Today"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
