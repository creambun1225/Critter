"use client";

import { useEffect, useState } from "react";

import Layout from "@/components/Layout";

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
  orderBy,
  onSnapshot
} from "firebase/firestore";

export default function NotificationsPage() {

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [notifications, setNotifications] =
    useState<any[]>([]);

  // ログイン確認
  useEffect(() => {

    return onAuthStateChanged(
      auth,
      (user) => {

        if (!user) {

          location.href =
            "/login";

          return;

        }

        setCurrentUser(user);

      }
    );

  }, []);

  // 通知取得
  useEffect(() => {

    const q =
      query(
        collection(
          db,
          "notifications"
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

          setNotifications(

            snap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            }))

          );

        }
      );

    return () => unsub();

  }, []);

  return (

    <Layout currentUser={currentUser}>

      {/* タイトル */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">

        <div className="text-4xl font-bold">

          通知

        </div>

      </div>

      {/* 通知一覧 */}
      <div>

        {notifications.length === 0 && (

          <div className="p-8 text-zinc-500 text-center">

            通知はまだありません

          </div>

        )}

        {notifications.map((n:any) => (

          <div
            key={n.id}
            className="border-b border-zinc-800 p-5 hover:bg-zinc-950 transition"
          >

            {/* 通報 */}
            {n.type === "report" && (

              <div>

                <div className="text-red-400 font-bold text-lg">

                  🚨 通報

                </div>

                <div className="mt-2 text-white">

                  {n.text}

                </div>

              </div>

            )}

            {/* いいね */}
            {n.type === "like" && (

              <div>

                <div className="text-pink-400 font-bold text-lg">

                  ❤️ いいね

                </div>

                <div className="mt-2">

                  あなたのクリートがいいねされました
                </div>

              </div>

            )}

            {/* リポスト */}
            {n.type === "repost" && (

              <div>

                <div className="text-green-400 font-bold text-lg">

                  🔁 リポスト

                </div>

                <div className="mt-2">

                  あなたのクリートがリポストされました
                </div>

              </div>

            )}

            {/* フォロー */}
            {n.type === "follow" && (

              <div>

                <div className="text-sky-400 font-bold text-lg">

                  👤 フォロー

                </div>

                <div className="mt-2">

                  新しいフォロワーがいます
                </div>

              </div>

            )}

          </div>

        ))}

      </div>

    </Layout>

  );

}