"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

export default function BookmarksPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  // ログイン確認 + currentUser のフル情報取得
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        location.href = "/login";
        return;
      }
      // PostCard に渡す name/icon 等が必要なので Firestore から取得
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setCurrentUser({ uid: user.uid, ...snap.data() });
      } else {
        setCurrentUser({ uid: user.uid });
      }
    });
  }, []);

  // ブックマーク取得（bookmarkedUsers で管理）
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "posts"),
      where("bookmarkedUsers", "array-contains", currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const sorted = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => b.createdAt - a.createdAt);
      setPosts(sorted);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  return (
    <Layout currentUser={currentUser}>

      {/* タイトル */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">
        <div className="text-4xl font-bold">ブックマーク</div>
      </div>

      {/* 投稿 */}
      <div>
        {posts.length === 0 && (
          <div className="p-8 text-zinc-500 text-center">
            ブックマークはまだありません
          </div>
        )}
        {posts.map((post: any) => (
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