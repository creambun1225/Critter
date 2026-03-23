"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function EditProfile(){

  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  const [username,setUsername]=useState("");
  const [bio,setBio]=useState("");
  const [icon,setIcon]=useState("");
  const [header,setHeader]=useState("");

  // 🔥 正しいログインチェック
  useEffect(()=>{
    return onAuthStateChanged(auth,(u)=>{
      if(!u){
        window.location.href="/login";
      }else{
        setUser(u);

        // データ取得
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

  const save = async ()=>{
    if(!user) return;

    await setDoc(doc(db,"users",user.uid),{
      username,
      bio,
      icon,
      header
    });

    alert("保存完了");
    window.location.href="/profile";
  };

  if(loading) return <div>読み込み中...</div>;

  return (
    <div className="bg-white min-h-screen p-6">

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
  );
}