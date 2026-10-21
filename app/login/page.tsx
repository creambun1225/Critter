"use client";

import { useState } from "react";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  TwitterAuthProvider,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // メールアドレスでログイン
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      const userSnap = await getDoc(doc(db, "users", userCredential.user.uid));
      if (!userSnap.exists()) {
        setError("ユーザー情報が見つかりません");
        return;
      }

      location.href = "/";
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("このメールアドレスは登録されていません");
      } else if (err.code === "auth/wrong-password") {
        setError("パスワードが間違っています");
      } else if (err.code === "auth/invalid-email") {
        setError("メールアドレスの形式が正しくありません");
      } else {
        setError("ログインに失敗しました: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Googleでログイン
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const userRef = doc(db, "users", result.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          name: result.user.displayName || "ユーザー",
          username: result.user.email?.split("@")[0] || "user",
          email: result.user.email || "",
          icon: result.user.photoURL || "",
          headerImage: "",
          bio: "",
          verified: false,
          admin: false,
          followers: [],
          following: [],
          blockedUsers: [],
          mutedUsers: [],
          banned: false,
          banReason: "",
          createdAt: Date.now(),
        });
      }

      location.href = "/";
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("ログインがキャンセルされました");
      } else if (err.code === "auth/popup-blocked") {
        setError("ポップアップがブロックされています。ブラウザの設定を確認してください");
      } else {
        setError("Googleログインに失敗しました: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Xでログイン
  const handleXLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new TwitterAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const info = getAdditionalUserInfo(result);
      const xUsername = ((info?.username as string) || "user")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");

      const userRef = doc(db, "users", result.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          name: result.user.displayName || xUsername,
          username: xUsername,
          email: result.user.email || "",
          icon: result.user.photoURL || "",
          headerImage: "",
          bio: "",
          verified: false,
          admin: false,
          followers: [],
          following: [],
          blockedUsers: [],
          mutedUsers: [],
          banned: false,
          banReason: "",
          createdAt: Date.now(),
        });
      }

      location.href = "/";
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("キャンセルされました");
      } else if (err.code === "auth/popup-blocked") {
        setError("ポップアップがブロックされています。ブラウザの設定を確認してください");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError("このメールアドレスは別の方法で登録されています");
      } else {
        setError("Xログインに失敗しました: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <h1 className="text-4xl font-bold text-white text-center mb-10">Critter</h1>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-2 rounded-2xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-5 py-3 text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition"
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-5 py-3 text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-full transition"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-black text-zinc-400">または</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-bold py-3 rounded-full transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Googleでログイン
          </button>

          <button
            type="button"
            onClick={handleXLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-bold py-3 rounded-full transition"
          >
            Xでログイン
          </button>
        </div>

        <p className="text-center mt-6">
          <Link href="/signup" className="text-blue-500 hover:text-blue-400 font-bold transition">
            アカウント作成はこちら
          </Link>
        </p>
      </div>
    </div>
  );
}
a