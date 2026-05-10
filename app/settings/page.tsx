"use client";

import { useEffect, useState } from "react";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  signOut,
  deleteUser,
  onAuthStateChanged
} from "firebase/auth";

import {
  doc,
  getDoc
} from "firebase/firestore";

export default function SettingsPage() {

  const [userData, setUserData] =
    useState<any>(null);

  // ユーザー情報取得
  useEffect(() => {

    return onAuthStateChanged(
      auth,
      async (user) => {

        if (!user) {

          location.href =
            "/login";

          return;

        }

        const snap =
          await getDoc(
            doc(
              db,
              "users",
              user.uid
            )
          );

        if (snap.exists()) {

          setUserData({

            email:
              user.email,

            password:
              "Firebaseでは取得不可",

            ...snap.data()

          });

        }

      }
    );

  }, []);

  // ログアウト
  const logout =
    async () => {

      await signOut(auth);

      location.href =
        "/login";

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

  if (!userData)
    return null;

  return (

    <div className="bg-black min-h-screen text-white p-6">

      <h1 className="text-3xl font-bold mb-6">
        設定
      </h1>

      {/* アカウント情報 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">

        <h2 className="text-xl font-bold mb-4">
          アカウント情報
        </h2>

        {/* 名前 */}
        <div className="mb-4">

          <div className="text-zinc-500 text-sm">
            ユーザー名
          </div>

          <div className="text-lg">
            {userData.name}
          </div>

        </div>

        {/* @ */}
        <div className="mb-4">

          <div className="text-zinc-500 text-sm">
            @ユーザー名
          </div>

          <div className="text-lg">
            @{userData.username}
          </div>

        </div>

        {/* メール */}
        <div className="mb-4">

          <div className="text-zinc-500 text-sm">
            メールアドレス
          </div>

          <div className="text-lg break-all">
            {userData.email}
          </div>

        </div>

        {/* パスワード */}
        <div>

          <div className="text-zinc-500 text-sm">
            パスワード
          </div>

          <div className="text-lg">
            {userData.password}
          </div>

        </div>

      </div>

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