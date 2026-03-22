"use client";
import { useState, useEffect } from "react";

import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
} from "firebase/firestore";

export default function Home() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);

  // 投稿取得
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "posts"), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setPosts(data);
    });
    return () => unsub();
  }, []);

  // 投稿
  const handlePost = async () => {
    if (!text) return;

    await addDoc(collection(db, "posts"), {
      text,
    });

    setText("");
  };

  return (
    <main className="flex justify-center bg-gray-100 min-h-screen relative">
      <div className="w-[600px] bg-white border-x min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">クリッター</h1>

        <textarea
          className="w-full border p-2 rounded"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="いまどうしてる？"
        />

        <button
          onClick={handlePost}
          className="bg-blue-500 text-white px-4 py-1 mt-2 rounded"
        >
          投稿
        </button>

        <div className="mt-4">
          {posts.map((post, i) => (
            <div key={i} className="border p-2 mb-2 rounded">
              {post.text}
            </div>
          ))}
        </div>
      </div>

      {/* 👇 左下バージョン表示 */}
      <div className="fixed bottom-2 left-2 text-gray-400 text-sm">
        v1.0.0
      </div>
    </main>
  );
}