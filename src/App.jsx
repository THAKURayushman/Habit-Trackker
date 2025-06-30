import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Stats from "./pages/Stats";
import Navbar from "./components/Navbar";

const App = () => {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        try {
          const guest = await signInAnonymously(auth);
          setUser(guest.user);
        } catch (err) {
          console.error("Anonymous sign-in error:", err);
        }
      } else {
        setUser(currentUser);
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {user && !isHome && <Navbar user={user} />}
      <main className="flex-grow w-full max-w-4xl mx-auto p-4 sm:p-6">
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Always show Home */}
          <Route path="/" element={<Home />} />

          {/* Login: only for anonymous users */}
          <Route
            path="/login"
            element={
              user && !user.isAnonymous ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )
            }
          />

          {/* Dashboard: for any signed-in user */}
          <Route
            path="/dashboard"
            element={
              user ? <Dashboard user={user} /> : <Navigate to="/" replace />
            }
          />

          {/* Other pages */}
          <Route
            path="/analytics"
            element={
              user ? <Analytics user={user} /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/stats"
            element={user ? <Stats user={user} /> : <Navigate to="/" replace />}
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
