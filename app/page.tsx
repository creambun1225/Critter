"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { db, auth } from "../lib/firebase";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  runTransaction,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

export default function Home() {

  const [user, setUser] = useState<any>(null);

  const [posts, setPosts] = useState<any[]>([]);

  const [text, setText] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) {
        location.href = "/login";
      } else {
        setUser(u);
      }
    });
  }, []);

  useEffect(() => {

    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {

      setPosts(
        snap.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .filter((p: any) => !p.parentId)
      );

    });

  }, []);

  const post = async () => {

    if (!text.trim()) return;

    await addDoc(collection(db, "posts"), {
      text,
      uid: user.uid,
      username: user.email,
      createdAt: Date.now(),
      likes: 0,
      likedBy: [],
      parentId: null,
    });

    setText("");

  };

  const like = async (p: any) => {

    const ref = doc(db, "posts", p.id);

    await runTransaction(db, async (tx) => {

      const snap = await tx.get(ref);

      const data = snap.data();

      if (data?.likedBy?.includes(user.uid)) return;

      tx.update(ref, {
        likes: (data?.likes || 0) + 1,
        likedBy: [...(data?.likedBy || []), user.uid],
      });

    });

  };

  if (!user) {
    return (
      <div className="p-10 text-center text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div>

      {/* 上 */}
      <div className="sticky top-0 z-50 backdrop-blur bg-black/80 border-b border-zinc-800 p-4">

        <h1 className="text-xl font-bold">
          ホーム
        </h1>

      </div>

      {/* 投稿 */}
      <div className="border-b border-zinc-800 p-4">

        <div className="flex gap-3">

          <div className="w-12 h-12 rounded-full bg-zinc-700 shrink-0" />

          <div className="flex-1">

            <textarea
              placeholder="いまどうしてる？"
              className="w-full bg-transparent text-xl resize-none min-h-[100px] placeholder:text-zinc-500"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="flex justify-end mt-4">

              <button
                onClick={post}
                className="bg-blue-500 hover:bg-blue-600 transition px-5 py-2 rounded-full font-bold"
              >
                ポスト
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* TL */}
      {posts.map((p) => (

        <div
          key={p.id}
          className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition"
        >

          <div className="flex gap-3">

            <div className="w-12 h-12 rounded-full bg-zinc-700 shrink-0" />

            <div className="flex-1">

              <div className="flex items-center gap-2">

                <p className="font-bold">
                  {p.username?.split("@")[0]}
                </p>

                <p className="text-zinc-500 text-sm">
                  @{p.username?.split("@")[0]}
                </p>

              </div>

              <Link href={`/post/${p.id}`}>

                <p className="mt-2 whitespace-pre-wrap text-[15px] hover:underline cursor-pointer">
                  {p.text}
                </p>

              </Link>

              <div className="flex gap-8 mt-4 text-zinc-500 text-sm">

                <button className="hover:text-sky-500 transition">
                  💬
                </button>

                <button className="hover:text-green-500 transition">
                  🔁
                </button>

                <button
                  onClick={() => like(p)}
                  className={
                    p.likedBy?.includes(user.uid)
                      ? "text-pink-500"
                      : "hover:text-pink-500 transition"
                  }
                >
                  ❤️ {p.likes}
                </button>

              </div>

            </div>

          </div>

        </div>

      ))}

    </div>
  );
}