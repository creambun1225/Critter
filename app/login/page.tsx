"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setError("");
    try {
      if (isRegister) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          name: email.split("@")[0],
          bio: "Critter user",
          icon: "",
          email,
        });
        window.location.href = "/";
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);

        // BANチェック
        const userSnap = await getDoc(doc(db, "users", res.user.uid));
        if (userSnap.exists() && userSnap.data().banned) {
          window.location.href = "/banned";
          return;
        }

        window.location.href = "/";
      }
    } catch (e: any) {
      console.log(e);
      setError(e.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl w-[360px]">

        <h1 className="text-3xl font-bold mb-8 text-center text-white">Critter</h1>

        <input type="email" placeholder="メールアドレス" value={email}
          onChange={(e) => setEmail(e.target.value)} style={{ color: "black" }}
          className="bg-white border border-zinc-300 rounded-xl p-4 w-full mb-4 placeholder:text-zinc-500 outline-none" />

        <input type="password" placeholder="パスワード" value={password}
          onChange={(e) => setPassword(e.target.value)} style={{ color: "black" }}
          className="bg-white border border-zinc-300 rounded-xl p-4 w-full mb-4 placeholder:text-zinc-500 outline-none" />

        {error && <p className="text-red-500 text-sm mb-4 break-all">{error}</p>}

        <button onClick={handleAuth}
          className="bg-blue-500 hover:bg-blue-600 transition text-white w-full py-3 rounded-full font-bold">
          {isRegister ? "アカウント作成" : "ログイン"}
        </button>

        <p onClick={() => setIsRegister(!isRegister)}
          className="text-blue-500 hover:underline mt-6 cursor-pointer text-sm text-center">
          {isRegister ? "ログインはこちら" : "アカウント作成はこちら"}
        </p>

      </div>
    </div>
  );
}