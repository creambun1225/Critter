"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  doc,
  getDoc
} from "firebase/firestore";

export default function BookmarksPage() {

  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {

    return onAuthStateChanged(auth, async (user) => {

      if (!user) return;

      const userSnap = await getDoc(
        doc(db, "users", user.uid)
      );

      const data: any = userSnap.data();

      const ids = data.bookmarks || [];

      const loaded = [];

      for (const id of ids) {

        const snap = await getDoc(
          doc(db, "posts", id)
        );

        if (snap.exists()) {

          loaded.push({
            id: snap.id,
            ...snap.data()
          });

        }

      }

      setPosts(loaded);

    });

  }, []);

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">

        <h1 className="text-2xl font-bold">
          ブックマーク
        </h1>

      </div>

      {posts.length === 0 && (

        <div className="p-10 text-center text-zinc-500">

          ブックマークがありません

        </div>

      )}

      {posts.map((p) => (

        <div
          key={p.id}
          className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition"
        >

          <Link href={`/user/${p.uid}`}>

            <div className="flex items-center gap-2 hover:underline cursor-pointer">

              <p className="font-bold">
                {p.name}
              </p>

              <p className="text-zinc-500">
                @{p.username}
              </p>

            </div>

          </Link>

          <Link href={`/post/${p.id}`}>

            <p className="mt-2 whitespace-pre-wrap hover:underline">
              {p.text}
            </p>

          </Link>

        </div>

      ))}

    </div>
  );
}