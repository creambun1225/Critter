"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Layout from "@/components/Layout";

export default function EditProfilePage() {

  const [currentUser,setCurrentUser]=useState<any>(null);
  const [name,setName]=useState("");
  const [username,setUsername]=useState("");
  const [bio,setBio]=useState("");
  const [icon,setIcon]=useState("");
  const [image,setImage]=useState<any>(null);

  useEffect(()=>{

    const unsub=
    onAuthStateChanged(
      auth,
      async(user)=>{

        if(!user){
          location.href="/login";
          return;
        }

        setCurrentUser(user);

        const snap=
        await getDoc(
          doc(db,"users",user.uid)
        );

        if(snap.exists()){

          const data=snap.data();

          setName(data.name||"");
          setUsername(data.username||"");
          setBio(data.bio||"");
          setIcon(data.icon||"");

        }

      }
    );

    return()=>unsub();

  },[]);

  const saveProfile=async()=>{

    if(!currentUser)return;

    let iconUrl=icon;

    if(image){

      const imageRef=
      ref(
        storage,
        `icons/${Date.now()}_${image.name}`
      );

      await uploadBytes(
        imageRef,
        image
      );

      iconUrl=
      await getDownloadURL(
        imageRef
      );

    }

    await updateDoc(
      doc(db,"users",currentUser.uid),
      {
        name,
        username,
        bio,
        icon:iconUrl
      }
    );

    alert("保存しました");
    location.href=`/user/${currentUser.uid}`;

  };

  return(

    <Layout currentUser={currentUser}>

      <div className="p-6 text-white">

        <h1 className="text-3xl font-bold mb-6">
          プロフィール編集
        </h1>

        <div className="space-y-6">

          <div>
            <div className="mb-2">名前</div>
            <input
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="w-full bg-zinc-900 rounded-xl p-3 border border-zinc-700"
            />
          </div>

          <div>
            <div className="mb-2">ユーザー名</div>
            <input
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            className="w-full bg-zinc-900 rounded-xl p-3 border border-zinc-700"
            />
          </div>

          <div>
            <div className="mb-2">自己紹介</div>
            <textarea
            value={bio}
            onChange={(e)=>setBio(e.target.value)}
            className="w-full bg-zinc-900 rounded-xl p-3 border border-zinc-700 min-h-[120px]"
            />
          </div>

          <div>
            <div className="mb-2">アイコン</div>

            <input
            type="file"
            accept="image/*"
            onChange={(e)=>setImage(e.target.files?.[0])}
            />

            <img
            src={image?URL.createObjectURL(image):(icon||"/default.png")}
            className="w-32 h-32 rounded-full object-cover mt-4 border border-zinc-700"
            />
          </div>

          <button
          onClick={saveProfile}
          className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-full font-bold"
          >
            保存
          </button>

        </div>

      </div>

    </Layout>

  );
}
