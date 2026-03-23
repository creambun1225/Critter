"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

export default function EditProfile(){

  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  const [username,setUsername]=useState("");
  const [bio,setBio]=useState("");

  const [iconFile,setIconFile]=useState<any>(null);
  const [headerFile,setHeaderFile]=useState<any>(null);

  const storage = getStorage();

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
        });

        setLoading(false);
      }
    });
  },[]);

  const uploadImage = async (file:any,path:string)=>{
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const save = async ()=>{
    if(!user) return;

    let iconUrl = "";
    let headerUrl = "";

    if(iconFile){
      iconUrl = await uploadImage(iconFile, "icons/"+user.uid);
    }

    if(headerFile){
      headerUrl = await uploadImage(headerFile, "headers/"+user.uid);
    }

    await setDoc(doc(db,"users",user.uid),{
      username,
      bio,
      icon: iconUrl,
      header: headerUrl
    },{ merge:true });

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

      <p>アイコン画像</p>
      <input
        type="file"
        onChange={(e)=>setIconFile(e.target.files?.[0])}
        className="mb-3"
      />

      <p>ヘッダー画像</p>
      <input
        type="file"
        onChange={(e)=>setHeaderFile(e.target.files?.[0])}
        className="mb-3"
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