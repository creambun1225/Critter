"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";

export default function BannedPage() {
  const [banReason, setBanReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const checkBan = async (user: any) => {
      if (!user) {
        location.href = "/login";
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.banned) {
          setIsBanned(true);
          setBanReason(userData.banReason || "不適切な行動");
        } else {
          // BAN解除されている場合はホームに遷移
          location.href = "/";
        }
      }
      setLoading(false);
    };

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkBan(user);
      } else {
        location.href = "/login";
      }
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-400">読み込み中...</div>
      </div>
    );
  }

  if (!isBanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-400">リダイレクト中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-white mb-2">アカウントが停止されています</h1>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 mb-6">
          <div className="mb-6">
            <p className="text-zinc-400 text-sm mb-3">停止理由:</p>
            <p className="text-white text-lg font-semibold">{banReason}</p>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
            <p className="text-zinc-300 text-center text-sm leading-relaxed">
              このアカウントはコミュニティガイドラインへの違反が確認されたため、停止されています。
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/ban-appeal"
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl text-center transition"
            >
              ✉️ 異議申し立てをする
            </Link>
            <button
              onClick={() => location.reload()}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-xl transition"
            >
              🔄 状態を更新
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-zinc-500 text-xs mb-2">
            ヘルプが必要な場合は、以下のボタンをクリックしてください。
          </p>
          <Link href="/contact" className="text-blue-400 hover:text-blue-300 text-sm transition">
            お問い合わせ
          </Link>
        </div>
      </div>
    </div>
  );
}