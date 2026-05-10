"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  db,
  auth
} from "@/lib/firebase";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

export default function Home() {

  const [user, setUser] =
    useState<any>(null);

  const [posts, setPosts] =
    useState<any[]>([]);

  const [text, setText] =
    useState("");

  useEffect(() => {

    return onAuthStateChanged(
      auth,
      (u) => {

        if (!u) {

          location.href =
            "/login";

        } else {

          setUser(u);

        }

      }
    );

  }, []);

  useEffect(() => {

    const q = query(
      collection(db, "posts"),
      orderBy(
        "createdAt",
        "desc"
      )
    );

    return onSnapshot(
      q,
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

  // ハッシュタグ
  const renderText = (
    text: string
  ) => {

    return text
      .split(" ")
      .map((word, i) => {

        if (
          word.startsWith("#")
        ) {

          return (

            <Link
              key={i}
              href={`/search?q=${encodeURIComponent(word)}`}
              className="text-sky-500 hover:underline"
            >
              {word}{" "}
            </Link>

          );

        }

        return word + " ";

      });

  };

  // 投稿
  const post = async () => {

    if (!text) return;

    await addDoc(
      collection(db, "posts"),
      {

        text,

        uid: user.uid,

        username:
          user.displayName ||
          user.email,

        name:
          user.displayName ||
          "ユーザー",

        createdAt:
          Date.now(),

      }
    );

    setText("");

  };

  if (!user)
    return null;

  return (
    <div className="bg-black text-white min-h-screen">

      {/* 上 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">

        <h1 className="text-3xl font-bold">
          ホーム
        </h1>

      </div>

      {/* 投稿欄 */}
      <div className="border-b border-zinc-800 p-4">

        <textarea
          value={text}
          onChange={(e) =>
            setText(
              e.target.value
            )
          }
          placeholder="いまどうしてる？"
          className="w-full bg-black text-white outline-none resize-none text-xl min-h-[120px]"
        />

        <div className="flex justify-end">

          <button
            onClick={post}
            className="bg-blue-500 hover:bg-blue-600 transition px-6 py-2 rounded-full font-bold"
          >
            クリート
          </button>

        </div>

      </div>

      {/* 投稿一覧 */}
      {posts.map((p: any) => (

        <div
          key={p.id}
          className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition"
        >

          <div className="flex gap-3">

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
              <div className="mt-2 whitespace-pre-wrap text-white">

                {renderText(
                  p.text
                )}

              </div>

              {/* 詳細 */}
              <Link
                href={`/post/${p.id}`}
                className="text-zinc-500 text-sm hover:underline mt-3 inline-block"
              >
                詳細を見る
              </Link>

            </div>

          </div>

        </div>

      ))}

    </div>
  );
}