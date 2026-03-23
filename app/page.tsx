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

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) window.location.href = "/login";
      else {
        setUser(u);
        const d = await getDoc(doc(db, "users", u.uid));
        setUserData(d.data());
      }
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
      username: userData.username,
    });

    setText("");
  };

  if (!user) return null;

  return (
    <main className="flex justify-center bg-gray-100 min-h-screen">

      {/* 左 */}
      <div className="w-[250px] p-4">
        <h1 className="text-2xl font-bold mb-6">Karotter</h1>
        <Link href="/">🏠 ホーム</Link><br/>
        <Link href="/notifications">🔔 通知</Link><br/>
        <Link href="/profile">👤 プロフィール</Link>
      </div>

      {/* 中央 */}
      <div className="w-[600px] bg-white border-x">

        <div className="p-4 border-b">
          <textarea
            className="w-full p-2 border"
            value={text}
            onChange={(e)=>setText(e.target.value)}
          />
          <button onClick={handlePost} className="bg-blue-500 text-white px-3 py-1 mt-2">
            投稿
          </button>
        </div>

        {posts.map(p => (
          <Link href={`/user/${p.uid}`} key={p.id}>
            <div className="p-4 border-b cursor-pointer">
              <p className="font-bold">{p.username}</p>
              <p>{p.text}</p>
            </div>
          </Link>
        ))}

      </div>

      {/* 右 */}
      <div className="w-[250px] p-4">
        <h2>トレンド</h2>
        <p># sns</p>
        <p># karotter</p>
      </div>

    </main>
  );
}