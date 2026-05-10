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
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc
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

  // ログイン確認
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

  // 投稿取得
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

          snap.docs.map((d) => {

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

          })

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

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );

    const userSnap =
      await getDoc(userRef);

    const userData =
      userSnap.data();

    await addDoc(
      collection(db, "posts"),
      {

        text,

        uid:
          user.uid,

        name:
          userData?.name ||
          "ユーザー",

        username:
          userData?.username ||
          "user",

        icon:
          userData?.icon ||
          "",

        verified:
          userData?.verified ||
          false,

        admin:
          userData?.admin ||
          false,

        createdAt:
          Date.now(),

        likes: [],
        reposts: [],
        bookmarks: []

      }
    );

    setText("");

  };

  // いいね
  const toggleLike =
    async (p: any) => {

      const ref =
        doc(
          db,
          "posts",
          p.id
        );

      const liked =
        p.likes?.includes(
          user.uid
        );

      await updateDoc(
        ref,
        {

          likes: liked
            ? arrayRemove(user.uid)
            : arrayUnion(user.uid)

        }
      );

    };

  // リポスト
  const toggleRepost =
    async (p: any) => {

      const ref =
        doc(
          db,
          "posts",
          p.id
        );

      const reposted =
        p.reposts?.includes(
          user.uid
        );

      await updateDoc(
        ref,
        {

          reposts: reposted
            ? arrayRemove(user.uid)
            : arrayUnion(user.uid)

        }
      );

    };

  // ブックマーク
  const toggleBookmark =
    async (p: any) => {

      const ref =
        doc(
          db,
          "posts",
          p.id
        );

      const bookmarked =
        p.bookmarks?.includes(
          user.uid
        );

      await updateDoc(
        ref,
        {

          bookmarks: bookmarked
            ? arrayRemove(user.uid)
            : arrayUnion(user.uid)

        }
      );

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
                  className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full object-cover bg-zinc-700 cursor-pointer"
                />

              ) : (

                <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-zinc-700 cursor-pointer" />

              )}

            </Link>

            <div className="flex-1">

              {/* 名前 */}
              <Link href={`/user/${p.uid}`}>

                <div className="hover:underline cursor-pointer flex items-center gap-2">

                  <span className="font-bold">
                    {p.name}
                  </span>

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

                  <span className="text-zinc-500 ml-1">
                    @{p.username || "user"}
                  </span>

                </div>

              </Link>

              {/* 本文 */}
              <div className="mt-2 whitespace-pre-wrap text-white">

                {renderText(
                  p.text
                )}

              </div>

              {/* ボタン */}
              <div className="flex gap-8 mt-4 text-zinc-500">

                {/* 返信 */}
                <Link
                  href={`/post/${p.id}`}
                  className="hover:text-sky-500"
                >
                  💬 0
                </Link>

                {/* リポスト */}
                <button
                  onClick={() =>
                    toggleRepost(p)
                  }
                  className={
                    p.reposts.includes(user.uid)
                      ? "text-green-500"
                      : "hover:text-green-500"
                  }
                >
                  🔁 {p.reposts.length}
                </button>

                {/* いいね */}
                <button
                  onClick={() =>
                    toggleLike(p)
                  }
                  className={
                    p.likes.includes(user.uid)
                      ? "text-pink-500"
                      : "hover:text-pink-500"
                  }
                >
                  ❤️ {p.likes.length}
                </button>

                {/* ブックマーク */}
                <button
                  onClick={() =>
                    toggleBookmark(p)
                  }
                  className={
                    p.bookmarks.includes(user.uid)
                      ? "text-yellow-500"
                      : "hover:text-yellow-500"
                  }
                >
                  🔖 {p.bookmarks.length}
                </button>

              </div>

            </div>

          </div>

        </div>

      ))}

    </div>
  );
}