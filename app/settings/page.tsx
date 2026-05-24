"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import { auth, db } from "@/lib/firebase";
import { signOut, deleteUser, onAuthStateChanged, updatePassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function SettingsPage() {

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // テーマ初期化
    try {
      const theme = localStorage.getItem("critter_theme");
      const dark = theme !== "light";
      setIsDark(dark);
      if (!dark) {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    } catch {}

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = "/login"; return; }
      setCurrentUser(user);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserData(snap.data());
    });
    return () => unsub();
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      if (next) {
        localStorage.setItem("critter_theme", "dark");
        document.documentElement.classList.remove("light");
      } else {
        localStorage.setItem("critter_theme", "light");
        document.documentElement.classList.add("light");
      }
    } catch {}
  };

  const logout = async () => {
    await signOut(auth);
    location.href = "/login";
  };

  const changePassword = async () => {
    if (!newPassword) return;
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        alert("変更しました");
        setNewPassword("");
      }
    } catch {
      alert("再ログインしてください");
    }
  };

  const becomeAdmin = async () => {
    if (adminPassword !== "annpannmann") { alert("パスワードが違います"); return; }
    await updateDoc(doc(db, "users", currentUser.uid), { admin: true, verified: true });
    alert("管理者になりました");
    location.reload();
  };

  const removeAccount = async () => {
    const ok = confirm("本当に削除しますか？");
    if (!ok) return;
    await deleteUser(auth.currentUser!);
  };

  if (!currentUser) return null;

  const isAdmin = userData?.admin === true;

  return (
    <Layout currentUser={{ ...currentUser, ...userData }}>
      <div className="p-6 text-white">

        <h1 className="text-4xl font-bold mb-8">設定</h1>

        {/* アカウント情報 */}
        <div className="bg-zinc-900 rounded-2xl p-5 mb-6">
          <div className="text-xl font-bold mb-4">アカウント情報</div>
          <div>名前: {userData?.name}</div>
          <div className="text-zinc-500 mt-2">@{userData?.username}</div>
        </div>

        {/* テーマ切替 */}
        <div className="bg-zinc-900 rounded-2xl p-5 mb-6">
          <div className="text-xl font-bold mb-4">テーマ</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-bold">{isDark ? "🌙 ダークモード" : "☀️ ライトモード"}</div>
              <div className="text-zinc-500 text-sm mt-1">
                {isDark ? "現在ダークモードです" : "現在ライトモードです"}
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full transition-colors ${isDark ? "bg-blue-500" : "bg-zinc-600"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isDark ? "translate-x-7" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>

        {/* パスワード変更 */}
        <div className="bg-zinc-900 rounded-2xl p-5 mb-6">
          <div className="text-xl font-bold mb-4">パスワード変更</div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="新しいパスワード"
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mb-4"
          />
          <button onClick={changePassword} className="bg-blue-500 px-5 py-3 rounded-xl">変更する</button>
        </div>

        {/* 管理者権限 */}
        <div className="bg-zinc-900 rounded-2xl p-5 mb-6">
          <div className="text-xl font-bold mb-4">管理者権限付与</div>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="管理者パスワード"
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mb-4"
          />
          <button onClick={becomeAdmin} className="bg-yellow-500 text-black px-5 py-3 rounded-xl">管理者になる</button>
        </div>

        <button onClick={logout} className="w-full bg-zinc-800 rounded-xl p-4 mb-4">ログアウト</button>
        <button onClick={removeAccount} className="w-full bg-red-600 rounded-xl p-4 mb-4">アカウント削除</button>

        <Link href="/terms" className="w-full block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left mb-4">利用規約</Link>
        <Link href="/privacy" className="w-full block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left mb-4">プライバシーポリシー</Link>
        <Link href="/contact" className="w-full block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left mb-4">お問い合わせ</Link>
        <Link href="/bugreport" className="w-full block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left mb-4">バグ報告</Link>

        {isAdmin && (
          <Link href="/admin/reports" className="w-full block bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-4 text-left text-yellow-400 font-bold">
            📋 報告一覧（管理者）
          </Link>
        )}

      </div>
    </Layout>
  );
}