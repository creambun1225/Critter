"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, collection, query,
  orderBy, onSnapshot, updateDoc,
} from "firebase/firestore";

export default function AdminReportsPage() {

  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tab, setTab] = useState<"contacts" | "bugs">("contacts");
  const [contacts, setContacts] = useState<any[]>([]);
  const [bugs, setBugs] = useState<any[]>([]);

  // 展開中のカード
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = "/login"; return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (!data.admin) { location.href = "/"; return; } // 管理者以外はリダイレクト
        setCurrentUser({ uid: user.uid, ...data });
      }
    });
    return () => unsub();
  }, []);

  // お問い合わせ取得
  useEffect(() => {
    const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setContacts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // バグ報告取得
  useEffect(() => {
    const q = query(collection(db, "bugreports"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setBugs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // お問い合わせの対応済み切り替え
  const toggleStatus = async (id: string, current: string) => {
    const next = current === "対応済み" ? "未対応" : "対応済み";
    await updateDoc(doc(db, "contacts", id), { status: next });
  };

  if (!currentUser) return null;

  const list = tab === "contacts" ? contacts : bugs;

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
        <h1 className="font-bold text-white text-xl">報告一覧</h1>
      </div>

      {/* タブ */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setTab("contacts")}
          className={`flex-1 py-4 font-bold text-sm transition border-b-2 ${
            tab === "contacts" ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          お問い合わせ
          <span className="ml-2 text-xs text-zinc-500">({contacts.length})</span>
        </button>
        <button
          onClick={() => setTab("bugs")}
          className={`flex-1 py-4 font-bold text-sm transition border-b-2 ${
            tab === "bugs" ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          バグ報告
          <span className="ml-2 text-xs text-zinc-500">({bugs.length})</span>
        </button>
      </div>

      {/* 一覧 */}
      <div className="divide-y divide-zinc-800">
        {list.length === 0 && (
          <p className="text-center text-zinc-600 py-12">まだ{tab === "contacts" ? "お問い合わせ" : "バグ報告"}はありません</p>
        )}

        {list.map((item: any) => (
          <div key={item.id} className="p-4">

            {/* ヘッダー行 */}
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-zinc-400 text-sm shrink-0">@{item.username}</span>
                <span className="text-white text-sm truncate">{item.body?.slice(0, 40)}{item.body?.length > 40 ? "..." : ""}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {/* お問い合わせのみ対応済みバッジ */}
                {tab === "contacts" && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    item.status === "対応済み"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {item.status || "未対応"}
                  </span>
                )}
                <span className="text-zinc-600 text-sm">{openId === item.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* 展開時の詳細 */}
            {openId === item.id && (
              <div className="mt-4 bg-zinc-900 rounded-2xl p-4">

                {/* ユーザー名・日時 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-400 text-sm font-bold">@{item.username}</span>
                  <span className="text-zinc-600 text-xs">
                    {new Date(item.createdAt).toLocaleString("ja-JP")}
                  </span>
                </div>

                {/* 内容 */}
                <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                  {item.body}
                </p>

                {/* お問い合わせのみ：対応済みボタン */}
                {tab === "contacts" && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => toggleStatus(item.id, item.status || "未対応")}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                        item.status === "対応済み"
                          ? "bg-zinc-700 hover:bg-zinc-600 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      {item.status === "対応済み" ? "未対応に戻す" : "対応済みにする"}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        ))}
      </div>

    </Layout>
  );
}