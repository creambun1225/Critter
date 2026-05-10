"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import Link from "next/link";

import {
  db,
  auth
} from "@/lib/firebase";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

export default function UserPage() {

  const params =
    useParams();

  const uid =
    params.uid as string;

  const [me, setMe] =
    useState<any>(null);

  const [userData, setUserData] =
    useState<any>(null);

  const [posts, setPosts] =
    useState<any[]>([]);

  const [menuOpen, setMenuOpen] =
    useState(false);

  // 自分
  useEffect(() => {

    return onAuthStateChanged(
      auth,
      async (u) => {

        if (!u) return;

        const snap =
          await getDoc(
            doc(
              db,
              "users",
              u.uid
            )
          );

        if (snap.exists()) {

          setMe({
            uid: u.uid,
            ...snap.data()
          });

        }

      }
    );

  }, []);

  // 相手プロフィール
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

            uid,

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
              "",

            verified:
              data.verified || false,

            admin:
              data.admin || false

          });

        }

      };

    load();

  }, [uid]);

  // 投稿
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

                id: d.id,

                ...data,

                likes:
                  Array.isArray(data.likes)
                    ? data.likes
                    : [],

                reposts:
                  Array.isArray(data.reposts)
                    ? data.reposts
                    : [],

                bookmarks:
                  Array.isArray(data.bookmarks)
                    ? data.bookmarks
                    : []

              };

            }
          )

        );

      }
    );

  }, [uid]);

  // 認証付与
  const verifyUser =
    async () => {

      await updateDoc(
        doc(
          db,
          "users",
          uid
        ),
        {
          verified: true
        }
      );

      setUserData({
        ...userData,
        verified: true
      });

      setMenuOpen(false);

    };

  if (!userData)
    return (
      <div className="text-white p-6">
        loading...
      </div>
    );

  return (

    <div className="bg-black min-h-screen text-white">

      {/* ヘッダー */}
      <div className="h-36 bg-zinc-700 relative">

        {/* 管理者用 */}
        {me?.admin && (

          <button
            onClick={() =>
              setMenuOpen(
                !menuOpen
              )
            }
            className="absolute top-4 right-4 text-2xl"
          >
            ⋯
          </button>

        )}

        {/* メニュー */}
        {menuOpen && (

          <div className="absolute top-14 right-4 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden z-50">

            <button
              onClick={verifyUser}
              className="block px-4 py-3 hover:bg-zinc-800 w-full text-left"
            >
              ✔️ 認証マークを付ける
            </button>

          </div>

        )}

      </div>

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
        <div className="flex items-center gap-2 mt-4">

          <h1 className="text-3xl font-bold">

            {userData.name}

          </h1>

          {/* 青認証 */}
          {userData.verified && (

            <div className="text-sky-500 text-2xl">
              ✔️
            </div>

          )}

          {/* 金認証 */}
          {userData.admin && (

            <div className="text-yellow-400 text-2xl">
              👑
            </div>

          )}

        </div>

        {/* @ */}
        <p className="text-zinc-500">

          @{userData.username}

        </p>

        {/* 自己紹介 */}
        <p className="mt-4 whitespace-pre-wrap">

          {userData.bio}

        </p>

      </div>

      {/* 投稿 */}
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
                  <div className="flex items-center gap-2">

                    <div className="font-bold">

                      {p.name || "ユーザー"}

                    </div>

                    {p.verified && (

                      <div className="text-sky-500">
                        ✔️
                      </div>

                    )}

                    {p.admin && (

                      <div className="text-yellow-400">
                        👑
                      </div>

                    )}

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