"use client";

import { useEffect, useState } from "react";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  signOut
} from "firebase/auth";

import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

import Link from "next/link";

export default function SettingsPage() {

  const [showAdmin, setShowAdmin] = useState(false);

  const [showAccount, setShowAccount] = useState(false);

  const [password, setPassword] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {

    const load = async () => {

      if (!auth.currentUser) return;

      const snap = await getDoc(
        doc(db, "users", auth.currentUser.uid)
      );

      if (snap.exists()) {

        setProfile(snap.data());

        setIsAdmin(
          snap.data().admin || false
        );

      }

    };

    load();

  }, []);

  const logout = async () => {

    await signOut(auth);

    location.href = "/login";

  };

  const adminAuth = async () => {

    if (password !== "annpannmann") {

      alert("パスワードが違います");

      return;

    }

    if (!auth.currentUser) return;

    await updateDoc(
      doc(db, "users", auth.currentUser.uid),
      {
        admin: true
      }
    );

    setIsAdmin(true);

    alert("管理者権限を付与しました");

  };

  return (
    <div className="min-h-screen bg-black text-white">

      {/* 上 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">

        <h1 className="text-2xl font-bold">
          設定
        </h1>

      </div>

      {/* 中 */}
      <div className="p-4 space-y-4">

        {/* アカウント情報 */}
        <button
          onClick={() =>
            setShowAccount(!showAccount)
          }
          className="w-full bg-zinc-900 hover:bg-zinc-800 transition p-4 rounded-2xl text-left"
        >
          アカウント情報
        </button>

        {showAccount && profile && (

          <div className="bg-zinc-900 rounded-2xl p-4 space-y-4">

            <div>

              <p className="text-zinc-500 text-sm">
                ユーザー名
              </p>

              <p className="text-lg font-bold">
                @{profile.username}
              </p>

            </div>

            <div>

              <p className="text-zinc-500 text-sm">
                メールアドレス
              </p>

              <p className="break-all">
                {profile.email}
              </p>

            </div>

            <div>

              <p className="text-zinc-500 text-sm">
                パスワード
              </p>

              <p>
                ••••••••
              </p>

            </div>

            <div>

              <p className="text-zinc-500 text-sm">
                ブックマーク数
              </p>

              <Link href="/bookmarks">

                <p className="text-blue-500 hover:underline cursor-pointer">
                  {profile.bookmarks?.length || 0}件
                </p>

              </Link>

            </div>

          </div>

        )}

        {/* 管理者 */}
        <button
          onClick={() =>
            setShowAdmin(!showAdmin)
          }
          className="w-full bg-zinc-900 hover:bg-zinc-800 transition p-4 rounded-2xl text-left"
        >
          管理者権限付与
        </button>

        {showAdmin && (

          <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">

            <input
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="パスワード"
              className="w-full bg-black border border-zinc-700 rounded-xl p-3"
            />

            <button
              onClick={adminAuth}
              className="bg-blue-500 hover:bg-blue-600 transition px-5 py-2 rounded-full font-bold"
            >
              付与
            </button>

          </div>

        )}

        {isAdmin && (

          <div className="bg-green-500/20 border border-green-500 rounded-2xl p-4">

            管理者権限があります

          </div>

        )}

        {/* ブックマーク */}
        <Link href="/bookmarks">

          <button className="w-full bg-zinc-900 hover:bg-zinc-800 transition p-4 rounded-2xl text-left">

            ブックマークを見る

          </button>

        </Link>

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