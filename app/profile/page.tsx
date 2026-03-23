"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        window.location.href = "/login";
        return;
      }

      setUser(u);

      // 🔥 プロフィール取得
      const docRef = await getDoc(doc(db, "users", u.uid));
      setData(docRef.data());

      // 🔥 投稿取得
      const q = query(collection(db, "posts"), where("uid", "==", u.uid));
      onSnapshot(q, (snap) => {
        setPosts(snap.docs.map(d => d.data()));
      });
    });

    return () => unsub();
  }, []);

  // 🔥 読み込み中対策
  if (!data) {
    return <p className="p-4">読み込み中...</p>;
  }

  return (
    <div className="max-w-[600px] mx-auto">

      {/* ヘッダー */}
      <div className="h-32 bg-gray-300"></div>

      {/* アイコン */}
      <div className="-mt-10 ml-4">
        <div className="w-20 h-20 bg-gray-400 rounded-full border-4 border-white"></div>
      </div>

      <div className="p-4">
        <h1 className="text-xl font-bold">
          {data.username || "ユーザー"}
        </h1>

        <p className="text-gray-500">
          {data.bio || "自己紹介なし"}
        </p>

        <Link href="/settings">
          <button className="mt-3 border px-3 py-1 rounded">
            プロフィールを編集
          </button>
        </Link>

        {/* 投稿 */}
        <div className="mt-4">
          {posts.map((p, i) => (
            <div key={i} className="border-b p-2">
              {p.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}