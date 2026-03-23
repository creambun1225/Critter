"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) window.location.href = "/login";
      else setUser(u);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handlePost = async () => {
    if (!text) return;

    await addDoc(collection(db, "posts"), {
      text,
      createdAt: Date.now(),
      uid: user.uid,
      username: user.email.split("@")[0],
    });

    setText("");
  };

  if (!user) return null;

  return (
    <main className="flex justify-center bg-gray-100 min-h-screen">

      {/* 左メニュー */}
      <div className="w-[250px] p-4">
        <h1 className="text-2xl font-bold mb-6">Karotter</h1>

        <div className="space-y-4 text-lg">
          <Link href="/">🏠 ホーム</Link><br/>
          <Link href="/notifications">🔔 通知</Link><br/>
          <Link href="/profile">👤 プロフィール</Link>
        </div>

        <button className="bg-blue-500 text-white w-full mt-6 py-2 rounded-full">
          ＋ カロート
        </button>
      </div>

      {/* 中央 */}
      <div className="w-[600px] bg-white border-x">

        {/* 投稿欄 */}
        <div className="p-4 border-b">
          <textarea
            className="w-full p-2 border rounded"
            placeholder="いまどうしてる？"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={handlePost}
            className="mt-2 bg-blue-500 text-white px-4 py-1 rounded-full"
          >
            投稿
          </button>
        </div>

        {/* 投稿一覧 */}
        {posts.map((p) => (
          <Link href={`/user/${p.uid}`} key={p.id}>
            <div className="p-4 border-b hover:bg-gray-50 cursor-pointer flex gap-3">

              {/* アイコン */}
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>

              <div className="flex-1">

                {/* 名前 */}
                <div className="flex gap-2">
                  <span className="font-bold">{p.username}</span>
                  <span className="text-gray-500 text-sm">
                    @{p.username}・今
                  </span>
                </div>

                {/* 本文 */}
                <p className="mt-1">{p.text}</p>

                {/* ボタン（ダミーUI） */}
                <div className="flex gap-6 text-gray-500 mt-2 text-sm">
                  <span>💬 0</span>
                  <span>🔁 0</span>
                  <span>❤️ 0</span>
                  <span>📊</span>
                </div>

              </div>
            </div>
          </Link>
        ))}

      </div>

      {/* 右 */}
      <div className="w-[300px] p-4">

        <div className="bg-white p-4 rounded-xl">
          <h2 className="font-bold mb-2">トレンド</h2>

          <p># こんにちは</p>
          <p># karotter</p>
          <p># sns</p>
          <p># よろしく</p>
        </div>

      </div>

    </main>
  );
}