"use client";

import { useEffect, useState } from "react";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  db,
  auth
} from "@/lib/firebase";

import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";

export default function Home() {

  const [text, setText] =
    useState("");

  const [posts, setPosts] =
    useState<any[]>([]);

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [userData, setUserData] =
    useState<any>(null);

  // ログイン確認
  useEffect(() => {

    const unsub =
      onAuthStateChanged(
        auth,
        async (user) => {

          if (!user) {

            location.href =
              "/login";

            return;

          }

          setCurrentUser(user);

          // users取得
          const snap =
            await getDoc(
              doc(
                db,
                "users",
                user.uid
              )
            );

          if (snap.exists()) {

            setUserData(
              snap.data()
            );

          }

        }
      );

    return () => unsub();

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

    const unsub =
      onSnapshot(q, (snap) => {

        setPosts(
          snap.docs.map(
            (doc:any) => ({
              id: doc.id,
              ...doc.data()
            })
          )
        );

      });

    return () => unsub();

  }, []);

  // 投稿
  const createPost =
    async () => {

      if (!text.trim()) return;

      await addDoc(
        collection(db, "posts"),
        {
          text,

          uid:
            currentUser.uid,

          name:
            userData?.name ||
            currentUser.displayName ||
            "ユーザー",

          username:
            userData?.username ||
            currentUser.email?.split(
              "@"
            )[0] ||
            "user",

          icon:
            userData?.icon ||
            currentUser.photoURL ||
            "",

          verified:
            userData?.verified ||
            false,

          adminVerified:
            userData?.admin ||
            false,

          replies:
            0,

          reposts:
            0,

          likes:
            0,

          bookmarks:
            0,

          createdAt:
            Date.now()
        }
      );

      setText("");

    };

  return (

    <Layout currentUser={currentUser}>

      {/* タイトル */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">

        <div className="text-4xl font-bold">

          ホーム

        </div>

      </div>

      {/* 投稿フォーム */}
      <div className="border-b border-zinc-800 p-4 flex gap-4">

        {/* アイコン */}
        <img
          src={
            userData?.icon ||
            currentUser?.photoURL ||
            "/default.png"
          }
          className="w-14 h-14 rounded-full object-cover bg-zinc-700 flex-shrink-0"
        />

        <div className="flex-1">

          {/* 入力 */}
          <textarea
            value={text}
            onChange={(e)=>
              setText(
                e.target.value
              )
            }
            placeholder="いまどうしてる？"
            className="w-full bg-black outline-none resize-none text-xl min-h-[120px]"
          />

          {/* ボタン */}
          <div className="flex justify-end mt-4">

            <button
              onClick={createPost}
              className="bg-blue-500 hover:bg-blue-600 transition px-8 py-3 rounded-full text-lg font-bold"
            >

              クリート

            </button>

          </div>

        </div>

      </div>

      {/* 投稿一覧 */}
      <div>

        {posts.map((post:any)=>(

          <PostCard
            key={post.id}
            post={post}
            currentUser={{
              ...currentUser,
              ...userData
            }}
          />

        ))}

      </div>

    </Layout>

  );

}