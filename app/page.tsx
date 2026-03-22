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
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // ログイン状態チェック
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.href = "/login";
      } else {
        setUser(u);
      }
    });

    return () => unsubscribe();
  }, []);

  // 投稿取得
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(data);
    });

    return () => unsubscribe();
  }, []);

  // 投稿処理
  const handlePost = async () => {
    if (!text || !user) return;

    await addDoc(collection(db, "posts"), {
      text,
      createdAt: Date.now(),
      user: user.email?.replace("@critter.com", ""),
    });

    setText("");
  };

  // ログイン前
  if (!user) return null;

  return (
    <main className="flex justify-center bg-gray-100 min-h-screen">
      {/* 左メニュー */}
      <div className="w-[250px] p-4 hidden md:block">
        <h1 className="text-2xl font-bold mb-6">Critter</h1>
        <p>🏠 ホーム</p>
        <p>🔍 検索</p>
        <p>👤 プロフィール</p>

        <button
          onClick={() => signOut(auth)}
          className="mt-6 text-red-500"
        >
          ログアウト
        </button>
      </div>

      {/* メイン */}
      <div className="w-[600px] bg-white border-x p-4">
        <h1 className="text-xl font-bold mb-4">ホーム</h1>

        {/* 投稿欄 */}
        <div className="border-b pb-4 mb-4">
          <textarea
            className="w-full p-2 border rounded"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="いまどうしてる？"
          />
          <button
            onClick={handlePost}
            className="mt-2 bg-blue-500 text-white px-4 py-1 rounded"
          >
            投稿
          </button>
        </div>

        {/* 投稿一覧 */}
        <div>
          {posts.map((post) => (
            <div key={post.id} className="border-b p-4">
              <p className="font-bold">{post.user}</p>
              <p>{post.text}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}