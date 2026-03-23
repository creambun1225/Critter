"use client";

import { useState } from "react";

export default function Settings() {

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  return (
    <div className="flex bg-gray-100 min-h-screen">

      <div className="w-[250px] p-6 border-r bg-white">
        <h1 className="text-xl font-bold mb-6">設定</h1>

        <div className="flex flex-col gap-4 text-gray-600">
          <div className="bg-blue-100 p-2 rounded">プロフィール</div>
          <div>表示</div>
          <div>アカウント</div>
          <div>通知</div>
        </div>
      </div>

      <div className="flex-1 p-10">

        <h1 className="text-2xl font-bold mb-6">プロフィール設定</h1>

        <div className="mb-4">
          <p>ユーザー名</p>
          <input
            className="border p-2 w-full"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
          />
        </div>

        <div>
          <p>自己紹介</p>
          <textarea
            className="border p-2 w-full"
            value={bio}
            onChange={(e)=>setBio(e.target.value)}
          />
        </div>

      </div>

    </div>
  );
}