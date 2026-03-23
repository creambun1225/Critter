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
  deleteDoc,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [replyText, setReplyText] = useState<any>({});

  // 🔥 ログイン＆ユーザー名取得（修正ポイント）
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        window.location.href = "/login";
        return;
      }

      setUser(u);

      const docRef = await getDoc(doc(db, "users", u.uid));
      const data = docRef.data();

      setUsername(data?.username || "ユーザー");
    });

    return () => unsub();
  }, []);

  // 投稿取得
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // いいね
  useEffect(() => {
    return onSnapshot(collection(db, "likes"), (snap) => {
      setLikes(snap.docs.map(d => d.data()));
    });
  }, []);

  // 返信
  useEffect(() => {
    return onSnapshot(collection(db, "replies"), (snap) => {
      setReplies(snap.docs.map(d => d.data()));
    });
  }, []);

  // 📝 投稿
  const handlePost = async () => {
    if (!text || !user) return;

    await addDoc(collection(db, "posts"), {
      text,
      createdAt: Date.now(),
      uid: user.uid,
      username: username, // 🔥 これ重要
    });

    setText("");
  };

  // ❤️ いいね
  const toggleLike = async (postId: string) => {
    const id = user.uid + "_" + postId;
    const liked = likes.find(l => l.postId === postId && l.uid === user.uid);

    if (liked) {
      await deleteDoc(doc(db, "likes", id));
    } else {
      await setDoc(doc(db, "likes", id), {
        uid: user.uid,
        postId,
      });
    }
  };

  const getLikeCount = (postId: string) =>
    likes.filter(l => l.postId === postId).length;

  // 💬 返信
  const sendReply = async (postId: string) => {
    if (!replyText[postId]) return;

    await addDoc(collection(db, "replies"), {
      text: replyText[postId],
      postId,
      uid: user.uid,
      username: username, // 🔥 これ追加
      createdAt: Date.now(),
    });

    setReplyText({ ...replyText, [postId]: "" });
  };

  if (!user) return null;

  return (
    <main className="flex justify-center bg-gray-100 min-h-screen">

      {/* 左 */}
      <div className="w-[250px] p-4 hidden md:block">
        <h1 className="text-2xl font-bold mb-6">Critter</h1>

        <Link href="/"><p>🏠 ホーム</p></Link>
        <Link href="/profile"><p className="mt-2">👤 プロフィール</p></Link>

        <button onClick={() => signOut(auth)} className="mt-6 text-red-500">
          ログアウト
        </button>
      </div>

      {/* メイン */}
      <div className="w-[600px] bg-white border-x p-4">

        {/* 投稿 */}
        <div className="border-b pb-4 mb-4">
          <textarea
            className="w-full p-2 border"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button onClick={handlePost} className="bg-blue-500 text-white px-4 py-1 mt-2">
            投稿
          </button>
        </div>

        {/* 投稿一覧 */}
        {posts.map((post) => (
          <div key={post.id} className="border-b p-4">

            <p className="font-bold">{post.username}</p>
            <p>{post.text}</p>

            <div className="flex gap-4 mt-2">
              <button onClick={() => toggleLike(post.id)}>
                ❤️ {getLikeCount(post.id)}
              </button>
            </div>

            {/* 返信 */}
            <div className="mt-2">
              <input
                className="border p-1 w-full"
                value={replyText[post.id] || ""}
                onChange={(e) =>
                  setReplyText({ ...replyText, [post.id]: e.target.value })
                }
              />
              <button onClick={() => sendReply(post.id)} className="text-blue-500 text-sm">
                返信
              </button>
            </div>

            <div className="ml-4 mt-2">
              {replies
                .filter(r => r.postId === post.id)
                .map((r, i) => (
                  <p key={i} className="text-sm">
                    {r.username}: {r.text}
                  </p>
                ))}
            </div>

          </div>
        ))}
      </div>
    </main>
  );
}