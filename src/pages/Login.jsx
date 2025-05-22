import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

const Login = () => {
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-gray-800">
        Gamified Habit Tracker
      </h1>
      <button
        onClick={signInWithGoogle}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-medium shadow-md transition duration-200"
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;
