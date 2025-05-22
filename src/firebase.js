// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDF8EkcGpw0vb7ngQgsNas3M5_GzzJzqRs",
  authDomain: "gamified-habbit-tracker.firebaseapp.com",
  projectId: "gamified-habbit-tracker",
  storageBucket: "gamified-habbit-tracker.firebasestorage.app",
  messagingSenderId: "16602067104",
  appId: "1:16602067104:web:4d33a256ae3863fb3c99c5",
  measurementId: "G-ZYS31SMZ2D",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db };
export default app;
