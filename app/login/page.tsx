"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setError("");

    try {
      if (isRegister) {
        // 登録
        const res = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, "users", res.user.uid), {
          username: email.split("@")[0],
          bio: ""
        });

      } else {
        // ログイン
        await signInWithEmailAndPassword(auth, email, password);
      }

      window.location.href = "/";

    } catch (e:any) {
      console.log(e);
      setError(e.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">

      <div className="bg-white p-8 rounded shadow w-[300px]">

        <h1 className="text-xl font-bold mb-4">
          {isRegister ? "アカウント作成" : "ログイン"}
        </h1>

        <input
          className="border p-2 w-full mb-3"
          placeholder="メール"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-3"
          placeholder="パスワード"
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleAuth}
          className="bg-blue-500 text-white w-full py-2 rounded mt-2"
        >
          {isRegister ? "登録" : "ログイン"}
        </button>

        <p
          onClick={()=>setIsRegister(!isRegister)}
          className="text-blue-500 mt-4 cursor-pointer text-sm"
        >
          {isRegister
            ? "ログインはこちら"
            : "アカウント作成はこちら"}
        </p>

      </div>

    </div>
  );
}