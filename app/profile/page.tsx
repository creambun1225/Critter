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

export default function Profile() {
  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;

    getDoc(doc(db, "users", u.uid)).then((res) => {
      setUserData(res.data());
    });

    const q = query(collection(db, "posts"), where("uid", "==", u.uid));

    onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((doc) => doc.data()));
    });
  }, []);

  if (!userData) return null;

  return (
    <div className="p-4">
      <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
      <h1 className="text-xl font-bold">{userData.username}</h1>

      {posts.map((p, i) => (
        <div key={i} className="border-b p-2">
          {p.text}
        </div>
      ))}
    </div>
  );
}