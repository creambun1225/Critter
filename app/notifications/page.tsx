"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

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
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

export default function NotificationsPage() {

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [notifications, setNotifications] =
    useState<any[]>([]);

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

          const userSnap =
            await getDoc(
              doc(
                db,
                "users",
                user.uid
              )
            );

          if (!userSnap.exists())
            return;

          const userData =
            userSnap.data();

          setCurrentUser({
            uid: user.uid,
            ...userData
          });

          // 管理者なら通報通知取得
          if (userData.admin) {

            const q = query(
              collection(
                db,
                "notifications"
              ),
              where(
                "type",
                "==",
                "report"
              ),
              orderBy(
                "createdAt",
                "desc"
              )
            );

            onSnapshot(
              q,
              async (snap) => {

                const list =
                  snap.docs.map(
                    (d:any)=>({
                      id:d.id,
                      ...d.data()
                    })
                  );

                setNotifications(
                  list
                );

                // 未読を既読に
                for (const n of list) {

                  if (
                    !n.readBy?.includes(
                      user.uid
                    )
                  ) {

                    await updateDoc(
                      doc(
                        db,
                        "notifications",
                        n.id
                      ),
                      {
                        readBy: [
                          ...(n.readBy || []),
                          user.uid
                        ]
                      }
                    );

                  }

                }

              }
            );

          }

        }
      );

    return () => unsub();

  }, []);

  return (

    <Layout currentUser={currentUser}>

      <div className="bg-black min-h-screen text-white">

        {/* タイトル */}
        <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">

          <div className="text-3xl font-bold">

            通知

          </div>

        </div>

        {/* 通知一覧 */}
        <div>

          {notifications.length === 0 && (

            <div className="p-6 text-zinc-500">

              通知はありません

            </div>

          )}

          {notifications.map((n:any)=>(

            <div
              key={n.id}
              className="border-b border-zinc-800 p-5 hover:bg-zinc-950 transition"
            >

              <div className="text-lg">

                🚨 クリートが通報されました

              </div>

              <Link
                href={`/post/${n.postId}`}
                className="text-blue-400 mt-3 inline-block"
              >

                [通報されたクリートを表示]

              </Link>

            </div>

          ))}

        </div>

      </div>

    </Layout>

  );

}