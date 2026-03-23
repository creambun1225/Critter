"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { useParams } from "next/navigation";

export default function Profile() {
  const params = useParams();
  const uid = params?.uid as string;

  const [data, setData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!uid) return;

    getDoc(doc(db, "users", uid))
      .then((d) => {
        if (d.exists()) setData(d.data());
        else setData({ username: "ユーザーなし", bio: "" });
      });

    const q = query(collection(db, "posts"), where("uid", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => d.data()));
    });

    return () => unsub();
  }, [uid]);

  if (!uid) return <div>UIDなし</div>;
  if (!data) return <div>読み込み中...</div>;

  return (
    <div>
      <div className="h-40 bg-gray-300"></div>

      <div className="w-24 h-24 bg-gray-400 rounded-full -mt-12 ml-4"></div>

      <div className="p-4">
        <h1 className="text-xl font-bold">{data.username}</h1>
        <p>@{data.username}</p>

        <p>{data.bio}</p>

        {posts.map((p,i)=>(
          <div key={i} className="border-b p-2">
            {p.text}
          </div>
        ))}
      </div>
    </div>
  );
}