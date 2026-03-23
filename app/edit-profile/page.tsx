"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function EditProfile(){

  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  const [username,setUsername]=useState("");
  const [bio,setBio]=useState("");

  const [icon,setIcon]=useState("");
  const [header,setHeader]=useState("");

  const [trends,setTrends]=useState<string[]>([]);

  // 🔐 ログインチェック
  useEffect(()=>{
    return onAuthStateChanged(auth,(u)=>{
      if(!u){
        window.location.href="/login";
      }else{
        setUser(u);

        getDoc(doc(db,"users",u.uid)).then(d=>{
          const data:any=d.data();
          if(!data) return;

          setUsername(data.username || "");
          setBio(data.bio || "");
          setIcon(data.icon || "");
          setHeader(data.header || "");
        });

        setLoading(false);
      }
    });
  },[]);

  // トレンド（仮）
  useEffect(()=>{
    setTrends(["AI","ゲーム","マイクラ","YouTube","学校"]);
  },[]);

  // 💾 保存
  const save = async ()=>{
    if(!user) return;

    try{
      await setDoc(doc(db,"users",user.uid),{
        username,
        bio,
        icon,
        header
      },{merge:true});

      alert("保存成功！");
      window.location.href="/profile";

    }catch(e){
      console.error(e);
      alert("保存失敗");
    }
  };

  if(loading) return <div>読み込み中...</div>;

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

      {/* 真ん中 */}
      <div className="w-[600px] bg-white border-x p-6">

        <h1 className="text-xl font-bold mb-4">プロフィール編集</h1>

        <p>ユーザー名</p>
        <input
          className="border w-full p-2 mb-3"
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
        />

        <p>自己紹介</p>
        <textarea
          className="border w-full p-2 mb-3"
          value={bio}
          onChange={(e)=>setBio(e.target.value)}
        />

        <p>アイコンURL</p>
        <input
          className="border w-full p-2 mb-3"
          value={icon}
          onChange={(e)=>setIcon(e.target.value)}
        />

        <p>ヘッダーURL</p>
        <input
          className="border w-full p-2 mb-3"
          value={header}
          onChange={(e)=>setHeader(e.target.value)}
        />

        <button
          onClick={save}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          保存
        </button>

      </div>

      {/* 右 */}
      <div className="w-[250px] p-4">
        <div className="bg-white p-4 rounded-xl">
          <h2 className="font-bold mb-2">🔥 トレンド</h2>
          {trends.map((t,i)=><p key={i}>{t}</p>)}
        </div>
      </div>

    </main>
  );
}