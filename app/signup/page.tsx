"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  TwitterAuthProvider,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // メールアドレスで登録
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !name || !username) {
      setError("すべてのフィールドを入力してください");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上である必要があります");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name,
        username,
        email,
        icon: "",
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

      location.href = "/";
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("このメールアドレスは既に登録されています");
      } else if (err.code === "auth/weak-password") {
        setError("パスワードが弱すぎます（6文字以上推奨）");
      } else if (err.code === "auth/invalid-email") {
        setError("メールアドレスの形式が正しくありません");
      } else {
        setError("登録に失敗しました: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Googleで登録
  const handleGoogleSignup = async () => {
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
        setError("登録がキャンセルされました");
      } else if (err.code === "auth/popup-blocked") {
        setError("ポップアップがブロックされています。ブラウザの設定を確認してください");
      } else {
        setError("Google登録に失敗しました: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Xで登録
  const handleXSignup = async () => {
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
        setError("登録がキャンセルされました");
      } else if (err.code === "auth/popup-blocked") {
        setError("ポップアップがブロックされています。ブラウザの設定を確認してください");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError("このメールアドレスは別の方法で登録されています");
      } else {
        setError("X登録に失敗しました: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <h1 className="text-4xl font-bold text-center mb-10">Critter</h1>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-2 rounded-2xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignup} className="space-y-3">
          <input
            type="text"
            placeholder="お名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-5 py-3 text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition"
          />

          <input
            type="text"
            placeholder="ユーザー名（@の後ろ）"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-5 py-3 text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition"
          />

          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-5 py-3 text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition"
          />

          <input
            type="password"
            placeholder="パスワード（6文字以上）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-5 py-3 text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-full transition"
          >
            {loading ? "登録中..." : "登録"}
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
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-bold py-3 rounded-full transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Googleで登録
          </button>

          <button
            type="button"
            onClick={handleXSignup}
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-bold py-3 rounded-full transition"
          >
            Xで登録
          </button>
        </div>

        <p className="text-center mt-6">
          <Link href="/login" className="text-blue-500 hover:text-blue-400 font-bold transition">
            ログインはこちら
          </Link>
        </p>
      </div>
    </div>
  );
}