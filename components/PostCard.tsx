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
  updateDoc
} from "firebase/firestore";

export default function PostCard({
  post,
  currentUser
}: any) {

  const [open, setOpen] =
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
          postId: post.id,
          text: post.text,
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

      await updateDoc(
        doc(
          db,
          "posts",
          post.id
        ),
        {
          likes:
            (post.likes || 0) + 1
        }
      );

    };

  // リポスト
  const repostPost =
    async () => {

      await updateDoc(
        doc(
          db,
          "posts",
          post.id
        ),
        {
          reposts:
            (post.reposts || 0) + 1
        }
      );

    };

  // ブックマーク
  const bookmarkPost =
    async () => {

      await updateDoc(
        doc(
          db,
          "posts",
          post.id
        ),
        {
          bookmarks:
            (post.bookmarks || 0) + 1
        }
      );

    };

  const canDelete =
    currentUser?.uid ===
      post.uid ||
    currentUser?.isAdmin;

  return (

    <div className="border-b border-zinc-800 p-4">

      {/* 上 */}
      <div className="flex justify-between items-start">

        <Link
          href={`/user/${post.uid}`}
          className="flex gap-3"
        >

          {/* アイコン */}
          <img
            src={
              post.icon ||
              "/default.png"
            }
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />

          <div>

            {/* 名前 */}
            <div className="flex items-center gap-2 flex-wrap">

              <div className="font-bold text-white text-xl">

                {post.name}

              </div>

              {/* 青認証 */}
              {post.verified && (

                <img
                  src="/verified.png"
                  className="w-5 h-5"
                />

              )}

              {/* 金認証 */}
              {post.adminVerified && (

                <img
                  src="/admin.png"
                  className="w-5 h-5"
                />

              )}

            </div>

            {/* username */}
            <div className="text-zinc-500">

              @{post.username}

            </div>

          </div>

        </Link>

        {/* 詳細 */}
        <div className="relative">

          <button
            onClick={()=>
              setOpen(!open)
            }
            className="text-zinc-400 text-2xl hover:text-white"
          >
            ⋯
          </button>

          {open && (

            <div className="absolute right-0 top-10 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-56 z-50 shadow-xl">

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

      {/* 本文 */}
      <div className="mt-4 whitespace-pre-wrap text-white text-[17px]">

        {post.text}

      </div>

      {/* 下ボタン */}
      <div className="flex justify-between mt-5 text-zinc-500 max-w-md">

        {/* 返信 */}
        <button className="hover:text-sky-400 flex items-center gap-2">

          💬

          <span>
            {post.replies || 0}
          </span>

        </button>

        {/* リポスト */}
        <button
          onClick={repostPost}
          className="hover:text-green-400 flex items-center gap-2"
        >

          🔁

          <span>
            {post.reposts || 0}
          </span>

        </button>

        {/* いいね */}
        <button
          onClick={likePost}
          className="hover:text-pink-400 flex items-center gap-2"
        >

          ❤️

          <span>
            {post.likes || 0}
          </span>

        </button>

        {/* ブックマーク */}
        <button
          onClick={bookmarkPost}
          className="hover:text-yellow-400 flex items-center gap-2"
        >

          🔖

          <span>
            {post.bookmarks || 0}
          </span>

        </button>

      </div>

    </div>

  );

}