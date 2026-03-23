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
  getDoc,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>({});
  const [likes, setLikes] = useState<any>({});
  const [bookmarks, setBookmarks] = useState<any>({});
  const [trends, setTrends] = useState<string[]>([]);

  // ログイン
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) window.location.href = "/login";
      else {
        setUser(u);
        const d = await getDoc(doc(db, "users", u.uid));
        setUserData(d.data());
      }
    });
  }, []);

  // 投稿取得
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // 👍いいね
  const toggleLike = async (postId: string) => {
    const ref = doc(db, "likes", user.uid + "_" + postId);
    if (likes[postId]) await deleteDoc(ref);
    else await setDoc(ref, { uid: user.uid, postId });
  };

  // 🔖ブックマーク
  const toggleBookmark = async (postId: string) => {
    const ref = doc(db, "bookmarks", user.uid + "_" + postId);
    if (bookmarks[postId]) await deleteDoc(ref);
    else await setDoc(ref, { uid: user.uid, postId });
  };

  // 状態取得
  useEffect(() => {
    if (!user) return;

    const unsub1 = onSnapshot(collection(db, "likes"), (snap) => {
      const data:any = {};
      snap.docs.forEach(d=>{
        const v = d.data();
        if(v.uid===user.uid) data[v.postId]=true;
      });
      setLikes(data);
    });

    const unsub2 = onSnapshot(collection(db, "bookmarks"), (snap) => {
      const data:any = {};
      snap.docs.forEach(d=>{
        const v = d.data();
        if(v.uid===user.uid) data[v.postId]=true;
      });
      setBookmarks(data);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  // 🔥トレンド（単語＋#）
  useEffect(() => {
    const words:any = {};

    posts.forEach(p=>{
      if(!p.text) return;

      p.text.split(/[\s　]+/).forEach((w:string)=>{
        if(w.length<2) return;
        words[w]=(words[w]||0)+1;
      });
    });

    const sorted = Object.entries(words)
      .sort((a:any,b:any)=>b[1]-a[1])
      .slice(0,5)
      .map((w:any)=>w[0]);

    setTrends(sorted);
  },[posts]);

  if (!user) return null;

  return (
    <main className="flex justify-center bg-[#f5f8fa] min-h-screen">

      {/* 左メニュー */}
      <div className="w-[250px] p-6 space-y-6 border-r">

        <h1 className="text-3xl font-bold text-blue-500">Critter</h1>

        <div className="space-y-5 text-xl font-medium">
          <Link href="/" className="block hover:text-blue-500">🏠 ホーム</Link>
          <Link href="/notifications" className="block hover:text-blue-500">🔔 通知</Link>
          <Link href="/profile" className="block hover:text-blue-500">👤 プロフィール</Link>
          <Link href="/bookmarks" className="block hover:text-blue-500">🔖 ブックマーク</Link>
        </div>

        <button
          onClick={async ()=>{
            const t = prompt("投稿内容");
            if(!t) return;

            await addDoc(collection(db,"posts"),{
              text:t,
              createdAt:Date.now(),
              uid:user.uid,
              username:userData?.username || "unknown"
            });
          }}
          className="bg-blue-500 text-white w-full py-3 rounded-full font-bold"
        >
          ＋ クリート
        </button>

      </div>

      {/* 投稿 */}
      <div className="w-[600px] bg-white border-x">

        {posts.map(p => (
          <div key={p.id} className="p-4 border-b hover:bg-gray-50">

            {/* 名前 */}
            <Link href={`/user/${p.uid}`}>
              <p className="font-bold text-sm hover:underline cursor-pointer">
                {p.username}
              </p>
            </Link>

            {/* 本文 */}
            <Link href={`/post/${p.id}`}>
              <p className="mt-1 text-[15px] cursor-pointer">{p.text}</p>
            </Link>

            {/* アクション */}
            <div className="flex justify-between mt-3 text-sm text-gray-500">

              <button onClick={()=>toggleLike(p.id)}>
                {likes[p.id] ? "❤️" : "🤍"} 1
              </button>

              <Link href={`/post/${p.id}`}>💬 0</Link>

              <span>🔁 0</span>

              <button onClick={()=>toggleBookmark(p.id)}>
                🔖
              </button>

              <span>👁 1</span>

            </div>

          </div>
        ))}

      </div>

      {/* トレンド */}
      <div className="w-[250px] p-4">
        <div className="bg-white p-4 rounded-xl">
          <h2 className="font-bold mb-2">🔥 トレンド</h2>

          {trends.map((t,i)=>(
            <p key={i} className="py-1">{t}</p>
          ))}
        </div>
      </div>

    </main>
  );
}