"use client";

import Link from "next/link";

import {
  auth,
  db
} from "../../lib/firebase";

import {
  doc,
  getDoc
} from "firebase/firestore";

import {
  useEffect,
  useState
} from "react";

export default function ProfilePage() {

  const user = auth.currentUser;

  const [name, setName] = useState("");

  const [bio, setBio] = useState("");

  useEffect(() => {

    const loadProfile = async () => {

      if (!user) return;

      const snap = await getDoc(
        doc(db, "users", user.uid)
      );

      if (snap.exists()) {

        const data = snap.data();

        setName(data.name || "");
        setBio(data.bio || "");

      } else {

        setName(user.email?.split("@")[0] || "");
        setBio("Critter user");

      }

    };

    loadProfile();

  }, [user]);

  return (
    <div className="min-h-screen">

      {/* ヘッダー */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">

        <h1 className="text-xl font-bold">
          プロフィール
        </h1>

      </div>

      {/* バナー */}
      <div className="h-52 bg-zinc-800" />

      {/* プロフィール */}
      <div className="p-4 border-b border-zinc-800">

        {/* アイコン */}
        <div className="w-28 h-28 rounded-full bg-zinc-700 border-4 border-black -mt-16" />

        {/* 名前 */}
        <div className="mt-4">

          <h1 className="text-2xl font-bold">
            {name}
          </h1>

          <p className="text-zinc-500">
            @{name}
          </p>

        </div>

        {/* 自己紹介 */}
        <p className="mt-4">
          {bio}
        </p>

        {/* フォロー */}
        <div className="flex gap-6 mt-4 text-zinc-500">

          <p>
            <span className="text-white font-bold">
              0
            </span>{" "}
            フォロー中
          </p>

          <p>
            <span className="text-white font-bold">
              0
            </span>{" "}
            フォロワー
          </p>

        </div>

        {/* 編集 */}
        <Link href="/edit-profile">

          <button className="mt-6 border border-zinc-700 hover:bg-zinc-900 transition px-5 py-2 rounded-full font-bold">

            プロフィールを編集

          </button>

        </Link>

      </div>

    </div>
  );
}