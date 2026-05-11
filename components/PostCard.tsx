"use client";

import { useState } from "react";

import Link from "next/link";

import {
  db
} from "@/lib/firebase";

import {
  doc,
  deleteDoc,
  addDoc,
  collection,
  updateDoc,
  increment
} from "firebase/firestore";

export default function PostCard({
  post,
  currentUser
}: any) {

  const [open, setOpen] =
    useState(false);

  const [liked, setLiked] =
    useState(false);

  const [reposted, setReposted] =
    useState(false);

  const [bookmarked, setBookmarked] =
    useState(false);

  // 通報
  const reportPost =
    async () => {

      await addDoc(
        collection(
          db,
          "reports"
        ),
        {
          postId:
            post.id,

          postText:
            post.text,

          reportedBy:
            currentUser?.uid,

          postUserId:
            post.uid,

          createdAt:
            Date.now()
        }
      );

      // 管理者通知
      await addDoc(
        collection(
          db,
          "notifications"
        ),
        {
          type:
            "report",

          text:
            "クリートが通報されました",

          postId:
            post.id,

          createdAt:
            Date.now()
        }
      );

      alert(
        "通報しました"
      );

      setOpen(false);

    };

  // 削除
  const deletePost =
    async () => {

      const ok =
        confirm(
          "このクリートを削除しますか？"
        );

      if (!ok) return;

      await deleteDoc(
        doc(
          db,
          "posts",
          post.id
        )
      );

    };

  // いいね
  const likePost =
    async () => {

      if (liked) return;

      setLiked(true);

      await updateDoc(
        doc(
          db,
          "posts",
          post.id
        ),
        {
          likes:
            increment(1)
        }
      );

    };

  // リポスト
  const repostPost =
    async () => {

      if (reposted) return;

      setReposted(true);

      await updateDoc(
        doc(
          db,
          "posts",
          post.id
        ),
        {
          reposts:
            increment(1)
        }
      );

    };

  // ブックマーク
  const bookmarkPost =
    async () => {

      if (bookmarked) return;

      setBookmarked(true);

      await updateDoc(
        doc(
          db,
          "posts",
          post.id
        ),
        {
          bookmarks:
            increment(1)
        }
      );

    };

  const canDelete =

    currentUser?.uid ===
      post.uid ||

    currentUser?.admin ===
      true ||

    currentUser?.isAdmin ===
      true;

  return (

    <div className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition">

      {/* 上 */}
      <div className="flex justify-between items-start gap-3">

        {/* 左 */}
        <Link
          href={`/user/${post.uid}`}
          className="flex gap-3 flex-1 min-w-0"
        >

          {/* アイコン */}
          <img
            src={
              post.icon ||
              "/default.png"
            }
            className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-zinc-700"
          />

          {/* 情報 */}
          <div className="min-w-0 flex-1">

            {/* 名前 */}
            <div className="flex items-center gap-2 flex-wrap">

              <div className="font-bold text-[17px] truncate">

                {post.name}

              </div>

              {/* 青認証 */}
              {post.verified && (

                <img
                  src="/verified-blue.png"
                  className="w-5 h-5"
                />

              )}

              {/* 金認証 */}
              {post.adminVerified && (

                <img
                  src="/verified-gold.png"
                  className="w-5 h-5"
                />

              )}

              <div className="text-zinc-500 truncate">

                @{post.username}

              </div>

            </div>

            {/* 本文 */}
            <div className="mt-2 whitespace-pre-wrap break-words text-[16px]">

              {post.text}

            </div>

          </div>

        </Link>

        {/* 詳細 */}
        <div className="relative flex-shrink-0">

          <button
            onClick={() =>
              setOpen(!open)
            }
            className="text-zinc-500 hover:text-white text-2xl px-2"
          >

            ⋯

          </button>

          {open && (

            <div className="absolute right-0 top-10 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-64 z-50 shadow-2xl">

              {/* 通報 */}
              <button
                onClick={reportPost}
                className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-400"
              >

                このクリートを通報

              </button>

              {/* 削除 */}
              {canDelete && (

                <button
                  onClick={deletePost}
                  className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-500 border-t border-zinc-800"
                >

                  クリートを削除

                </button>

              )}

            </div>

          )}

        </div>

      </div>

      {/* 下 */}
      <div className="flex justify-between mt-5 max-w-md text-zinc-500 ml-[60px]">

        {/* 返信 */}
        <button className="hover:text-sky-400 flex items-center gap-2 transition">

          <span>
            💬
          </span>

          <span>
            {post.replies || 0}
          </span>

        </button>

        {/* リポスト */}
        <button
          onClick={repostPost}
          className="hover:text-green-400 flex items-center gap-2 transition"
        >

          <span>
            🔁
          </span>

          <span>
            {post.reposts || 0}
          </span>

        </button>

        {/* いいね */}
        <button
          onClick={likePost}
          className="hover:text-pink-400 flex items-center gap-2 transition"
        >

          <span>
            ❤️
          </span>

          <span>
            {post.likes || 0}
          </span>

        </button>

        {/* ブックマーク */}
        <button
          onClick={bookmarkPost}
          className="hover:text-yellow-400 flex items-center gap-2 transition"
        >

          <span>
            🔖
          </span>

          <span>
            {post.bookmarks || 0}
          </span>

        </button>

      </div>

    </div>

  );

}