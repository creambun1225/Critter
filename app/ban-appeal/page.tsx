"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import Layout from "@/components/Layout";

export default function BanAppealPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appealStatus, setAppealStatus] = useState<any>(null);
  const [appealResponse, setAppealResponse] = useState("");

  useEffect(() => {
    const checkUser = async (user: any) => {
      if (!user) {
        location.href = "/login";
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        setCurrentUser({ uid: user.uid, ...userSnap.data() });
      }

      // 前回の異議申し立てを確認（最新のものを取得）
      const q = query(
        collection(db, "ban_appeals"),
        where("uid", "==", user.uid)
      );
      const snap = await getDocs(q);
      if (snap.docs.length > 0) {
        const latestAppeal = snap.docs.sort(
          (a, b) => b.data().createdAt - a.data().createdAt
        )[0];
        const data = latestAppeal.data();
        
        // 対応済みの appeal のみを表示
        if (data.status && data.status !== "pending") {
          setAppealStatus(data.status);
          setAppealResponse(data.response || "");
        } else {
          // 未対応の場合は、form を表示する状態にする
          setAppealStatus("pending");
        }
      }

      setLoading(false);
    };

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkUser(user);
      } else {
        location.href = "/login";
      }
    });

    return () => unsub();
  }, []);

  const handleSubmitAppeal = async () => {
    if (!text.trim() || !currentUser) return;

    try {
      await addDoc(collection(db, "ban_appeals"), {
        username: currentUser.username,
        body: text,
        uid: currentUser.uid,
        status: "pending",
        createdAt: Date.now(),
      });

      setText("");
      setSubmitted(true);
      setAppealStatus("pending");
      alert("異議申し立てを送信しました");
    } catch (e) {
      console.error(e);
      alert("送信に失敗しました");
    }
  };

  if (loading) {
    return (
      <Layout currentUser={currentUser}>
        <div className="text-center py-20 text-zinc-500">読み込み中...</div>
      </Layout>
    );
  }

  // BAN維持の場合
  if (appealStatus === "denied") {
    return (
      <Layout currentUser={currentUser}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🚫</div>
              <h1 className="text-2xl font-bold text-white mb-2">
                異議申し立ての結果
              </h1>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 mb-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
                <p className="text-red-400 font-bold text-center mb-4">
                  BAN維持
                </p>
                <p className="text-white text-center leading-relaxed">
                  運営チームが確認した結果、この対応は正確であると判断いたしました。
                </p>
              </div>

              <Link
                href="/signup"
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl text-center transition mb-3"
              >
                📝 新しくアカウントを作成
              </Link>

              <button
                onClick={() => {
                  localStorage.removeItem("critter_ban_status");
                  auth.signOut();
                  location.href = "/login";
                }}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-xl transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // BAN解除の場合
  if (appealStatus === "approved") {
    return (
      <Layout currentUser={currentUser}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-white mb-2">
                異議申し立ての結果
              </h1>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 mb-6">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
                <p className="text-green-400 font-bold text-center mb-4">
                  BAN解除
                </p>
                <p className="text-white text-center leading-relaxed">
                  運営チームが確認した結果、この対応は正しくなかったことと判断いたしました。この度は大変申し訳ありませんでした。
                </p>
              </div>

              <Link
                href="/"
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl text-center transition"
              >
                🏠 続ける
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // 異議申し立て送信済み（未対応）の場合
  if (appealStatus === "pending") {
    return (
      <Layout currentUser={currentUser}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">⏳</div>
              <h1 className="text-2xl font-bold text-white mb-2">
                異議申し立て受付中
              </h1>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 mb-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
                <p className="text-yellow-400 font-bold text-center mb-4">
                  確認中
                </p>
                <p className="text-white text-center leading-relaxed">
                  ただいま運営チームが確認しております。今しばらくお待ちください。
                </p>
              </div>

              <p className="text-zinc-500 text-sm text-center">
                通常、数日以内に対応結果をお知らせいたします。
              </p>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("critter_ban_status");
                auth.signOut();
                location.href = "/login";
              }}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-xl transition"
            >
              ログアウト
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // 異議申し立てフォーム
  return (
    <Layout currentUser={currentUser}>
      <div className="max-w-2xl mx-auto">
        <div className="border-b border-zinc-800 p-4">
          <h1 className="text-2xl font-bold text-white">BAN異議申し立て</h1>
          <p className="text-zinc-500 text-sm mt-1">
            アカウント停止について異議がある場合はここで申し立てることができます
          </p>
        </div>

        <div className="p-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <p className="text-blue-400 text-sm">
              ℹ️ 詳しく、具体的に理由をお書きください。運営チームが確認いたします。
            </p>
          </div>

          <div className="mb-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="異議申し立ての理由を詳しくお書きください..."
              rows={8}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition"
            />
          </div>

          <button
            onClick={handleSubmitAppeal}
            disabled={!text.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition"
          >
            📤 送信
          </button>
        </div>
      </div>
    </Layout>
  );
}