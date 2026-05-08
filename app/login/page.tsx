"use client";

import { useState } from "react";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";

import {
  doc,
  setDoc
} from "firebase/firestore";

export default function Login() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [isRegister, setIsRegister] = useState(false);

  const [error, setError] = useState("");

  const handleAuth = async () => {

    setError("");

    try {

      // 登録
      if (isRegister) {

        const res =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

        await setDoc(
          doc(db, "users", res.user.uid),
          {

            uid: res.user.uid,

            name: email.split("@")[0],

            bio: "Critter user",

            icon: "",

            email,

          }
        );

      } else {

        // ログイン
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      }

      window.location.href = "/";

    } catch (e: any) {

      console.log(e);

      setError(e.message);

    }

  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black text-white">

      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl w-[360px]">

        {/* タイトル */}
        <h1 className="text-3xl font-bold mb-8 text-center">
          Critter
        </h1>

        {/* メール */}
        <input
          className="bg-black border border-zinc-700 rounded-xl p-4 w-full mb-4 text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 transition"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* パスワード */}
        <input
          className="bg-black border border-zinc-700 rounded-xl p-4 w-full mb-4 text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 transition"
          placeholder="パスワード"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* エラー */}
        {error && (

          <p className="text-red-500 text-sm mb-4 break-all">
            {error}
          </p>

        )}

        {/* ボタン */}
        <button
          onClick={handleAuth}
          className="bg-blue-500 hover:bg-blue-600 transition text-white w-full py-3 rounded-full font-bold"
        >
          {isRegister
            ? "アカウント作成"
            : "ログイン"}
        </button>

        {/* 切り替え */}
        <p
          onClick={() =>
            setIsRegister(!isRegister)
          }
          className="text-blue-500 hover:underline mt-6 cursor-pointer text-sm text-center"
        >
          {isRegister
            ? "ログインはこちら"
            : "アカウント作成はこちら"}
        </p>

      </div>

    </div>
  );
}