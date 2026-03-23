"use client";

import { useState, useEffect } from "react";
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

export default function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(()=>{
    auth.onAuthStateChanged(setUser);
  },[]);

  useEffect(()=>{
    getDoc(doc(db,"posts",id as string)).then(d=>setPost(d.data()));

    const q = query(collection(db,"replies"), where("postId","==",id));
    return onSnapshot(q,s=>setReplies(s.docs.map(d=>d.data())));
  },[id]);

  const send = async ()=>{
    await addDoc(collection(db,"replies"),{
      text,
      postId:id,
      username:user.email.split("@")[0]
    });
    setText("");
  };

  if(!post) return null;

  return (
    <div className="p-4">
      <h1>{post.username}</h1>
      <p>{post.text}</p>

      <textarea onChange={(e)=>setText(e.target.value)} />
      <button onClick={send}>返信</button>

      {replies.map((r,i)=>(
        <div key={i}>
          <b>{r.username}</b> {r.text}
        </div>
      ))}
    </div>
  );
}