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
  doc,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>({});
  const [trends, setTrends] = useState<string[]>([]);

  // 🔐 ログインチェック
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        window.location.href = "/login";
      } else {
        setUser(u);
        const d = await getDoc(doc(db, "users", u.uid));
        setUserData(d.data());
      }
    });
  }, []);

  // 📩 投稿取得
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // 🔥 トレンド生成
  useEffect(() => {
    const words: any = {};

    posts.forEach((p) => {
      if (!p.text) return;

      const split = p.text.split(/[\s　]+/);

      split.forEach((w: string) => {
        if (w.length < 2) return;
        words[w] = (words[w] || 0) + 1;
      });
    });

    const sorted = Object.entries(words)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map((w: any) => w[0]);

    setTrends(sorted);
  }, [posts]);

  // ✏ 投稿
  const handlePost = async () => {
    if (!text || !user) return;

    await addDoc(collection(db, "posts"), {
      text,
      createdAt: Date.now(),
      uid: user.uid,
      username: userData?.username || "unknown",
    });

    setText("");
  };

  if (!user) return null;

  return (
    <main className="flex justify-center bg-gray-100 min-h-screen">

      {/* 左 */}
      <div className="w-[250px] p-4">
        <h1 className="text-2xl font-bold mb-6">Karotter</h1>

        <div className="space-y-3">
          <Link href="/">🏠 ホーム</Link><br/>
          <Link href="/notifications">🔔 通知</Link><br/>
          <Link href="/profile">👤 プロフィール</Link>
        </div>
      </div>

      {/* 中央 */}
      <div className="w-[600px] bg-white border-x">

        {/* 投稿欄 */}
        <div className="p-4 border-b">
          <textarea
            className="w-full p-2 border rounded"
            value={text}
            onChange={(e)=>setText(e.target.value)}
            placeholder="いまどうしてる？"
          />
          <button
            onClick={handlePost}
            className="bg-blue-500 text-white px-4 py-1 mt-2 rounded"
          >
            投稿
          </button>
        </div>

        {/* 投稿一覧 */}
        {posts.map(p => (
          <Link href={`/user/${p.uid}`} key={p.id}>
            <div className="p-4 border-b cursor-pointer hover:bg-gray-50">
              <p className="font-bold">{p.username}</p>
              <p>{p.text}</p>
            </div>
          </Link>
        ))}

      </div>

      {/* 右（トレンド） */}
      <div className="w-[250px] p-4">
        <h2 className="font-bold mb-3">🔥 トレンド</h2>

        {trends.length === 0 && <p>まだデータなし</p>}

        {trends.map((t, i) => (
          <p key={i} className="mb-1">#{t}</p>
        ))}
      </div>

      {/* ＋クリートボタン */}
      <div
        onClick={async () => {
          const t = prompt("投稿内容を入力");
          if (!t || !user) return;

          await addDoc(collection(db, "posts"), {
            text: t,
            createdAt: Date.now(),
            uid: user.uid,
            username: userData?.username || "unknown",
          });
        }}
        className="fixed bottom-5 left-5 bg-blue-500 text-white px-6 py-3 rounded-full cursor-pointer shadow-lg hover:bg-blue-600"
      >
        ＋ クリート
      </div>

    </main>
  );
}