"use client";

import { useEffect, useState } from "react";

import Layout from "@/components/Layout";

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
  getDoc,
  updateDoc
} from "firebase/firestore";

export default function SettingsPage() {

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [userData, setUserData] =
    useState<any>(null);

  const [newPassword, setNewPassword] =
    useState("");

  const [adminPassword, setAdminPassword] =
    useState("");

  // ログイン確認
  useEffect(() => {

    const unsub =
      onAuthStateChanged(
        auth,

        async (user) => {

          if (!user) {

            location.href =
              "/login";

            return;

          }

          setCurrentUser(user);

          const ref =
            doc(
              db,
              "users",
              user.uid
            );

          const snap =
            await getDoc(ref);

          if (snap.exists()) {

            setUserData(
              snap.data()
            );

          } else {

            // usersに無い時でも最低限表示
            setUserData({
              name:
                user.displayName ||
                "ユーザー",

              username:
                user.email?.split("@")[0] ||
                "user",

              admin: false,
              verified: false
            });

          }

        }

      );

    return () => unsub();

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

      if (!newPassword)
        return;

      try {

        if (auth.currentUser) {

          await updatePassword(
            auth.currentUser,
            newPassword
          );

          alert(
            "変更しました"
          );

          setNewPassword("");

        }

      } catch {

        alert(
          "再ログインしてください"
        );

      }

    };

  // 管理者権限
  const becomeAdmin =
    async () => {

      if (
        adminPassword !==
        "annpannmann"
      ) {

        alert(
          "パスワード違います"
        );

        return;

      }

      try {

        await updateDoc(
          doc(
            db,
            "users",
            currentUser.uid
          ),
          {
            admin: true,
            verified: true
          }
        );

        alert(
          "管理者権限を付与しました"
        );

        location.reload();

      } catch {

        alert(
          "失敗しました"
        );

      }

    };

  // アカウント削除
  const removeAccount =
    async () => {

      const ok =
        confirm(
          "本当に削除しますか？"
        );

      if (!ok)
        return;

      try {

        if (auth.currentUser) {

          await deleteUser(
            auth.currentUser
          );

          location.href =
            "/login";

        }

      } catch {

        alert(
          "再ログインしてください"
        );

      }

    };

  if (!currentUser)
    return null;

  return (

    <Layout currentUser={{
      ...currentUser,
      ...userData
    }}>

      <div className="p-6 text-white">

        <h1 className="text-4xl font-bold mb-8">

          設定

        </h1>

        {/* アカウント */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">

          <div className="text-2xl font-bold mb-4">

            アカウント情報

          </div>

          <div className="mb-3">

            名前:
            {" "}
            {userData?.name}

          </div>

          <div className="mb-3 text-zinc-400">

            @
            {userData?.username}

          </div>

        </div>

        {/* パスワード変更 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">

          <div className="text-xl font-bold mb-4">

            パスワード変更

          </div>

          <input
            type="password"
            placeholder="新しいパスワード"
            value={newPassword}
            onChange={(e)=>
              setNewPassword(
                e.target.value
              )
            }
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mb-4"
          />

          <button
            onClick={changePassword}
            className="bg-blue-500 hover:bg-blue-600 px-5 py-3 rounded-xl font-bold"
          >

            変更する

          </button>

        </div>

        {/* 管理者 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">

          <div className="text-xl font-bold mb-4">

            管理者権限付与

          </div>

          <input
            type="password"
            placeholder="管理者パスワード"
            value={adminPassword}
            onChange={(e)=>
              setAdminPassword(
                e.target.value
              )
            }
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mb-4"
          />

          <button
            onClick={becomeAdmin}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-5 py-3 rounded-xl font-bold"
          >

            管理者になる

          </button>

        </div>

        {/* ログアウト */}
        <button
          onClick={logout}
          className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-2xl p-4 text-left mb-4"
        >

          ログアウト

        </button>

        {/* 削除 */}
        <button
          onClick={removeAccount}
          className="w-full bg-red-600 hover:bg-red-700 rounded-2xl p-4 text-left"
        >

          アカウント削除

        </button>

      </div>

    </Layout>

  );

}