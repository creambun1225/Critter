"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  useSearchParams
} from "next/navigation";

import {
  db
} from "@/lib/firebase";

import {
  collection,
  onSnapshot
} from "firebase/firestore";

export default function SearchPage() {

  const searchParams = useSearchParams();

  const initial =
    searchParams.get("q") || "";

  const [queryText, setQueryText] =
    useState(initial);

  const [posts, setPosts] =
    useState<any[]>([]);

  const [filtered, setFiltered] =
    useState<any[]>([]);

  useEffect(() => {

    return onSnapshot(
      collection(db, "posts"),
      (snap) => {

        const loaded = snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));

        setPosts(loaded);

      }
    );

  }, []);

  useEffect(() => {

    const q =
      queryText.toLowerCase();

    setFiltered(

      posts.filter((p: any) =>

        p.text?.toLowerCase().includes(q) ||

        p.username?.toLowerCase().includes(q) ||

        p.name?.toLowerCase().includes(q)

      )

    );

  }, [queryText, posts]);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* 上 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">

        <input
          placeholder="検索"
          value={queryText}
          onChange={(e) =>
            setQueryText(e.target.value)
          }
          className="w-full bg-zinc-900 rounded-full px-5 py-3 outline-none"
        />

      </div>

      {/* 投稿 */}
      {filtered.map((p: any) => (

        <div
          key={p.id}
          className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition"
        >

          <div className="flex gap-4">

            {/* アイコン */}
            <Link href={`/user/${p.uid}`}>

              {p.icon ? (

                <img
                  src={p.icon}
                  className="w-12 h-12 rounded-full object-cover cursor-pointer"
                />

              ) : (

                <div className="w-12 h-12 rounded-full bg-zinc-700 cursor-pointer" />

              )}

            </Link>

            <div className="flex-1">

              {/* 名前 */}
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

              {/* 本文 */}
              <Link href={`/post/${p.id}`}>

                <p className="mt-2 whitespace-pre-wrap hover:underline">
                  {p.text}
                </p>

              </Link>

            </div>

          </div>

        </div>

      ))}

    </div>
  );
}