"use client";

import { useEffect, useState } from "react";
import {
  collection, query, getDocs, doc, updateDoc, getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import Layout from "@/components/Layout";

interface BanAppeal {
  id: string;
  username: string;
  body: string;
  uid: string;
  status: string;
  createdAt: number;
  userId?: string;
  userName?: string;
  userIcon?: string;
}

export default function AdminBanAppealsPage() {
  const [appeals, setAppeals] = useState<BanAppeal[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedAppeal, setSelectedAppeal] = useState<BanAppeal | null>(null);
  const [message, setMessage] = useState("");
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
    const fetchAppeals = async () => {
      const q = query(collection(db, "ban_appeals"));
      const snap = await getDocs(q);
      const data = await Promise.all(
        snap.docs.map(async (d) => {
          const userSnap = await getDoc(doc(db, "users", d.data().uid));
          const userData = userSnap.exists() ? userSnap.data() : {};
          return {
            id: d.id,
            ...d.data(),
            userId: d.data().uid,
            userName: userData.name,
            userIcon: userData.icon,
          } as BanAppeal;
        })
      );
      setAppeals(data.sort((a, b) => b.createdAt - a.createdAt));
    };
    fetchAppeals();
  }, []);

  const handleMaintainBan = async () => {
    if (!selectedAppeal) return;
    setProcessing(true);
    try {
      await updateDoc(doc(db, "ban_appeals", selectedAppeal.id), {
        status: "denied",
        response: "運営チームが確認した結果、この対応は正確であると判断いたしました。",
        respondedAt: Date.now(),
      });

      setAppeals(
        appeals.map((a) =>
          a.id === selectedAppeal.id
            ? { ...a, status: "denied" }
            : a
        )
      );
      setSelectedAppeal(null);
      alert("BAN維持に設定しました");
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました");
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveBan = async () => {
    if (!selectedAppeal) return;
    setProcessing(true);
    try {
      // ユーザーのBAN状態を解除
      await updateDoc(doc(db, "users", selectedAppeal.uid), {
        banned: false,
        banReason: "",
      });

      // 異議申し立てを承認済みに
      await updateDoc(doc(db, "ban_appeals", selectedAppeal.id), {
        status: "approved",
        response: "運営チームが確認した結果、この対応は正しくなかったことと判断いたしました。この度は大変申し訳ありませんでした。",
        respondedAt: Date.now(),
      });

      setAppeals(
        appeals.map((a) =>
          a.id === selectedAppeal.id
            ? { ...a, status: "approved" }
            : a
        )
      );
      setSelectedAppeal(null);
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
        <div className="text-center py-20 text-zinc-500">管理者のみアクセス可能です</div>
      </Layout>
    );
  }

  return (
    <Layout currentUser={currentUser}>
      <div className="border-b border-zinc-800 p-4">
        <h1 className="text-2xl font-bold text-white">🚫 BAN異議申し立て管理</h1>
        <p className="text-zinc-500 text-sm mt-1">合計 {appeals.length} 件</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* リスト */}
        <div className="lg:col-span-1 border-r border-zinc-800">
          {appeals.length === 0 ? (
            <div className="p-4 text-center text-zinc-500">異議申し立てはありません</div>
          ) : (
            appeals.map((appeal) => (
              <button
                key={appeal.id}
                onClick={() => setSelectedAppeal(appeal)}
                className={`w-full text-left p-4 border-b border-zinc-800 hover:bg-zinc-900 transition ${
                  selectedAppeal?.id === appeal.id ? "bg-zinc-800" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={appeal.userIcon || "/default.png"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-white text-sm">{appeal.userName}</p>
                    <p className="text-zinc-500 text-xs">@{appeal.username}</p>
                  </div>
                </div>
                <p className="text-zinc-400 text-xs line-clamp-2 mb-2">{appeal.body}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    {new Date(appeal.createdAt).toLocaleString("ja-JP")}
                  </span>
                  <span
                    className={`px-2 py-1 rounded ${
                      appeal.status === "denied"
                        ? "bg-red-500/20 text-red-400"
                        : appeal.status === "approved"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {appeal.status === "denied"
                      ? "BAN維持"
                      : appeal.status === "approved"
                      ? "BAN解除"
                      : "未対応"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* 詳細 */}
        <div className="lg:col-span-2 p-4">
          {selectedAppeal ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img
                  src={selectedAppeal.userIcon || "/default.png"}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-white">{selectedAppeal.userName}</p>
                  <p className="text-zinc-500 text-sm">@{selectedAppeal.username}</p>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-xl p-4 mb-6 border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-2">異議申し立て内容:</p>
                <p className="text-white whitespace-pre-wrap">{selectedAppeal.body}</p>
              </div>

              <div className="text-sm text-zinc-500 mb-6">
                申し立て日時: {new Date(selectedAppeal.createdAt).toLocaleString("ja-JP")}
              </div>

              {selectedAppeal.status === "pending" ? (
                <div className="space-y-3">
                  <p className="text-white font-bold mb-4">対応を選択してください:</p>
                  <button
                    onClick={handleMaintainBan}
                    disabled={processing}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold py-3 px-4 rounded-xl transition"
                  >
                    {processing ? "処理中..." : "🚫 BAN維持"}
                  </button>
                  <button
                    onClick={handleRemoveBan}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold py-3 px-4 rounded-xl transition"
                  >
                    {processing ? "処理中..." : "✅ BAN解除"}
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <p className="text-sm text-zinc-400 mb-2">運営チームの対応:</p>
                  <p
                    className={`text-white mb-4 ${
                      selectedAppeal.status === "denied"
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {selectedAppeal.status === "denied"
                      ? "🚫 BAN維持"
                      : "✅ BAN解除"}
                  </p>
                  <p className="text-white whitespace-pre-wrap">
                    運営チームが確認した結果、この対応は
                    {selectedAppeal.status === "denied"
                      ? "正確であると判断いたしました。"
                      : "正しくなかったことと判断いたしました。この度は大変申し訳ありませんでした。"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500">
              異議申し立てを選択してください
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}