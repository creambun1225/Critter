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
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  // ログイン＆ユーザー情報取得
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        window.location.href = "/login";
      } else {
        setUser(u);

        // 🔥 ユーザー情報取得
        const docRef = await getDoc(doc(db, "users", u.uid));
        setUserData(docRef.data());
      }
    });
    return () => unsub();
  }, []);

  // 投稿取得
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(data);
    });

    return () => unsub();
  }, []);

  // 投稿（←ここが重要）
  const handlePost = async () => {
    if (!text || !user || !userData) return;

    await addDoc(collection(db, "posts"), {
      text,
      createdAt: Date.now(),
      uid: user.uid,

      // 🔥 これ追加（ユーザー名保存）
      username: userData.username || "ユーザー",
    });

    setText("");
  };

  if (!user) return null;

  return (
    <main className="flex justify-center bg-gray-100 min-h-screen">

      {/* 左メニュー */}
      <div className="w-[250px] p-4 hidden md:block">
        <h1 className="text-2xl font-bold mb-6">Critter</h1>

        <Link href="/">
          <p className="cursor-pointer hover:text-blue-500">🏠 ホーム</p>
        </Link>

        <Link href="/profile">
          <p className="cursor-pointer hover:text-blue-500 mt-2">👤 プロフィール</p>
        </Link>

        <button
          onClick={() => signOut(auth)}
          className="mt-6 text-red-500"
        >
          ログアウト
        </button>
      </div>

      {/* メイン */}
      <div className="w-[600px] bg-white border-x p-4">

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
        {posts.map((post) => (
          <div key={post.id} className="border-b p-4">

            {/* 🔥 UIDじゃなく名前表示 */}
            <p className="font-bold">
              {post.username || "ユーザー"}
            </p>

            <p>{post.text}</p>

          </div>
        ))}

      </div>
    </main>
  );
}