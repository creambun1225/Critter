"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  runTransaction
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type Post = {
  id: string;
  uid: string;
  username: string;
  text: string;
  parentId?: string | null;
  likes: number;
  createdAt: number;
};

export default function Home(){

  const [user,setUser]=useState<any>(null);
  const [posts,setPosts]=useState<Post[]>([]);
  const [text,setText]=useState("");

  // ログイン
  useEffect(()=>{
    return onAuthStateChanged(auth,(u)=>{
      if(!u) window.location.href="/login";
      else setUser(u);
    });
  },[]);

  // 投稿取得
  useEffect(()=>{
    const q=query(collection(db,"posts"),orderBy("createdAt","desc"));

    const unsub=onSnapshot(q,(snap)=>{
      const list=snap.docs.map((d:any)=>{
        const data=d.data();
        return {
          id:d.id,
          ...data
        };
      });

      // 親投稿のみ
      setPosts(list.filter(p=>!p.parentId));
    });

    return ()=>unsub();
  },[]);

  // 投稿
  const post=async()=>{
    if(!text || !user) return;

    await addDoc(collection(db,"posts"),{
      text,
      uid:user.uid,
      username:user.email,
      parentId:null,
      createdAt:Date.now(),
      likes:0
    });

    setText("");
  };

  // いいね
  const like=async(p:Post)=>{
    const ref=doc(db,"posts",p.id);

    await runTransaction(db,async(tx)=>{
      const snap=await tx.get(ref);
      const current=snap.data()?.likes || 0;

      tx.update(ref,{
        likes:current+1
      });
    });
  };

  if(!user) return <div>loading...</div>;

  return (
    <main className="flex justify-center bg-[#f5f8fa] h-screen">

      {/* 🔥 左メニュー */}
      <div className="w-[250px] fixed left-0 top-0 h-screen p-6 border-r bg-white flex flex-col justify-between">

        <div>
          <h1 className="text-3xl font-bold text-blue-500 mb-10">Critter</h1>

          <div className="flex flex-col gap-8 text-xl">
            <Link href="/">🏠 ホーム</Link>
            <Link href="/notifications">🔔 通知</Link>
            <Link href="/profile">👤 プロフィール</Link>
            <Link href="/bookmarks">🔖 ブックマーク</Link>
            <Link href="/settings">⚙️ 設定</Link>
          </div>
        </div>

      </div>

      {/* 🔥 真ん中（TL） */}
      <div className="w-[600px] ml-[250px] mr-[250px] overflow-y-scroll h-screen bg-white">

        {/* 投稿欄 */}
        <div className="p-4 border-b">
          <textarea
            className="w-full border p-2"
            placeholder="いまどうしてる？"
            value={text}
            onChange={(e)=>setText(e.target.value)}
          />

          <button
            onClick={post}
            className="bg-blue-500 text-white px-4 py-1 rounded mt-2"
          >
            ポスト
          </button>
        </div>

        {/* 投稿 */}
        {posts.map((p)=>(
          <div key={p.id} className="border-b p-4">

            <p className="font-bold">{p.username}</p>

            {/* 詳細へ */}
            <Link href={`/post/${p.id}`}>
              <p className="cursor-pointer hover:underline">
                {p.text}
              </p>
            </Link>

            <button
              onClick={()=>like(p)}
              className="text-gray-500 mt-2"
            >
              ❤️ {p.likes || 0}
            </button>

          </div>
        ))}

      </div>

      {/* 🔥 右（トレンド） */}
      <div className="w-[250px] fixed right-0 top-0 h-screen p-4">

        <div className="bg-white p-4 rounded-xl">
          <h2 className="font-bold mb-2">🔥 トレンド</h2>
          <p>AI</p>
          <p>ゲーム</p>
          <p>マイクラ</p>
        </div>

      </div>

    </main>
  );
}