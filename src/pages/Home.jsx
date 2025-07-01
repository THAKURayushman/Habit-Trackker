import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

const motivationalQuotes = [
  "Small daily improvements are the key to staggering long-term results.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Your habits will determine your future.",
  "Discipline is choosing between what you want now and what you want most.",
  "We become what we repeatedly do. Excellence, then, is not an act, but a habit.",
  "Consistency is what transforms average into excellence.",
  "Habits are the compound interest of self-improvement.",
  "It’s not what we do once in a while that shapes our lives. It’s what we do consistently.",
];

const Home = () => {
  const navigate = useNavigate();
  const [quote, setQuote] = useState("");
  const user = auth.currentUser;

  useEffect(() => {
    const randomQuote =
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);
  }, []);

  const displayName =
    user && !user.isAnonymous
      ? user.displayName?.split(" ")[0] || "User"
      : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-6 animate-fade-in duration-500">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-center text-indigo-400">
        {displayName ? `Welcome, ${displayName}!` : "Habit Hero"}
      </h1>

      <p className="text-xl sm:text-2xl text-gray-300 max-w-xl text-center mb-8 italic">
        "{quote}"
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-16">
        {!user?.isAnonymous && user && (
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-md text-lg font-semibold transition shadow-md"
          >
            Go to Dashboard
          </button>
        )}

        {(!user || user.isAnonymous) && (
          <>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-md text-lg font-semibold transition shadow-md"
            >
              Continue as Guest
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-800 px-6 py-3 rounded-md text-lg font-semibold transition shadow-md"
            >
              Login
            </button>
          </>
        )}
      </div>

      <section className="w-full max-w-4xl text-center px-4">
        <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-indigo-300">
          🚀 What Makes Habit Hero Awesome?
        </h2>

        <div className="flex overflow-x-auto space-x-6 pb-4 snap-x snap-mandatory scroll-smooth">
          {/* Feature Card 1 */}
          <div className="min-w-[250px] sm:min-w-[300px] bg-gray-800 p-6 rounded-xl shadow-lg snap-start">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              Track Your Progress
            </h3>
            <p className="text-gray-400 text-sm">
              Build daily habits, see your completions, and stay on track with
              your goals.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="min-w-[250px] sm:min-w-[300px] bg-gray-800 p-6 rounded-xl shadow-lg snap-start">
            <div className="text-4xl mb-3">🔥</div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              Earn Streaks
            </h3>
            <p className="text-gray-400 text-sm">
              Stay consistent to build streaks and unlock a sense of
              achievement.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="min-w-[250px] sm:min-w-[300px] bg-gray-800 p-6 rounded-xl shadow-lg snap-start">
            <div className="text-4xl mb-3">🎮</div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              Gamified XP System
            </h3>
            <p className="text-gray-400 text-sm">
              Complete habits to earn XP, level up, and gamify your self-growth.
            </p>
          </div>

          {/* Feature Card 4 */}
          <div className="min-w-[250px] sm:min-w-[300px] bg-gray-800 p-6 rounded-xl shadow-lg snap-start">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              Insights & Analytics
            </h3>
            <p className="text-gray-400 text-sm">
              Visualize your growth with weekly stats and habit analytics.
            </p>
          </div>

          {/* Feature Card 5 - AI */}
          <div className="min-w-[250px] sm:min-w-[300px] bg-gray-800 p-6 rounded-xl shadow-lg snap-start">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              AI Habit Suggestions
            </h3>
            <p className="text-gray-400 text-sm">
              Get smart daily habit ideas tailored to your current routine using
              AI-powered suggestions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
