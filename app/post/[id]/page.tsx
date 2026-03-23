"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { useParams } from "next/navigation";

export default function PostDetail() {
  const { id } = useParams();
  const [post,setPost]=useState<any>(null);
  const [replies,setReplies]=useState<any[]>([]);
  const [text,setText]=useState("");
  const [user,setUser]=useState<any>(null);

  useEffect(()=>{
    const u = auth.currentUser;
    if(!u) window.location.href="/login";
    else setUser(u);
  },[]);

  useEffect(()=>{
    if(!id) return;

    getDoc(doc(db,"posts",id as string))
      .then(d=>setPost(d.data()));

    const q=query(collection(db,"replies"),where("postId","==",id));
    return onSnapshot(q,s=>{
      setReplies(s.docs.map(d=>d.data()));
    });

  },[id]);

  const sendReply = async ()=>{
    if(!text) return;

    await addDoc(collection(db,"replies"),{
      text,
      postId:id,
      uid:user.uid
    });

    setText("");
  };

  if(!post) return <div>読み込み中...</div>;

  return (
    <div className="bg-white min-h-screen p-4">

      <h1 className="font-bold">{post.username}</h1>
      <p>{post.text}</p>

      <div className="mt-4">
        <textarea
          className="border w-full p-2"
          value={text}
          onChange={(e)=>setText(e.target.value)}
        />
        <button
          onClick={sendReply}
          className="bg-blue-500 text-white px-4 py-1 mt-2"
        >
          返信
        </button>
      </div>

      <div className="mt-6">
        {replies.map((r,i)=>(
          <div key={i} className="border-b p-2">
            {r.text}
          </div>
        ))}
      </div>

    </div>
  );
}