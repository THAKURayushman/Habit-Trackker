import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const XPGoals = ({ totalXP }) => {
  const user = auth.currentUser;
  const [targets, setTargets] = useState({
    weekly: "",
    monthly: 0,
    yearly: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchTargets = async () => {
      try {
        const docRef = doc(db, "xpTargets", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTargets(docSnap.data());
        }
      } catch (error) {
        console.error("Error loading XP targets:", error);
      }
      setLoading(false);
    };

    fetchTargets();
  }, [user]);

  const handleChange = (e) => {
    setTargets((prev) => ({
      ...prev,
      [e.target.name]: Number(e.target.value),
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const docRef = doc(db, "xpTargets", user.uid);
      await setDoc(docRef, targets);
    } catch (error) {
      console.error("Error saving XP targets:", error);
    }
    setSaving(false);
  };

  const getProgress = (goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(100, Math.round((totalXP / goal) * 100));
  };

  return (
    <div className="mb-10 p-4 bg-gray-900 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-green-300">
        🎯 XP Progress Goals
      </h2>

      {loading ? (
        <p className="text-gray-400">Loading XP goals...</p>
      ) : (
        <div className="space-y-6">
          {["weekly", "monthly", "yearly"].map((period) => (
            <div key={period}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {period} Target XP
              </label>
              <input
                type="number"
                name={period}
                value={targets[period]}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              />
              <div className="w-full bg-gray-700 h-4 mt-2 rounded">
                <div
                  className="h-full bg-green-400 rounded transition-all duration-300"
                  style={{ width: `${getProgress(targets[period])}%` }}
                ></div>
              </div>
              <p className="text-xs mt-1 text-gray-400">
                {getProgress(targets[period])}% of {targets[period]} XP
              </p>
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          >
            {saving ? "Saving..." : "Save Targets"}
          </button>
        </div>
      )}
    </div>
  );
};

export default XPGoals;
