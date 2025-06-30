import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = () => {
    if (confirmLogout) {
      try {
        auth.signOut();
        navigate("/");
      } catch (err) {
        console.error("Logout failed:", err);
      }
    } else {
      setConfirmLogout(true);
      setTimeout(() => setConfirmLogout(false), 3000); // reset confirmation after 3s
    }
  };

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  return (
    <nav className="bg-indigo-600 text-white p-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
      <h1 className="text-xl font-bold">🎯 Habit Hero</h1>
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
        <Link className="hover:underline" to="/dashboard">
          Dashboard
        </Link>
        <Link className="hover:underline" to="/stats">
          Stats
        </Link>
        {!user?.isAnonymous && (
          <Link className="hover:underline" to="/settings">
            Settings
          </Link>
        )}

        {/* Show Login for anonymous users, Logout for others */}
        {user?.isAnonymous ? (
          <button
            onClick={handleLoginRedirect}
            className="bg-red-500 hover:bg-blue-800 px-3 py-1 rounded-md transition"
          >
            Login
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md transition"
          >
            {confirmLogout ? "Click again to confirm Logout" : "Logout"}
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
