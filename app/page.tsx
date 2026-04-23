"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  runTransaction,
  deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const VERSION = "v1.1.0";

export default function Home(){

  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [text,setText]=useState("");
  const [posts,setPosts]=useState<any[]>([]);
  const [menuOpen,setMenuOpen]=useState<string | null>(null);

  // ログイン
  useEffect(()=>{
    return onAuthStateChanged(auth,(u)=>{
      if(!u) window.location.href="/login";
      else setUser(u);
    });
  },[]);

  // ユーザー
  useEffect(()=>{
    if(!user) return;
    getDoc(doc(db,"users",user.uid)).then(d=>{
      setUserData(d.data());
    });
  },[user]);

  // 投稿取得
  useEffect(()=>{
    const q=query(collection(db,"posts"),orderBy("createdAt","desc"));
    const unsub=onSnapshot(q,(snap)=>{
      setPosts(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return ()=>unsub();
  },[]);

  // 投稿
  const post=async()=>{
    if(!text) return;

    await addDoc(collection(db,"posts"),{
      text,
      uid:user.uid,
      username:userData?.username || "unknown",
      createdAt:Date.now(),
      likes:0,
      reposts:0,
      replies:0,
      views:0
    });

    setText("");
  };

  // 🔥 いいね（確実に増える）
  const like=async(p:any)=>{
    const ref = doc(db,"posts",p.id);
    await runTransaction(db, async (tx)=>{
      const snap = await tx.get(ref);
      const newLikes = (snap.data()?.likes || 0) + 1;
      tx.update(ref,{likes:newLikes});
    });
  };

  // 🔁 リポスト
  const repost=async(p:any)=>{
    const ref = doc(db,"posts",p.id);
    await runTransaction(db, async (tx)=>{
      const snap = await tx.get(ref);
      const newVal = (snap.data()?.reposts || 0) + 1;
      tx.update(ref,{reposts:newVal});
    });
  };

  // 🗑 削除
  const remove=async(id:string)=>{
    await deleteDoc(doc(db,"posts",id));
  };

  if(!user) return <div>loading...</div>;

  return (
    <main className="flex bg-[#f5f8fa] h-screen">

      {/* 左（完全固定） */}
      <div className="w-[250px] fixed left-0 top-0 h-screen flex flex-col justify-between p-6 border-r bg-white">

        <div>
          <h1 className="text-3xl font-bold text-blue-500 mb-8">Critter</h1>

          <div className="flex flex-col gap-7 text-xl">
            <Link href="/">🏠 ホーム</Link>
            <Link href="/notifications">🔔 通知</Link>
            <Link href="/profile">👤 プロフィール</Link>
            <Link href="/bookmarks">🔖 ブックマーク</Link>
            <Link href="/settings">⚙️ 設定</Link>
          </div>
        </div>

        <div>
          {/* ＋クリート（固定） */}
          <button
            onClick={()=>window.scrollTo({top:0})}
            className="bg-blue-500 text-white w-full py-3 rounded-full"
          >
            ＋クリート
          </button>

          <p className="text-gray-400 text-sm mt-4 text-center">
            {VERSION}
          </p>
        </div>

      </div>

      {/* 真ん中（スクロール） */}
      <div className="ml-[250px] mr-[250px] w-[600px] overflow-y-scroll h-screen bg-white">

        {/* 投稿欄 */}
        <div className="p-4 border-b">
          <textarea
            className="w-full border p-2"
            value={text}
            onChange={(e)=>setText(e.target.value)}
          />
          <button onClick={post} className="bg-blue-500 text-white px-4 py-1 mt-2 rounded">
            ポスト
          </button>
        </div>

        {/* 投稿 */}
        {posts.map((p)=>(
          <div key={p.id} className="border-b p-4 relative">

            {/* ・・・メニュー */}
            {p.uid===user.uid && (
              <div className="absolute right-2 top-2">
                <button onClick={()=>setMenuOpen(menuOpen===p.id?null:p.id)}>
                  ⋮
                </button>

                {menuOpen===p.id && (
                  <div className="bg-white border shadow p-2 absolute right-0">
                    <button
                      onClick={()=>remove(p.id)}
                      className="text-red-500"
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            )}

            <p className="font-bold">{p.username}</p>
            <p>{p.text}</p>

            <div className="flex gap-6 mt-2 text-gray-500">
              <span>💬 {p.replies}</span>
              <button onClick={()=>repost(p)}>🔁 {p.reposts}</button>
              <button onClick={()=>like(p)}>❤️ {p.likes}</button>
              <span>👀 {p.views}</span>
            </div>

          </div>
        ))}

      </div>

      {/* 右（固定） */}
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