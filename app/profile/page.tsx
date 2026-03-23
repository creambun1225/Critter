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
    <div className="max-w-[600px] mx-auto">

      <div
        className="h-40 bg-gray-300"
        style={{ backgroundImage: `url(${data.header})`, backgroundSize: "cover" }}
      />

      <div className="-mt-12 ml-4">
        <img
          src={data.icon || "/default.png"}
          className="w-24 h-24 rounded-full border-4 border-white"
        />
      </div>

      <div className="p-4">
        <h1 className="text-2xl font-bold">{data.username}</h1>
        <p className="text-gray-500">@{data.username}</p>
        <p>{data.bio}</p>
      </div>

    </div>
  );
}