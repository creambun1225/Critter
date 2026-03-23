"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { useParams } from "next/navigation";

export default function Profile() {
  const { uid } = useParams();
  const [data,setData]=useState<any>(null);
  const [posts,setPosts]=useState<any[]>([]);

  useEffect(()=>{
    if(!uid) return;

    getDoc(doc(db,"users",uid as string))
      .then(d=>{
        if(d.exists()) setData(d.data());
        else setData({username:"なし"});
      });

    const q=query(collection(db,"posts"),where("uid","==",uid));
    return onSnapshot(q,s=>setPosts(s.docs.map(d=>d.data())));
  },[uid]);

  if(!data) return <div>読み込み中</div>;

  return (
    <div className="bg-white min-h-screen">

      <div className="h-40 bg-gray-300"></div>

      <div className="w-24 h-24 bg-gray-400 rounded-full -mt-12 ml-4"></div>

      <div className="p-4">
        <h1 className="text-xl font-bold">{data.username}</h1>

        <div className="mt-4 border-t pt-2">
          {posts.map((p,i)=>(
            <div key={i} className="border-b p-2">
              {p.text}
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}