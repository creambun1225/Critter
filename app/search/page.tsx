"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import Link from "next/link";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  // URLの ?q= を検索欄に反映
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearch(q);
  }, [searchParams]);

  // ログイン確認
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        location.href = "/login";
        return;
      }
      setCurrentUser(user);
    });
  }, []);

  // ユーザー取得
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // 投稿取得
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "posts"), (snap) => {
      setPosts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // 検索欄が変わったらURLも更新
  const handleSearch = (value: string) => {
    setSearch(value);
    if (value.trim()) {
      router.replace(`/search?q=${encodeURIComponent(value.trim())}`);
    } else {
      router.replace("/search");
    }
  };

  // フィルタリング
  const filteredUsers = search.trim()
    ? users.filter(
        (u: any) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.username?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const filteredPosts = search.trim()
    ? posts.filter((p: any) =>
        p.text?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <Layout currentUser={currentUser}>

      {/* タイトル */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">
        <div className="text-4xl font-bold">検索</div>
      </div>

      {/* 検索欄 */}
      <div className="p-4 border-b border-zinc-800">
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="ユーザーやクリートを検索"
          className="w-full bg-zinc-900 rounded-full px-6 py-4 text-lg outline-none text-white placeholder-zinc-500"
          autoFocus
        />
      </div>

      {/* 検索前は何も表示しない */}
      {!search.trim() && (
        <p className="text-center text-zinc-600 py-16">
          キーワードを入力して検索
        </p>
      )}

      {/* ユーザー */}
      {search.trim() && (
        <div>
          {filteredUsers.length > 0 && (
            <div className="px-4 py-2 text-zinc-500 text-sm font-bold border-b border-zinc-800">
              ユーザー
            </div>
          )}
          {filteredUsers.map((u: any) => (
            <Link
              key={u.id}
              href={`/user/${u.id}`}
              className="flex items-center gap-4 p-4 border-b border-zinc-800 hover:bg-zinc-950 transition"
            >
              <img
                src={u.icon || "/default.png"}
                className="w-14 h-14 rounded-full object-cover bg-zinc-700"
              />
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-bold text-lg text-white">{u.name}</div>
                  {u.verified && <img src="/verified-blue.png" className="w-5 h-5" />}
                  {u.admin && <img src="/verified-gold.png" className="w-5 h-5" />}
                </div>
                <div className="text-zinc-500">@{u.username}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 投稿 */}
      {search.trim() && (
        <div>
          {filteredPosts.length > 0 && (
            <div className="px-4 py-2 text-zinc-500 text-sm font-bold border-b border-zinc-800">
              クリート
            </div>
          )}
          {filteredPosts.map((p: any) => (
            <Link
              key={p.id}
              href={`/post/${p.id}`}
              className="block border-b border-zinc-800 p-4 hover:bg-zinc-950 transition"
            >
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={p.icon || "/default.png"}
                  className="w-10 h-10 rounded-full object-cover bg-zinc-700"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{p.name}</span>
                    {p.verified && <img src="/verified-blue.png" className="w-4 h-4" />}
                    {p.admin && <img src="/verified-gold.png" className="w-4 h-4" />}
                    <span className="text-zinc-500 text-sm">@{p.username}</span>
                  </div>
                </div>
              </div>

              {/* 本文（ハッシュタグ部分を青く） */}
              <p className="text-white whitespace-pre-wrap break-words">
                {p.text?.split(/(#[^\s#]+)/g).map((part: string, i: number) =>
                  /^#[^\s#]+/.test(part) ? (
                    <span key={i} className="text-blue-400">{part}</span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </p>

              {/* 画像 */}
              {p.image && (
                <img
                  src={p.image}
                  className="mt-3 rounded-2xl max-h-[300px] object-cover border border-zinc-800 w-full"
                />
              )}

              {/* カウンター */}
              <div className="flex gap-4 mt-3 text-zinc-500 text-sm">
                <span>💬 {p.replies || 0}</span>
                <span>🔁 {p.reposts || 0}</span>
                <span>❤️ {p.likes || 0}</span>
                <span>🔖 {p.bookmarks || 0}</span>
              </div>
            </Link>
          ))}

          {/* ヒットなし */}
          {filteredUsers.length === 0 && filteredPosts.length === 0 && (
            <p className="text-center text-zinc-600 py-16">
              「{search}」に一致する結果がありません
            </p>
          )}
        </div>
      )}

    </Layout>
  );
}