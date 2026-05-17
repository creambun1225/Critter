"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";

// ───────────────────────────────────────
// アナリティクスモーダル
// ───────────────────────────────────────
function AnalyticsModal({
  post,
  onClose,
}: {
  post: any;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"likes" | "reposts" | "quotes" | "replies">("likes");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { key: "likes",   label: "いいね",   count: post.likedUsers?.length || 0 },
    { key: "reposts", label: "リポスト", count: post.repostedUsers?.length || 0 },
    { key: "quotes",  label: "引用",     count: null },
    { key: "replies", label: "リプライ", count: post.replies || 0 },
  ] as const;

  useEffect(() => {
    setLoading(true);
    setUsers([]);

    const fetchUsers = async () => {
      try {
        if (tab === "likes" || tab === "reposts") {
          const uids: string[] =
            tab === "likes"
              ? post.likedUsers || []
              : post.repostedUsers || [];

          const results = await Promise.all(
            uids.map(async (uid: string) => {
              const snap = await getDoc(doc(db, "users", uid));
              return snap.exists() ? { uid, ...snap.data() } : null;
            })
          );
          setUsers(results.filter(Boolean));

        } else if (tab === "quotes") {
          const q = query(
            collection(db, "posts"),
            where("quotePostId", "==", post.id)
          );
          const snap = await getDocs(q);
          const uids = [...new Set(snap.docs.map((d) => d.data().uid))] as string[];
          const results = await Promise.all(
            uids.map(async (uid: string) => {
              const userSnap = await getDoc(doc(db, "users", uid));
              return userSnap.exists() ? { uid, ...userSnap.data() } : null;
            })
          );
          setUsers(results.filter(Boolean));

        } else if (tab === "replies") {
          const q = query(
            collection(db, "posts", post.id, "replies"),
            orderBy("createdAt", "asc")
          );
          const snap = await getDocs(q);
          const uids = [...new Set(snap.docs.map((d) => d.data().uid))] as string[];
          const results = await Promise.all(
            uids.map(async (uid: string) => {
              const userSnap = await getDoc(doc(db, "users", uid));
              return userSnap.exists() ? { uid, ...userSnap.data() } : null;
            })
          );
          setUsers(results.filter(Boolean));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [tab, post]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-black border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">

          {/* ヘッダー */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900"
            >
              ✕
            </button>
            <h2 className="font-bold text-white text-lg">アナリティクス</h2>
            <div className="w-10" />
          </div>

          {/* タブ */}
          <div className="flex border-b border-zinc-800 shrink-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-sm font-bold transition border-b-2 ${
                  tab === t.key
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t.label}
                {t.count !== null && (
                  <span className="ml-1 text-xs text-zinc-500">({t.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* ユーザーリスト */}
          <div className="overflow-y-auto">
            {loading ? (
              <p className="text-center text-zinc-500 py-10">読み込み中...</p>
            ) : users.length === 0 ? (
              <p className="text-center text-zinc-500 py-10">まだいません</p>
            ) : (
              users.map((user) => (
                <Link
                  key={user.uid}
                  href={`/user/${user.uid}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition"
                >
                  <img
                    src={user.icon || "/default.png"}
                    className="w-10 h-10 rounded-full object-cover bg-zinc-700 shrink-0"
                  />
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

// ───────────────────────────────────────
// ホームページ
// ───────────────────────────────────────
export default function Home() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [analyticsPost, setAnalyticsPost] = useState<any>(null);

  // ログイン確認
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        location.href = "/login";
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          photoURL: user.photoURL,
          displayName: user.displayName,
          ...data,
        });
        setUserData(data);
      }
    });
    return () => unsub();
  }, []);

  // 投稿取得
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(
        snap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });
    return () => unsub();
  }, []);

  // 投稿
  const createPost = async () => {
    if (!text.trim() && !image) return;

    let imageUrl = "";

    // Cloudinary画像アップロード
    if (image) {
      const formData = new FormData();
      formData.append("file", image);
      formData.append("upload_preset", "critter_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dp16ulupy/image/upload",
        { method: "POST", body: formData }
      );
      const data = await res.json();
      imageUrl = data.secure_url;
    }

    // スパム判定
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

    // 3回以上で削除
    if (recentPosts.length >= 2) {
      for (const p of recentPosts) {
        await deleteDoc(doc(db, "posts", p.id));
      }
      alert("同じクリートを3秒以内に3回行ったため削除しました");
      return;
    }

    // ハッシュタグ
    const hashtags = text.match(/#\w+/g) || [];

    // 投稿保存
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
      replies: 0,
      reposts: 0,
      likes: 0,
      bookmarks: 0,
      likedUsers: [],
      repostedUsers: [],
      bookmarkedUsers: [],
      createdAt: Date.now(),
    });

    setText("");
    setImage(null);
  };

  return (
    <Layout currentUser={currentUser}>

      {/* ヘッダー */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">
        <div className="text-3xl md:text-4xl font-bold">ホーム</div>
      </div>

      {/* 投稿フォーム */}
      <div className="border-b border-zinc-800 p-4 flex gap-4">
        <img
          src={userData?.icon || "/default.png"}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover bg-zinc-700 flex-shrink-0"
        />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="いまどうしてる？"
            className="w-full bg-black outline-none resize-none text-lg md:text-xl min-h-[120px] text-white placeholder-zinc-600"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0])}
            className="mt-4"
          />

          {image && (
            <img
              src={URL.createObjectURL(image)}
              className="mt-4 rounded-2xl max-h-[350px] object-cover"
            />
          )}

          <div className="flex justify-end mt-4">
            <button
              onClick={createPost}
              className="bg-blue-500 hover:bg-blue-600 transition px-6 md:px-8 py-3 rounded-full text-lg font-bold"
            >
              クリート
            </button>
          </div>
        </div>
      </div>

      {/* 投稿一覧 */}
      <div>
        {posts.map((post: any) => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            onAnalytics={(p) => setAnalyticsPost(p)}
          />
        ))}
      </div>

      {/* アナリティクスモーダル */}
      {analyticsPost && (
        <AnalyticsModal
          post={analyticsPost}
          onClose={() => setAnalyticsPost(null)}
        />
      )}

    </Layout>
  );
}