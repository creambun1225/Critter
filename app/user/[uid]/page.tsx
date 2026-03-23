"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { useParams } from "next/navigation";

export default function UserProfile() {
  const { uid } = useParams();
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const load = async () => {
      const d = await getDoc(doc(db, "users", uid as string));
      setData(d.data());
    };
    load();
  }, []);

  return (
    <div className="p-4">

      <h1>{data.username}</h1>
      <p>{data.bio}</p>

      <button
        onClick={async () => {
          await addDoc(collection(db, "follows"), {
            to: uid,
          });
        }}
        className="border px-3 py-1"
      >
        フォロー
      </button>

    </div>
  );
}