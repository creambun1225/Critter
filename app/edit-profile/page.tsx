"use client";

import { useEffect, useState } from "react";

import {
  auth,
  db
} from "../../lib/firebase";

import {
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";

export default function EditProfilePage() {

  const user = auth.currentUser;

  const [name, setName] = useState("");

  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const loadProfile = async () => {

      if (!user) return;

      const ref = doc(db, "users", user.uid);

      const snap = await getDoc(ref);

      if (snap.exists()) {

        const data = snap.data();

        setName(data.name || "");
        setBio(data.bio || "");

      } else {

        setName(user.email?.split("@")[0] || "");
        setBio("Critter user");

      }

      setLoading(false);

    };

    loadProfile();

  }, [user]);

  const save = async () => {

    if (!user) return;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      bio,
      email: user.email,
    });

    alert("プロフィールを保存しました");

  };

  if (loading) {
    return (
      <div className="p-10 text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      {/* 上 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">

        <h1 className="text-xl font-bold">
          プロフィールを編集
        </h1>

      </div>

      {/* 中身 */}
      <div className="p-4 space-y-6">

        {/* アイコン */}
        <div>

          <p className="mb-2 text-zinc-500">
            アイコン
          </p>

          <div className="w-24 h-24 rounded-full bg-zinc-700" />

        </div>

        {/* 名前 */}
        <div>

          <p className="mb-2 text-zinc-500">
            名前
          </p>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl p-4"
          />

        </div>

        {/* 自己紹介 */}
        <div>

          <p className="mb-2 text-zinc-500">
            自己紹介
          </p>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl p-4 min-h-[120px] resize-none"
          />

        </div>

        {/* 保存 */}
        <button
          onClick={save}
          className="bg-blue-500 hover:bg-blue-600 transition px-6 py-3 rounded-full font-bold"
        >
          保存
        </button>

      </div>

    </div>
  );
}