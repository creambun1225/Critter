"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function BannedPage() {
  const [banReason, setBanReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = "/login"; return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        // BANされていなければホームへ
        if (!data.banned) { location.href = "/"; return; }
        setBanReason(data.banReason || "規約違反");
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500">読み込み中...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-950 border border-red-500/30 rounded-3xl p-8 text-center">

        {/* アイコン */}
        <div className="text-6xl mb-6"></div>

        {/* タイトル */}
        <h1 className="text-2xl font-bold text-red-400 mb-4">
          このアカウントはBANされました
        </h1>

        {/* 理由 */}
        <div className="bg-zinc-900 rounded-2xl p-4 mb-6 text-left">
          <p className="text-zinc-400 text-sm font-bold mb-2">BAN理由</p>
          <p className="text-white text-sm leading-relaxed">{banReason}</p>
        </div>

        <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
          このアカウントは利用規約に違反したとしてBANされました。
          ご不明な点がある場合は下記よりお問い合わせください。
        </p>

        {/* 異議申し立てリンク */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
          <p className="text-zinc-400 text-sm mb-2">
            このBANが間違っていると思われる場合は
          </p>
          <Link href="/ban-appeal"
            className="text-blue-400 hover:underline font-bold text-sm">
            こちら
          </Link>
          <p className="text-zinc-400 text-sm mt-1">からお問い合わせください。</p>
        </div>

      </div>
    </div>
  );
}