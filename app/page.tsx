"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // ログインチェック
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) window.location.href = "/login";
      else setUser(u);
    });
  }, []);

  // 投稿取得
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // 投稿
  const createPost = async () => {
    const text = prompt("投稿内容");
    if (!text || !user) return;

    await addDoc(collection(db, "posts"), {
      text,
      createdAt: Date.now(),
      uid: user.uid
    });
  };

  if (!user) return null;

  return (
    <main className="flex justify-center bg-[#f5f8fa] min-h-screen">

      {/* 左メニュー */}
      <div className="w-[250px] p-6 border-r">
        <h1 className="text-2xl font-bold mb-6">Critter</h1>

        <div className="flex flex-col gap-6 text-lg">
          <Link href="/">🏠 ホーム</Link>
          <Link href="/profile">👤 プロフィール</Link>
        </div>

        <button
          onClick={createPost}
          className="mt-6 bg-blue-500 text-white p-2 rounded"
        >
          ＋ 投稿
        </button>
      </div>

      {/* タイムライン */}
      <div className="w-[600px] bg-white border-x">

        {posts.map(p => (
          <div key={p.id} className="p-4 border-b">
            <Link href={`/user/${p.uid}`}>
              <p className="font-bold">{p.username || "unknown"}</p>
            </Link>

            <Link href={`/post/${p.id}`}>
              <p>{p.text}</p>
            </Link>
          </div>
        ))}

      </div>

      {/* 右 */}
      <div className="w-[250px] p-4">
        <div className="bg-white p-4 rounded">
          トレンド
        </div>
      </div>

    </main>
  );
}