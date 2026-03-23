"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Settings() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [icon, setIcon] = useState("");
  const [header, setHeader] = useState("");

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;

    getDoc(doc(db, "users", u.uid)).then((res) => {
      const d = res.data();
      setUsername(d?.username || "");
      setBio(d?.bio || "");
      setIcon(d?.icon || "");
      setHeader(d?.header || "");
    });
  }, []);

  const save = async () => {
    const u = auth.currentUser;
    if (!u) return;

    await setDoc(doc(db, "users", u.uid), {
      username,
      bio,
      icon,
      header,
    }, { merge: true });

    alert("保存した！");
  };

  return (
    <div className="max-w-[600px] mx-auto p-4">

      <h1 className="text-xl font-bold mb-4">プロフィール編集</h1>

      <input
        placeholder="表示名"
        className="border p-2 w-full mb-2"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <textarea
        placeholder="自己紹介"
        className="border p-2 w-full mb-2"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />

      <input
        placeholder="アイコンURL"
        className="border p-2 w-full mb-2"
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
      />

      <input
        placeholder="ヘッダーURL"
        className="border p-2 w-full mb-2"
        value={header}
        onChange={(e) => setHeader(e.target.value)}
      />

      <button
        onClick={save}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        保存
      </button>
    </div>
  );
}