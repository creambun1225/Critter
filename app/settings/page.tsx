"use client";

import { useEffect, useState } from "react";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  signOut,
  deleteUser,
  onAuthStateChanged,
  updatePassword
} from "firebase/auth";

import {
  doc,
  getDoc
} from "firebase/firestore";

export default function SettingsPage() {

  const [userData, setUserData] =
    useState<any>(null);

  const [showAccount, setShowAccount] =
    useState(false);

  const [newPassword, setNewPassword] =
    useState("");

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

  // パスワード変更
  const changePassword =
    async () => {

      if (!newPassword) {

        alert(
          "新しいパスワード入力して"
        );

        return;

      }

      try {

        if (auth.currentUser) {

          await updatePassword(
            auth.currentUser,
            newPassword
          );

          alert(
            "パスワード変更しました"
          );

          setNewPassword("");

        }

      } catch (e:any) {

        alert(
          "再ログインしてください"
        );

      }

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

      {/* アカウント情報ボタン */}
      <button
        onClick={() =>
          setShowAccount(
            !showAccount
          )
        }
        className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left mb-4"
      >
        アカウント情報
      </button>

      {/* 開いた時 */}
      {showAccount && (

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">

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

          {/* パスワード変更 */}
          <div>

            <div className="text-zinc-500 text-sm mb-2">
              パスワード変更
            </div>

            <input
              type="password"
              placeholder="新しいパスワード"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 mb-3 text-white"
            />

            <button
              onClick={changePassword}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-xl"
            >
              パスワード変更
            </button>

          </div>

        </div>

      )}

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