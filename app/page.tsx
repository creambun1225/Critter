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

  // 🔥 投稿取得
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "posts"), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setPosts(data);
    });
    return () => unsub();
  }, []);

  // 🔥 投稿
  const handlePost = async () => {
    if (!text) return;

    await addDoc(collection(db, "posts"), {
      text,
    });

    setText("");
  };

  return (
    <main className="flex justify-center">
      <div className="w-[600px] border-x min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">クリッター</h1>

        <textarea
          className="w-full border p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={handlePost}
          className="bg-blue-500 text-white px-4 py-1 mt-2"
        >
          投稿
        </button>

        <div className="mt-4">
          {posts.map((post, i) => (
            <div key={i} className="border p-2 mb-2">
              {post.text}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}