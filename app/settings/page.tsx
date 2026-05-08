"use client";

import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function SettingsPage() {

  const logout = async () => {

    await signOut(auth);

    location.href = "/login";

  };

  return (
    <div className="min-h-screen">

      {/* 上 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">

        <h1 className="text-xl font-bold">
          設定
        </h1>

      </div>

      {/* 設定一覧 */}
      <div className="p-4 space-y-3">

        <button className="w-full bg-zinc-900 hover:bg-zinc-800 transition p-4 rounded-2xl text-left">
          アカウント設定
        </button>

        <button className="w-full bg-zinc-900 hover:bg-zinc-800 transition p-4 rounded-2xl text-left">
          プライバシー
        </button>

        <button className="w-full bg-zinc-900 hover:bg-zinc-800 transition p-4 rounded-2xl text-left">
          通知設定
        </button>

        <button className="w-full bg-zinc-900 hover:bg-zinc-800 transition p-4 rounded-2xl text-left">
          表示設定
        </button>

        {/* ログアウト */}
        <button
          onClick={logout}
          className="w-full bg-red-500 hover:bg-red-600 transition p-4 rounded-2xl font-bold"
        >
          ログアウト
        </button>

      </div>

    </div>
  );
}