"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditProfile(){

  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  const [username,setUsername]=useState("");
  const [bio,setBio]=useState("");

  const [iconFile,setIconFile]=useState<File | null>(null);
  const [headerFile,setHeaderFile]=useState<File | null>(null);

  const [iconUrl,setIconUrl]=useState("");
  const [headerUrl,setHeaderUrl]=useState("");

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
          setIconUrl(data.icon || "");
          setHeaderUrl(data.header || "");
        });

        setLoading(false);
      }
    });
  },[]);

  // 🔥 トレンド（仮）
  useEffect(()=>{
    setTrends(["AI","ゲーム","マイクラ","YouTube","学校"]);
  },[]);

  // 🔥 画像アップロード関数
  const uploadImage = async (file:File,path:string)=>{
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // 💾 保存
  const save = async ()=>{
    if(!user) return;

    let newIcon = iconUrl;
    let newHeader = headerUrl;

    try{

      // アイコン更新
      if(iconFile){
        newIcon = await uploadImage(iconFile, "icons/"+user.uid);
      }

      // ヘッダー更新
      if(headerFile){
        newHeader = await uploadImage(headerFile, "headers/"+user.uid);
      }

      await setDoc(doc(db,"users",user.uid),{
        username,
        bio,
        icon:newIcon,
        header:newHeader
      },{merge:true});

      alert("保存成功！");
      window.location.href="/profile";

    }catch(e){
      console.log(e);
      alert("保存失敗（Storage設定ミスの可能性）");
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

      {/* 🔥 真ん中（編集） */}
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

        <p>アイコン画像</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e)=>setIconFile(e.target.files?.[0] || null)}
          className="mb-3"
        />

        <p>ヘッダー画像</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e)=>setHeaderFile(e.target.files?.[0] || null)}
          className="mb-3"
        />

        <button
          onClick={save}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          保存
        </button>

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