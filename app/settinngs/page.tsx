"use client";

import { useState } from "react";

export default function Settings() {

  const [username, setUsername] = useState("creambun");
  const [displayName, setDisplayName] = useState("creambun");
  const [bio, setBio] = useState("");

  return (
    <div className="flex bg-gray-100 min-h-screen">

      {/* 左 */}
      <div className="w-[250px] p-6 border-r bg-white">
        <h1 className="text-xl font-bold mb-6">設定</h1>

        <div className="flex flex-col gap-4 text-gray-600">
          <div className="bg-blue-100 p-2 rounded">プロフィール</div>
          <div>表示</div>
          <div>アカウント</div>
          <div>パスワード</div>
          <div>APIキー</div>
          <div>プライバシー</div>
          <div>通知</div>
          <div>通話</div>
          <div>法務</div>
          <div>クレジット</div>
        </div>
      </div>

      {/* 右 */}
      <div className="flex-1 p-10">

        <h1 className="text-2xl font-bold mb-6">プロフィール設定</h1>

        <div className="mb-6">
          <p>プロフィール画像</p>
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
            画像なし
          </div>
        </div>

        <div className="mb-6">
          <p>ヘッダー画像</p>
          <div className="h-32 bg-gray-200 flex items-center justify-center rounded">
            画像なし
          </div>
        </div>

        <div className="mb-4">
          <p>ユーザー名</p>
          <input
            className="border p-2 w-full rounded"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
            変更
          </button>
        </div>

        <div className="mb-4">
          <p>表示名</p>
          <input
            className="border p-2 w-full rounded"
            value={displayName}
            onChange={(e)=>setDisplayName(e.target.value)}
          />
        </div>

        <div>
          <p>自己紹介</p>
          <textarea
            className="border p-2 w-full rounded"
            value={bio}
            onChange={(e)=>setBio(e.target.value)}
          />
        </div>

      </div>

    </div>
  );
}