"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";

export default function BanAppealPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = "/login"; return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setCurrentUser({ uid: user.uid, ...data });
        setUsername(data.username || "");
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    if (!username.trim() || !body.trim()) {
      alert("すべて入力してください");
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, "ban_appeals"), {
        username: username.trim(),
        body: body.trim(),
        uid: currentUser?.uid ?? "",
        status: "未対応",
        createdAt: Date.now(),
      });
      setSent(true);
    } catch (e) {
      console.error(e);
      alert("送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  if (sent) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-white text-xl font-bold mb-2">送信しました</h2>
        <p className="text-zinc-500 text-sm">管理者が確認次第、対応いたします。</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black px-4 py-10">
      <div className="max-w-md mx-auto">

        <h1 className="text-2xl font-bold text-white mb-2">BANへの異議申し立て</h1>
        <p className="text-zinc-500 text-sm mb-8">
          BANが誤りと思われる場合は以下にご記入の上、送信してください。
        </p>

        <div className="mb-4">
          <label className="block text-zinc-400 text-sm font-bold mb-2">ユーザー名</label>
          <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
            <span className="px-3 text-zinc-500">@</span>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="flex-1 bg-transparent p-3 outline-none text-white placeholder-zinc-600" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-zinc-400 text-sm font-bold mb-2">申し立て内容</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="BANが誤りと思われる理由をご記入ください"
            rows={6}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-600 outline-none resize-none focus:border-blue-500 transition" />
        </div>

        <button onClick={handleSubmit} disabled={sending || !username.trim() || !body.trim()}
          className="w-full bg-blue-500 hover:bg-blue-600 transition rounded-xl py-4 font-bold text-white text-lg disabled:opacity-40">
          {sending ? "送信中..." : "送信する"}
        </button>

      </div>
    </div>
  );
}