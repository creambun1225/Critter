"use client";
import { useState, useEffect } from "react";

import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // 🔐 ログインチェック
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.href = "/login";
      } else {
        setUser(u);
      }
    });
    return () => unsub();
  }, []);

  // 🔥 投稿取得（これが重要）
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(data);
    });

    return () => unsub();
  }, []);

  // ✍ 投稿
  const handlePost = async () => {
    if (!text || !user) return;

    await addDoc(collection(db, "posts"), {
      text,
      user: user.email.replace("@critter.com", ""),
      likes: 0,
      createdAt: Date.now(),
    });

    setText("");
  };

  // ❤️ いいね
  const handleLike = async (id: string, likes: number) => {
    const ref = doc(db, "posts", id);
    await updateDoc(ref, {
      likes: likes + 1,
    });
  };

  return (
    <main className="flex justify-center bg-gray-100 min-h-screen relative">
      <div className="w-[600px] bg-white border-x min-h-screen p-4">
        <h1 className="text-xl font-bold mb-4">クリッター</h1>

        <button
          onClick={() => signOut(auth)}
          className="text-red-500 mb-4"
        >
          ログアウト
        </button>

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
          {posts.map((post) => (
            <div key={post.id} className="border p-3 mb-2 rounded">
              <p className="font-bold">{post.user}</p>
              <p>{post.text}</p>

              <button
                onClick={() => handleLike(post.id, post.likes || 0)}
                className="text-red-500 mt-2"
              >
                ❤️ {post.likes || 0}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* バージョン */}
      <div className="fixed bottom-2 left-2 text-gray-400 text-sm">
        v2.0.0
      </div>
    </main>
  );
}