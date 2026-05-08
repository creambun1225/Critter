"use client";

import { useEffect,useState } from "react";
import { useParams } from "next/navigation";
import { db,auth } from "@/lib/firebase";
import {
  doc,getDoc,collection,addDoc,query,where,onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PostPage(){

  const {id}=useParams();
  const [user,setUser]=useState<any>(null);
  const [post,setPost]=useState<any>(null);
  const [replies,setReplies]=useState<any[]>([]);
  const [text,setText]=useState("");

  useEffect(()=>{
    return onAuthStateChanged(auth,(u)=>{
      if(!u) location.href="/login";
      else setUser(u);
    });
  },[]);

  useEffect(()=>{
    if(!id) return;

    getDoc(doc(db,"posts",id as string)).then(d=>{
      setPost(d.data());
    });

    const q=query(collection(db,"posts"),where("parentId","==",id));

    return onSnapshot(q,(snap)=>{
      setReplies(snap.docs.map(d=>d.data()));
    });
  },[id]);

  const reply=async()=>{
    await addDoc(collection(db,"posts"),{
      text,
      uid:user.uid,
      username:user.email,
      parentId:id,
      createdAt:Date.now(),
      likes:0,
      likedBy:[]
    });

    setText("");
  };

  if(!post) return <div>loading...</div>;

  return (
    <div className="p-4">

      <p className="font-bold">{post.username}</p>
      <p>{post.text}</p>

      <textarea
        className="w-full border p-2 mt-3"
        value={text}
        onChange={(e)=>setText(e.target.value)}
      />

      <button
        onClick={reply}
        className="bg-blue-500 text-white px-4 py-1 mt-2 rounded"
      >
        返信
      </button>

      {replies.map((r,i)=>(
        <div key={i} className="border-b mt-3">
          <p className="font-bold">{r.username}</p>
          <p>{r.text}</p>
        </div>
      ))}

    </div>
  );
}