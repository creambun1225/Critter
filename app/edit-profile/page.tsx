"use client";

import { useState } from "react";
import { auth } from "../../lib/firebase";

export default function EditProfilePage() {

  const user = auth.currentUser;

  const [name, setName] = useState(
    user?.email?.split("@")[0] || ""
  );

  const [bio, setBio] = useState("Critter user");

  const save = () => {

    alert("プロフィール保存機能はこれから追加");

  };

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