"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  auth
} from "@/lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

export default function NotificationsPage() {

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  // ログイン確認
  useEffect(() => {

    const unsub =
      onAuthStateChanged(
        auth,
        (u) => {

          if (!u) {

            location.href =
              "/login";

            return;

          }

          setUser(u);

          setLoading(false);

        }
      );

    return () => unsub();

  }, []);

  // 読み込み中
  if (loading) {

    return null;

  }

  // user無い
  if (!user) {

    return null;

  }

  return (

    <div className="flex bg-black min-h-screen text-white">

      {/* 左 */}
      <div className="w-[250px] border-r border-zinc-800 p-4 flex flex-col fixed h-screen bg-black">

        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black text-3xl font-bold mb-8">

          C

        </div>

        <div className="flex flex-col gap-6 text-2xl">

          <Link href="/">
            🏠 ホーム
          </Link>

          <Link href="/search">
            🔎 検索
          </Link>

          <Link href="/notifications">
            🔔 通知
          </Link>

          <Link href={`/user/${user.uid}`}>
            👤 プロフィール
          </Link>

          <Link href="/bookmarks">
            🔖 ブックマーク
          </Link>

          <Link href="/settings">
            ⚙️ 設定
          </Link>

        </div>

        <div className="mt-auto text-zinc-500 text-sm">

          Critter v1.0.1

        </div>

      </div>

      {/* 真ん中 */}
      <div className="ml-[250px] w-[600px] min-h-screen border-r border-zinc-800">

        <div className="sticky top-0 bg-black/80 backdrop-blur border-b border-zinc-800 p-4 z-50">

          <h1 className="text-3xl font-bold">

            通知

          </h1>

        </div>

        <div className="p-6 text-zinc-400">

          通知はまだありません

        </div>

      </div>

      {/* 右 */}
      <div className="flex-1 p-8">

        <div className="bg-zinc-900 rounded-3xl p-6 w-[300px]">

          <div className="text-3xl font-bold mb-6">

            トレンド

          </div>

          <div className="mb-5">

            <div className="text-zinc-500 text-sm">

              トレンド

            </div>

            <div className="font-bold text-xl">

              #AI

            </div>

          </div>

          <div>

            <div className="text-zinc-500 text-sm">

              ゲーム

            </div>

            <div className="font-bold text-xl">

              #Minecraft

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}