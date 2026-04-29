"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  runTransaction
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type Post = {
  id: string;
  uid: string;
  username: string;
  text: string;
  parentId?: string | null;
  likes: number;
  likedBy?: string[];
};

export default function Home(){

  const [user,setUser]=useState<any>(null);
  const [posts,setPosts]=useState<Post[]>([]);
  const [text,setText]=useState("");

  useEffect(()=>{
    return onAuthStateChanged(auth,(u)=>{
      if(!u) window.location.href="/login";
      else setUser(u);
    });
  },[]);

  useEffect(()=>{
    const q=query(collection(db,"posts"),orderBy("createdAt","desc"));

    const unsub=onSnapshot(q,(snap)=>{
      const list=snap.docs.map((d:any)=>({
        id:d.id,
        ...(d.data() as any)
      }));

      setPosts(list.filter(p=>!p.parentId));
    });

    return ()=>unsub();
  },[]);

  const post=async()=>{
    if(!text || !user) return;

    await addDoc(collection(db,"posts"),{
      text,
      uid:user.uid,
      username:user.email,
      parentId:null,
      createdAt:Date.now(),
      likes:0,
      likedBy:[]
    });

    setText("");
  };

  const like=async(p:Post)=>{
    const ref=doc(db,"posts",p.id);

    await runTransaction(db,async(tx)=>{
      const snap=await tx.get(ref);
      const data=snap.data();

      const likedBy=data?.likedBy || [];

      if(likedBy.includes(user.uid)) return;

      tx.update(ref,{
        likes:(data?.likes || 0)+1,
        likedBy:[...likedBy,user.uid]
      });
    });
  };

  if(!user) return <div>loading...</div>;

  return (
    <div>

      {/* 投稿 */}
      <div className="p-4 border-b">
        <textarea
          className="w-full border p-2 text-black"
          value={text}
          onChange={(e)=>setText(e.target.value)}
        />
        <button
          onClick={post}
          className="bg-blue-500 text-white px-4 py-1 mt-2 rounded"
        >
          ポスト
        </button>
      </div>

      {/* TL */}
      {posts.map((p)=>(
        <div key={p.id} className="border-b p-4">

          <p className="font-bold">{p.username}</p>

          <Link href={`/post/${p.id}`}>
            <p className="cursor-pointer hover:underline">
              {p.text}
            </p>
          </Link>

          <button
            onClick={()=>like(p)}
            className={
              p.likedBy?.includes(user.uid)
                ? "text-red-500"
                : "text-gray-500"
            }
          >
            ❤️ {p.likes || 0}
          </button>

        </div>
      ))}

    </div>
  );
}