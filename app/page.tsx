"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  collection, addDoc, query, orderBy,
  onSnapshot, doc, getDoc, where,
  getDocs, deleteDoc, limit,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AnalyticsModal({ post, onClose }: { post: any; onClose: () => void }) {
  const [tab, setTab] = useState<"likes" | "reposts" | "quotes" | "replies">("likes");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { key: "likes",   label: "いいね",        count: post.likedUsers?.length || 0 },
    { key: "reposts", label: "リクリート",     count: post.repostedUsers?.length || 0 },
    { key: "quotes",  label: "引用リクリート", count: null },
    { key: "replies", label: "リプライ",       count: post.replies || 0 },
  ] as const;

  useEffect(() => {
    setLoading(true);
    setUsers([]);
    const fetch = async () => {
      try {
        if (tab === "likes" || tab === "reposts") {
          const uids: string[] = tab === "likes" ? post.likedUsers || [] : post.repostedUsers || [];
          const results = await Promise.all(
            uids.map(async (uid) => {
              const snap = await getDoc(doc(db, "users", uid));
              return snap.exists() ? { uid, ...snap.data() } : null;
            })
          );
          setUsers(results.filter(Boolean));
        } else if (tab === "quotes") {
          const q = query(collection(db, "posts"), where("quotePostId", "==", post.id));
          const snap = await getDocs(q);
          const uids = [...new Set(snap.docs.map((d) => d.data().uid))] as string[];
          const results = await Promise.all(
            uids.map(async (uid) => {
              const s = await getDoc(doc(db, "users", uid));
              return s.exists() ? { uid, ...s.data() } : null;
            })
          );
          setUsers(results.filter(Boolean));
        } else if (tab === "replies") {
          const q = query(collection(db, "posts", post.id, "replies"), orderBy("createdAt", "asc"));
          const snap = await getDocs(q);
          const uids = [...new Set(snap.docs.map((d) => d.data().uid))] as string[];
          const results = await Promise.all(
            uids.map(async (uid) => {
              const s = await getDoc(doc(db, "users", uid));
              return s.exists() ? { uid, ...s.data() } : null;
            })
          );
          setUsers(results.filter(Boolean));
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [tab, post]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-black border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900">✕</button>
            <h2 className="font-bold text-white text-lg">アナリティクス</h2>
            <div className="w-10" />
          </div>
          <div className="flex border-b border-zinc-800 shrink-0">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-sm font-bold transition border-b-2 ${tab === t.key ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                {t.label}
                {t.count !== null && <span className="ml-1 text-xs text-zinc-500">({t.count})</span>}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto">
            {loading ? (
              <p className="text-center text-zinc-500 py-10">読み込み中...</p>
            ) : users.length === 0 ? (
              <p className="text-center text-zinc-500 py-10">まだいません</p>
            ) : (
              users.map((user) => (
                <Link key={user.uid} href={`/user/${user.uid}`} onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition">
                  <img src={user.icon || "/default.png"} className="w-10 h-10 rounded-full object-cover bg-zinc-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white truncate">{user.name}</span>
                      {user.verified && <img src="/verified-blue.png" className="w-4 h-4" />}
                      {user.admin && <img src="/verified-gold.png" className="w-4 h-4" />}
                    </div>
                    <div className="text-zinc-500 text-sm truncate">@{user.username}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function calcRecommendScore(post: any, currentUser: any): number {
  let score = 0;
  score += (post.likes || 0) * 3;
  score += (post.reposts || 0) * 4;
  score += (post.replies || 0) * 2;
  score += (post.bookmarks || 0) * 2;

  if (currentUser?.likedUsers && post.likedUsers) {
    const likedByMe = post.likedUsers.includes(currentUser.uid);
    if (!likedByMe) score += 5;
  }

  const following: string[] = currentUser?.following || [];
  if (following.includes(post.uid)) score += 8;

  const age = Date.now() - (post.createdAt || 0);
  const hoursOld = age / (1000 * 60 * 60);
  if (hoursOld < 1) score += 10;
  else if (hoursOld < 6) score += 7;
  else if (hoursOld < 24) score += 3;

  return score;
}

export default function Home() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [analyticsPost, setAnalyticsPost] = useState<any>(null);
  const [posting, setPosting] = useState(false);
  const [feedTab, setFeedTab] = useState<"following" | "recommended" | "latest">("recommended");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("画像は5MB以下にしてください"); return; }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = "/login"; return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setCurrentUser({ uid: user.uid, email: user.email, ...data });
        setUserData(data);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(50)  // 最新50件のみ取得して高速化
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const displayPosts = useMemo(() => {
    if (!currentUser) return posts;

    const following: string[] = currentUser.following || [];
    const mutedUsers: string[] = currentUser.mutedUsers || [];
    const blockedUsers: string[] = currentUser.blockedUsers || [];

    const filtered = posts.filter((p) =>
      !mutedUsers.includes(p.uid) &&
      !blockedUsers.includes(p.uid)
    );

    if (feedTab === "following") {
      return filtered.filter((p) => following.includes(p.uid) || p.uid === currentUser.uid);
    }

    if (feedTab === "recommended") {
      return [...filtered].sort(
        (a, b) => calcRecommendScore(b, currentUser) - calcRecommendScore(a, currentUser)
      );
    }

    return filtered;
  }, [posts, feedTab, currentUser]);

  const createPost = async () => {
    if (!text.trim() && !image) return;
    if (posting) return;
    setPosting(true);
    try {
      let imageUrl = "";
      if (image) imageUrl = await fileToBase64(image);

      const now = Date.now();
      const spamQuery = query(
        collection(db, "posts"),
        where("uid", "==", currentUser.uid),
        where("text", "==", text)
      );
      const spamSnap = await getDocs(spamQuery);
      const recentPosts = spamSnap.docs.filter(
        (d: any) => now - d.data().createdAt <= 3000
      );
      if (recentPosts.length >= 2) {
        for (const p of recentPosts) await deleteDoc(doc(db, "posts", p.id));
        alert("荒らし行為と判断し、クリートを削除しました");
        return;
      }

      const hashtags = text.match(/#[^\s#]+/g)?.map((t) => t.slice(1)) || [];

      await addDoc(collection(db, "posts"), {
        text,
        image: imageUrl,
        hashtags,
        uid: currentUser.uid,
        name: userData?.name || "ユーザー",
        username: userData?.username || "user",
        icon: userData?.icon || "",
        verified: currentUser?.verified || false,
        admin: currentUser?.admin || false,
        replies: 0, reposts: 0, likes: 0, bookmarks: 0,
        likedUsers: [], repostedUsers: [], bookmarkedUsers: [],
        impressions: 0,
        createdAt: Date.now(),
      });

      setText("");
      setImage(null);
      setImagePreview("");
    } catch (e) {
      console.error(e);
      alert("投稿に失敗しました");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Layout currentUser={currentUser}>

      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800">
        <div className="p-4 pb-0">
          <div className="text-3xl md:text-4xl font-bold text-white">ホーム</div>
        </div>

        <div className="flex items-center justify-center gap-2 px-4 py-3">
          {(["following", "recommended", "latest"] as const).map((t) => {
            const label = t === "following" ? "フォロー中" : t === "recommended" ? "おすすめ" : "新着";
            const active = feedTab === t;
            return (
              <button
                key={t}
                onClick={() => setFeedTab(t)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition ${
                  active
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="md:hidden border-b border-zinc-800 p-4 flex gap-4">
        <img
          src={userData?.icon || "/default.png"}
          className="w-12 h-12 rounded-full object-cover bg-zinc-700 flex-shrink-0"
        />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="いまどうしてる？"
            className="w-full bg-black outline-none resize-none text-lg min-h-[120px] text-white placeholder-zinc-600"
          />
          {imagePreview && (
            <div className="relative mt-3 inline-block">
              <img src={imagePreview} className="rounded-2xl max-h-[350px] object-cover" />
              <button
                onClick={() => { setImage(null); setImagePreview(""); }}
                className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black transition text-sm"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex items-center justify-between mt-4">
            <label className="cursor-pointer text-blue-400 hover:text-blue-300 transition text-2xl">
              🖼
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
            <button
              onClick={createPost}
              disabled={posting || (!text.trim() && !image)}
              className="bg-blue-500 hover:bg-blue-600 transition px-6 py-3 rounded-full text-lg font-bold disabled:opacity-40"
            >
              {posting ? "投稿中..." : "クリート"}
            </button>
          </div>
        </div>
      </div>

      {feedTab === "following" && displayPosts.length === 0 && (
        <p className="text-center text-zinc-600 py-16">
          フォロー中のユーザーの投稿がありません
        </p>
      )}

      <div>
        {displayPosts.map((post: any) => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            onAnalytics={(p) => setAnalyticsPost(p)}
          />
        ))}
      </div>

      {analyticsPost && (
        <AnalyticsModal post={analyticsPost} onClose={() => setAnalyticsPost(null)} />
      )}

    </Layout>
  );
}