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
  getDoc,
  runTransaction
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type Post = {
  id: string;
  uid: string;
  username: string;
  text: string;
  image?: string;
  parentId?: string | null;
  createdAt: number;
  likes: number;
};

export default function Home(){

  const [user,setUser]=useState<any>(null);
  const [posts,setPosts]=useState<Post[]>([]);
  const [text,setText]=useState("");

  // ログイン
  useEffect(()=>{
    return onAuthStateChanged(auth,(u)=>{
      if(!u) window.location.href="/login";
      else setUser(u);
    });
  },[]);

  // 投稿取得（親投稿だけ）
  useEffect(()=>{
    const q=query(collection(db,"posts"),orderBy("createdAt","desc"));

    const unsub=onSnapshot(q,(snap)=>{
      const list=snap.docs.map((d:any)=>{
        const data=d.data();
        return {
          id:d.id,
          ...data
        };
      });

      // 親投稿のみ表示
      setPosts(list.filter(p=>!p.parentId));
    });

    return ()=>unsub();
  },[]);

  // 投稿
  const post=async()=>{
    if(!text || !user) return;

    await addDoc(collection(db,"posts"),{
      text,
      uid:user.uid,
      username:user.email,
      parentId:null,
      createdAt:Date.now(),
      likes:0
    });

    setText("");
  };

  // いいね
  const like=async(p:Post)=>{
    const ref=doc(db,"posts",p.id);

    await runTransaction(db,async(tx)=>{
      const snap=await tx.get(ref);
      const current=snap.data()?.likes || 0;

      tx.update(ref,{
        likes:current+1
      });
    });
  };

  if(!user) return <div>loading...</div>;

  return (
    <main className="flex justify-center bg-[#f5f8fa] min-h-screen">

      <div className="w-[600px] bg-white">

        {/* 投稿欄 */}
        <div className="p-4 border-b">
          <textarea
            className="w-full border p-2"
            placeholder="いまどうしてる？"
            value={text}
            onChange={(e)=>setText(e.target.value)}
          />

          <button
            onClick={post}
            className="bg-blue-500 text-white px-4 py-1 rounded mt-2"
          >
            ポスト
          </button>
        </div>

        {/* 投稿一覧 */}
        {posts.map((p)=>(
          <div key={p.id} className="border-b p-4">

            <p className="font-bold">{p.username}</p>

            {/* 👇クリックで詳細 */}
            <Link href={`/post/${p.id}`}>
              <p className="cursor-pointer hover:underline">
                {p.text}
              </p>
            </Link>

            <button
              onClick={()=>like(p)}
              className="text-gray-500 mt-2"
            >
              ❤️ {p.likes || 0}
            </button>

          </div>
        ))}

      </div>

    </main>
  );
}