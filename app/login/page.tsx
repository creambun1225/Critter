"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const email = username + "@critter.com";

  const login = async () => {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "/";
  };

  const register = async () => {
    await createUserWithEmailAndPassword(auth, email, password);
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl mb-4">Critter</h1>

      <input
        placeholder="ユーザー名"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 mb-2"
      />

      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 mb-2"
      />

      <button onClick={login} className="bg-blue-500 text-white px-4 py-2 mb-2">
        ログイン
      </button>

      <button onClick={register} className="bg-gray-500 text-white px-4 py-2">
        新規登録
      </button>
    </div>
  );
}