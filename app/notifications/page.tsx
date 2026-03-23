"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Notifications() {
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) return;

      const q = query(collection(db, "notifications"), where("to", "==", u.uid));

      onSnapshot(q, (snap) => {
        setList(snap.docs.map(d => d.data()));
      });
    });
  }, []);

  return (
    <div className="p-4">
      <h1>通知</h1>

      {list.map((n, i) => (
        <p key={i}>{n.fromName} がフォロー</p>
      ))}
    </div>
  );
}