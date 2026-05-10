"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

export default function NotificationsPage() {

  const [user, setUser] =
    useState<any>(null);

  const [reports, setReports] =
    useState<any[]>([]);

  // ログイン
  useEffect(() => {

    return onAuthStateChanged(
      auth,
      (u) => {

        if (!u) {

          location.href =
            "/login";

          return;

        }

        setUser(u);

      }
    );

  }, []);

  // 通報取得
  useEffect(() => {

    if (!user)
      return;

    const q =
      query(
        collection(
          db,
          "reports"
        )
      );

    const unsub =
      onSnapshot(
        q,
        (snap) => {

          setReports(

            snap.docs.map(
              (d) => ({

                id: d.id,

                ...d.data()

              })
            )

          );

        }
      );

    return () => unsub();

  }, [user]);

  // まだ読み込み中
  if (!user) {

    return null;

  }

  return (

    <div className="flex bg-black min-h-screen text-white">

      {/* 左 */}
      <div className="w-[250px] border-r border-zinc-800 p-4 flex flex-col fixed h-screen bg-black">

        {/* ロゴ */}
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black text-3xl font-bold mb-8">

          C

        </div>

        {/* メニュー */}
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

        {/* バージョン */}
        <div className="mt-auto text-zinc-500 text-sm">

          Critter v1.0.1

        </div>

      </div>

      {/* 真ん中 */}
      <div className="ml-[250px] w-[600px] border-r border-zinc-800 min-h-screen">

        {/* タイトル */}
        <div className="sticky top-0 bg-black/80 backdrop-blur border-b border-zinc-800 p-4 z-50">

          <h1 className="text-3xl font-bold">

            通知

          </h1>

        </div>

        {/* 通報一覧 */}
        <div>

          {reports.length === 0 && (

            <div className="p-6 text-zinc-500">

              通知はありません

            </div>

          )}

          {reports.map((report:any)=>(

            <div
              key={report.id}
              className="border-b border-zinc-800 p-4"
            >

              <div className="text-red-400 font-bold mb-2">

                通報されたクリート

              </div>

              <div className="text-white whitespace-pre-wrap">

                {report.text}

              </div>

            </div>

          ))}

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