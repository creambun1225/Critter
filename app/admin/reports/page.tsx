"use client";

import { useEffect, useState } from "react";
import {
  collection, query, getDocs, doc, updateDoc, getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import Layout from "@/components/Layout";

interface Report {
  id: string;
  username: string;
  body: string;
  uid: string;
  status?: string;
  createdAt: number;
}

interface BanAppeal {
  id: string;
  username: string;
  body: string;
  uid: string;
  status: string;
  createdAt: number;
  userName?: string;
  userIcon?: string;
}

export default function AdminReportsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tab, setTab] = useState<"contacts" | "bugreports" | "ban_appeals">("contacts");
  const [contacts, setContacts] = useState<Report[]>([]);
  const [bugreports, setBugreports] = useState<Report[]>([]);
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        location.href = "/login";
        return;
      }
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists() || !userSnap.data().admin) {
        location.href = "/";
        return;
      }
      setCurrentUser({ uid: user.uid, ...userSnap.data() });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Contacts
      const cSnap = await getDocs(collection(db, "contacts"));
      setContacts(
        cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Report))
      );

      // Bug Reports
      const bSnap = await getDocs(collection(db, "bugreports"));
      setBugreports(
        bSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Report))
      );

      // Ban Appeals with user info
      const aSnap = await getDocs(collection(db, "ban_appeals"));
      const appeals = await Promise.all(
        aSnap.docs.map(async (d) => {
          const userSnap = await getDoc(doc(db, "users", d.data().uid));
          return {
            id: d.id,
            ...d.data(),
            userName: userSnap.data()?.name,
            userIcon: userSnap.data()?.icon,
          } as BanAppeal;
        })
      );
      setBanAppeals(appeals.sort((a, b) => b.createdAt - a.createdAt));
    };

    fetchData();
  }, []);

  const handleBanMaintain = async () => {
    if (!selectedItem || tab !== "ban_appeals") return;
    setProcessing(true);
    try {
      await updateDoc(doc(db, "ban_appeals", selectedItem.id), {
        status: "denied",
        response: "運営チームが確認した結果、この対応は正確であると判断いたしました。",
        respondedAt: Date.now(),
      });

      setBanAppeals(
        banAppeals.map((a) =>
          a.id === selectedItem.id ? { ...a, status: "denied" } : a
        )
      );
      setSelectedItem(null);
      alert("BAN維持に設定しました");
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました");
    } finally {
      setProcessing(false);
    }
  };

  const handleBanRemove = async () => {
    if (!selectedItem || tab !== "ban_appeals") return;
    setProcessing(true);
    try {
      // ユーザーのBAN状態を解除
      await updateDoc(doc(db, "users", selectedItem.uid), {
        banned: false,
        banReason: "",
      });

      // 異議申し立てを承認済みに
      await updateDoc(doc(db, "ban_appeals", selectedItem.id), {
        status: "approved",
        response: "運営チームが確認した結果、この対応は正しくなかったことと判断いたしました。この度は大変申し訳ありませんでした。",
        respondedAt: Date.now(),
      });

      setBanAppeals(
        banAppeals.map((a) =>
          a.id === selectedItem.id ? { ...a, status: "approved" } : a
        )
      );
      setSelectedItem(null);
      alert("BANを解除しました");
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout currentUser={currentUser}>
        <div className="text-center py-20 text-zinc-500">読み込み中...</div>
      </Layout>
    );
  }

  if (!currentUser?.admin) {
    return (
      <Layout currentUser={currentUser}>
        <div className="text-center py-20 text-zinc-500">
          管理者のみアクセス可能です
        </div>
      </Layout>
    );
  }

  const displayList =
    tab === "contacts" ? contacts : tab === "bugreports" ? bugreports : banAppeals;

  return (
    <Layout currentUser={currentUser}>
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-white">📋 報告一覧</h1>
        </div>

        <div className="flex items-center justify-start gap-4 px-4 py-3 border-t border-zinc-800 overflow-x-auto">
          {(["contacts", "bugreports", "ban_appeals"] as const).map((t) => {
            const labels = {
              contacts: `お問い合わせ (${contacts.length})`,
              bugreports: `バグ報告 (${bugreports.length})`,
              ban_appeals: `BAN異議申し立て (${banAppeals.length})`,
            };
            return (
              <button
                key={t}
                onClick={() => { setTab(t); setSelectedItem(null); }}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                  tab === t
                    ? "bg-blue-500 text-white"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* リスト */}
        <div className="lg:col-span-1 border-r border-zinc-800 max-h-[calc(100vh-200px)] overflow-y-auto">
          {displayList.length === 0 ? (
            <div className="p-4 text-center text-zinc-500">
              {tab === "contacts"
                ? "お問い合わせはありません"
                : tab === "bugreports"
                ? "バグ報告はありません"
                : "BAN異議申し立てはありません"}
            </div>
          ) : (
            displayList.map((item: any) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`w-full text-left p-4 border-b border-zinc-800 hover:bg-zinc-900 transition ${
                  selectedItem?.id === item.id ? "bg-zinc-800" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white text-sm">
                    {item.username || item.body?.substring(0, 20)}
                  </p>
                  {tab === "ban_appeals" && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.status === "denied"
                          ? "bg-red-500/20 text-red-400"
                          : item.status === "approved"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {item.status === "denied"
                        ? "BAN維持"
                        : item.status === "approved"
                        ? "BAN解除"
                        : "未対応"}
                    </span>
                  )}
                </div>
                <p className="text-zinc-400 text-xs line-clamp-2 mb-2">
                  {item.body}
                </p>
                <p className="text-zinc-500 text-xs">
                  {new Date(item.createdAt).toLocaleString("ja-JP")}
                </p>
              </button>
            ))
          )}
        </div>

        {/* 詳細 */}
        <div className="lg:col-span-2 p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {selectedItem ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-bold text-white">
                    {selectedItem.username}
                  </p>
                  <p className="text-zinc-500 text-sm">
                    {new Date(selectedItem.createdAt).toLocaleString("ja-JP")}
                  </p>
                </div>
                {tab === "ban_appeals" && selectedItem.userName && (
                  <img
                    src={selectedItem.userIcon || "/default.png"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
              </div>

              <div className="bg-zinc-900 rounded-xl p-4 mb-6 border border-zinc-800">
                <p className="text-white whitespace-pre-wrap">
                  {selectedItem.body}
                </p>
              </div>

              {tab === "ban_appeals" && (
                <div>
                  {selectedItem.status === "pending" ? (
                    <div className="space-y-3">
                      <p className="text-white font-bold mb-4">
                        対応を選択してください:
                      </p>
                      <button
                        onClick={handleBanMaintain}
                        disabled={processing}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold py-3 px-4 rounded-xl transition"
                      >
                        {processing ? "処理中..." : "🚫 BAN維持"}
                      </button>
                      <button
                        onClick={handleBanRemove}
                        disabled={processing}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold py-3 px-4 rounded-xl transition"
                      >
                        {processing ? "処理中..." : "✅ BAN解除"}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-zinc-800/50 rounded-xl p-4">
                      <p
                        className={`text-sm font-bold mb-3 ${
                          selectedItem.status === "denied"
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {selectedItem.status === "denied"
                          ? "🚫 BAN維持"
                          : "✅ BAN解除"}
                      </p>
                      <p className="text-white text-sm">
                        {selectedItem.status === "denied"
                          ? "運営チームが確認した結果、この対応は正確であると判断いたしました。"
                          : "運営チームが確認した結果、この対応は正しくなかったことと判断いたしました。この度は大変申し訳ありませんでした。"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500">
              {tab === "contacts"
                ? "お問い合わせを選択してください"
                : tab === "bugreports"
                ? "バグ報告を選択してください"
                : "BAN異議申し立てを選択してください"}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}