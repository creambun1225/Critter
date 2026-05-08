"use client";

import { useEffect, useState } from "react";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy
} from "firebase/firestore";

import Link from "next/link";

export default function Profile() {

  const [profile, setProfile] = useState<any>(null);

  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {

    return onAuthStateChanged(auth, async (user) => {

      if (!user) {

        location.href = "/login";

        return;

      }

      // プロフィール取得
      const snap = await getDoc(
        doc(db, "users", user.uid)
      );

      if (snap.exists()) {

        setProfile(snap.data());

      }

      // 自分の投稿取得
      const q = query(
        collection(db, "posts"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      onSnapshot(q, (snap) => {

        setPosts(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data()
          }))
        );

      });

    });

  }, []);

  if (!profile) {

    return (
      <div className="flex justify-center items-center h-screen text-zinc-500">
        Loading...
      </div>
    );

  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* 上 */}
      <div className="sticky top-0 z-50 backdrop-blur bg-black/80 border-b border-zinc-800 p-4">

        <h1 className="text-2xl font-bold">
          プロフィール
        </h1>

      </div>

      {/* プロフィール */}
      <div className="border-b border-zinc-800">

        {/* ヘッダー */}
        <div className="h-40 bg-zinc-800" />

        <div className="p-4">

          {/* アイコン */}
          <div className="-mt-20">

            {profile.icon ? (

              <img
                src={profile.icon}
                className="w-32 h-32 rounded-full border-4 border-black object-cover"
              />

            ) : (

              <div className="w-32 h-32 rounded-full border-4 border-black bg-zinc-700" />

            )}

          </div>

          {/* 編集 */}
          <div className="flex justify-end">

            <Link href="/edit-profile">

              <button className="border border-zinc-700 hover:bg-zinc-900 transition px-5 py-2 rounded-full font-bold">
                プロフィールを編集
              </button>

            </Link>

          </div>

          {/* 名前 */}
          <div className="mt-4">

            <h1 className="text-3xl font-bold">
              {profile.name}
            </h1>

            <p className="text-zinc-500">
              @{profile.username}
            </p>

          </div>

          {/* bio */}
          <p className="mt-4 whitespace-pre-wrap">
            {profile.bio}
          </p>

        </div>

      </div>

      {/* 投稿 */}
      <div>

        {posts.length === 0 && (

          <div className="p-8 text-center text-zinc-500">
            まだクリートがありません
          </div>

        )}

        {posts.map((p) => (

          <div
            key={p.id}
            className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition"
          >

            <div className="flex gap-4">

              {/* アイコン */}
              {p.icon ? (

                <img
                  src={p.icon}
                  className="w-12 h-12 rounded-full object-cover"
                />

              ) : (

                <div className="w-12 h-12 rounded-full bg-zinc-700" />

              )}

              {/* 本文 */}
              <div className="flex-1">

                {/* 名前 */}
                <Link href={`/user/${p.uid}`}>

                  <div className="flex items-center gap-2 hover:underline cursor-pointer">

                    <p className="font-bold">
                      {p.username}
                    </p>

                    <p className="text-zinc-500">
                      @{p.username}
                    </p>

                  </div>

                </Link>

                {/* 投稿 */}
                <Link href={`/post/${p.id}`}>

                  <p className="mt-2 whitespace-pre-wrap hover:underline">
                    {p.text}
                  </p>

                </Link>

                {/* ボタン */}
                <div className="flex gap-8 mt-4 text-zinc-500">

                  <Link href={`/post/${p.id}`}>

                    <button className="hover:text-sky-500 transition">
                      💬
                    </button>

                  </Link>

                  <button className="hover:text-green-500 transition">
                    🔁
                  </button>

                  <button className="hover:text-pink-500 transition">
                    ❤️ {p.likes || 0}
                  </button>

                </div>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}