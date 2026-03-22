"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("その他");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");

    if (!username || !password) {
      setError("ユーザー名とパスワードは必須！");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上にして！");
      return;
    }

    try {
      await createUserWithEmailAndPassword(
        auth,
        username + "@critter.com",
        password
      );

      alert("登録成功！");
      window.location.href = "/";
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-[400px] bg-white p-6 rounded-xl shadow">
        
        {/* ロゴ */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full"></div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          アカウント作成
        </h1>

        <p className="text-center text-sm text-gray-500 mb-4">
          または{" "}
          <Link href="/login" className="text-blue-500">
            ログインはこちら
          </Link>
        </p>

        {/* エラー表示 */}
        {error && (
          <p className="text-red-500 text-sm mb-2 text-center">
            {error}
          </p>
        )}

        {/* ユーザー名 */}
        <input
          placeholder="ユーザー名"
          className="w-full border p-3 rounded mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* 性別 */}
        <select
          className="w-full border p-3 rounded mb-3"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option>男性</option>
          <option>女性</option>
          <option>その他</option>
        </select>

        {/* パスワード */}
        <input
          type="password"
          placeholder="パスワード（6文字以上）"
          className="w-full border p-3 rounded mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* 登録ボタン */}
        <button
          onClick={handleRegister}
          className="w-full bg-black text-white py-3 rounded font-bold"
        >
          アカウント作成
        </button>
      </div>
    </main>
  );
}