"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Bookmarks() {

  const [user,setUser]=useState<any>(null);
  const [posts,setPosts]=useState<any[]>([]);
  const [bookmarks,setBookmarks]=useState<any>({});

  useEffect(()=>{
    return onAuthStateChanged(auth,(u)=>{
      if(!u) window.location.href="/login";
      else setUser(u);
    });
  },[]);

  useEffect(()=>{
    if(!user) return;

    const unsub1 = onSnapshot(collection(db,"bookmarks"),(snap)=>{
      const data:any={};
      snap.docs.forEach(d=>{
        const v=d.data();
        if(v.uid===user.uid) data[v.postId]=true;
      });
      setBookmarks(data);
    });

    const unsub2 = onSnapshot(collection(db,"posts"),(snap)=>{
      setPosts(snap.docs.map(d=>({id:d.id,...d.data()})));
    });

    return ()=>{
      unsub1();
      unsub2();
    };
  },[user]);

  if(!user) return null;

  return (
    <div className="bg-white min-h-screen p-4">

      <h1 className="text-xl font-bold mb-4">ブックマーク</h1>

      {posts.filter(p=>bookmarks[p.id]).map(p=>(
        <div key={p.id} className="border-b p-4">
          <p className="font-bold">{p.username}</p>
          <p>{p.text}</p>
        </div>
      ))}

    </div>
  );
}