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
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) window.location.href = "/login";
      else setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handlePost = async () => {
    if (!text || !user) return;

    await addDoc(collection(db, "posts"), {
      text,
      createdAt: Date.now(),
      uid: user.uid,
      username: user.email.split("@")[0], // 仮ユーザー名
    });

    setText("");
  };

  // 🔥 トレンド生成
  const words: any = {};
  posts.forEach(p => {
    p.text.split(" ").forEach((w: string) => {
      words[w] = (words[w] || 0) + 1;
    });
  });

  const trends = Object.entries(words)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5);

  if (!user) return null;

  return (
    <main className="flex justify-center bg-gray-100 min-h-screen">

      {/* 左 */}
      <div className="w-[200px] p-4">
        <Link href="/">🏠 ホーム</Link>
        <br />
        <Link href="/profile">👤 プロフィール</Link>
      </div>

      {/* メイン */}
      <div className="w-[600px] bg-white p-4">

        <textarea
          className="w-full border p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button onClick={handlePost} className="bg-blue-500 text-white px-3 py-1 mt-2">
          投稿
        </button>

        {posts.map((post) => (
          <Link href="/profile" key={post.id}>
            <div className="border-b p-4 cursor-pointer hover:bg-gray-100">

              <p className="font-bold">
                {post.username || "ユーザー"}
              </p>

              <p>{post.text}</p>

            </div>
          </Link>
        ))}

      </div>

      {/* 右（トレンド） */}
      <div className="w-[200px] p-4">
        <h2 className="font-bold mb-2">🔥 トレンド</h2>

        {trends.map((t: any, i) => (
          <p key={i}>
            {t[0]} ({t[1]})
          </p>
        ))}
      </div>

    </main>
  );
}