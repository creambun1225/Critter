"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "posts"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(data);
    });
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!text || !user) return;

    await addDoc(collection(db, "posts"), {
      text,
      user: user.email.replace("@critter.com", ""),
      likes: 0,
    });

    setText("");
  };

  const handleLike = async (id: string, likes: number) => {
    const ref = doc(db, "posts", id);
    await updateDoc(ref, { likes: likes + 1 });
  };

  return (
    <main className="flex justify-center bg-gray-100 min-h-screen">
      <div className="w-[600px] bg-white p-4">
        <h1 className="text-xl font-bold mb-4">クリッター</h1>

        <button onClick={() => signOut(auth)} className="mb-4 text-red-500">
          ログアウト
        </button>

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
          {posts.map((post) => (
            <div key={post.id} className="border p-2 mb-2">
              <p className="font-bold">{post.user}</p>
              <p>{post.text}</p>

              <button
                onClick={() => handleLike(post.id, post.likes || 0)}
                className="text-red-500"
              >
                ❤️ {post.likes || 0}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}