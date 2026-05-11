"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import PostCard from "@/components/PostCard";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc
} from "firebase/firestore";

export default function HomePage() {

  const [user, setUser] =
    useState<any>(null);

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [posts, setPosts] =
    useState<any[]>([]);

  const [text, setText] =
    useState("");

  // ログイン
  useEffect(() => {

    return onAuthStateChanged(
      auth,
      async (u) => {

        if (!u) {

          location.href =
            "/login";

          return;

        }

        setUser(u);

        const snap =
          await getDoc(
            doc(
              db,
              "users",
              u.uid
            )
          );

        if (snap.exists()) {

          setCurrentUser({

            uid: u.uid,

            ...snap.data()

          });

        }

      }
    );

  }, []);

  // 投稿取得
  useEffect(() => {

    const q =
      query(
        collection(
          db,
          "posts"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const unsub =
      onSnapshot(
        q,
        (snap) => {

          setPosts(

            snap.docs.map(
              (d) => ({

                id: d.id,

                ...d.data()

              })
            )

          );

        }
      );

    return () => unsub();

  }, []);

  // 投稿
  const createPost =
    async () => {

      if (!text.trim())
        return;

      if (!currentUser)
        return;

      await addDoc(
        collection(
          db,
          "posts"
        ),
        {
          uid:
            user.uid,

          name:
            currentUser.name ||
            "ユーザー",

          username:
            currentUser.username ||
            "user",

          icon:
            currentUser.icon ||
            "",

          verified:
            currentUser.verified ||
            false,

          adminVerified:
            currentUser.adminVerified ||
            false,

          text,

          likes: 0,

          reposts: 0,

          bookmarks: 0,

          createdAt:
            Date.now()
        }
      );

      setText("");

    };

  if (!user)
    return null;

  return (

    <div className="flex bg-black min-h-screen text-white">

      {/* 左 */}
      <div className="w-[250px] border-r border-zinc-800 p-4 flex flex-col fixed h-screen bg-black">

        {/* ロゴ */}
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black text-3xl font-bold mb-8">

          C

        </div>

        {/* メニュー */}
        <div className="flex flex-col gap-6 text-2xl">

          <Link href="/">
            🏠 ホーム
          </Link>

          <Link href="/search">
            🔎 検索
          </Link>

          <Link href="/notifications">
            🔔 通知
          </Link>

          <Link href={`/user/${user.uid}`}>
            👤 プロフィール
          </Link>

          <Link href="/bookmarks">
            🔖 ブックマーク
          </Link>

          <Link href="/settings">
            ⚙️ 設定
          </Link>

        </div>

        {/* 投稿ボタン */}
        <button
          onClick={createPost}
          className="mt-8 bg-blue-500 hover:bg-blue-600 rounded-full py-4 font-bold text-xl"
        >
          クリート
        </button>

        {/* バージョン */}
        <div className="mt-auto text-zinc-500 text-sm">

          Critter v1.0.1

        </div>

      </div>

      {/* 真ん中 */}
      <div className="ml-[250px] w-[600px] border-r border-zinc-800 min-h-screen">

        {/* 上 */}
        <div className="sticky top-0 bg-black/80 backdrop-blur border-b border-zinc-800 p-4 z-50">

          <h1 className="text-3xl font-bold">
            ホーム
          </h1>

        </div>

        {/* 投稿欄 */}
        <div className="border-b border-zinc-800 p-4">

          <textarea
            value={text}
            onChange={(e)=>
              setText(
                e.target.value
              )
            }
            placeholder="いまどうしてる？"
            className="w-full bg-black text-white outline-none resize-none text-xl min-h-[120px]"
          />

          <div className="flex justify-end mt-4">

            <button
              onClick={createPost}
              className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-full font-bold"
            >
              クリート
            </button>

          </div>

        </div>

        {/* 投稿一覧 */}
        {posts.map((post:any)=>(

          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
          />

        ))}

      </div>

      {/* 右 */}
      <div className="flex-1 p-8">

        <div className="bg-zinc-900 rounded-3xl p-6 w-[300px]">

          <div className="text-3xl font-bold mb-6">

            トレンド

          </div>

          <div className="mb-5">

            <div className="text-zinc-500 text-sm">

              トレンド

            </div>

            <div className="font-bold text-xl">

              #AI

            </div>

          </div>

          <div>

            <div className="text-zinc-500 text-sm">

              ゲーム

            </div>

            <div className="font-bold text-xl">

              #Minecraft

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}