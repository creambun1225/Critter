"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";

export default function BugReportPage() {

  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

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
      alert("ユーザー名と内容を入力してください");
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, "bugreports"), {
        username: username.trim(),
        body: body.trim(),
        uid: currentUser?.uid ?? "",
        createdAt: Date.now(),
      });
      alert("バグ報告を送信しました。ご協力ありがとうございます。");
      setBody("");
      router.back();
    } catch (e) {
      console.error(e);
      alert("送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout currentUser={currentUser}>

      {/* ヘッダー */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900 transition"
        >
          ←
        </button>
        <h1 className="font-bold text-white text-xl">バグ報告</h1>
      </div>

      <div className="p-6 text-white max-w-lg">

        <p className="text-zinc-400 text-sm mb-6">
          不具合を発見した場合はこちらからご報告ください。再現手順や発生状況をできるだけ詳しくお書きいただけると助かります。
        </p>

        {/* ユーザー名 */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-zinc-400 mb-2">
            あなたのユーザー名
          </label>
          <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
            <span className="px-3 text-zinc-500 text-lg">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="flex-1 bg-transparent p-3 outline-none text-white placeholder-zinc-600"
            />
          </div>
        </div>

        {/* 内容 */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-zinc-400 mb-2">
            バグの内容・再現手順
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="例）〇〇のページで△△ボタンを押すと画面が白くなる"
            rows={8}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-600 outline-none resize-none focus:border-blue-500 transition"
          />
          <div className="text-right text-zinc-600 text-xs mt-1">{body.length} 文字</div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={sending || !username.trim() || !body.trim()}
          className="w-full bg-red-500 hover:bg-red-600 transition rounded-xl py-4 font-bold text-lg disabled:opacity-40"
        >
          {sending ? "送信中..." : "報告する"}
        </button>

      </div>

    </Layout>
  );
}