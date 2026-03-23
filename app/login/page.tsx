"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const handle = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, pass);

        await setDoc(doc(db, "users", res.user.uid), {
          username: email.split("@")[0],
          bio: "",
          icon: "",
          header: "",
        });
      }

      window.location.href = "/";
    } catch (e) {
      alert("失敗");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">

      <input
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 m-1"
      />

      <input
        type="password"
        placeholder="password"
        onChange={(e) => setPass(e.target.value)}
        className="border p-2 m-1"
      />

      <button onClick={handle} className="bg-blue-500 text-white px-4 py-2">
        {isLogin ? "ログイン" : "登録"}
      </button>

      <p
        className="text-blue-500 mt-2 cursor-pointer"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? "アカウント作成はこちら" : "ログインはこちら"}
      </p>

    </div>
  );
}