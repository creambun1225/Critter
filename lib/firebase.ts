import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyC3v8B5z-WuhhC4sI8c1s6FUDk2NYX_WmY",
  authDomain: "critter-3c31b.firebaseapp.com",
  projectId: "critter-3c31b",
  storageBucket: "critter-3c31b.firebasestorage.app",
  messagingSenderId: "154125669854",
  appId: "1:154125669854:web:9b411bb1e77f151d8a794f"
};

// 初期化
const app = initializeApp(firebaseConfig);

// 🔥 これが超重要
export const auth = getAuth(app);
export const db = getFirestore(app);