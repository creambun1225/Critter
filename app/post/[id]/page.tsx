"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
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
};

export default function PostPage(){

  const { id } = useParams();

  const [user,setUser]=useState<any>(null);
  const [post,setPost]=useState<Post | null>(null);
  const [replies,setReplies]=useState<Post[]>([]);
  const [text,setText]=useState("");

  // ログイン
  useEffect(()=>{
    return onAuthStateChanged(auth,(u)=>{
      if(!u) window.location.href="/login";
      else setUser(u);
    });
  },[]);

  // データ取得
  useEffect(()=>{
    if(!id) return;

    // 親ポスト
    getDoc(doc(db,"posts",id as string)).then(d=>{
      if(!d.exists()) return;
      setPost({
        id:d.id,
        ...(d.data() as any)
      });
    });

    // 返信
    const q=query(
      collection(db,"posts"),
      where("parentId","==",id)
    );

    const unsub=onSnapshot(q,(snap)=>{
      const list=snap.docs.map((d:any)=>({
        id:d.id,
        ...(d.data() as any)
      }));
      setReplies(list);
    });

    return ()=>unsub();
  },[id]);

  // 返信投稿
  const reply=async()=>{
    if(!text || !user) return;

    await addDoc(collection(db,"posts"),{
      text,
      uid:user.uid,
      username:user.email,
      parentId:id,
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

  if(!post) return <div>loading...</div>;

  return (
    <main className="flex justify-center bg-[#f5f8fa] min-h-screen">

      <div className="w-[600px] bg-white p-4">

        {/* 親ポスト */}
        <div className="border-b pb-4 mb-4">
          <p className="font-bold">{post.username}</p>
          <p>{post.text}</p>

          <button onClick={()=>like(post)}>
            ❤️ {post.likes || 0}
          </button>
        </div>

        {/* 返信欄 */}
        <div className="border-b pb-4 mb-4">
          <textarea
            className="w-full border p-2"
            placeholder="返信を書く"
            value={text}
            onChange={(e)=>setText(e.target.value)}
          />

          <button
            onClick={reply}
            className="bg-blue-500 text-white px-4 py-1 rounded mt-2"
          >
            返信
          </button>
        </div>

        {/* 返信一覧 */}
        {replies.map((r)=>(
          <div key={r.id} className="border-b p-3">

            <p className="font-bold">{r.username}</p>
            <p>{r.text}</p>

            <button onClick={()=>like(r)}>
              ❤️ {r.likes || 0}
            </button>

          </div>
        ))}

      </div>

    </main>
  );
}