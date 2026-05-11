"use client";

import { useState } from "react";

import Link from "next/link";

import {
  formatDistanceToNow
} from "date-fns";

import {
  ja
} from "date-fns/locale";

import {
  db
} from "@/lib/firebase";

import {
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

export default function PostCard({
  post,
  currentUser
}: any) {

  const [open, setOpen] =
    useState(false);

  // フォロー
  const follow =
    async () => {

      await updateDoc(
        doc(
          db,
          "users",
          post.uid
        ),
        {
          followers:
            arrayUnion(
              currentUser.uid
            )
        }
      );

    };

  // フォロー解除
  const unfollow =
    async () => {

      await updateDoc(
        doc(
          db,
          "users",
          post.uid
        ),
        {
          followers:
            arrayRemove(
              currentUser.uid
            )
        }
      );

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

  const isFollowing =

    post.followers?.includes(
      currentUser?.uid
    );

  const canDelete =

    currentUser?.uid ===
      post.uid ||

    currentUser?.admin;

  return (

    <div className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition">

      {/* 上 */}
      <div className="flex justify-between gap-3">

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
            className="w-12 h-12 rounded-full object-cover bg-zinc-700 flex-shrink-0"
          />

          <div className="min-w-0 flex-1">

            {/* 名前 */}
            <div className="flex items-center gap-2 flex-wrap">

              <div className="font-bold truncate">

                {post.name}

              </div>

              {/* 青 */}
              {post.verified && (

                <img
                  src="/verified-blue.png"
                  className="w-5 h-5"
                />

              )}

              {/* 金 */}
              {post.adminVerified && (

                <img
                  src="/verified-gold.png"
                  className="w-5 h-5"
                />

              )}

              <div className="text-zinc-500 truncate">

                @{post.username}

              </div>

              {/* 時間 */}
              <div className="text-zinc-500 text-sm">

                · {

                  formatDistanceToNow(
                    new Date(
                      post.createdAt
                    ),
                    {
                      addSuffix: true,
                      locale: ja
                    }
                  )

                }

              </div>

            </div>

            {/* 本文 */}
            <div className="mt-2 whitespace-pre-wrap break-words">

              {post.text}

            </div>

            {/* 画像 */}
            {post.image && (

              <img
                src={post.image}
                className="mt-4 rounded-2xl w-full max-h-[500px] object-cover border border-zinc-800"
              />

            )}

            {/* ハッシュタグ */}
            <div className="flex gap-2 flex-wrap mt-3">

              {(post.hashtags || [])
                .map((tag:string)=>(

                <div
                  key={tag}
                  className="text-sky-400"
                >

                  {tag}

                </div>

              ))}

            </div>

            {/* ボタン */}
            <div className="flex justify-between mt-5 max-w-md text-zinc-500">

              <button>
                💬 {post.replies || 0}
              </button>

              <button>
                🔁 {post.reposts || 0}
              </button>

              <button>
                ❤️ {post.likes || 0}
              </button>

              <button>
                🔖 {post.bookmarks || 0}
              </button>

            </div>

          </div>

        </Link>

        {/* 右 */}
        <div className="flex flex-col items-end gap-2">

          {/* 詳細 */}
          <div className="relative">

            <button
              onClick={()=>
                setOpen(!open)
              }
              className="text-2xl text-zinc-500 hover:text-white"
            >
              ⋯
            </button>

            {open && (

              <div className="absolute right-0 top-10 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-56 z-50">

                {/* フォロー */}
                {currentUser?.uid !==
                  post.uid && (

                  <button
                    onClick={
                      isFollowing
                        ? unfollow
                        : follow
                    }
                    className="w-full text-left px-4 py-3 hover:bg-zinc-900"
                  >

                    {isFollowing
                      ? "フォロー解除"
                      : "フォロー"}

                  </button>

                )}

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

      </div>

    </div>

  );

}