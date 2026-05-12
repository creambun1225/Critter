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

      if (!currentUser)
        return;

      const likedUsers =
        post.likedUsers || [];

      const alreadyLiked =
        likedUsers.includes(
          currentUser.uid
        );

      let newLikedUsers;

      if (alreadyLiked) {

        newLikedUsers =
          likedUsers.filter(
            (id:string)=>
              id !== currentUser.uid
          );

      } else {

        newLikedUsers = [
          ...likedUsers,
          currentUser.uid
        ];

      }

      await updateDoc(
        doc(
          db,
          "posts",
          post.id
        ),
        {
          likedUsers:
            newLikedUsers,

          likes:
            newLikedUsers.length
        }
      );

    };

  // リポスト
  const repostPost =
    async () => {

      if (!currentUser)
        return;

      const repostedUsers =
        post.repostedUsers || [];

      const alreadyReposted =
        repostedUsers.includes(
          currentUser.uid
        );

      let newRepostedUsers;

      if (alreadyReposted) {

        newRepostedUsers =
          repostedUsers.filter(
            (id:string)=>
              id !== currentUser.uid
          );

      } else {

        newRepostedUsers = [
          ...repostedUsers,
          currentUser.uid
        ];

      }

      await updateDoc(
        doc(
          db,
          "posts",
          post.id
        ),
        {
          repostedUsers:
            newRepostedUsers,

          reposts:
            newRepostedUsers.length
        }
      );

    };

  // ブックマーク
  const bookmarkPost =
    async () => {

      if (!currentUser)
        return;

      const bookmarkedUsers =
        post.bookmarkedUsers || [];

      const alreadyBookmarked =
        bookmarkedUsers.includes(
          currentUser.uid
        );

      let newBookmarkedUsers;

      if (alreadyBookmarked) {

        newBookmarkedUsers =
          bookmarkedUsers.filter(
            (id:string)=>
              id !== currentUser.uid
          );

      } else {

        newBookmarkedUsers = [
          ...bookmarkedUsers,
          currentUser.uid
        ];

      }

      await updateDoc(
        doc(
          db,
          "posts",
          post.id
        ),
        {
          bookmarkedUsers:
            newBookmarkedUsers,

          bookmarks:
            newBookmarkedUsers.length
        }
      );

    };

  const canDelete =
    currentUser?.uid ===
      post.uid ||
    currentUser?.admin;

  return (

    <div className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition">

      {/* 上 */}
      <div className="flex justify-between items-start gap-3">

        {/* 左 */}
        <Link
          href={`/user/${post.uid}`}
          className="flex gap-3 flex-1"
        >

          {/* アイコン */}
          <img
            src={
              post.icon ||
              "/default.png"
            }
            className="w-12 h-12 rounded-full object-cover shrink-0 bg-zinc-700"
          />

          {/* 本体 */}
          <div className="flex-1 min-w-0">

            {/* 名前 */}
            <div className="flex items-center gap-2 flex-wrap">

              <div className="font-bold text-white text-[17px]">

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
              {post.admin && (

                <img
                  src="/verified-gold.png"
                  className="w-5 h-5"
                />

              )}

              <div className="text-zinc-500">

                @{post.username}

              </div>

              {/* 時間 */}
              <div className="text-zinc-500 text-sm">

                · {new Date(
                  post.createdAt
                ).toLocaleString("ja-JP")}

              </div>

            </div>

            {/* 本文 */}
            <div className="mt-2 whitespace-pre-wrap break-words text-[16px]">

              {post.text}

            </div>

            {/* 画像 */}
            {post.image && (

              <img
                src={post.image}
                className="mt-4 rounded-2xl max-h-[500px] object-cover border border-zinc-800"
              />

            )}

            {/* ハッシュタグ */}
            {post.hashtags?.length > 0 && (

              <div className="flex flex-wrap gap-2 mt-3">

                {post.hashtags.map(
                  (
                    tag:string,
                    index:number
                  ) => (

                    <div
                      key={index}
                      className="text-blue-400"
                    >

                      {tag}

                    </div>

                  )
                )}

              </div>

            )}

            {/* 下ボタン */}
            <div className="flex justify-between mt-5 max-w-md text-zinc-500">

              {/* リプ */}
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
                onClick={(e)=>{

                  e.preventDefault();

                  repostPost();

                }}
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
                onClick={(e)=>{

                  e.preventDefault();

                  likePost();

                }}
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
                onClick={(e)=>{

                  e.preventDefault();

                  bookmarkPost();

                }}
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

        </Link>

        {/* メニュー */}
        <div className="relative">

          <button
            onClick={()=>
              setOpen(!open)
            }
            className="text-zinc-500 hover:text-white text-2xl px-2"
          >

            ⋯

          </button>

          {open && (

            <div className="absolute right-0 top-10 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-56 z-50 shadow-2xl">

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

    </div>

  );

}