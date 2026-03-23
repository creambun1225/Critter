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
  const [image, setImage] = useState("");
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
      image,
      createdAt: Date.now(),
      uid: user.uid,
      username: user.email.split("@")[0],
    });

    setText("");
    setImage("");
  };

  // トレンド
  const words: any = {};
  posts.forEach(p => {
    p.text.split(" ").forEach((w: string) => {
      words[w] = (words[w] || 0) + 1;
    });
  });

  const trends = Object.entries(words).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);

  if (!user) return null;

  return (
    <main className="flex">

      {/* 左 */}
      <div className="w-48 p-4">
        <Link href="/">🏠 ホーム</Link><br/>
        <Link href="/profile">👤 プロフィール</Link><br/>
        <Link href="/notifications">🔔 通知</Link>
      </div>

      {/* 中央 */}
      <div className="w-[600px]">

        <textarea
          className="w-full border p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <input
          placeholder="画像URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="border p-2 w-full"
        />

        <button onClick={handlePost} className="bg-blue-500 text-white px-3 py-1 mt-2">
          投稿
        </button>

        {posts.map((p) => (
          <Link href={`/user/${p.uid}`} key={p.id}>
            <div className="border p-3 mt-2 cursor-pointer">

              <p className="font-bold">{p.username}</p>
              <p>{p.text}</p>

              {p.image && <img src={p.image} className="mt-2" />}

            </div>
          </Link>
        ))}

      </div>

      {/* 右 */}
      <div className="w-48 p-4">
        <h2>🔥トレンド</h2>

        {trends.map((t: any, i) => (
          <p key={i}>{t[0]} ({t[1]})</p>
        ))}
      </div>

    </main>
  );
}