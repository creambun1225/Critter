"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  db,
  auth
} from "@/lib/firebase";

import PostCard from "@/components/PostCard";

export default function Home() {

  const [text, setText] =
    useState("");

  const [posts, setPosts] =
    useState<any[]>([]);

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  // ログイン確認
  useEffect(() => {

    const unsub =
      onAuthStateChanged(
        auth,
        async (user) => {

          if (!user) {

            location.href =
              "/login";

            return;

          }

          setCurrentUser(user);

        }
      );

    return () => unsub();

  }, []);

  // 投稿取得
  useEffect(() => {

    const q = query(
      collection(db, "posts"),
      orderBy(
        "createdAt",
        "desc"
      )
    );

    const unsub =
      onSnapshot(q, (snap) => {

        setPosts(
          snap.docs.map(
            (doc:any) => ({
              id: doc.id,
              ...doc.data()
            })
          )
        );

      });

    return () => unsub();

  }, []);

  // 投稿
  const createPost =
    async () => {

      if (!text.trim()) return;

      await addDoc(
        collection(db, "posts"),
        {
          text,

          uid:
            currentUser.uid,

          name:
            currentUser.displayName ||
            "ユーザー",

          username:
            currentUser.email?.split(
              "@"
            )[0] || "user",

          icon:
            currentUser.photoURL || "",

          verified: false,

          adminVerified: false,

          replies: 0,

          reposts: 0,

          likes: 0,

          bookmarks: 0,

          createdAt:
            Date.now()
        }
      );

      setText("");

    };

  return (

    <div className="flex justify-center bg-black min-h-screen text-white">

      {/* 左 */}
      <div className="w-[260px] border-r border-zinc-800 p-4 flex flex-col fixed left-0 top-0 h-screen bg-black">

        {/* ロゴ */}
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black text-3xl font-bold mb-8">

          C

        </div>

        {/* メニュー */}
        <div className="flex flex-col gap-6 text-2xl font-bold">

          <Link href="/">
            🏠 ホーム
          </Link>

          <Link href="/search">
            🔎 検索
          </Link>

          <Link href="/notifications">
            🔔 通知
          </Link>

          <Link
            href={`/user/${currentUser?.uid}`}
          >
            👤 プロフィール
          </Link>

          <Link href="/bookmarks">
            🔖 ブックマーク
          </Link>

          <Link href="/settings">
            ⚙️ 設定
          </Link>

        </div>

        {/* クリート */}
        <button
          onClick={createPost}
          className="mt-10 bg-blue-500 hover:bg-blue-600 transition rounded-full py-4 text-2xl font-bold"
        >

          クリート

        </button>

        {/* バージョン */}
        <div className="mt-auto text-zinc-500">

          Critter v1.0.1

        </div>

      </div>

      {/* 中央 */}
      <div className="w-[620px] border-r border-l border-zinc-800 min-h-screen ml-[260px]">

        {/* タイトル */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">

          <div className="text-5xl font-bold">

            ホーム

          </div>

        </div>

        {/* 投稿フォーム */}
        <div className="border-b border-zinc-800 p-4">

          <textarea
            value={text}
            onChange={(e)=>
              setText(
                e.target.value
              )
            }
            placeholder="いまどうしてる？"
            className="w-full bg-black outline-none resize-none text-2xl min-h-[120px]"
          />

          <div className="flex justify-end mt-4">

            <button
              onClick={createPost}
              className="bg-blue-500 hover:bg-blue-600 transition px-8 py-3 rounded-full text-xl font-bold"
            >

              クリート

            </button>

          </div>

        </div>

        {/* 投稿一覧 */}
        <div>

          {posts.map((post:any)=>(

            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
            />

          ))}

        </div>

      </div>

      {/* 右 */}
      <div className="w-[350px] p-6">

        <div className="bg-zinc-900 rounded-3xl p-6 sticky top-6">

          <div className="text-4xl font-bold mb-6">

            トレンド

          </div>

          <div className="mb-5">

            <div className="text-zinc-500">

              トレンド

            </div>

            <div className="font-bold text-3xl">

              #AI

            </div>

          </div>

          <div>

            <div className="text-zinc-500">

              ゲーム

            </div>

            <div className="font-bold text-3xl">

              #Minecraft

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}