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
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

// 🔥 これ追加
const VERSION = "v1.0.0";

export default function Home(){

  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [text,setText]=useState("");
  const [posts,setPosts]=useState<any[]>([]);

  useEffect(()=>{
    return onAuthStateChanged(auth,(u)=>{
      if(!u) window.location.href="/login";
      else setUser(u);
    });
  },[]);

  useEffect(()=>{
    if(!user) return;
    getDoc(doc(db,"users",user.uid)).then(d=>{
      setUserData(d.data());
    });
  },[user]);

  useEffect(()=>{
    const q=query(collection(db,"posts"),orderBy("createdAt","desc"));

    const unsub=onSnapshot(q,(snap)=>{
      setPosts(snap.docs.map(d=>({
        id:d.id,
        ...d.data()
      })));
    });

    return ()=>unsub();
  },[]);

  const post=async()=>{
    if(!text) return;

    await addDoc(collection(db,"posts"),{
      text,
      uid:user.uid,
      username:userData?.username || "unknown",
      createdAt:Date.now(),
      likes:0,
      replies:0,
      reposts:0,
      views:0
    });

    setText("");
  };

  const like=async(p:any)=>{
    await updateDoc(doc(db,"posts",p.id),{
      likes:(p.likes||0)+1
    });
  };

  const repost=async(p:any)=>{
    await updateDoc(doc(db,"posts",p.id),{
      reposts:(p.reposts||0)+1
    });
  };

  const remove=async(id:string)=>{
    if(confirm("削除する？")){
      await deleteDoc(doc(db,"posts",id));
    }
  };

  if(!user) return <div>loading...</div>;

  return (
    <main className="flex justify-center bg-[#f5f8fa] h-screen">

      {/* 左 */}
      <div className="w-[250px] p-6 border-r flex flex-col justify-between fixed left-0 top-0 h-screen bg-white">

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

        {/* ＋クリート */}
        <div>
          <button
            onClick={()=>window.scrollTo({top:0})}
            className="bg-blue-500 text-white rounded-full py-3 w-full"
          >
            ＋クリート
          </button>

          {/* 🔥 バージョン表示 */}
          <p className="text-gray-400 text-sm mt-4 text-center">
            {VERSION}
          </p>
        </div>

      </div>

      {/* 真ん中 */}
      <div className="w-[600px] ml-[250px] mr-[250px] overflow-y-scroll h-screen bg-white">

        <div className="p-4 border-b">
          <textarea
            className="w-full border p-2"
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

        {posts.map((p)=>(
          <div key={p.id} className="border-b p-4 relative">

            {p.uid===user.uid && (
              <button
                onClick={()=>remove(p.id)}
                className="absolute right-2 top-2 text-gray-400"
              >
                ⋮
              </button>
            )}

            <Link href={`/user/${p.uid}`}>
              <p className="font-bold">{p.username}</p>
            </Link>

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

      {/* 右 */}
      <div className="w-[250px] p-4 fixed right-0 top-0 h-screen">
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