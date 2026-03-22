"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      alert("入力して！");
      return;
    }

    try {
      await signInWithEmailAndPassword(
        auth,
        username + "@critter.com",
        password
      );
      window.location.href = "/";
    } catch (e) {
      alert("ログイン失敗");
    }
  };

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-[400px] bg-white p-6 rounded-xl shadow">
        
        {/* ロゴ */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full"></div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">
          ログイン
        </h1>

        <input
          placeholder="ユーザー名"
          className="w-full border p-3 rounded mb-3"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="パスワード"
          className="w-full border p-3 rounded mb-3"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white py-3 rounded font-bold"
        >
          ログイン
        </button>

        {/* ↓これが今回の重要部分 */}
        <p className="text-center text-sm mt-4">
          アカウントを持っていない？{" "}
          <Link href="/register" className="text-blue-500">
            アカウント作成はこちら
          </Link>
        </p>

      </div>
    </main>
  );
}