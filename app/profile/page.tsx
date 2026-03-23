"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Profile(){

  const [user,setUser]=useState<any>(null);
  const [data,setData]=useState<any>(null);
  const [posts,setPosts]=useState<any[]>([]);
  const [trends,setTrends]=useState<string[]>([]);

  // ログインチェック
  useEffect(()=>{
    return onAuthStateChanged(auth,(u)=>{
      if(!u) window.location.href="/login";
      else setUser(u);
    });
  },[]);

  // データ取得
  useEffect(()=>{
    if(!user) return;

    getDoc(doc(db,"users",user.uid))
      .then(d=>setData(d.data()));

    const q=query(collection(db,"posts"),where("uid","==",user.uid));
    const unsub=onSnapshot(q,s=>{
      const list=s.docs.map(d=>d.data());
      setPosts(list);

      // トレンド
      const words:any={};
      list.forEach((p:any)=>{
        if(!p.text) return;
        p.text.split(/[\s　]+/).forEach((w:string)=>{
          if(w.length<2) return;
          words[w]=(words[w]||0)+1;
        });
      });

      const sorted=Object.entries(words)
        .sort((a:any,b:any)=>b[1]-a[1])
        .slice(0,5)
        .map((w:any)=>w[0]);

      setTrends(sorted);
    });

    return ()=>unsub();

  },[user]);

  if(!user || !data) return <div>読み込み中...</div>;

  return (
    <main className="flex justify-center bg-[#f5f8fa] min-h-screen">

      {/* 左メニュー */}
      <div className="w-[250px] p-6 border-r flex flex-col justify-between">

        <div>
          <h1 className="text-3xl font-bold text-blue-500 mb-8">Critter</h1>

          <div className="flex flex-col gap-7 text-xl font-medium">
            <Link href="/">🏠 ホーム</Link>
            <Link href="/notifications">🔔 通知</Link>
            <Link href="/profile">👤 プロフィール</Link>
            <Link href="/bookmarks">🔖 ブックマーク</Link>
            <Link href="/settings">⚙️ 設定</Link>
          </div>

          <button
            onClick={()=>signOut(auth)}
            className="mt-10 text-red-500"
          >
            ログアウト
          </button>
        </div>

      </div>

      {/* 真ん中（プロフィール） */}
      <div className="w-[600px] bg-white border-x">

        {/* ヘッダー */}
        <div
          className="h-40 bg-gray-300"
          style={{
            backgroundImage:`url(${data.header})`,
            backgroundSize:"cover"
          }}
        />

        {/* アイコン */}
        <img
          src={data.icon || "https://via.placeholder.com/100"}
          className="w-24 h-24 rounded-full -mt-12 ml-4 border-4 border-white"
        />

        {/* 名前＋編集 */}
        <div className="flex justify-between items-center p-4">
          <div>
            <h1 className="text-xl font-bold">{data.username}</h1>
            <p className="text-gray-500">@{data.username}</p>
          </div>

          <button
            onClick={()=>window.location.href="/edit-profile"}
            className="border px-4 py-1 rounded-full hover:bg-gray-100"
          >
            プロフィールを編集
          </button>
        </div>

        {/* 自己紹介 */}
        <div className="px-4 pb-4 text-gray-700">
          {data.bio}
        </div>

        {/* 投稿 */}
        <div className="border-t">
          {posts.map((p,i)=>(
            <div key={i} className="border-b p-4">
              {p.text}
            </div>
          ))}
        </div>

      </div>

      {/* 右トレンド */}
      <div className="w-[250px] p-4">
        <div className="bg-white p-4 rounded-xl">
          <h2 className="font-bold mb-2">🔥 トレンド</h2>
          {trends.map((t,i)=><p key={i}>{t}</p>)}
        </div>
      </div>

    </main>
  );
}