"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { useParams } from "next/navigation";

export default function Profile() {
  const { uid } = useParams();
  const [data,setData]=useState<any>({});
  const [posts,setPosts]=useState<any[]>([]);
  const [me,setMe]=useState<any>(null);
  const [following,setFollowing]=useState(false);

  useEffect(()=>{
    auth.onAuthStateChanged(setMe);
  },[]);

  useEffect(()=>{
    if(!uid) return;

    getDoc(doc(db,"users",uid as string)).then(d=>setData(d.data()));

    const q=query(collection(db,"posts"),where("uid","==",uid));
    return onSnapshot(q,s=>setPosts(s.docs.map(d=>d.data())));
  },[uid]);

  // フォロー
  useEffect(()=>{
    if(!me) return;

    const ref=doc(db,"follows",me.uid+"_"+uid);
    getDoc(ref).then(d=>setFollowing(d.exists()));
  },[me,uid]);

  const toggleFollow=async()=>{
    const ref=doc(db,"follows",me.uid+"_"+uid);
    if(following){
      await deleteDoc(ref);
      setFollowing(false);
    }else{
      await setDoc(ref,{from:me.uid,to:uid});
      setFollowing(true);
    }
  };

  return (
    <div>

      {/* ヘッダー */}
      <div className="h-40 bg-gray-300"></div>

      {/* アイコン */}
      <div className="w-24 h-24 bg-gray-400 rounded-full -mt-12 ml-4"></div>

      <div className="p-4">

        <h1 className="text-xl font-bold">{data?.username}</h1>

        <button onClick={toggleFollow} className="border px-3 py-1">
          {following ? "フォロー中" : "フォロー"}
        </button>

        <p className="mt-2">{data?.bio}</p>

        {/* 投稿 */}
        {posts.map((p,i)=>(
          <div key={i} className="border-b p-2">
            {p.text}
          </div>
        ))}

      </div>
    </div>
  );
}