import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "ここはそのまま",
  authDomain: "ここもそのまま",
  projectId: "ここもそのまま",
  storageBucket: "ここもそのまま",
  messagingSenderId: "ここもそのまま",
  appId: "ここもそのまま"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);