import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyArU4FM-MASjuBd0zZPCW5UyJFYZHdfpLE",
  authDomain: "mangabr-hub.firebaseapp.com",
  projectId: "mangabr-hub",
  storageBucket: "mangabr-hub.firebasestorage.app",
  messagingSenderId: "1052394065947",
  appId: "1:1052394065947:web:21bd2286a741050bdba8be",
  measurementId: "G-29PZL92H6C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
