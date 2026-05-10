"use client";

import {
  Suspense,
  useEffect,
  useState
} from "react";

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

function SearchContent() {

  const searchParams =
    useSearchParams();

  const q =
    searchParams.get("q") || "";

  const [search, setSearch] =
    useState(q);

  const [posts, setPosts] =
    useState<any[]>([]);

  useEffect(() => {

    return onSnapshot(
      collection(db, "posts"),
      (snap) => {

        setPosts(

          snap.docs.map((d) => ({
            id: d.id,
            ...d.data()
          }))

        );

      }
    );

  }, []);

  const filtered = posts.filter(
    (p: any) => {

      const s =
        search.toLowerCase();

      return (
        p.text
          ?.toLowerCase()
          .includes(s) ||

        p.username
          ?.toLowerCase()
          .includes(s) ||

        p.name
          ?.toLowerCase()
          .includes(s)
      );

    }
  );

  return (
    <div className="bg-black text-white min-h-screen">

      {/* 上 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="検索"
          className="w-full bg-zinc-900 rounded-full px-5 py-3 outline-none"
        />

      </div>

      {/* 投稿 */}
      {filtered.map((p: any) => (

        <div
          key={p.id}
          className="border-b border-zinc-800 p-4"
        >

          <div className="flex gap-3">

            {/* アイコン */}
            <Link href={`/user/${p.uid}`}>

              {p.icon ? (

                <img
                  src={p.icon}
                  className="w-12 h-12 rounded-full object-cover"
                />

              ) : (

                <div className="w-12 h-12 rounded-full bg-zinc-700" />

              )}

            </Link>

            <div className="flex-1">

              {/* 名前 */}
              <Link href={`/user/${p.uid}`}>

                <div className="hover:underline cursor-pointer">

                  <span className="font-bold">
                    {p.name}
                  </span>

                  <span className="text-zinc-500 ml-2">
                    @{p.username}
                  </span>

                </div>

              </Link>

              {/* 本文 */}
              <p className="mt-2 whitespace-pre-wrap">

                {p.text}

              </p>

            </div>

          </div>

        </div>

      ))}

    </div>
  );
}

export default function SearchPage() {

  return (

    <Suspense fallback={<div />}>

      <SearchContent />

    </Suspense>

  );

}