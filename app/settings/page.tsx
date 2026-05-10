"use client";

import { auth } from "@/lib/firebase";

import {
  signOut,
  deleteUser
} from "firebase/auth";

export default function SettingsPage() {

  // ログアウト
  const logout = async () => {

    await signOut(auth);

    location.href = "/login";

  };

  // アカウント削除
  const removeAccount =
    async () => {

      const ok =
        confirm(
          "本当にアカウント削除しますか？"
        );

      if (!ok) return;

      try {

        if (auth.currentUser) {

          await deleteUser(
            auth.currentUser
          );

          alert(
            "アカウント削除しました"
          );

          location.href =
            "/login";

        }

      } catch (e:any) {

        alert(
          "再ログインしてください"
        );

      }

    };

  return (

    <div className="text-white p-6">

      <h1 className="text-3xl font-bold mb-6">
        設定
      </h1>

      {/* ログアウト */}
      <button
        onClick={logout}
        className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left mb-4"
      >
        ログアウト
      </button>

      {/* アカウント削除 */}
      <button
        onClick={removeAccount}
        className="w-full bg-red-600 hover:bg-red-700 rounded-xl p-4 text-left"
      >
        アカウント削除
      </button>

    </div>

  );

}