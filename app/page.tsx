"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // ログインチェック
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        window.location.href = "/login";
      } else {
        setUser(u);
      }
    });
    return () => unsub();
  }, []);

  // 投稿取得
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(data);
    });

    return () => unsub();
  }, []);

  // 投稿
  const handlePost = async () => {
    if (!text || !user) return;

    await addDoc(collection(db, "posts"), {
      text,
      createdAt: Date.now(),
      uid: user.uid,
    });

    setText("");
  };

  // ❤️ いいね
  const likePost = async (postId: string) => {
    await setDoc(doc(db, "likes", user.uid + "_" + postId), {
      uid: user.uid,
      postId,
    });
  };

  const unlikePost = async (postId: string) => {
    await deleteDoc(doc(db, "likes", user.uid + "_" + postId));
  };

  // 👤 フォロー
  const followUser = async (targetUid: string) => {
    await setDoc(doc(db, "follows", user.uid + "_" + targetUid), {
      follower: user.uid,
      following: targetUid,
    });
  };

  const unfollowUser = async (targetUid: string) => {
    await deleteDoc(doc(db, "follows", user.uid + "_" + targetUid));
  };

  if (!user) return null;

  return (
    <main className="flex justify-center bg-gray-100 min-h-screen">

      {/* 左メニュー */}
      <div className="w-[250px] p-4 hidden md:block">
        <h1 className="text-2xl font-bold mb-6">Critter</h1>
        <p>🏠 ホーム</p>
        <Link href="/profile">
          <p className="mt-2 cursor-pointer">👤 プロフィール</p>
        </Link>

        <button
          onClick={() => signOut(auth)}
          className="mt-6 text-red-500"
        >
          ログアウト
        </button>
      </div>

      {/* メイン */}
      <div className="w-[600px] bg-white border-x p-4">

        {/* 投稿欄 */}
        <div className="border-b pb-4 mb-4">
          <textarea
            className="w-full p-2 border rounded"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="いまどうしてる？"
          />
          <button
            onClick={handlePost}
            className="mt-2 bg-blue-500 text-white px-4 py-1 rounded"
          >
            投稿
          </button>
        </div>

        {/* 投稿一覧 */}
        {posts.map((post) => (
          <div key={post.id} className="border-b p-4 flex gap-3">

            {/* アイコン */}
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>

            {/* 内容 */}
            <div className="flex-1">
              <p className="font-bold">{post.uid}</p>
              <p>{post.text}</p>

              {/* アクション */}
              <div className="flex gap-4 mt-2 text-sm">

                <button onClick={() => likePost(post.id)}>
                  ❤️ いいね
                </button>

                {post.uid !== user.uid && (
                  <button onClick={() => followUser(post.uid)}>
                    フォロー
                  </button>
                )}

              </div>
            </div>

          </div>
        ))}
      </div>
    </main>
  );
}