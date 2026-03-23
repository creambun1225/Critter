"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function Notifications(){

  const [list,setList]=useState<any[]>([]);
  const user = auth.currentUser;

  useEffect(()=>{
    if(!user) return;

    return onSnapshot(collection(db,"notifications"),(snap)=>{
      setList(snap.docs.map(d=>d.data()));
    });
  },[]);

  return (
    <div className="bg-white min-h-screen p-4">

      <h1 className="text-xl font-bold mb-4">通知</h1>

      {list.map((n,i)=>(
        <div key={i} className="border-b p-3">
          {n.text}
        </div>
      ))}

    </div>
  );
}