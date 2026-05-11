"use client";

import { useEffect, useState } from "react";

import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

export default function BookmarksPage() {

  const [currentUser, setCurrentUser] =
    useState<any>(null);

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

  // ブックマーク取得
  useEffect(() => {

    if (!currentUser) return;

    const q =
      query(
        collection(
          db,
          "posts"
        ),
        where(
          "bookmarkedBy",
          "array-contains",
          currentUser.uid
        )
      );

    const unsub =
      onSnapshot(
        q,
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

  }, [currentUser]);

  return (

    <Layout currentUser={currentUser}>

      {/* タイトル */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">

        <div className="text-4xl font-bold">

          ブックマーク

        </div>

      </div>

      {/* 投稿 */}
      <div>

        {posts.length === 0 && (

          <div className="p-8 text-zinc-500 text-center">

            ブックマークはまだありません

          </div>

        )}

        {posts.map((post:any) => (

          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
          />

        ))}

      </div>

    </Layout>

  );

}