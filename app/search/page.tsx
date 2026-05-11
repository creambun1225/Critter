"use client";

import { useEffect, useState } from "react";

import Layout from "@/components/Layout";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  collection,
  onSnapshot
} from "firebase/firestore";

import Link from "next/link";

export default function SearchPage() {

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [search, setSearch] =
    useState("");

  const [users, setUsers] =
    useState<any[]>([]);

  const [posts, setPosts] =
    useState<any[]>([]);

  // ログイン確認
  useEffect(() => {

    return onAuthStateChanged(
      auth,
      (user) => {

        if (!user) {

          location.href =
            "/login";

          return;

        }

        setCurrentUser(user);

      }
    );

  }, []);

  // ユーザー取得
  useEffect(() => {

    const unsub =
      onSnapshot(
        collection(
          db,
          "users"
        ),
        (snap) => {

          setUsers(

            snap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            }))

          );

        }
      );

    return () => unsub();

  }, []);

  // 投稿取得
  useEffect(() => {

    const unsub =
      onSnapshot(
        collection(
          db,
          "posts"
        ),
        (snap) => {

          setPosts(

            snap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            }))

          );

        }
      );

    return () => unsub();

  }, []);

  // 検索
  const filteredUsers =

    users.filter((u:any) =>

      u.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        ) ||

      u.username
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )

    );

  const filteredPosts =

    posts.filter((p:any) =>

      p.text
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )

    );

  return (

    <Layout currentUser={currentUser}>

      {/* タイトル */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">

        <div className="text-4xl font-bold">

          検索

        </div>

      </div>

      {/* 検索欄 */}
      <div className="p-4 border-b border-zinc-800">

        <input
          value={search}
          onChange={(e)=>
            setSearch(
              e.target.value
            )
          }
          placeholder="ユーザーやクリートを検索"
          className="w-full bg-zinc-900 rounded-full px-6 py-4 text-lg outline-none"
        />

      </div>

      {/* ユーザー */}
      <div>

        {filteredUsers.map((u:any) => (

          <Link
            key={u.id}
            href={`/user/${u.id}`}
            className="flex items-center gap-4 p-4 border-b border-zinc-800 hover:bg-zinc-950 transition"
          >

            {/* アイコン */}
            <img
              src={
                u.icon ||
                "/default.png"
              }
              className="w-14 h-14 rounded-full object-cover bg-zinc-700"
            />

            <div>

              <div className="flex items-center gap-2">

                <div className="font-bold text-lg">

                  {u.name}

                </div>

                {/* 青認証 */}
                {u.verified && (

                  <img
                    src="/verified-blue.png"
                    className="w-5 h-5"
                  />

                )}

                {/* 金認証 */}
                {u.admin && (

                  <img
                    src="/verified-gold.png"
                    className="w-5 h-5"
                  />

                )}

              </div>

              <div className="text-zinc-500">

                @{u.username}

              </div>

            </div>

          </Link>

        ))}

      </div>

      {/* 投稿 */}
      <div>

        {filteredPosts.map((p:any) => (

          <div
            key={p.id}
            className="border-b border-zinc-800 p-4"
          >

            <div className="flex items-center gap-2">

              <span className="font-bold">

                {p.name}

              </span>

              <span className="text-zinc-500">

                @{p.username}

              </span>

            </div>

            <div className="mt-2 whitespace-pre-wrap">

              {p.text}

            </div>

          </div>

        ))}

      </div>

    </Layout>

  );

}