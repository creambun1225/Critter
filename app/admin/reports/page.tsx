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
  const [tab, setTab] = useState<"contacts" | "bugs" | "ban_appeals">("contacts");
  const [contacts, setContacts] = useState<any[]>([]);
  const [bugs, setBugs] = useState<any[]>([]);
  const [banAppeals, setBanAppeals] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = "/login"; return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (!data.admin) { location.href = "/"; return; }
        setCurrentUser({ uid: user.uid, ...data });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setContacts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const q = query(collection(db, "bugreports"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setBugs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const q = query(collection(db, "ban_appeals"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setBanAppeals(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, []);

  const toggleStatus = async (colName: string, id: string, current: string) => {
    const next = current === "対応済み" ? "未対応" : "対応済み";
    await updateDoc(doc(db, colName, id), { status: next });
  };

  if (!currentUser) return null;

  const tabs = [
    { key: "contacts",    label: "お問い合わせ", count: contacts.length,    col: "contacts" },
    { key: "bugs",        label: "バグ報告",     count: bugs.length,         col: "bugreports" },
    { key: "ban_appeals", label: "BAN異議申し立て", count: banAppeals.length, col: "ban_appeals" },
  ] as const;

  const currentList =
    tab === "contacts" ? contacts :
    tab === "bugs" ? bugs :
    banAppeals;

  const currentCol =
    tab === "contacts" ? "contacts" :
    tab === "bugs" ? "bugreports" :
    "ban_appeals";

  return (
    <Layout currentUser={currentUser}>
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()}
          className="text-zinc-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900 transition">
          ←
        </button>
        <h1 className="font-bold text-white text-xl">報告一覧</h1>
      </div>

      {/* タブ */}
      <div className="flex border-b border-zinc-800 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-4 font-bold text-sm transition border-b-2 whitespace-nowrap px-2 ${
              tab === t.key ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}>
            {t.label}
            <span className="ml-1 text-xs text-zinc-500">({t.count})</span>
          </button>
        ))}
      </div>

      {/* 一覧 */}
      <div className="divide-y divide-zinc-800">
        {currentList.length === 0 && (
          <p className="text-center text-zinc-600 py-12">まだありません</p>
        )}
        {currentList.map((item: any) => (
          <div key={item.id} className="p-4">
            <div className="flex items-center justify-between cursor-pointer"
              onClick={() => setOpenId(openId === item.id ? null : item.id)}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-zinc-400 text-sm shrink-0">@{item.username}</span>
                <span className="text-white text-sm truncate">
                  {item.body?.slice(0, 40)}{item.body?.length > 40 ? "..." : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  item.status === "対応済み" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}>
                  {item.status || "未対応"}
                </span>
                <span className="text-zinc-600 text-sm">{openId === item.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {openId === item.id && (
              <div className="mt-4 bg-zinc-900 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-400 text-sm font-bold">@{item.username}</span>
                  <span className="text-zinc-600 text-xs">{new Date(item.createdAt).toLocaleString("ja-JP")}</span>
                </div>
                <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{item.body}</p>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => toggleStatus(currentCol, item.id, item.status || "未対応")}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                      item.status === "対応済み"
                        ? "bg-zinc-700 hover:bg-zinc-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}>
                    {item.status === "対応済み" ? "未対応に戻す" : "対応済みにする"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}