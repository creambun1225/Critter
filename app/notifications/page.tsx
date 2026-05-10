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
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

export default function NotificationsPage() {

  const [user, setUser] =
    useState<any>(null);

  const [reports, setReports] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  // ログイン確認
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

    if (!user) return;

    const q = query(
      collection(
        db,
        "reports"
      ),
      orderBy(
        "createdAt",
        "desc"
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

          setLoading(false);

        }
      );

    return () => unsub();

  }, [user]);

  if (!user)
    return null;

  return (

    <div className="bg-black min-h-screen text-white">

      {/* 上 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">

        <h1 className="text-3xl font-bold">
          通知
        </h1>

      </div>

      {/* ロード */}
      {loading && (

        <div className="p-6 text-zinc-400">

          loading...

        </div>

      )}

      {/* 通報一覧 */}
      {!loading && reports.length === 0 && (

        <div className="p-6 text-zinc-500">

          通知はありません

        </div>

      )}

      {/* 通報 */}
      {reports.map((r:any) => (

        <div
          key={r.id}
          className="border-b border-zinc-800 p-4"
        >

          <div className="text-red-500 font-bold">

            🚨 通報されたクリート

          </div>

          <div className="mt-3 whitespace-pre-wrap">

            {r.text}

          </div>

          <div className="mt-4">

            <Link
              href={`/post/${r.postId}`}
              className="text-sky-500 hover:underline"
            >
              クリートを見る
            </Link>

          </div>

        </div>

      ))}

    </div>

  );

}