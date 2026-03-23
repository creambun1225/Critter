"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Profile() {
  const [data, setData] = useState<any>({});

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      const d = await getDoc(doc(db, "users", u.uid));
      setData(d.data());
    });
  }, []);

  return (
    <div className="p-4">
      <h1>{data.username}</h1>
      <p>{data.bio}</p>
    </div>
  );
}