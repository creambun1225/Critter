"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Profile() {
  const [data, setData] = useState<any>({});
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;

      const docRef = await getDoc(doc(db, "users", u.uid));
      setData(docRef.data() || {});

      const q = query(collection(db, "posts"), where("uid", "==", u.uid));
      onSnapshot(q, (snap) => {
        setPosts(snap.docs.map(d => d.data()));
      });
    });

    return () => unsub();
  }, []);

  return (
    <div className="max-w-[600px] mx-auto">

      {/* ヘッダー */}
      <div
        className="h-32 bg-gray-300"
        style={{
          backgroundImage: `url(${data.header || ""})`,
          backgroundSize: "cover"
        }}
      />

      {/* アイコン */}
      <div className="-mt-10 ml-4">
        <img
          src={data.icon || "/default.png"}
          className="w-20 h-20 rounded-full border-4 border-white object-cover"
        />
      </div>

      <div className="p-4">
        <h1 className="text-xl font-bold">
          {data.username || "ユーザー"}
        </h1>

        <p className="text-gray-500">
          {data.bio || "自己紹介なし"}
        </p>

        {/* 投稿 */}
        <div className="mt-4">
          {posts.map((p, i) => (
            <div key={i} className="border-b p-2">
              {p.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}