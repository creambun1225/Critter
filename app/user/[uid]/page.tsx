"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import Link from "next/link";

import {
  db
} from "@/lib/firebase";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

export default function UserPage() {

  const params =
    useParams();

  const uid =
    params.uid as string;

  const [userData, setUserData] =
    useState<any>(null);

  const [posts, setPosts] =
    useState<any[]>([]);

  // ユーザー取得
  useEffect(() => {

    const load =
      async () => {

        const ref =
          doc(
            db,
            "users",
            uid
          );

        const snap =
          await getDoc(ref);

        if (snap.exists()) {

          const data =
            snap.data();

          setUserData({

            name:
              data.name ||
              "ユーザー",

            username:
              data.username ||
              "user",

            bio:
              data.bio ||
              "",

            icon:
              data.icon ||
              ""

          });

        } else {

          setUserData({

            name:
              "ユーザー",

            username:
              "user",

            bio: "",

            icon: ""

          });

        }

      };

    load();

  }, [uid]);

  // 投稿取得
  useEffect(() => {

    const q = query(
      collection(
        db,
        "posts"
      ),
      where(
        "uid",
        "==",
        uid
      )
    );

    return onSnapshot(
      q,
      (snap) => {

        setPosts(

          snap.docs.map(
            (d) => {

              const data =
                d.data();

              return {

                id:
                  d.id,

                ...data,

                likes:
                  Array.isArray(
                    data.likes
                  )
                    ? data.likes
                    : [],

                reposts:
                  Array.isArray(
                    data.reposts
                  )
                    ? data.reposts
                    : [],

                bookmarks:
                  Array.isArray(
                    data.bookmarks
                  )
                    ? data.bookmarks
                    : []

              };

            }
          )

        );

      }
    );

  }, [uid]);

  if (!userData)
    return (
      <div className="text-white p-6">
        loading...
      </div>
    );

  return (

    <div className="bg-black min-h-screen text-white">

      {/* ヘッダー */}
      <div className="h-36 bg-zinc-700" />

      {/* プロフィール */}
      <div className="p-4">

        {/* アイコン */}
        <div className="-mt-20">

          {userData.icon ? (

            <img
              src={userData.icon}
              className="w-32 h-32 rounded-full border-4 border-black object-cover"
            />

          ) : (

            <div className="w-32 h-32 rounded-full bg-zinc-500 border-4 border-black" />

          )}

        </div>

        {/* 名前 */}
        <h1 className="text-3xl font-bold mt-4">

          {userData.name}

        </h1>

        {/* ユーザー名 */}
        <p className="text-zinc-500">

          @{userData.username}

        </p>

        {/* 自己紹介 */}
        <p className="mt-4 whitespace-pre-wrap">

          {userData.bio}

        </p>

      </div>

      {/* 投稿一覧 */}
      <div className="mt-6">

        {posts.map((p: any) => (

          <Link
            key={p.id}
            href={`/post/${p.id}`}
          >

            <div className="border-t border-zinc-800 p-4 hover:bg-zinc-950 transition cursor-pointer">

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

                <div>

                  {/* 名前 */}
                  <div className="font-bold">

                    {p.name || "ユーザー"}

                  </div>

                  {/* @ */}
                  <div className="text-zinc-500">

                    @{p.username || "user"}

                  </div>

                  {/* 本文 */}
                  <div className="mt-2 whitespace-pre-wrap text-white">

                    {p.text}

                  </div>

                  {/* 数 */}
                  <div className="flex gap-5 mt-3 text-zinc-500 text-sm">

                    <div>
                      ❤️ {p.likes.length}
                    </div>

                    <div>
                      🔁 {p.reposts.length}
                    </div>

                    <div>
                      🔖 {p.bookmarks.length}
                    </div>

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