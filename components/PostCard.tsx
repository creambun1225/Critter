"use client";

import { useState } from "react";

import Link from "next/link";

import {
  db,
  auth
} from "@/lib/firebase";

import {
  doc,
  deleteDoc,
  addDoc,
  collection
} from "firebase/firestore";

export default function PostCard({
  post,
  currentUser
}:any) {

  const [open, setOpen] =
    useState(false);

  // 削除できるか
  const canDelete =
    currentUser?.uid === post.uid ||
    currentUser?.isAdmin;

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
          postUid: post.uid,
          text: post.text,
          reportedBy:
            auth.currentUser?.uid,
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
          "削除しますか？"
        );

      if (!ok) return;

      await deleteDoc(
        doc(
          db,
          "posts",
          post.id
        )
      );

      setOpen(false);

    };

  return (

    <div className="border-b border-zinc-800 p-4 relative">

      {/* 上 */}
      <div className="flex justify-between">

        {/* ユーザー */}
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
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />

          <div>

            <div className="flex items-center gap-2 font-bold text-white">

              {post.name}

              {/* 青認証 */}
              {post.verified && (

                <img
                  src="/verified.png"
                  className="w-5 h-5"
                />

              )}

              {/* 金管理者 */}
              {post.adminVerified && (

                <img
                  src="/admin.png"
                  className="w-5 h-5"
                />

              )}

            </div>

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
            className="text-xl text-zinc-400 hover:text-white"
          >
            ⋯
          </button>

          {/* メニュー */}
          {open && (

            <div className="absolute right-0 mt-2 bg-black border border-zinc-700 rounded-xl overflow-hidden z-50 w-56">

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

    </div>

  );

}