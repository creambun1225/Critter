"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { useParams } from "next/navigation";

export default function UserProfile() {
  const params = useParams();
  const uid = params?.uid as string;

  const [data, setData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!uid) return;

    const load = async () => {
      const d = await getDoc(doc(db, "users", uid));
      if (d.exists()) setData(d.data());
    };

    load();

    const q = query(collection(db, "posts"), where("uid", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => d.data()));
    });

    return () => unsub();
  }, [uid]);

  if (!data) return <div className="p-4">読み込み中...</div>;

  return (
    <div className="p-4">
      <h1>{data.username}</h1>
      <p>{data.bio}</p>

      {posts.map((p,i)=>(
        <div key={i} className="border p-2">{p.text}</div>
      ))}
    </div>
  );
}