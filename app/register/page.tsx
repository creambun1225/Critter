"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(
        auth,
        username + "@critter.com",
        password
      );
      alert("登録成功！");
    } catch (e) {
      alert("登録失敗");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-[400px] p-6 border rounded">
        <h1 className="text-xl font-bold mb-4">アカウント作成</h1>

        <input
          placeholder="ユーザー名"
          className="w-full border p-2 mb-2"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="パスワード"
          className="w-full border p-2 mb-2"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          className="bg-black text-white w-full py-2 rounded"
        >
          登録
        </button>
      </div>
    </div>
  );
}