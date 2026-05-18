"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

function notificationLabel(type: string) {
  switch (type) {
    case "like":   return { emoji: "❤️", text: "さんがいいねしました" };
    case "repost": return { emoji: "🔁", text: "さんがリポストしました" };
    case "quote":  return { emoji: "✏️", text: "さんが引用リポストしました" };
    case "reply":  return { emoji: "💬", text: "さんが返信しました" };
    case "report": return { emoji: "🚨", text: "クリートが通報されました" };
    default:       return { emoji: "🔔", text: "通知があります" };
  }
}

export default function NotificationsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = "/login"; return; }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) return;
      const userData = userSnap.data();
      setCurrentUser({ uid: user.uid, ...userData });

      // 自分宛の通知（orderBy なし → JS でソート）
      const personalQ = query(
        collection(db, "notifications"),
        where("toUid", "==", user.uid)
      );

      const unsubPersonal = onSnapshot(personalQ, async (snap) => {
        const list: any[] = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

        // 未読を既読に
        for (const n of list) {
          if (!n.readBy?.includes(user.uid)) {
            await updateDoc(doc(db, "notifications", n.id), {
              readBy: [...(n.readBy || []), user.uid],
            });
          }
        }

        setNotifications((prev) => {
          // 通報通知と合算してcreatedAt降順
          const reports = prev.filter((n) => n.type === "report");
          return [...list, ...reports].sort((a, b) => b.createdAt - a.createdAt);
        });
      });

      // 管理者なら通報通知も取得
      if (userData.admin) {
        const reportQ = query(
          collection(db, "notifications"),
          where("type", "==", "report")
        );

        onSnapshot(reportQ, async (snap) => {
          const list: any[] = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

          for (const n of list) {
            if (!n.readBy?.includes(user.uid)) {
              await updateDoc(doc(db, "notifications", n.id), {
                readBy: [...(n.readBy || []), user.uid],
              });
            }
          }

          setNotifications((prev) => {
            const personal = prev.filter((n) => n.type !== "report");
            return [...personal, ...list].sort((a, b) => b.createdAt - a.createdAt);
          });
        });
      }

      return () => unsubPersonal();
    });

    return () => unsub();
  }, []);

  return (
    <Layout currentUser={currentUser}>
      <div className="bg-black min-h-screen text-white">

        {/* タイトル */}
        <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">
          <div className="text-3xl font-bold">通知</div>
        </div>

        {/* 通知一覧 */}
        <div>
          {notifications.length === 0 && (
            <div className="p-6 text-zinc-500 text-center">通知はありません</div>
          )}

          {notifications.map((n: any) => {
            const { emoji, text } = notificationLabel(n.type);

            // 通報通知（管理者向け）
            if (n.type === "report") {
              return (
                <div key={n.id} className="border-b border-zinc-800 p-5 hover:bg-zinc-950 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <p className="text-white font-bold">クリートが通報されました</p>
                      {n.postText && (
                        <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{n.postText}</p>
                      )}
                      <Link href={`/post/${n.postId}`} className="text-blue-400 text-sm mt-1 inline-block hover:underline">
                        通報されたクリートを表示 →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }

            // 通常通知
            return (
              <div key={n.id} className="border-b border-zinc-800 p-5 hover:bg-zinc-950 transition">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-1">{emoji}</span>
                  <div className="flex-1 min-w-0">

                    {/* アイコン + 名前 → プロフィールへ */}
                    <Link
                      href={`/user/${n.fromUid}`}
                      className="flex items-center gap-2 mb-1 w-fit hover:opacity-80 transition"
                    >
                      <img
                        src={n.fromIcon || "/default.png"}
                        className="w-9 h-9 rounded-full object-cover bg-zinc-700"
                      />
                      <span className="font-bold text-white">{n.fromName}</span>
                      <span className="text-zinc-500 text-sm">@{n.fromUsername}</span>
                    </Link>

                    {/* 通知文 */}
                    <p className="text-zinc-300 text-sm">
                      <span className="font-bold text-white">{n.fromName}</span>
                      {text}
                    </p>

                    {/* 投稿プレビュー */}
                    {n.postText && (
                      <Link
                        href={`/post/${n.postId}`}
                        className="block mt-2 text-zinc-500 text-sm line-clamp-2 hover:text-zinc-300 transition"
                      >
                        {n.postText}
                      </Link>
                    )}

                    {/* 時間 */}
                    <p className="text-zinc-600 text-xs mt-1">
                      {new Date(n.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}