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
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

export default function ProfilePage() {

  const [userData, setUserData] =
    useState<any>(null);

  const [posts, setPosts] =
    useState<any[]>([]);

  useEffect(() => {

    return onAuthStateChanged(
      auth,
      async (user) => {

        if (!user) {

          location.href = "/login";
          return;

        }

        // ユーザー情報
        const userRef =
          doc(
            db,
            "users",
            user.uid
          );

        const userSnap =
          await getDoc(userRef);

        if (userSnap.exists()) {

          const data =
            userSnap.data();

          setUserData({

            uid: user.uid,

            name:
              data.name || "ユーザー",

            username:
              data.username || "user",

            bio:
              data.bio || "",

            icon:
              data.icon || "",

            verified:
              data.verified || false,

            admin:
              data.admin || false

          });

        }

        // 投稿
        const q = query(
          collection(db, "posts"),
          where(
            "uid",
            "==",
            user.uid
          )
        );

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

      }
    );

  }, []);

  if (!userData) {

    return (
      <div className="text-white p-6">
        loading...
      </div>
    );

  }

  return (

    <div className="bg-black min-h-screen text-white">

      {/* ヘッダー */}
      <div className="h-40 bg-zinc-700" />

      {/* プロフィール */}
      <div className="px-6">

        {/* アイコン */}
        <div className="-mt-16">

          {userData.icon ? (

            <img
              src={userData.icon}
              className="w-32 h-32 rounded-full border-4 border-black object-cover bg-zinc-700"
            />

          ) : (

            <div className="w-32 h-32 rounded-full bg-zinc-600 border-4 border-black" />

          )}

        </div>

        {/* 名前 */}
        <div className="flex items-center gap-2 mt-4">

          <h1 className="text-3xl font-bold">

            {userData.name}

          </h1>

          {/* 青認証 */}
          {userData.verified && (

            <img
              src="/verified-blue.png"
              className="w-7 h-7"
            />

          )}

          {/* 金認証 */}
          {userData.admin && (

            <img
              src="/verified-gold.png"
              className="w-7 h-7"
            />

          )}

        </div>

        {/* @ */}
        <p className="text-zinc-400 text-lg">

          @{userData.username}

        </p>

        {/* 自己紹介 */}
        <p className="mt-4 whitespace-pre-wrap">

          {userData.bio}

        </p>

        {/* 編集 */}
        <Link href="/profile/edit">

          <button className="mt-6 border border-zinc-600 px-5 py-2 rounded-full hover:bg-zinc-900">

            プロフィールを編集

          </button>

        </Link>

      </div>

      {/* 投稿一覧 */}
      <div className="mt-8">

        {posts.map((p: any) => (

          <Link
            key={p.id}
            href={`/post/${p.id}`}
          >

            <div className="border-t border-zinc-800 p-4 hover:bg-zinc-950 transition">

              <div className="flex gap-3">

                {/* アイコン */}
                {p.icon ? (

                  <img
                    src={p.icon}
                    className="w-12 h-12 rounded-full object-cover"
                  />

                ) : (

                  <div className="w-12 h-12 rounded-full bg-zinc-700" />

                )}

                <div className="flex-1">

                  {/* 名前 */}
                  <div className="flex items-center gap-2">

                    <div className="font-bold">

                      {p.name}

                    </div>

                    {/* 青認証 */}
                    {p.verified && (

                      <img
                        src="/verified-blue.png"
                        className="w-5 h-5"
                      />

                    )}

                    {/* 金認証 */}
                    {p.admin && (

                      <img
                        src="/verified-gold.png"
                        className="w-5 h-5"
                      />

                    )}

                  </div>

                  {/* @ */}
                  <div className="text-zinc-500">

                    @{p.username}

                  </div>

                  {/* 本文 */}
                  <div className="mt-2 whitespace-pre-wrap">

                    {p.text}

                  </div>

                </div>

              </div>

            </div>

          </Link>

        ))}

      </div>

    </div>

  );

}